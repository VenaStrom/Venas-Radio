package se.venastrom.vradio

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import se.venastrom.vradio.auth.SessionState

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
      text = "Spara dina favoriter och inställningar för att synka mellan enheter.",
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

    Spacer(modifier = Modifier.weight(1f))

    BuildInfo()
  }
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
