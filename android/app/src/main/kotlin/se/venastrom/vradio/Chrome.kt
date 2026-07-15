package se.venastrom.vradio

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Header: logo on the left, options on the right.
 * Mirrors the web client's <header> in app.tsx.
 */
@Composable
fun VRadioHeader(
  onMenuClick: () -> Unit,
  modifier: Modifier = Modifier,
) {
  Row(
    modifier = modifier
      .fillMaxWidth()
      .background(Zinc.z950)
      .statusBarsPadding()
      .windowInsetsPadding(WindowInsets.navigationBars.only(WindowInsetsSides.Horizontal)) // Inset to avoid the nav bar
      .height(Dimens.headerHeight)
      .padding(horizontal = 8.dp),
    verticalAlignment = Alignment.CenterVertically,
  ) {
    // Logo
    Row(
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
      Icon(
        painter = painterResource(R.drawable.ic_audio_lines),
        contentDescription = null,
        tint = Zinc.z100,
        modifier = Modifier.size(28.dp),
      )
      Text(
        text = "VR",
        color = Zinc.z100,
        fontWeight = FontWeight.Bold,
        fontSize = 20.sp,
      )
    }

    Spacer(modifier = Modifier.weight(1f))

    TappableIcon(
      icon = R.drawable.ic_menu,
      contentDescription = "Meny",
      tint = Zinc.z100,
      iconSize = 32.dp,
      onClick = onMenuClick,
      modifier = Modifier.size(48.dp),
    )
  }
}

/** Tabs in the footer nav. Routes are stubbed until navigation exists. */
enum class Tab(val icon: Int, val label: String) {
  LIVE(R.drawable.ic_radio, "Live"),
  SEARCH(R.drawable.ic_newspaper, "Sök"),
  FEED(R.drawable.ic_heart, "Flöde"),
}

/**
 * Footer: playback controls stacked above the nav row.
 * Mirrors the web client's <footer> in app.tsx.
 */
@Composable
fun VRadioFooter(
  selected: Tab,
  onTabClick: (Tab) -> Unit,
  controls: @Composable () -> Unit,
  modifier: Modifier = Modifier,
) {
  Column(
    modifier = modifier
      .fillMaxWidth()
      .background(Zinc.z950)
      .navigationBarsPadding(),
  ) {
    controls()

    Row(
      modifier = Modifier
        .fillMaxWidth()
        .height(Dimens.footerHeight),
      verticalAlignment = Alignment.CenterVertically,
    ) {
      // weight(1f) rather than SpaceBetween: each tab owns a full third of the
      // footer, so the tap target is the whole cell and not just the glyph.
      Tab.entries.forEach { tab ->
        TappableIcon(
          icon = tab.icon,
          contentDescription = tab.label,
          tint = if (tab == selected) Zinc.z100 else Zinc.z500,
          iconSize = 40.dp,
          onClick = { onTabClick(tab) },
          modifier = Modifier
            .weight(1f)
            .fillMaxHeight(),
        )
      }
    }
  }
}

/**
 * An icon with its own tap target.
 *
 * Deliberately not Material3's IconButton: that clips its content to a 40dp
 * circle, which slices the corners off square-ish glyphs (the newspaper icon
 * came out octagonal), and its fixed 48dp box cannot be stretched to fill a
 * nav cell. A plain Box clips nothing and takes whatever size it is given.
 */
@Composable
fun TappableIcon(
  icon: Int,
  contentDescription: String,
  tint: Color,
  iconSize: Dp,
  onClick: () -> Unit,
  enabled: Boolean = true,
  modifier: Modifier = Modifier,
) {
  Box(
    modifier = modifier.clickable(
      interactionSource = remember { MutableInteractionSource() },
      // Unbounded so the ripple stays a circle around the glyph instead of
      // flooding the whole cell.
      indication = ripple(bounded = false, radius = 32.dp),
      enabled = enabled,
      onClick = onClick,
    ),
    contentAlignment = Alignment.Center,
  ) {
    Icon(
      painter = painterResource(icon),
      contentDescription = contentDescription,
      tint = tint,
      modifier = Modifier.size(iconSize),
    )
  }
}
