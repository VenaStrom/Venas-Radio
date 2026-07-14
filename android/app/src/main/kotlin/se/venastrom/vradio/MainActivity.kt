package se.venastrom.vradio

import android.Manifest
import android.content.ComponentName
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.util.concurrent.MoreExecutors

class MainActivity : ComponentActivity() {

  private var controllerFuture: ListenableFuture<MediaController>? = null
  private var controller by mutableStateOf<MediaController?>(null)

  // Playback works without this; denying it only hides the media notification.
  private val requestNotifications =
    registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      requestNotifications.launch(Manifest.permission.POST_NOTIFICATIONS)
    }

    setContent {
      MaterialTheme(colorScheme = darkColorScheme()) {
        Surface(modifier = Modifier.fillMaxSize()) {
          PlayerScreen(controller)
        }
      }
    }
  }

  override fun onStart() {
    super.onStart()
    val token = SessionToken(this, ComponentName(this, PlaybackService::class.java))
    val future = MediaController.Builder(this, token).buildAsync()
    controllerFuture = future
    future.addListener({ controller = future.get() }, MoreExecutors.directExecutor())
  }

  override fun onStop() {
    controller = null
    controllerFuture?.let(MediaController::releaseFuture)
    controllerFuture = null
    super.onStop()
  }
}

@Composable
private fun PlayerScreen(controller: MediaController?) {
  var isPlaying by remember { mutableStateOf(false) }
  var playbackState by remember { mutableIntStateOf(Player.STATE_IDLE) }
  var title by remember { mutableStateOf("") }

  DisposableEffect(controller) {
    if (controller == null) return@DisposableEffect onDispose { }

    fun sync() {
      isPlaying = controller.isPlaying
      playbackState = controller.playbackState
      title = controller.mediaMetadata.title?.toString() ?: ""
    }
    sync()

    val listener = object : Player.Listener {
      override fun onEvents(player: Player, events: Player.Events) = sync()
    }
    controller.addListener(listener)
    onDispose { controller.removeListener(listener) }
  }

  Column(
    modifier = Modifier
      .fillMaxSize()
      .padding(24.dp),
    verticalArrangement = Arrangement.Center,
    horizontalAlignment = Alignment.CenterHorizontally,
  ) {
    Text(
      text = title.ifEmpty { "—" },
      style = MaterialTheme.typography.headlineLarge,
    )
    Text(
      text = when (playbackState) {
        Player.STATE_IDLE -> "Idle"
        Player.STATE_BUFFERING -> "Buffrar..."
        Player.STATE_READY -> if (isPlaying) "Live" else "Pausad"
        Player.STATE_ENDED -> "Slut"
        else -> ""
      },
      style = MaterialTheme.typography.bodyMedium,
      modifier = Modifier.padding(top = 4.dp, bottom = 32.dp),
    )

    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
      Button(
        onClick = { controller?.seekToPreviousMediaItem() },
        enabled = controller != null,
      ) { Text("Föregående") }

      Button(
        onClick = { if (isPlaying) controller?.pause() else controller?.play() },
        enabled = controller != null,
      ) { Text(if (isPlaying) "Pausa" else "Spela") }

      Button(
        onClick = { controller?.seekToNextMediaItem() },
        enabled = controller != null,
      ) { Text("Nästa") }
    }
  }
}
