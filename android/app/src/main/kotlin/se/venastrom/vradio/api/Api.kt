package se.venastrom.vradio.api

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import se.venastrom.vradio.BuildConfig
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * Read access to the backend, with an on-device cache.
 *
 * Responses are cached as files under [Context.getCacheDir], which Android
 * clears under storage pressure — losing an entry only costs a refetch.
 * Freshness is file mtime + TTL, the same scheme the server's audio cache
 * uses. Semantics per call:
 *
 *  1. fresh cache → serve it, no network
 *  2. otherwise → network, rewrite cache
 *  3. network fails → serve the stale cache if one exists (offline still
 *     shows channels), else propagate the failure
 */
object Api {
  private val json = Json { ignoreUnknownKeys = true }

  private const val CACHE_DIR = "api"
  private const val TTL_MS = 24L * 60 * 60 * 1000

  /** Channels: 52, programs: 450 — both endpoints fit in a single page. */
  private const val PAGE_SIZE = 10_000

  /** One mutex per cache key so concurrent callers (UI + PlaybackService at launch) share one fetch. */
  private val locks = mutableMapOf<String, Mutex>()

  @Synchronized
  private fun lockFor(key: String): Mutex = locks.getOrPut(key) { Mutex() }

  /** The server orders by id, which is lexicographic varchar order; name order is what the UI wants. */
  suspend fun channels(context: Context): List<ChannelDto> =
    cached<ChannelsResponse>(context, "channels", "/api/channels?page=1&pagesize=$PAGE_SIZE")
      .channels.sortedBy { it.name }

  suspend fun programs(context: Context): List<ProgramDto> =
    cached<ProgramsResponse>(context, "programs", "/api/programs?page=1&pagesize=$PAGE_SIZE")
      .programs.sortedBy { it.name }

  private suspend inline fun <reified T> cached(context: Context, key: String, path: String): T =
    withContext(Dispatchers.IO) {
      val startedAt = System.currentTimeMillis()
      // Not a local fun: those are unsupported inside inline functions.
      val elapsed = { "${System.currentTimeMillis() - startedAt}ms" }

      val file = File(File(context.cacheDir, CACHE_DIR), "$key.json")

      readCache<T>(file, requireFresh = true)?.let {
        Log.d("Api", "$key: cache hit in ${elapsed()}")
        return@withContext it
      }

      lockFor(key).withLock {
        // Whoever held the lock first may have already refreshed it.
        readCache<T>(file, requireFresh = true)?.let {
          Log.d("Api", "$key: cache hit after lock in ${elapsed()}")
          return@withLock it
        }

        try {
          val body = httpGet("${BuildConfig.API_BASE_URL}$path")
          val value = json.decodeFromString<T>(body)
          writeCache(file, body)
          Log.d("Api", "$key: fetched over network in ${elapsed()}")
          value
        }
        catch (e: Throwable) {
          readCache<T>(file, requireFresh = false)
            ?.also { Log.d("Api", "$key: network failed, stale cache in ${elapsed()}") }
            ?: throw e
        }
      }
    }

  /** Null on missing, expired (when [requireFresh]), or undecodable — all mean "go to network". */
  private inline fun <reified T> readCache(file: File, requireFresh: Boolean): T? {
    if (!file.isFile) return null
    if (requireFresh && System.currentTimeMillis() - file.lastModified() >= TTL_MS) return null
    return runCatching { json.decodeFromString<T>(file.readText()) }.getOrNull()
  }

  /** Temp-then-rename so a crash mid-write can never leave a truncated entry. */
  private fun writeCache(file: File, body: String) {
    runCatching {
      file.parentFile?.mkdirs()
      val tmp = File(file.parentFile, "${file.name}.tmp")
      tmp.writeText(body)
      if (!tmp.renameTo(file)) tmp.delete()
    }
    // A failed cache write is not a failed request; the value is already decoded.
  }

  private fun httpGet(url: String): String =
    (URL(url).openConnection() as HttpURLConnection).run {
      connectTimeout = 10_000
      readTimeout = 15_000
      requestMethod = "GET"
      val code = responseCode
      if (code !in 200..299) {
        val err = errorStream?.bufferedReader()?.readText().orEmpty()
        throw IllegalStateException("HTTP $code ${err.take(200)}")
      }
      inputStream.bufferedReader().use { it.readText() }
    }
}
