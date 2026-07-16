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
 * What was last playing, by reference. Only type + id are stored; everything
 * displayable (name, image, stream url) is re-derived from the API cache so a
 * stale snapshot can never disagree with fresh data.
 */
@Serializable
data class CurrentMedia(val type: MediaType, val id: String)

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
  private const val KEY_CURRENT_MEDIA = "current_media"

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

  private val _currentMedia = MutableStateFlow<CurrentMedia?>(null)
  val currentMedia: StateFlow<CurrentMedia?> = _currentMedia.asStateFlow()

  /** Idempotent. Call once from a Dispatchers.IO context before anything else. */
  @Synchronized
  fun load(context: Context) {
    if (prefs != null) return
    val p = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    _followedChannels.value = decode(p, KEY_FOLLOWED_CHANNELS) ?: emptySet()
    _followedPrograms.value = decode(p, KEY_FOLLOWED_PROGRAMS) ?: emptySet()
    _progressSeconds.value = decode(p, KEY_PROGRESS) ?: emptyMap()
    progressTouchedAt = decode(p, KEY_PROGRESS_TOUCHED) ?: emptyMap()
    _currentMedia.value = decode(p, KEY_CURRENT_MEDIA)

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
  }

  @Synchronized
  fun setCurrentMedia(media: CurrentMedia?) {
    _currentMedia.value = media
    persist(KEY_CURRENT_MEDIA, media)
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
