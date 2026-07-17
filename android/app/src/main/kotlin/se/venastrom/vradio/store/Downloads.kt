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
 * bounded: the [MAX_EPISODES] newest not-yet-finished episodes of the feed;
 * anything outside that (aged out, fully listened, unfollowed) is pruned on
 * each sync. Playback prefers the local file via [localUri] when one exists.
 */
object Downloads {
  private const val MAX_EPISODES = 20
  private const val COMPLETION_EPSILON_SECONDS = 2.0

  /** Ids with a complete local file, for the "Nedladdad" markers. */
  val downloaded = MutableStateFlow<Set<String>>(emptySet())

  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
  private val syncing = AtomicBoolean(false)

  private fun dir(context: Context): File =
    File(context.getExternalFilesDir(null) ?: context.filesDir, "episodes")

  private fun fileFor(context: Context, episodeId: String): File =
    File(dir(context), "$episodeId.mp3")

  /** The local copy to play, or null when the episode is not (fully) downloaded. */
  fun localUri(context: Context, episodeId: String): Uri? =
    fileFor(context, episodeId).takeIf { it.isFile }?.let(Uri::fromFile)

  /** Deletes everything — the toggle turning off should also free the storage. */
  fun clearAll(context: Context) {
    val app = context.applicationContext
    scope.launch {
      dir(app).listFiles()?.forEach(File::delete)
      refreshIndex(app)
    }
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
        refreshIndex(app)
        if (!LocalStore.downloadOnWifi.value) return@launch
        if (!onWifi(app)) return@launch

        val progress = LocalStore.progressSeconds.value
        val wanted = episodes
          .filter { (progress[it.id] ?: 0.0) < it.durationSeconds - COMPLETION_EPSILON_SECONDS }
          .sortedByDescending { it.publishedAtMs }
          .take(MAX_EPISODES)
        val wantedIds = wanted.map { it.id }.toSet()

        dir(app).listFiles()?.forEach { file ->
          if (file.name.substringBefore(".") !in wantedIds) file.delete()
        }
        refreshIndex(app)

        for (episode in wanted) {
          if (fileFor(app, episode.id).isFile) continue
          // Both can change mid-run: the toggle in the drawer, Wi-Fi by walking away.
          if (!LocalStore.downloadOnWifi.value || !onWifi(app)) break
          download(app, episode)
          refreshIndex(app)
        }
      }
      finally {
        syncing.set(false)
      }
    }
  }

  private fun refreshIndex(context: Context) {
    downloaded.value = dir(context).listFiles()
      ?.filter { it.isFile && it.extension == "mp3" }
      ?.map { it.nameWithoutExtension }
      ?.toSet()
      ?: emptySet()
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
