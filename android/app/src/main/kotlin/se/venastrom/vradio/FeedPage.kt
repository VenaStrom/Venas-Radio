package se.venastrom.vradio

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import coil3.compose.AsyncImage
import kotlinx.coroutines.launch
import se.venastrom.vradio.api.Api
import se.venastrom.vradio.api.EpisodeDto
import se.venastrom.vradio.store.Compactness
import se.venastrom.vradio.store.Downloads
import se.venastrom.vradio.store.LocalStore
import se.venastrom.vradio.store.UiSession
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale

private val swedish = Locale.forLanguageTag("sv-SE")

/** Within this of the end counts as fully listened — same epsilon as the web client. */
private const val COMPLETION_EPSILON_SECONDS = 2.0

/**
 * The FEED tab: the latest episodes from followed programs, newest first,
 * grouped under relative date headers. Mirrors the web client's feed/page.tsx.
 */
@Composable
fun FeedPage(controller: MediaController?, onExplore: () -> Unit, modifier: Modifier = Modifier) {
  val context = LocalContext.current
  val scope = rememberCoroutineScope()

  val followed by LocalStore.followedPrograms.collectAsStateWithLifecycle()
  var episodes by remember { mutableStateOf<List<EpisodeDto>?>(null) }
  var offline by remember { mutableStateOf(false) }
  var loadFailed by remember { mutableStateOf(false) }
  var refreshing by remember { mutableStateOf(false) }
  // Session-scoped so switching tabs does not wipe the query.
  var query by UiSession::feedQuery

  LaunchedEffect(followed) {
    if (followed.isEmpty()) return@LaunchedEffect
    episodes = null
    loadFailed = false
    try {
      val feed = Api.episodes(context, followed)
      episodes = feed.episodes
      offline = feed.offline
      if (!feed.offline) Downloads.sync(context, feed.episodes)
    }
    catch (_: Throwable) {
      loadFailed = true
    }
  }

  fun refresh() {
    if (refreshing || followed.isEmpty()) return
    scope.launch {
      refreshing = true
      try {
        val feed = Api.episodes(context, followed, force = true)
        episodes = feed.episodes
        offline = feed.offline
        if (!feed.offline) Downloads.sync(context, feed.episodes)
        loadFailed = false
      }
      catch (_: Throwable) {
        loadFailed = episodes == null
      }
      refreshing = false
    }
  }

  val progress by LocalStore.progressSeconds.collectAsStateWithLifecycle()
  val compactness by LocalStore.compactness.collectAsStateWithLifecycle()
  val downloadedIds by Downloads.downloaded.collectAsStateWithLifecycle()

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

  val filtered = remember(episodes, query) {
    val q = query.trim().lowercase()
    if (q.isEmpty()) {
      episodes
    }
    else {
      episodes?.filter {
        q in it.title.lowercase() || q in it.description.lowercase() || q in it.programName.lowercase()
      }
    }
  }

  fun playPause(episode: EpisodeDto) {
    val c = controller ?: return
    // The list as currently shown becomes the playlist, so a finished episode
    // auto-advances to the next one — and with a search active, "next" means
    // the next search hit, not the next thing in the unfiltered feed.
    val playlist = filtered ?: return

    // Already loaded: toggle without resetting the position.
    if (c.currentMediaItem?.mediaId == episode.id) {
      if (c.isPlaying) c.pause() else c.play()
      return
    }

    val saved = LocalStore.progressSeconds.value[episode.id] ?: 0.0
    val complete = saved >= episode.durationSeconds - COMPLETION_EPSILON_SECONDS
    val startMs = if (complete) 0L else (saved * 1000).toLong()
    c.setMediaItems(
      playlist.map { it.toMediaItem(Downloads.localUri(context, it.id)) },
      playlist.indexOf(episode),
      startMs,
    )
    c.prepare()
    c.play()
  }

  if (followed.isEmpty()) {
    EmptyState(
      title = "Inga favoriter än",
      description = "Följ program för att se deras senaste avsnitt.",
      onExplore = onExplore,
      modifier = modifier,
    )
    return
  }

  Column(modifier = modifier.fillMaxSize()) {
    SearchBar(
      value = query,
      onValueChange = { query = it },
      placeholder = "Sök i flödet...",
      modifier = Modifier
        .align(Alignment.CenterHorizontally)
        .padding(top = 8.dp, bottom = 8.dp)
        .fillMaxWidth(10f / 12f),
    )

    // Otherwise "offline" masquerades as "your programs have nothing new" —
    // most confusingly right after following something.
    if (offline) {
      Text(
        text = "Ingen kontakt med servern – visar sparade avsnitt",
        color = Color(0xFFFBBF24), // Tailwind amber-400
        fontSize = 12.sp,
        textAlign = TextAlign.Center,
        modifier = Modifier
          .fillMaxWidth()
          .padding(bottom = 4.dp),
      )
    }

    when {
      filtered != null && filtered.isEmpty() && query.isNotBlank() -> EmptyState(
        title = "Inga träffar",
        description = "Inga avsnitt matchar din sökning.",
        onExplore = onExplore,
      )

      filtered != null && filtered.isEmpty() -> EmptyState(
        title = "Inga avsnitt än",
        description = "Dina favoriter har inga nya avsnitt just nu.",
        onExplore = onExplore,
        action = {
          Button(onClick = ::refresh, enabled = !refreshing) {
            Text(if (refreshing) "Hämtar avsnitt..." else "Hämta senaste avsnitten")
          }
        },
      )

      loadFailed -> EmptyState(
        title = "Något gick fel",
        description = "Kunde inte hämta avsnitten. Är servern nåbar?",
        onExplore = onExplore,
        action = {
          Button(onClick = ::refresh, enabled = !refreshing) {
            Text(if (refreshing) "Hämtar avsnitt..." else "Försök igen")
          }
        },
      )

      else -> {
        val today = LocalDate.now()
        LazyColumn(
          modifier = Modifier.weight(1f),
          // px-6 pt-4 pb-10 from the web list; gap-y-8 in the full layout.
          contentPadding = PaddingValues(start = 24.dp, end = 24.dp, top = 16.dp, bottom = 40.dp),
          verticalArrangement = Arrangement.spacedBy(
            when (compactness) {
              Compactness.DEFAULT -> 32.dp
              Compactness.COMPACT -> 16.dp
              Compactness.LIST -> 8.dp
            },
          ),
        ) {
          if (filtered == null) {
            itemsIndexed(List(8) { it }, key = { i, _ -> i }) { _, _ -> EpisodeRowSkeleton() }
          }
          else {
            itemsIndexed(filtered, key = { _, episode -> episode.id }) { index, episode ->
              val date = localDateOf(episode.publishedAtMs)
              val previousDate = if (index > 0) localDateOf(filtered[index - 1].publishedAtMs) else null

              Column {
                // Header travels with the first row of its day, 8dp apart —
                // the web did the same with a negative margin.
                if (date != previousDate) {
                  Text(
                    text = dateHeaderLabel(date, today),
                    color = Zinc.z400,
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                      .fillMaxWidth()
                      .padding(bottom = 8.dp),
                  )
                }
                EpisodeRow(
                  episode = episode,
                  progressSeconds = progress[episode.id] ?: 0.0,
                  isPlaying = playingId == episode.id,
                  isDownloaded = episode.id in downloadedIds,
                  playEnabled = controller != null,
                  onPlayPause = { playPause(episode) },
                  compactness = compactness,
                )
              }
            }
          }
        }
      }
    }
  }
}

