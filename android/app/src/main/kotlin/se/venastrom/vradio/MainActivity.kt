package se.venastrom.vradio

import android.Manifest
import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.sp
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import coil3.ImageLoader
import coil3.compose.setSingletonImageLoaderFactory
import coil3.network.okhttp.OkHttpNetworkFetcherFactory
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.util.concurrent.MoreExecutors
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import se.venastrom.vradio.auth.Auth
import se.venastrom.vradio.auth.SessionState
import se.venastrom.vradio.store.LocalStore

class MainActivity : ComponentActivity() {

  private var controllerFuture: ListenableFuture<MediaController>? = null
  private var controller by mutableStateOf<MediaController?>(null)

  /** Set when the OAuth deep link lands, consumed once by the composable. */
  private var redirectUri by mutableStateOf<Uri?>(null)

  // Playback works without this; denying it only hides the media notification.
  private val requestNotifications =
    registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      requestNotifications.launch(Manifest.permission.POST_NOTIFICATIONS)
    }

    redirectUri = intent?.data?.takeIf(Auth::isRedirect)

    setContent {
      // Explicit network fetcher: Coil 3's core has no networking, and relying
      // on ServiceLoader discovery makes image loading fail silently if it
      // ever breaks. Coil's disk cache (cacheDir/image_cache) comes with it.
      setSingletonImageLoaderFactory { ctx ->
        ImageLoader.Builder(ctx)
          .components { add(OkHttpNetworkFetcherFactory()) }
          .build()
      }
      VRadioTheme {
        AppScaffold(
          controller = controller,
          redirectUri = redirectUri,
          onRedirectHandled = { redirectUri = null },
        )
      }
    }
  }

  /** The activity is singleTask, so the OAuth redirect arrives here, not in onCreate. */
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    redirectUri = intent.data?.takeIf(Auth::isRedirect)
  }

  override fun onStart() {
    super.onStart()
    val token = SessionToken(this, ComponentName(this, PlaybackService::class.java))
    val future = MediaController.Builder(this, token).buildAsync()
    controllerFuture = future
    // releaseFuture in onStop cancels a not-yet-done future, and this listener
    // still runs; get() on it would throw.
    future.addListener(
      { if (!future.isCancelled) controller = future.get() },
      MoreExecutors.directExecutor(),
    )
  }

  override fun onStop() {
    controller = null
    controllerFuture?.let(MediaController::releaseFuture)
    controllerFuture = null
    super.onStop()
  }
}

@Composable
private fun AppScaffold(
  controller: MediaController?,
  redirectUri: Uri?,
  onRedirectHandled: () -> Unit,
) {
  var selectedTab by remember { mutableStateOf(Tab.LIVE) }
  var session by remember { mutableStateOf<SessionState>(SessionState.Loading) }
  val drawerState = rememberDrawerState(DrawerValue.Closed)
  val scope = rememberCoroutineScope()
  val context = LocalContext.current

  // Auth calls block on the network, so they never run on the main thread;
  // LocalStore.load is the store's one disk read and belongs off it too.
  LaunchedEffect(Unit) {
    withContext(Dispatchers.IO) {
      LocalStore.load(context)
      session = Auth.restore(context)
    }
  }

  LaunchedEffect(redirectUri) {
    val uri = redirectUri ?: return@LaunchedEffect
    session = SessionState.Loading
    session = withContext(Dispatchers.IO) { Auth.completeSignIn(context, uri) }
    onRedirectHandled()
    drawerState.open()
  }

  // ModalNavigationDrawer always opens from the start edge. The menu button lives
  // on the right, so the whole tree is flipped to RTL and the content flipped
  // back, which puts the drawer on the right without reimplementing it.
  CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
    ModalNavigationDrawer(
      drawerState = drawerState,
      drawerContent = {
        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
          ModalDrawerSheet(drawerContainerColor = Zinc.z950) {
            Sidebar(
              session = session,
              onSignIn = {
                scope.launch {
                  drawerState.close()
                  Auth.startSignIn(context)
                }
              },
              onSignOut = {
                scope.launch {
                  session = withContext(Dispatchers.IO) { Auth.signOut(context) }
                }
              },
            )
          }
        }
      },
    ) {
      CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
        MainContent(
          controller = controller,
          selectedTab = selectedTab,
          onTabClick = { selectedTab = it },
          onMenuClick = { scope.launch { drawerState.open() } },
        )
      }
    }
  }
}

@Composable
private fun MainContent(
  controller: MediaController?,
  selectedTab: Tab,
  onTabClick: (Tab) -> Unit,
  onMenuClick: () -> Unit,
) {
  Scaffold(
    containerColor = Zinc.z900,
    topBar = { VRadioHeader(onMenuClick = onMenuClick) },
    bottomBar = {
      VRadioFooter(
        selected = selectedTab,
        onTabClick = onTabClick,
        controls = { PlayerControls(controller) },
      )
    },
  ) { innerPadding ->
    val pageModifier = Modifier
      .fillMaxSize()
      .background(Zinc.z900)
      .padding(innerPadding)

    when (selectedTab) {
      Tab.LIVE -> ChannelPage(controller = controller, modifier = pageModifier)
      Tab.SEARCH -> SearchPage(modifier = pageModifier)

      // Stubs: the remaining tabs get real pages during the port.
      else -> Column(
        modifier = pageModifier,
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
      ) {
        Text(text = selectedTab.label, color = Zinc.z100, fontSize = 24.sp)
      }
    }
  }
}

