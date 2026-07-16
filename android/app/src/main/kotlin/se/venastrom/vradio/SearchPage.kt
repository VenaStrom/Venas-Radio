package se.venastrom.vradio

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil3.compose.AsyncImage
import se.venastrom.vradio.api.Api
import se.venastrom.vradio.api.ProgramDto
import se.venastrom.vradio.store.LocalStore

/**
 * The SEARCH tab: program search. Mirrors the web client's search/page.tsx.
 *
 * Search runs entirely on-device against the cached program list — the web
 * client round-tripped every query to the server (Fuse.js there) and lazy-
 * fetched rows in batches of 30, none of which earns its keep when all 450
 * programs are already sitting in the API cache.
 */
@Composable
fun SearchPage(modifier: Modifier = Modifier) {
  val context = LocalContext.current

  var programs by remember { mutableStateOf<List<ProgramDto>?>(null) }
  var channelNames by remember { mutableStateOf<Map<String, String>>(emptyMap()) }
  var loadFailed by remember { mutableStateOf(false) }
  var query by rememberSaveable { mutableStateOf("") }

  LaunchedEffect(Unit) {
    try {
      programs = Api.programs(context)
      // Stands in for the web's broadcast_info line; purely decorative, so a
      // failure here must not take the page down.
      channelNames = runCatching { Api.channels(context).associate { it.id to it.name } }
        .getOrDefault(emptyMap())
    }
    catch (_: Throwable) {
      loadFailed = true
    }
  }

  val followed by LocalStore.followedPrograms.collectAsStateWithLifecycle()

  // Recomputed per keystroke; favorites are snapshotted per result set like the
  // web's orderingFavorites, so toggling a like never reshuffles what you see.
  val results = remember(programs, query) {
    val q = query.trim().lowercase()
    val favorites = LocalStore.followedPrograms.value
    programs
      ?.mapNotNull { program -> searchRank(program, q)?.let { rank -> program to rank } }
      ?.sortedWith(
        compareBy(
          { (program, _) -> program.id !in favorites },
          { (_, rank) -> rank },
          { (program, _) -> program.name },
        ),
      )
      ?.map { (program, _) -> program }
  }

  Column(modifier = modifier.fillMaxSize()) {
    // Pinned to the top rather than the web's pill floating above the footer:
    // bottom placement meant the bar rode the keyboard the full screen height
    // every time it opened.
    SearchBar(
      value = query,
      onValueChange = { query = it },
      placeholder = "Sök program...",
      modifier = Modifier
        .align(Alignment.CenterHorizontally)
        .padding(top = 8.dp, bottom = 8.dp)
        .fillMaxWidth(10f / 12f),
    )

    LazyColumn(
      modifier = Modifier.weight(1f),
      // px-6 pt-4 pb-10 from the web list.
      contentPadding = PaddingValues(start = 24.dp, end = 24.dp, top = 16.dp, bottom = 40.dp),
      verticalArrangement = Arrangement.spacedBy(48.dp), // gap-y-12
    ) {
      when {
        results != null -> {
          items(results, key = { it.id }) { program ->
            ProgramRow(
              program = program,
              channelName = program.channelId?.let(channelNames::get),
              isLiked = program.id in followed,
              onToggleLike = { LocalStore.toggleFollowedProgram(program.id) },
            )
          }
          if (results.isEmpty()) {
            item {
              Text(
                text = "Inga träffar.",
                color = Zinc.z400,
                fontSize = 14.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
              )
            }
          }
        }

        loadFailed -> item {
          Text(
            text = "Kunde inte hämta programmen. Är servern nåbar?",
            color = Zinc.z400,
            fontSize = 14.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
          )
        }

        else -> items(10) { ProgramRowSkeleton() }
      }
    }
  }
}

/**
 * Match rank: lower sorts first, null filters out. The server used Fuse.js;
 * prefix > name > description is a close-enough stand-in at this list size.
 */
private fun searchRank(program: ProgramDto, query: String): Int? = when {
  query.isEmpty() -> 0
  program.name.lowercase().startsWith(query) -> 0
  query in program.name.lowercase() -> 1
  query in program.description.lowercase() -> 2
  else -> null
}

