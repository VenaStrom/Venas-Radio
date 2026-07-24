package se.venastrom.vradio

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.net.toUri
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import se.venastrom.vradio.auth.SessionState
import se.venastrom.vradio.store.Compactness
import se.venastrom.vradio.store.Downloads
import se.venastrom.vradio.store.LocalStore

private const val REPO_URL = "https://github.com/VenaStrom/Venas-Radio"

/** Discord's brand colour, as the web client's login button used. */
private val Blurple = Color(0xFF5865F2)

/**
 * Settings panel behind the header's menu button.
 * Ported from the web client's sidebar.tsx.
 */
@Composable
fun Sidebar(
  session: SessionState,
  onSignIn: () -> Unit,
  onSignOut: () -> Unit,
  modifier: Modifier = Modifier,
) {
  Column(
    modifier = modifier
      .fillMaxHeight()
      .background(Zinc.z950)
      .systemBarsPadding()
      .padding(horizontal = 20.dp, vertical = 16.dp),
  ) {
    Text(
      text = "Inställningar",
      color = Zinc.z100,
      fontWeight = FontWeight.Bold,
      fontSize = 20.sp,
    )
    Text(
      text = "Logga in för att synka din lyssningshistorik och favoritprogram.",
      color = Zinc.z400,
      fontSize = 13.sp,
      modifier = Modifier.padding(top = 4.dp, bottom = 20.dp),
    )

    when (session) {
      is SessionState.Loading -> Text("Laddar...", color = Zinc.z400, fontSize = 14.sp)
      is SessionState.SignedOut -> DiscordSignInButton(onClick = onSignIn)
      is SessionState.SignedIn -> SignedInRow(session, onSignOut)
      // A failure still offers the button: the fix is almost always to retry.
      is SessionState.Failed -> {
        DiscordSignInButton(onClick = onSignIn)
        Text(
          text = session.message,
          color = Color(0xFFF87171),
          fontSize = 12.sp,
          modifier = Modifier.padding(top = 8.dp),
        )
      }
    }

    CompactnessSelect(modifier = Modifier.padding(top = 28.dp))
    DownloadToggle(modifier = Modifier.padding(top = 24.dp))

    Spacer(modifier = Modifier.weight(1f))

    BuildInfo()
  }
}

/** How dense the list pages render: full rows, thin rows, or text-only. */
@Composable
private fun CompactnessSelect(modifier: Modifier = Modifier) {
  val current by LocalStore.compactness.collectAsStateWithLifecycle()

  Column(modifier = modifier) {
    Text(
      text = "Layout",
      color = Zinc.z100,
      fontWeight = FontWeight.Bold,
      fontSize = 15.sp,
    )

    SingleChoiceSegmentedButtonRow(modifier = Modifier.padding(top = 8.dp)) {
      Compactness.entries.forEachIndexed { index, level ->
        SegmentedButton(
          selected = level == current,
          onClick = { LocalStore.setCompactness(level) },
          shape = SegmentedButtonDefaults.itemShape(index = index, count = Compactness.entries.size),
          colors = SegmentedButtonDefaults.colors(
            activeContainerColor = Zinc.z800,
            activeContentColor = Zinc.z100,
            inactiveContainerColor = Color.Transparent,
            inactiveContentColor = Zinc.z400,
          ),
          label = { Text(text = level.label, fontSize = 13.sp) },
        )
      }
    }
  }
}

/** The download-limit presets offered in the sidebar. */
private val downloadLimitChoices = listOf(5, 10, 20, 50)

