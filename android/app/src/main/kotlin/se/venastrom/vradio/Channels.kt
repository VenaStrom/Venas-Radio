package se.venastrom.vradio

import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata

data class Channel(
    val id: Int,
    val name: String,
    val streamUrl: String,
)

/**
 * Hardcoded for the scaffold. These are real `liveaudio.url` values from
 * api.sr.se/api/v2/channels and get replaced by Room-backed data later.
 */
val CHANNELS = listOf(
    Channel(132, "P1", "https://www.sverigesradio.se/topsy/direkt/srapi/132.mp3"),
    Channel(163, "P2", "https://www.sverigesradio.se/topsy/direkt/srapi/163.mp3"),
    Channel(164, "P3", "https://www.sverigesradio.se/topsy/direkt/srapi/164.mp3"),
)

fun Channel.toMediaItem(): MediaItem = MediaItem.Builder()
    .setMediaId(id.toString())
    .setUri(streamUrl)
    .setMediaMetadata(
        MediaMetadata.Builder()
            .setTitle(name)
            .setArtist("Sveriges Radio")
            .setIsPlayable(true)
            .setIsBrowsable(false)
            .build(),
    )
    .build()
