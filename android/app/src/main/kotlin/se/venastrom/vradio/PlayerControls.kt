package se.venastrom.vradio

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.media3.common.C
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import java.util.Locale

/**
 * Progress bar + playback controls in the footer's controls slot.
 * Ported from the web client's audio-player.tsx.
 */
@Composable
fun PlayerControls(controller: MediaController?) {
  var isPlaying by remember { mutableStateOf(false) }
  var playbackState by remember { mutableIntStateOf(Player.STATE_IDLE) }
  var title by remember { mutableStateOf("") }
  var subtitle by remember { mutableStateOf("") }
  var isEpisode by remember { mutableStateOf(false) }
  var positionMs by remember { mutableLongStateOf(0L) }
  var durationMs by remember { mutableLongStateOf(C.TIME_UNSET) }

  DisposableEffect(controller) {
    if (controller == null) return@DisposableEffect onDispose { }

    fun sync() {
      isPlaying = controller.isPlaying
      playbackState = controller.playbackState
      title = controller.mediaMetadata.title?.toString() ?: ""
      subtitle = controller.mediaMetadata.artist?.toString() ?: ""
      isEpisode = controller.mediaMetadata.mediaType == MediaMetadata.MEDIA_TYPE_PODCAST_EPISODE
    }
    sync()

    val listener = object : Player.Listener {
      override fun onEvents(player: Player, events: Player.Events) = sync()
    }
    controller.addListener(listener)
    onDispose { controller.removeListener(listener) }
  }

  // Media3 has no position callback — the position is meant to be polled.
  // Display only: persisting progress is PlaybackService's job, since playback
  // outlives this composable.
  LaunchedEffect(controller) {
    val c = controller ?: return@LaunchedEffect
    while (isActive) {
      positionMs = c.currentPosition
      durationMs = c.duration
      delay(500)
    }
  }

  Column(modifier = Modifier.fillMaxWidth()) {
    SeekableProgressBar(
      fraction = if (durationMs > 0) positionMs.toFloat() / durationMs else 0f,
      isLive = !isEpisode,
      isLoading = playbackState == Player.STATE_BUFFERING,
      enabled = controller != null && isEpisode,
      onSeek = { fraction ->
        controller?.let {
          if (it.duration != C.TIME_UNSET) it.seekTo((fraction * it.duration).toLong())
        }
      },
    )

    Row(
      modifier = Modifier
        .fillMaxWidth()
        .padding(start = 12.dp, end = 12.dp, bottom = 4.dp),
      verticalAlignment = Alignment.CenterVertically,
    ) {
      Column(modifier = Modifier.weight(1f)) {
        Text(text = subtitle.ifEmpty { "Sveriges Radio" }, color = Zinc.z400, fontSize = 13.sp)
        Text(
          text = title.ifEmpty { "Spelar inget" },
          color = Zinc.z100,
          fontWeight = FontWeight.Bold,
          fontSize = 16.sp,
        )
      }

      Text(
        text = when {
          playbackState == Player.STATE_BUFFERING -> "Laddar..."
          isEpisode -> "${formatTime(positionMs)} / ${formatTime(durationMs)}"
          playbackState == Player.STATE_READY -> if (isPlaying) "Live •" else "Pausad"
          else -> ""
        },
        color = Zinc.z400,
        fontSize = 13.sp,
        modifier = Modifier.padding(end = 12.dp),
      )

      TappableIcon(
        icon = if (isPlaying) R.drawable.ic_pause else R.drawable.ic_play,
        contentDescription = if (isPlaying) "Pausa" else "Spela",
        tint = Zinc.z100,
        iconSize = 30.dp,
        enabled = controller != null,
        onClick = { if (isPlaying) controller?.pause() else controller?.play() },
        modifier = Modifier.size(48.dp),
      )
    }
  }
}

/**
 * The thin bar at the footer's top edge. Live renders full and static (pulsing
 * only while buffering — a steady pulse read as perpetual loading); episodes
 * show real progress and seek on tap or drag. The touch target is 16dp tall
 * while the bar itself stays 4dp, standing in for the web client's invisible
 * range input stretched over the bar.
 */
@Composable
private fun SeekableProgressBar(
  fraction: Float,
  isLive: Boolean,
  isLoading: Boolean,
  enabled: Boolean,
  onSeek: (Float) -> Unit,
) {
  var dragFraction by remember { mutableStateOf<Float?>(null) }

  val displayed = if (isLive) 1f else (dragFraction ?: fraction).coerceIn(0f, 1f)
  // The web offset the fill by 3% so barely-started progress still reads as a bar.
  val visualOffset = 0.03f
  val filled = if (displayed > 0f) visualOffset + displayed * (1f - visualOffset) else 0f

  // Tailwind's animate-pulse, but only while buffering.
  val pulse by rememberInfiniteTransition(label = "loading")
    .animateFloat(
      initialValue = 1f,
      targetValue = 0.5f,
      animationSpec = infiniteRepeatable(tween(1000), RepeatMode.Reverse),
      label = "alpha",
    )

  Box(
    modifier = Modifier
      .fillMaxWidth()
      .height(16.dp)
      .pointerInput(enabled) {
        if (!enabled) return@pointerInput
        detectTapGestures { tap -> onSeek((tap.x / size.width).coerceIn(0f, 1f)) }
      }
      .pointerInput(enabled) {
        if (!enabled) return@pointerInput
        detectHorizontalDragGestures(
          onDragStart = { start -> dragFraction = (start.x / size.width).coerceIn(0f, 1f) },
          onDragEnd = {
            dragFraction?.let(onSeek)
            dragFraction = null
          },
          onDragCancel = { dragFraction = null },
        ) { change, _ ->
          change.consume()
          dragFraction = (change.position.x / size.width).coerceIn(0f, 1f)
        }
      },
  ) {
    Box(
      modifier = Modifier
        .fillMaxWidth()
        .height(4.dp)
        .background(Zinc.z800),
    ) {
      if (filled > 0f) {
        Box(
          modifier = Modifier
            .fillMaxWidth(filled)
            .fillMaxHeight()
            .alpha(if (isLoading) pulse else 1f)
            .background(Zinc.z100, RoundedCornerShape(topEnd = 2.dp, bottomEnd = 2.dp)),
        )
      }
    }
  }
}

private fun formatTime(ms: Long): String {
  if (ms < 0) return "--:--"
  val totalSeconds = ms / 1000
  val hours = totalSeconds / 3600
  val minutes = (totalSeconds % 3600) / 60
  val seconds = totalSeconds % 60
  return if (hours > 0) {
    String.format(Locale.ROOT, "%d:%02d:%02d", hours, minutes, seconds)
  }
  else {
    String.format(Locale.ROOT, "%d:%02d", minutes, seconds)
  }
}
