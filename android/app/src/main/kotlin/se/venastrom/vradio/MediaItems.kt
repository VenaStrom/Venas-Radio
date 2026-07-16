package se.venastrom.vradio

import android.net.Uri
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import se.venastrom.vradio.api.ChannelDto
import se.venastrom.vradio.api.EpisodeDto

// The mediaType set below is load-bearing: the player UI branches on it (radio
// stations get a static full progress bar, podcast episodes get position and
// seeking) and PlaybackService persists it as the restorable current media.

fun ChannelDto.toMediaItem(): MediaItem = MediaItem.Builder()
  .setMediaId(id)
  .setUri(streamUrl)
  .setMediaMetadata(
    MediaMetadata.Builder()
      .setTitle(name)
      .setArtist("Sveriges Radio")
      .setArtworkUri(Uri.parse(image))
      .setMediaType(MediaMetadata.MEDIA_TYPE_RADIO_STATION)
      .setIsPlayable(true)
      .setIsBrowsable(false)
      .build(),
  )
  .build()

fun EpisodeDto.toMediaItem(): MediaItem = MediaItem.Builder()
  .setMediaId(id)
  .setUri(audioUrl)
  .setMediaMetadata(
    MediaMetadata.Builder()
      .setTitle(title)
      .setArtist(programName)
      .setArtworkUri(Uri.parse(image))
      .setMediaType(MediaMetadata.MEDIA_TYPE_PODCAST_EPISODE)
      .setIsPlayable(true)
      .setIsBrowsable(false)
      .build(),
  )
  .build()