private fun localDateOf(epochMs: Long): LocalDate =
  Instant.ofEpochMilli(epochMs).atZone(ZoneId.systemDefault()).toLocalDate()

/** "i dag" / "i går" near today, weekday + date further out — like the web's Intl formatting. */
private fun dateHeaderLabel(date: LocalDate, today: LocalDate): String {
  val diff = ChronoUnit.DAYS.between(today, date).toInt()
  val label = when (diff) {
    -2 -> "i förrgår"
    -1 -> "i går"
    0 -> "i dag"
    1 -> "i morgon"
    2 -> "i övermorgon"
    else -> date.format(DateTimeFormatter.ofPattern("EEEE d MMM", swedish))
  }
  return if (diff > 0) "$label (tidig publicering)" else label
}

private fun formatClock(epochMs: Long): String =
  DateTimeFormatter.ofPattern("HH:mm").format(Instant.ofEpochMilli(epochMs).atZone(ZoneId.systemDefault()))

/** "1 h 23 min" / "45 min" / "30 s" — the web hid seconds once minutes existed. */
private fun formatSpan(totalSeconds: Int): String {
  val hours = totalSeconds / 3600
  val minutes = (totalSeconds % 3600) / 60
  return when {
    hours > 0 -> "$hours h $minutes min"
    minutes > 0 -> "$minutes min"
    else -> "$totalSeconds s"
  }
}

