package se.venastrom.vradio

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLinkStyles
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withLink
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.media3.common.C
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import coil3.compose.AsyncImage
import se.venastrom.vradio.api.Api
import se.venastrom.vradio.api.ChannelDto
import se.venastrom.vradio.store.LocalStore

private val LikedRed = Color(0xFFFF0000)

/**
 * The LIVE tab: intro blurb and the live channel list.
 * Mirrors the web client's page.tsx + channel-list.tsx + channel-dom.tsx.
 */
@Composable
fun ChannelPage(controller: MediaController?, modifier: Modifier = Modifier) {
  val context = LocalContext.current
  var channels by remember { mutableStateOf<List<ChannelDto>?>(null) }
  var loadFailed by remember { mutableStateOf(false) }

  LaunchedEffect(Unit) {
    try {
      channels = Api.channels(context)
    }
    catch (_: Throwable) {
      loadFailed = true
    }
  }

  val followed by LocalStore.followedChannels.collectAsStateWithLifecycle()

  // Favorites first, but ordered by a snapshot taken when the list arrived:
  // toggling a like must not teleport the row mid-scroll. Same trick as the
  // web client's orderingFavorites state.
  val ordered = remember(channels) {
    val favorites = LocalStore.followedChannels.value
    // sortedByDescending is stable, so name order is kept within each group.
    channels?.sortedByDescending { it.id in favorites }
  }

  // The id of the channel currently audible, from the controller — playback
  // state has exactly one source of truth, the session.
  var playingId by remember { mutableStateOf<String?>(null) }
  DisposableEffect(controller) {
    if (controller == null) {
      playingId = null
      return@DisposableEffect onDispose { }
    }
    fun sync() {
      playingId = controller.currentMediaItem?.mediaId.takeIf { controller.isPlaying }
    }
    sync()

    val listener = object : Player.Listener {
      override fun onEvents(player: Player, events: Player.Events) = sync()
    }
    controller.addListener(listener)
    onDispose { controller.removeListener(listener) }
  }

  fun playPause(channel: ChannelDto) {
    val c = controller ?: return
    if (playingId == channel.id) {
      c.pause()
      return
    }

    val index = (0 until c.mediaItemCount).firstOrNull { c.getMediaItemAt(it).mediaId == channel.id }
    if (index != null) {
      c.seekToDefaultPosition(index)
    }
    else {
      // The service builds its playlist from the same cache, but if it started
      // before the first successful fetch the playlist is empty. Rebuild it
      // here; `channels` is in the same name order the service would use.
      val all = channels ?: return
      c.setMediaItems(all.map { it.toMediaItem() }, all.indexOf(channel), C.TIME_UNSET)
      c.prepare()
    }
    c.play()
  }

  LazyColumn(modifier = modifier.fillMaxSize()) {
    item { Intro() }

    item {
      Text(
        text = "Lyssna live",
        color = Zinc.z100,
        fontSize = 20.sp,
        fontWeight = FontWeight.Bold,
        textAlign = TextAlign.Center,
        modifier = Modifier
          .fillMaxWidth()
          .padding(top = 64.dp, bottom = 20.dp),
      )
    }

    val loaded = ordered
    when {
      loaded != null -> items(loaded, key = { it.id }) { channel ->
        ChannelRow(
          channel = channel,
          isPlaying = playingId == channel.id,
          isLiked = channel.id in followed,
          onToggleLike = { LocalStore.toggleFollowedChannel(channel.id) },
          onPlayPause = { playPause(channel) },
          playEnabled = controller != null,
        )
      }

      loadFailed -> item {
        Text(
          text = "Kunde inte hämta kanalerna. Är servern nåbar?",
          color = Zinc.z400,
          fontSize = 14.sp,
          textAlign = TextAlign.Center,
          modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 24.dp),
        )
      }

      else -> items(10) { ChannelRowSkeleton() }
    }

    // last:pb-10
    item { Spacer(modifier = Modifier.height(40.dp)) }
  }
}

@Composable
private fun Intro() {
  Column(
    modifier = Modifier
      .fillMaxWidth()
      .padding(top = 48.dp, start = 16.dp, end = 16.dp),
    horizontalAlignment = Alignment.CenterHorizontally,
  ) {
    Text(
      text = "Välkommen till Venas Radio",
      color = Zinc.z100,
      fontSize = 24.sp,
      textAlign = TextAlign.Center,
    )
    Text(
      text = buildAnnotatedString {
        append("Venas Radio är en radioapp som låter dig lyssna på radiokanaler och -program från Sveriges Radio, via deras ")
        withLink(
          LinkAnnotation.Url(
            url = "https://api.sr.se/api/documentation/v2/index.html",
            styles = TextLinkStyles(style = SpanStyle(textDecoration = TextDecoration.Underline)),
          ),
        ) { append("öppna API") }
        append(".")
      },
      color = Zinc.z100,
      fontSize = 16.sp,
      textAlign = TextAlign.Center,
      modifier = Modifier.padding(top = 8.dp),
    )
  }
}

