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
      .setIsPlayable(true)
      .setIsBrowsable(false)
      .build(),
  )
  .build()
