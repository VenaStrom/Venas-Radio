package se.venastrom.vradio

import android.content.Intent
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService

/**
 * Owns the player. Because playback lives in a foreground service rather than a
 * browser tab, it survives backgrounding, the screen locking, and the task being
 * swiped away, and it holds audio focus continuously across track transitions.
 */
class PlaybackService : MediaSessionService() {

    private var mediaSession: MediaSession? = null

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

        player.setMediaItems(CHANNELS.map { it.toMediaItem() })
        player.prepare()

        mediaSession = MediaSession.Builder(this, player).build()
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
        mediaSession?.run {
            player.release()
            release()
        }
        mediaSession = null
        super.onDestroy()
    }
}
