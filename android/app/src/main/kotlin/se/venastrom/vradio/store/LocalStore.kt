package se.venastrom.vradio.store

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
enum class MediaType { CHANNEL, EPISODE }

/**
 * What was last playing. For channels only type + id matter — the rest is
 * re-derived from the API cache, which always holds every channel. Episodes
 * carry a playback snapshot too: the feed window moves, so weeks later the
 * episode may no longer be fetchable, and resuming must not need the network.
 */
/** One progress entry as the server reports it, handed over by [Sync]. */
data class RemoteProgress(val episodeId: String, val seconds: Double, val touchedAtMs: Long)

/** How dense the list pages render. A device preference — deliberately not synced. */
@Serializable
enum class Compactness(val label: String) {
  /** The full rows: artwork, attribution, description. */
  DEFAULT("Standard"),

  /** Thinner rows with small artwork; descriptions dropped. */
  COMPACT("Kompakt"),

  /** No artwork at all: name, progress and buttons. */
  LIST("Lista"),
}

@Serializable
data class CurrentMedia(
  val type: MediaType,
  val id: String,
  val title: String? = null,
  /** Program name for episodes, "Sveriges Radio" for channels. */
  val subtitle: String? = null,
  val image: String? = null,
  val audioUrl: String? = null,
)

/**
 * The web client's localStorage, ported: followed channels/programs, episode
 * progress, and the current media, all as JSON strings in SharedPreferences.
 *
 * [load] is the only disk read and must happen off the main thread; after it,
 * mutators are main-thread safe (in-memory update + async apply()). Corrupt
 * entries decode to their default rather than crashing — same stance the web
 * client took on unparseable localStorage.
 */
object LocalStore {
  private const val PREFS = "vradio_local"
  private const val KEY_FOLLOWED_CHANNELS = "followed_channels"
  private const val KEY_FOLLOWED_PROGRAMS = "followed_programs"
  private const val KEY_PROGRESS = "progress_seconds"
  private const val KEY_PROGRESS_TOUCHED = "progress_touched_at"
  private const val KEY_DURATIONS = "episode_durations"
  private const val KEY_CURRENT_MEDIA = "current_media"
  private const val KEY_COMPACTNESS = "ui_compactness"
  private const val KEY_DOWNLOAD_ON_WIFI = "download_on_wifi"
  private const val KEY_LAST_TAB = "last_tab"

  private val json = Json { ignoreUnknownKeys = true }

  private var prefs: SharedPreferences? = null

  private val _followedChannels = MutableStateFlow<Set<String>>(emptySet())
  val followedChannels: StateFlow<Set<String>> = _followedChannels.asStateFlow()

  private val _followedPrograms = MutableStateFlow<Set<String>>(emptySet())
  val followedPrograms: StateFlow<Set<String>> = _followedPrograms.asStateFlow()

  /** Episode id → elapsed seconds. Seconds, not ms: the server's EpisodeProgress.progress is seconds. */
  private val _progressSeconds = MutableStateFlow<Map<String, Double>>(emptyMap())
  val progressSeconds: StateFlow<Map<String, Double>> = _progressSeconds.asStateFlow()

  /**
   * Episode id → epoch ms of the last local update. Not exposed: it exists so
   * the eventual server sync can let locally-touched progress win the merge,
   * exactly as the web client's progressMeta did.
   */
  private var progressTouchedAt: Map<String, Long> = emptyMap()

  /**
   * Episode id → duration seconds, learned as episodes play. Exists so the
   * playback service can judge "is this finished?" for episodes whose DTOs it
   * never sees. Only played episodes have entries, which suffices: an episode
   * that never played cannot be finished.
   */
  private var episodeDurations: Map<String, Double> = emptyMap()

  private val _currentMedia = MutableStateFlow<CurrentMedia?>(null)
  val currentMedia: StateFlow<CurrentMedia?> = _currentMedia.asStateFlow()

  private val _compactness = MutableStateFlow(Compactness.DEFAULT)
  val compactness: StateFlow<Compactness> = _compactness.asStateFlow()

  private val _downloadOnWifi = MutableStateFlow(false)
  val downloadOnWifi: StateFlow<Boolean> = _downloadOnWifi.asStateFlow()

  /** Name of the last selected nav tab, so the app reopens where it was left. */
  private val _lastTab = MutableStateFlow<String?>(null)
  val lastTab: StateFlow<String?> = _lastTab.asStateFlow()

  /** Idempotent. Call once from a Dispatchers.IO context before anything else. */
  @Synchronized
  fun load(context: Context) {
    if (prefs != null) return
    val p = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    _followedChannels.value = decode(p, KEY_FOLLOWED_CHANNELS) ?: emptySet()
    _followedPrograms.value = decode(p, KEY_FOLLOWED_PROGRAMS) ?: emptySet()
    _progressSeconds.value = decode(p, KEY_PROGRESS) ?: emptyMap()
    progressTouchedAt = decode(p, KEY_PROGRESS_TOUCHED) ?: emptyMap()
    episodeDurations = decode(p, KEY_DURATIONS) ?: emptyMap()
    _currentMedia.value = decode(p, KEY_CURRENT_MEDIA)
    _compactness.value = decode(p, KEY_COMPACTNESS) ?: Compactness.DEFAULT
    _downloadOnWifi.value = decode(p, KEY_DOWNLOAD_ON_WIFI) ?: false
    _lastTab.value = decode(p, KEY_LAST_TAB)

    // Assigned last: it is the "loaded" flag, and the flows must hold their
    // persisted values before anyone can mutate them.
    prefs = p
  }

