package se.venastrom.vradio

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/** The Tailwind zinc values the web client used, so the two look the same. */
object Zinc {
  val z100 = Color(0xFFF4F4F5)
  val z400 = Color(0xFFA1A1AA)
  val z500 = Color(0xFF71717A)
  val z900 = Color(0xFF18181B)
  val z950 = Color(0xFF09090B)
}

/** From global.tw.css: --header-height: 4rem, --footer-height: 6rem. */
object Dimens {
  val headerHeight = 64.dp
  val footerHeight = 96.dp
}

@Composable
fun VRadioTheme(content: @Composable () -> Unit) {
  MaterialTheme(
    colorScheme = darkColorScheme(
      background = Zinc.z900,
      surface = Zinc.z950,
      onBackground = Zinc.z100,
      onSurface = Zinc.z100,
    ),
    content = content,
  )
}
