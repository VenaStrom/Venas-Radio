package se.venastrom.vradio.store

import android.content.Context
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import se.venastrom.vradio.BuildConfig
import se.venastrom.vradio.api.EpisodeProgressDto
import se.venastrom.vradio.api.UserStateDto
import se.venastrom.vradio.auth.Auth
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Keeps [LocalStore] and the server's user state converged.
 *
 * Local writes stay instant and offline-first; this object just watches the
 * store and pushes the whole state at most every [PUSH_INTERVAL_MS]. The PUT
 * response is the server's merged view, which is applied back — one round trip
 * both uploads and reconciles. Signed out, everything here is a no-op.
 */
object Sync {
  /** True after a failed push or pull; the header renders it as "Synkfel". */
  val failed = MutableStateFlow(false)

  private const val PUSH_INTERVAL_MS = 10_000L
  private const val PULL_DEBOUNCE_MS = 30_000L

  private val json = Json { ignoreUnknownKeys = true }
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
  private val dirty = AtomicBoolean(false)
  private var started = false
  private var lastPullAtMs = 0L

  /**
   * Idempotent. Starts the store watcher and the push loop, then pulls.
   * Called from both MainActivity and PlaybackService, whichever wakes first.
   */
  @Synchronized
  fun start(context: Context) {
    if (started) return
    started = true
    val app = context.applicationContext

    scope.launch {
      LocalStore.load(app)

      launch {
        combine(
          LocalStore.progressSeconds,
          LocalStore.followedPrograms,
          LocalStore.followedChannels,
        ) { _, _, _ -> }
          // The initial emissions are the loaded state, not edits.
          .drop(1)
          .collect { dirty.set(true) }
      }

      pull(app)

      while (isActive) {
        delay(PUSH_INTERVAL_MS)
        if (dirty.getAndSet(false) && !push(app)) {
          // Failed pushes retry on the next tick rather than hammering.
          dirty.set(true)
        }
      }
    }
  }

  /** Pulls again — call when a sign-in completes. Debounced; no-op signed out. */
  fun refresh(context: Context) {
    val app = context.applicationContext
    scope.launch {
      LocalStore.load(app)
      if (System.currentTimeMillis() - lastPullAtMs < PULL_DEBOUNCE_MS) return@launch
      pull(app)
    }
  }

  private fun pull(context: Context): Boolean {
    val token = Auth.storedToken(context) ?: return false
    lastPullAtMs = System.currentTimeMillis()
    return try {
      val body = request("GET", token, null)
      apply(json.decodeFromString<UserStateDto>(body))
      failed.value = false
      // Upload the merged view, so state that only exists locally lands too.
      dirty.set(true)
      true
    }
    catch (e: Throwable) {
      Log.w("Sync", "Pull failed", e)
      failed.value = true
      false
    }
  }

  private fun push(context: Context): Boolean {
    // Signed out is not a failure; there is simply nothing to sync.
    val token = Auth.storedToken(context) ?: return true
    return try {
      val body = request("PUT", token, json.encodeToString(snapshot()))
      apply(json.decodeFromString<UserStateDto>(body))
      failed.value = false
      true
    }
    catch (e: Throwable) {
      Log.w("Sync", "Push failed", e)
      failed.value = true
      false
    }
  }

  private fun snapshot(): UserStateDto {
    val touched = LocalStore.progressTouchedSnapshot()
    return UserStateDto(
      progress = LocalStore.progressSeconds.value.mapNotNull { (id, seconds) ->
        val touchedAtMs = touched[id] ?: return@mapNotNull null
        EpisodeProgressDto(episodeId = id, seconds = seconds, touchedAtMs = touchedAtMs)
      },
      followedProgramIds = LocalStore.followedPrograms.value.toList(),
      followedChannelIds = LocalStore.followedChannels.value.toList(),
    )
  }

  private fun apply(state: UserStateDto) {
    LocalStore.applyRemoteState(
      progress = state.progress.map { RemoteProgress(it.episodeId, it.seconds, it.touchedAtMs) },
      programIds = state.followedProgramIds,
      channelIds = state.followedChannelIds,
    )
  }

  private fun request(method: String, token: String, body: String?): String =
    (URL("${BuildConfig.API_BASE_URL}/api/user-state").openConnection() as HttpURLConnection).run {
      connectTimeout = 10_000
      readTimeout = 15_000
      requestMethod = method
      setRequestProperty("Authorization", "Bearer $token")
      if (body != null) {
        doOutput = true
        setRequestProperty("Content-Type", "application/json")
        outputStream.use { it.write(body.toByteArray()) }
      }
      val code = responseCode
      if (code !in 200..299) {
        val err = errorStream?.bufferedReader()?.readText().orEmpty()
        throw IllegalStateException("HTTP $code ${err.take(200)}")
      }
      inputStream.bufferedReader().use { it.readText() }
    }
}