  @Synchronized
  fun toggleFollowedChannel(id: String) {
    _followedChannels.value = toggle(_followedChannels.value, id)
    persist(KEY_FOLLOWED_CHANNELS, _followedChannels.value)
  }

  @Synchronized
  fun toggleFollowedProgram(id: String) {
    _followedPrograms.value = toggle(_followedPrograms.value, id)
    persist(KEY_FOLLOWED_PROGRAMS, _followedPrograms.value)
  }

  /**
   * Records listening progress, clamped to [0, duration] like the web client
   * did — a seek past the end must not persist a nonsense position.
   */
  @Synchronized
  fun updateProgress(episodeId: String, seconds: Double, durationSeconds: Double? = null) {
    if (!seconds.isFinite()) return
    val clamped = when {
      durationSeconds != null && durationSeconds.isFinite() -> seconds.coerceIn(0.0, durationSeconds)
      else -> seconds.coerceAtLeast(0.0)
    }
    _progressSeconds.value = _progressSeconds.value + (episodeId to clamped)
    progressTouchedAt = progressTouchedAt + (episodeId to System.currentTimeMillis())
    persist(KEY_PROGRESS, _progressSeconds.value)
    persist(KEY_PROGRESS_TOUCHED, progressTouchedAt)

    if (durationSeconds != null && durationSeconds.isFinite() && episodeDurations[episodeId] != durationSeconds) {
      episodeDurations = episodeDurations + (episodeId to durationSeconds)
      persist(KEY_DURATIONS, episodeDurations)
    }
  }

  @Synchronized
  fun durationSecondsOf(episodeId: String): Double? = episodeDurations[episodeId]

  @Synchronized
  fun setCurrentMedia(media: CurrentMedia?) {
    _currentMedia.value = media
    persist(KEY_CURRENT_MEDIA, media)
  }

  @Synchronized
  fun setCompactness(value: Compactness) {
    _compactness.value = value
    persist(KEY_COMPACTNESS, value)
  }

  @Synchronized
  fun setDownloadOnWifi(value: Boolean) {
    _downloadOnWifi.value = value
    persist(KEY_DOWNLOAD_ON_WIFI, value)
  }

  @Synchronized
  fun setLastTab(name: String) {
    _lastTab.value = name
    persist(KEY_LAST_TAB, name)
  }

  @Synchronized
  fun progressTouchedSnapshot(): Map<String, Long> = progressTouchedAt

  /**
   * Applies the server's view of the account.
   *
   * Progress is merged per episode, last-write-wins against the local
   * touched-at stamps — and applying never bumps a stamp, so remote data can
   * never masquerade as a local edit. Follows are unioned; unfollowing still
   * propagates because [Sync]'s push replaces the server-side set.
   */
  @Synchronized
  fun applyRemoteState(
    progress: List<RemoteProgress>,
    programIds: Collection<String>,
    channelIds: Collection<String>,
  ) {
    var progressChanged = false
    val newProgress = _progressSeconds.value.toMutableMap()
    val newTouched = progressTouchedAt.toMutableMap()
    for (entry in progress) {
      if (entry.touchedAtMs > (newTouched[entry.episodeId] ?: 0L)) {
        newProgress[entry.episodeId] = entry.seconds
        newTouched[entry.episodeId] = entry.touchedAtMs
        progressChanged = true
      }
    }
    if (progressChanged) {
      _progressSeconds.value = newProgress
      progressTouchedAt = newTouched
      persist(KEY_PROGRESS, _progressSeconds.value)
      persist(KEY_PROGRESS_TOUCHED, progressTouchedAt)
    }

    val mergedPrograms = _followedPrograms.value + programIds
    if (mergedPrograms != _followedPrograms.value) {
      _followedPrograms.value = mergedPrograms
      persist(KEY_FOLLOWED_PROGRAMS, mergedPrograms)
    }
    val mergedChannels = _followedChannels.value + channelIds
    if (mergedChannels != _followedChannels.value) {
      _followedChannels.value = mergedChannels
      persist(KEY_FOLLOWED_CHANNELS, mergedChannels)
    }
  }

  private fun toggle(set: Set<String>, id: String): Set<String> =
    if (id in set) set - id else set + id

  private inline fun <reified T> decode(p: SharedPreferences, key: String): T? {
    val raw = p.getString(key, null) ?: return null
    return runCatching { json.decodeFromString<T>(raw) }.getOrNull()
  }

  private inline fun <reified T> persist(key: String, value: T) {
    val p = checkNotNull(prefs) { "LocalStore.load must run before mutation" }
    p.edit().putString(key, json.encodeToString(value)).apply()
  }
}