/** One feed row, ported from episode-dom.tsx. */
@Composable
private fun EpisodeRow(
  episode: EpisodeDto,
  progressSeconds: Double,
  isPlaying: Boolean,
  isDownloaded: Boolean,
  playEnabled: Boolean,
  onPlayPause: () -> Unit,
  compactness: Compactness,
) {
  val fraction = if (episode.durationSeconds > 0) {
    (progressSeconds / episode.durationSeconds).toFloat().coerceIn(0f, 1f)
  }
  else {
    0f
  }

  if (compactness != Compactness.DEFAULT) {
    Row(
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
      if (compactness == Compactness.COMPACT) {
        AsyncImage(
          model = episode.image,
          contentDescription = "Avsnittsbild för ${episode.title}",
          modifier = Modifier
            .size(width = 80.dp, height = 45.dp)
            .clip(RoundedCornerShape(4.dp))
            .background(Zinc.z600),
        )
      }

      Column(modifier = Modifier.weight(1f)) {
        if (compactness == Compactness.COMPACT) {
          Text(text = episode.programName, color = Zinc.z400, fontSize = 11.sp, maxLines = 1)
          Text(
            text = episode.title,
            color = Zinc.z100,
            fontWeight = FontWeight.Bold,
            fontSize = 13.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
          )
        }
        else {
          Text(
            text = "${episode.programName} · ${episode.title}",
            color = Zinc.z100,
            fontWeight = FontWeight.Bold,
            fontSize = 13.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
          )
        }
        Spacer(modifier = Modifier.height(4.dp))
        ProgressLine(fraction)
      }

      TappableIcon(
        icon = if (isPlaying) R.drawable.ic_pause else R.drawable.ic_play,
        contentDescription = if (isPlaying) "Pausa ${episode.title}" else "Spela ${episode.title}",
        tint = Zinc.z100,
        iconSize = 26.dp,
        enabled = playEnabled,
        onClick = onPlayPause,
        modifier = Modifier.size(40.dp),
      )
    }
    return
  }

  Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
    SRAttribute()

    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
      AsyncImage(
        model = episode.image,
        contentDescription = "Avsnittsbild för ${episode.title}",
        modifier = Modifier
          .size(width = 128.dp, height = 72.dp)
          .clip(RoundedCornerShape(6.dp))
          .background(Zinc.z600),
      )

      Column {
        Text(text = episode.programName, color = Zinc.z100, fontWeight = FontWeight.Light, fontSize = 14.sp)
        Text(
          text = episode.title,
          color = Zinc.z100,
          fontWeight = FontWeight.Bold,
          fontSize = 14.sp,
          maxLines = 2,
          overflow = TextOverflow.Ellipsis,
        )
      }
    }

    Text(
      text = episode.description,
      color = Zinc.z100,
      fontSize = 12.sp,
      maxLines = 3,
      overflow = TextOverflow.Ellipsis,
    )

    ProgressLine(fraction)

    Row(
      modifier = Modifier.fillMaxWidth(),
      verticalAlignment = Alignment.CenterVertically,
    ) {
      val remaining = episode.durationSeconds - progressSeconds
      val listenState = when {
        progressSeconds <= 0.0 -> formatSpan(episode.durationSeconds)
        remaining <= COMPLETION_EPSILON_SECONDS -> "${formatSpan(episode.durationSeconds)}  ·  Lyssnad"
        else -> "${formatSpan(remaining.toInt())} kvar"
      }
      val downloadedSuffix = if (isDownloaded) "  ·  Nedladdad" else ""
      Text(
        text = "${dateHeaderLabel(localDateOf(episode.publishedAtMs), LocalDate.now())} " +
          "${formatClock(episode.publishedAtMs)}  ·  $listenState$downloadedSuffix",
        color = Zinc.z400,
        fontSize = 12.sp,
        modifier = Modifier.weight(1f),
      )

      TappableIcon(
        icon = if (isPlaying) R.drawable.ic_pause else R.drawable.ic_play,
        contentDescription = if (isPlaying) "Pausa ${episode.title}" else "Spela ${episode.title}",
        tint = Zinc.z100,
        iconSize = 28.dp,
        enabled = playEnabled,
        onClick = onPlayPause,
        modifier = Modifier.size(40.dp),
      )
    }
  }
}