@Composable
private fun ChannelRow(
  channel: ChannelDto,
  isPlaying: Boolean,
  isLiked: Boolean,
  onToggleLike: () -> Unit,
  onPlayPause: () -> Unit,
  playEnabled: Boolean,
) {
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .height(112.dp)
      .padding(horizontal = 16.dp, vertical = 8.dp),
    verticalAlignment = Alignment.CenterVertically,
  ) {
    AsyncImage(
      model = channel.image,
      contentDescription = "Kanalbild för ${channel.name}",
      modifier = Modifier
        .size(96.dp)
        .clip(RoundedCornerShape(6.dp))
        .background(Zinc.z600),
    )

    Spacer(modifier = Modifier.width(16.dp))

    Column(modifier = Modifier.fillMaxSize()) {
      Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
      ) {
        Text(
          text = channel.name,
          color = Zinc.z100,
          fontWeight = FontWeight.Bold,
          fontSize = 16.sp,
          maxLines = 1,
          overflow = TextOverflow.Ellipsis,
          modifier = Modifier.weight(1f),
        )

        TappableIcon(
          icon = if (isLiked) R.drawable.ic_heart_filled else R.drawable.ic_heart,
          contentDescription = if (isLiked) "Sluta följa ${channel.name}" else "Följ ${channel.name}",
          tint = if (isLiked) LikedRed else Zinc.z100,
          iconSize = 28.dp,
          onClick = onToggleLike,
          modifier = Modifier.size(40.dp),
        )

        TappableIcon(
          icon = if (isPlaying) R.drawable.ic_pause else R.drawable.ic_play,
          contentDescription = if (isPlaying) "Pausa ${channel.name}" else "Spela ${channel.name}",
          tint = Zinc.z100,
          iconSize = 28.dp,
          enabled = playEnabled,
          onClick = onPlayPause,
          modifier = Modifier.size(40.dp),
        )
      }

      SRAttribute()

      Text(
        text = channel.tagline,
        color = Zinc.z100,
        fontSize = 12.sp,
        maxLines = 3,
        overflow = TextOverflow.Ellipsis,
        modifier = Modifier.padding(top = 4.dp),
      )
    }
  }
}

/** The small "Hämtat från Sveriges Radio" credit, ported from sr-attribute.tsx. */
@Composable
fun SRAttribute(modifier: Modifier = Modifier) {
  Row(
    modifier = modifier,
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.spacedBy(4.dp),
  ) {
    Text(
      text = "Hämtat från Sveriges Radio",
      color = Zinc.z400,
      fontSize = 12.sp,
      fontWeight = FontWeight.Light,
    )
    Image(
      painter = painterResource(R.drawable.sveriges_radio),
      contentDescription = "SR",
      modifier = Modifier
        .size(18.dp)
        .clip(RoundedCornerShape(2.dp)),
    )
  }
}

/** Pulsing placeholder row, ported from channel-dom.tsx's Skeleton. */
@Composable
private fun ChannelRowSkeleton() {
  val pulse by rememberInfiniteTransition(label = "skeleton")
    .animateFloat(
      initialValue = 1f,
      targetValue = 0.5f,
      animationSpec = infiniteRepeatable(tween(1000), RepeatMode.Reverse),
      label = "alpha",
    )

  Row(
    modifier = Modifier
      .fillMaxWidth()
      .height(112.dp)
      .padding(horizontal = 16.dp, vertical = 8.dp)
      .alpha(pulse),
    verticalAlignment = Alignment.CenterVertically,
  ) {
    Box(
      modifier = Modifier
        .size(96.dp)
        .clip(RoundedCornerShape(6.dp))
        .background(Zinc.z600),
    )

    Spacer(modifier = Modifier.width(16.dp))

    Column {
      Box(
        modifier = Modifier
          .size(width = 112.dp, height = 16.dp)
          .clip(RoundedCornerShape(6.dp))
          .background(Zinc.z600),
      )
      Box(
        modifier = Modifier
          .padding(top = 12.dp)
          .size(width = 144.dp, height = 12.dp)
          .clip(RoundedCornerShape(2.dp))
          .background(Zinc.z600),
      )
      Box(
        modifier = Modifier
          .padding(top = 4.dp)
          .size(width = 144.dp, height = 24.dp)
          .clip(RoundedCornerShape(6.dp))
          .background(Zinc.z600),
      )
    }
  }
}