/** Floating pill above the footer, ported from search-input.tsx. */
@Composable
private fun SearchBar(
  value: String,
  onValueChange: (String) -> Unit,
  placeholder: String,
  modifier: Modifier = Modifier,
) {
  Row(
    modifier = modifier
      .clip(RoundedCornerShape(8.dp))
      .background(Zinc.z950)
      .padding(horizontal = 16.dp, vertical = 10.dp),
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.spacedBy(8.dp),
  ) {
    Icon(
      painter = painterResource(R.drawable.ic_search),
      contentDescription = null,
      tint = Zinc.z100,
      modifier = Modifier
        .size(24.dp)
        .alpha(0.5f),
    )

    BasicTextField(
      value = value,
      onValueChange = onValueChange,
      singleLine = true,
      textStyle = TextStyle(color = Zinc.z100, fontSize = 18.sp, fontWeight = FontWeight.SemiBold),
      cursorBrush = SolidColor(Zinc.z100),
      modifier = Modifier.weight(1f),
      decorationBox = { innerTextField ->
        if (value.isEmpty()) {
          Text(
            text = placeholder,
            color = Zinc.z500,
            fontSize = 18.sp,
            fontWeight = FontWeight.SemiBold,
          )
        }
        innerTextField()
      },
    )

    if (value.isNotEmpty()) {
      TappableIcon(
        icon = R.drawable.ic_x,
        contentDescription = "Rensa sökningen",
        tint = Zinc.z100.copy(alpha = 0.5f),
        iconSize = 24.dp,
        onClick = { onValueChange("") },
        modifier = Modifier.size(32.dp),
      )
    }
  }
}

/** One program hit, ported from program-dom.tsx. */
@Composable
private fun ProgramRow(
  program: ProgramDto,
  channelName: String?,
  isLiked: Boolean,
  onToggleLike: () -> Unit,
) {
  Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
    SRAttribute()

    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
      AsyncImage(
        model = program.image,
        contentDescription = "Programbild för ${program.name}",
        modifier = Modifier
          .size(82.dp)
          .clip(RoundedCornerShape(6.dp))
          .background(Zinc.z600),
      )

      Column(modifier = Modifier.weight(1f)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
          Text(
            text = program.name,
            color = Zinc.z100,
            fontWeight = FontWeight.Bold,
            fontSize = 16.sp,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f),
          )
          LikeButton(isLiked = isLiked, subject = program.name, onToggle = onToggleLike)
        }

        // The web showed broadcast_info here; the API doesn't carry it, so the
        // channel the program airs on stands in.
        if (channelName != null) {
          Text(text = "Sänds i $channelName", color = Zinc.z400, fontSize = 12.sp)
        }
      }
    }

    Text(
      text = program.description,
      color = Zinc.z100,
      fontSize = 12.sp,
      // The web let descriptions run their full length; four lines keeps 450
      // rows scannable on a phone.
      maxLines = 4,
      overflow = TextOverflow.Ellipsis,
    )
  }
}

/** Pulsing placeholder, ported from program-dom.tsx's Skeleton. */
@Composable
private fun ProgramRowSkeleton() {
  val pulse by rememberInfiniteTransition(label = "skeleton")
    .animateFloat(
      initialValue = 1f,
      targetValue = 0.5f,
      animationSpec = infiniteRepeatable(tween(1000), RepeatMode.Reverse),
      label = "alpha",
    )

  Column(
    modifier = Modifier.alpha(pulse),
    verticalArrangement = Arrangement.spacedBy(8.dp),
  ) {
    Box(modifier = Modifier.height(20.dp))

    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
      Box(
        modifier = Modifier
          .size(82.dp)
          .clip(RoundedCornerShape(6.dp))
          .background(Zinc.z600),
      )
      Box(
        modifier = Modifier
          .padding(top = 8.dp)
          .size(width = 160.dp, height = 20.dp)
          .clip(RoundedCornerShape(6.dp))
          .background(Zinc.z600),
      )
    }

    Box(
      modifier = Modifier
        .fillMaxWidth()
        .height(40.dp)
        .clip(RoundedCornerShape(6.dp))
        .background(Zinc.z600),
    )
  }
}