/** Static thin bar: listened share of the episode. */
@Composable
private fun ProgressLine(fraction: Float) {
  Box(
    modifier = Modifier
      .fillMaxWidth()
      .height(4.dp)
      .clip(RoundedCornerShape(2.dp))
      .background(Zinc.z800),
  ) {
    if (fraction > 0f) {
      Box(
        modifier = Modifier
          .fillMaxWidth(fraction)
          .fillMaxHeight()
          .background(Zinc.z100, RoundedCornerShape(2.dp)),
      )
    }
  }
}

@Composable
private fun EmptyState(
  title: String,
  description: String,
  onExplore: () -> Unit,
  modifier: Modifier = Modifier,
  action: (@Composable () -> Unit)? = null,
) {
  Column(
    modifier = modifier
      .fillMaxWidth()
      .padding(top = 48.dp, start = 24.dp, end = 24.dp),
    horizontalAlignment = Alignment.CenterHorizontally,
    verticalArrangement = Arrangement.spacedBy(12.dp),
  ) {
    Text(text = title, color = Zinc.z100, fontWeight = FontWeight.Bold, fontSize = 20.sp)
    Text(text = description, color = Zinc.z400, fontSize = 14.sp, textAlign = TextAlign.Center)
    action?.invoke()
    Text(
      text = "Utforska program",
      color = Zinc.z100,
      fontSize = 14.sp,
      textDecoration = TextDecoration.Underline,
      modifier = Modifier.clickable(onClick = onExplore),
    )
  }
}

/** Pulsing placeholder row, ported from episode-dom-skeleton.tsx. */
@Composable
private fun EpisodeRowSkeleton() {
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
    Spacer(modifier = Modifier.height(12.dp))

    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
      Box(
        modifier = Modifier
          .size(width = 128.dp, height = 72.dp)
          .clip(RoundedCornerShape(6.dp))
          .background(Zinc.z600),
      )
      Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(
          modifier = Modifier
            .size(width = 120.dp, height = 14.dp)
            .clip(RoundedCornerShape(4.dp))
            .background(Zinc.z600),
        )
        Box(
          modifier = Modifier
            .size(width = 180.dp, height = 16.dp)
            .clip(RoundedCornerShape(4.dp))
            .background(Zinc.z600),
        )
      }
    }

    Box(
      modifier = Modifier
        .fillMaxWidth()
        .height(32.dp)
        .clip(RoundedCornerShape(6.dp))
        .background(Zinc.z600),
    )
  }
}
