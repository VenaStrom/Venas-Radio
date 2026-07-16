package se.venastrom.vradio

import android.content.Intent
import android.util.Log
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import se.venastrom.vradio.api.Api
import se.venastrom.vradio.store.CurrentMedia
import se.venastrom.vradio.store.LocalStore
import se.venastrom.vradio.store.MediaType

/**
 * Owns the player. Because playback lives in a foreground service rather than a
 * browser tab, it survives backgrounding, the screen locking, and the task being
 * swiped away, and it holds audio focus continuously across track transitions.
 */
class PlaybackService : MediaSessionService() {

  private var mediaSession: MediaSession? = null

  // Main-thread scope: the player must only be touched from the main thread.
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

  override fun onCreate() {
    super.onCreate()

    val player = ExoPlayer.Builder(this)
      .setAudioAttributes(
        AudioAttributes.Builder()
          .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
          .setUsage(C.USAGE_MEDIA)
          .build(),
        // Media3 ducks for notifications and pauses for calls.
        /* handleAudioFocus = */ true,
      )
      // Pause when headphones are unplugged.
      .setHandleAudioBecomingNoisy(true)
      .build()

    mediaSession = MediaSession.Builder(this, player).build()

    scope.launch {
      withContext(Dispatchers.IO) { LocalStore.load(applicationContext) }
      val restored = LocalStore.currentMedia.value

      val restoredEpisode = restored?.toEpisodeMediaItem()
      if (restoredEpisode != null) {
        // Resume the episode where it was left, paused, straight from the
        // snapshot — no network, and no dependence on it still being in the feed.
        val startMs = ((LocalStore.progressSeconds.value[restored.id] ?: 0.0) * 1000).toLong()
        player.setMediaItem(restoredEpisode, startMs)
        player.prepare()
      }
      else {
        // Cache-first, so a device that has run before gets its playlist without
        // the network; only a first-ever launch with no connectivity ends up empty.
        val channels = runCatching { Api.channels(applicationContext) }
          .onFailure { Log.w("PlaybackService", "Could not load channels", it) }
          .getOrNull()
        if (channels != null) {
          player.setMediaItems(channels.map { it.toMediaItem() })
          if (restored?.type == MediaType.CHANNEL) {
            val index = channels.indexOfFirst { it.id == restored.id }
            if (index >= 0) player.seekToDefaultPosition(index)
          }
          player.prepare()
        }
      }

      // Attached only after restoration so the calls above cannot clobber the
      // stored media with their own synthetic transitions.
      player.addListener(object : Player.Listener {
        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
          persistCurrentMedia(mediaItem)
        }

        override fun onEvents(player: Player, events: Player.Events) {
          // Seeks and pauses are save points, so a process kill right after
          // either cannot lose the position.
          if (events.containsAny(Player.EVENT_POSITION_DISCONTINUITY, Player.EVENT_IS_PLAYING_CHANGED)) {
            saveEpisodeProgress(player)
          }
        }
      })

      // Progress saving lives here, not in the UI: playback outlives the
      // activity, and the notification keeps playing long after the
      // MediaController is released.
      while (isActive) {
        if (player.isPlaying) saveEpisodeProgress(player)
        delay(1000)
      }
    }
  }

  /** Full snapshot, so an episode can be rebuilt for resume without the network. */
  private fun persistCurrentMedia(mediaItem: MediaItem?) {
    val item = mediaItem ?: return
    val metadata = item.mediaMetadata
    val type =
      if (metadata.mediaType == MediaMetadata.MEDIA_TYPE_PODCAST_EPISODE) {
        MediaType.EPISODE
      }
      else {
        MediaType.CHANNEL
      }
    LocalStore.setCurrentMedia(
      CurrentMedia(
        type = type,
        id = item.mediaId,
        title = metadata.title?.toString(),
        subtitle = metadata.artist?.toString(),
        image = metadata.artworkUri?.toString(),
        audioUrl = item.localConfiguration?.uri?.toString(),
      ),
    )
  }

  private fun saveEpisodeProgress(player: Player) {
    val item = player.currentMediaItem ?: return
    if (item.mediaMetadata.mediaType != MediaMetadata.MEDIA_TYPE_PODCAST_EPISODE) return
    val durationMs = player.duration
    if (durationMs == C.TIME_UNSET) return
    LocalStore.updateProgress(item.mediaId, player.currentPosition / 1000.0, durationMs / 1000.0)
  }

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = mediaSession

  /**
   * Swiping the task away should not kill live radio, so only stop when
   * playback is actually idle.
   */
  override fun onTaskRemoved(rootIntent: Intent?) {
    val player = mediaSession?.player
    if (player == null || !player.playWhenReady || player.mediaItemCount == 0) {
      stopSelf()
    }
  }

  override fun onDestroy() {
    scope.cancel()
    mediaSession?.run {
      player.release()
      release()
    }
    mediaSession = null
    super.onDestroy()
  }
}
