package se.venastrom.vradio.store

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import se.venastrom.vradio.api.EpisodeDto
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Downloads feed episodes for offline playback, Wi-Fi only.
 *
 * Files live in app-private external storage (not cacheDir — Android may purge
 * that, and a purge is exactly what a download exists to prevent). The set is
 * bounded: the newest not-yet-finished episodes of the feed, capped by
 * [LocalStore.downloadLimit]; anything outside that (aged out, fully
 * listened, unfollowed) is pruned on each sync. Playback prefers the local file via [localUri] when one exists.
 */
object Downloads {
  private const val COMPLETION_EPSILON_SECONDS = 2.0

  /** Ids with a complete local file, for the "Nedladdad" markers. */
  val downloaded = MutableStateFlow<Set<String>>(emptySet())

  /** Total size on disk of the downloaded episodes, for the settings panel. */
  val downloadedBytes = MutableStateFlow(0L)

  /** Total listening time of the downloaded episodes, for the settings panel. */
  val downloadedSeconds = MutableStateFlow(0L)

  private val json = Json { ignoreUnknownKeys = true }

  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
  private val syncing = AtomicBoolean(false)

  private fun dir(context: Context): File =
    File(context.getExternalFilesDir(null) ?: context.filesDir, "episodes")

  private fun fileFor(context: Context, episodeId: String): File =
    File(dir(context), "$episodeId.mp3")

  /**
   * id -> durationSeconds for the downloadable set. The mp3s on disk do not
   * know their durations; this index remembers them so the settings panel can
   * total up offline listening time without probing every file.
   */
  private fun durationIndexFile(context: Context): File = File(dir(context), "durations.json")

  /** The local copy to play, or null when the episode is not (fully) downloaded. */
  fun localUri(context: Context, episodeId: String): Uri? =
    fileFor(context, episodeId).takeIf { it.isFile }?.let(Uri::fromFile)

  /** Deletes everything — the toggle turning off should also free the storage. */
  fun clearAll(context: Context) {
    val app = context.applicationContext
    scope.launch {
      dir(app).listFiles()?.forEach(File::delete)
      refreshIndexNow(app)
    }
  }

  /** Re-reads the on-disk state (async). The settings panel calls this on open. */
  fun refreshIndex(context: Context) {
    val app = context.applicationContext
    scope.launch { refreshIndexNow(app) }
  }

  /**
   * Brings the local files in line with [episodes] (the just-fetched feed).
   * Cheap when disabled or off Wi-Fi; safe to call on every feed load.
   */
  fun sync(context: Context, episodes: List<EpisodeDto>) {
    val app = context.applicationContext
    if (!syncing.compareAndSet(false, true)) return

    scope.launch {
      try {
        LocalStore.load(app)
        refreshIndexNow(app)
        if (!LocalStore.downloadOnWifi.value) return@launch

        val progress = LocalStore.progressSeconds.value
        val wanted = episodes
          .filter { (progress[it.id] ?: 0.0) < it.durationSeconds - COMPLETION_EPSILON_SECONDS }
          .sortedByDescending { it.publishedAtMs }
          .take(LocalStore.downloadLimit.value)
        val wantedIds = wanted.map { it.id }.toSet()

        runCatching {
          dir(app).mkdirs()
          durationIndexFile(app).writeText(json.encodeToString(wanted.associate { it.id to it.durationSeconds }))
        }

        // Pruning needs no network, so it runs before the Wi-Fi gate: listened
        // and aged-out episodes free their storage even on mobile data.
        dir(app).listFiles()?.forEach { file ->
          if (file.extension == "json") return@forEach
          if (file.name.substringBefore(".") !in wantedIds) file.delete()
        }
        refreshIndexNow(app)

        if (!onWifi(app)) return@launch

        for (episode in wanted) {
          if (fileFor(app, episode.id).isFile) continue
          // Both can change mid-run: the toggle in the drawer, Wi-Fi by walking away.
          if (!LocalStore.downloadOnWifi.value || !onWifi(app)) break
          download(app, episode)
          refreshIndexNow(app)
        }
      }
      finally {
        syncing.set(false)
      }
    }
  }

  private fun refreshIndexNow(context: Context) {
    val files = dir(context).listFiles()?.filter { it.isFile && it.extension == "mp3" } ?: emptyList()
    val ids = files.map { it.nameWithoutExtension }.toSet()
    val durations = runCatching {
      json.decodeFromString<Map<String, Int>>(durationIndexFile(context).readText())
    }.getOrDefault(emptyMap())

    downloaded.value = ids
    downloadedBytes.value = files.sumOf { it.length() }
    downloadedSeconds.value = ids.sumOf { (durations[it] ?: 0).toLong() }
  }

  private fun download(context: Context, episode: EpisodeDto) {
    val target = fileFor(context, episode.id)
    val tmp = File(target.parentFile, "${target.name}.tmp")
    try {
      target.parentFile?.mkdirs()
      val connection = URL(episode.audioUrl).openConnection() as HttpURLConnection
      connection.connectTimeout = 10_000
      connection.readTimeout = 30_000
      val code = connection.responseCode
      if (code !in 200..299) throw IllegalStateException("HTTP $code")

      connection.inputStream.use { input ->
        tmp.outputStream().use { output -> input.copyTo(output) }
      }
      // Temp-then-rename: a crash mid-download can never leave a playable-looking torso.
      if (!tmp.renameTo(target)) tmp.delete()
      Log.d("Downloads", "${episode.id}: downloaded ${target.length() / 1024} kB")
    }
    catch (e: Throwable) {
      tmp.delete()
      Log.w("Downloads", "${episode.id}: download failed", e)
    }
  }

  private fun onWifi(context: Context): Boolean {
    val manager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val capabilities = manager.getNetworkCapabilities(manager.activeNetwork) ?: return false
    return capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
  }
}
