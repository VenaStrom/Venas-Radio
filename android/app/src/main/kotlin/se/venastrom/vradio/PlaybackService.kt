package se.venastrom.vradio

import android.content.Intent
import android.util.Log
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
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
      // Cache-first, so a device that has run before gets its playlist without
      // the network; only a first-ever launch with no connectivity ends up empty.
      val channels = try {
        Api.channels(applicationContext)
      }
      catch (e: Throwable) {
        Log.w("PlaybackService", "Could not load channels", e)
        return@launch
      }
      val restored = withContext(Dispatchers.IO) {
        LocalStore.load(applicationContext)
        LocalStore.currentMedia.value
      }

      player.setMediaItems(channels.map { it.toMediaItem() })
      if (restored?.type == MediaType.CHANNEL) {
        val index = channels.indexOfFirst { it.id == restored.id }
        if (index >= 0) player.seekToDefaultPosition(index)
      }
      player.prepare()

      // Attached only after restoration so the setMediaItems/seek above cannot
      // clobber the stored media with their own synthetic transitions.
      player.addListener(object : Player.Listener {
        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
          val id = mediaItem?.mediaId ?: return
          LocalStore.setCurrentMedia(CurrentMedia(MediaType.CHANNEL, id))
        }
      })
    }
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
