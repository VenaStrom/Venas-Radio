package se.venastrom.vradio

import android.net.Uri
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import se.venastrom.vradio.api.ChannelDto

fun ChannelDto.toMediaItem(): MediaItem = MediaItem.Builder()
  .setMediaId(id)
  .setUri(streamUrl)
  .setMediaMetadata(
    MediaMetadata.Builder()
      .setTitle(name)
      .setArtist("Sveriges Radio")
      .setArtworkUri(Uri.parse(image))
      // The player UI branches on this: radio stations get a static full
      // progress bar, podcast episodes (later) get position + seeking.
      .setMediaType(MediaMetadata.MEDIA_TYPE_RADIO_STATION)
      .setIsPlayable(true)
      .setIsBrowsable(false)
      .build(),
  )
  .build()