/** Downloads the feed's newest episodes over Wi-Fi so they play offline. */
@Composable
private fun DownloadToggle(modifier: Modifier = Modifier) {
  val context = LocalContext.current
  val enabled by LocalStore.downloadOnWifi.collectAsStateWithLifecycle()
  val limit by LocalStore.downloadLimit.collectAsStateWithLifecycle()
  val bytes by Downloads.downloadedBytes.collectAsStateWithLifecycle()
  val seconds by Downloads.downloadedSeconds.collectAsStateWithLifecycle()
  val count = Downloads.downloaded.collectAsStateWithLifecycle().value.size

  // The panel may open before any feed load has indexed the files.
  LaunchedEffect(Unit) { Downloads.refreshIndex(context) }

  Column(modifier = modifier.fillMaxWidth()) {
    Row(verticalAlignment = Alignment.CenterVertically) {
      Column(modifier = Modifier.weight(1f)) {
        Text(
          text = "Ladda ner flödet",
          color = Zinc.z100,
          fontWeight = FontWeight.Bold,
          fontSize = 15.sp,
        )
        Text(
          text = "Via Wi-Fi, för lyssning offline",
          color = Zinc.z400,
          fontSize = 12.sp,
        )
        if (enabled || bytes > 0) {
          Text(
            text = "$count avsnitt · ${formatListeningTime(seconds)} · ${formatBytes(bytes)}",
            color = Zinc.z500,
            fontSize = 12.sp,
            modifier = Modifier.padding(top = 2.dp),
          )
        }
      }
      Switch(
        checked = enabled,
        onCheckedChange = { checked ->
          LocalStore.setDownloadOnWifi(checked)
          // Off should also give the storage back, not strand a pile of mp3s.
          if (!checked) Downloads.clearAll(context)
        },
      )
    }

    if (enabled) {
      Text(
        text = "Antal avsnitt",
        color = Zinc.z400,
        fontSize = 12.sp,
        modifier = Modifier.padding(top = 8.dp),
      )
      SingleChoiceSegmentedButtonRow(modifier = Modifier.padding(top = 4.dp)) {
        downloadLimitChoices.forEachIndexed { index, choice ->
          SegmentedButton(
            selected = choice == limit,
            onClick = { LocalStore.setDownloadLimit(choice) },
            shape = SegmentedButtonDefaults.itemShape(index = index, count = downloadLimitChoices.size),
            colors = SegmentedButtonDefaults.colors(
              activeContainerColor = Zinc.z800,
              activeContentColor = Zinc.z100,
              inactiveContainerColor = Color.Transparent,
              inactiveContentColor = Zinc.z400,
            ),
            label = { Text(text = "$choice", fontSize = 13.sp) },
          )
        }
      }
    }
  }
}

private fun formatListeningTime(totalSeconds: Long): String {
  val hours = totalSeconds / 3600
  val minutes = (totalSeconds % 3600) / 60
  return if (hours > 0) "$hours h $minutes min" else "$minutes min"
}

private fun formatBytes(bytes: Long): String = when {
  bytes >= 1_000_000_000 -> "%.1f GB".format(bytes / 1e9)
  bytes >= 1_000_000 -> "%.0f MB".format(bytes / 1e6)
  else -> "%.0f kB".format(bytes / 1e3)
}

@Composable
private fun DiscordSignInButton(onClick: () -> Unit) {
  Row(
    modifier = Modifier
      .background(Blurple, RoundedCornerShape(8.dp))
      .clickable(onClick = onClick)
      .padding(horizontal = 24.dp, vertical = 10.dp),
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.spacedBy(8.dp),
  ) {
    Icon(
      painter = painterResource(R.drawable.ic_discord),
      contentDescription = null,
      tint = Color.White,
      modifier = Modifier.size(20.dp),
    )
    Text(
      text = "Logga in",
      color = Color.White,
      fontWeight = FontWeight.Bold,
      fontSize = 15.sp,
    )
  }
}

@Composable
private fun SignedInRow(session: SessionState.SignedIn, onSignOut: () -> Unit) {
  Column {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
      Icon(
        painter = painterResource(R.drawable.ic_discord),
        contentDescription = null,
        tint = Blurple,
        modifier = Modifier.size(20.dp),
      )
      Text(
        text = session.username,
        color = Zinc.z100,
        fontWeight = FontWeight.Bold,
        fontSize = 15.sp,
      )
    }
    Text(
      text = "Logga ut",
      color = Zinc.z400,
      fontSize = 13.sp,
      textDecoration = TextDecoration.Underline,
      modifier = Modifier
        .padding(top = 12.dp)
        .clickable(onClick = onSignOut),
    )
  }
}

/** Branch and commit, linked to GitHub. Mirrors the web client's sidebar footer. */
@Composable
private fun BuildInfo() {
  val context = LocalContext.current
  val branch = BuildConfig.GIT_BRANCH
  val commit = BuildConfig.GIT_COMMIT

  fun open(url: String) {
    context.startActivity(Intent(Intent.ACTION_VIEW, url.toUri()))
  }

  Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
    if (branch.isNotEmpty()) {
      Text(
        text = "Branch: $branch",
        color = Zinc.z400,
        fontSize = 12.sp,
        modifier = Modifier.clickable { open("$REPO_URL/tree/$branch") },
      )
    } else {
      Text(text = "Branch: okänd", color = Zinc.z400, fontSize = 12.sp)
    }

    if (commit.isNotEmpty()) {
      Text(
        text = "Commit: ${commit.take(7)}",
        color = Zinc.z400,
        fontSize = 12.sp,
        modifier = Modifier.clickable { open("$REPO_URL/commit/$commit") },
      )
    } else {
      Text(text = "Commit: okänd", color = Zinc.z400, fontSize = 12.sp)
    }
  }
}
