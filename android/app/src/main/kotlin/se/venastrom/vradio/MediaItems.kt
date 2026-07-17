package se.venastrom.vradio

import android.net.Uri
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import se.venastrom.vradio.api.ChannelDto
import se.venastrom.vradio.api.EpisodeDto
import se.venastrom.vradio.store.CurrentMedia
import se.venastrom.vradio.store.MediaType

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

/**
 * Rebuilds a playable episode from the stored snapshot, entirely offline.
 * Null for channels and for snapshots written before audio urls were stored.
 * [localUri] (a downloaded file) wins over the stream url when present.
 */
fun CurrentMedia.toEpisodeMediaItem(localUri: Uri? = null): MediaItem? {
  if (type != MediaType.EPISODE) return null
  val uri = localUri ?: audioUrl?.let(Uri::parse) ?: return null
  return MediaItem.Builder()
    .setMediaId(id)
    .setUri(uri)
    .setMediaMetadata(
      MediaMetadata.Builder()
        .setTitle(title)
        .setArtist(subtitle)
        .setArtworkUri(image?.let(Uri::parse))
        .setMediaType(MediaMetadata.MEDIA_TYPE_PODCAST_EPISODE)
        .setIsPlayable(true)
        .setIsBrowsable(false)
        .build(),
    )
    .build()
}

/** [localUri] (a downloaded file) wins over the stream url when present. */
fun EpisodeDto.toMediaItem(localUri: Uri? = null): MediaItem = MediaItem.Builder()
  .setMediaId(id)
  .setUri(localUri ?: Uri.parse(audioUrl))
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
