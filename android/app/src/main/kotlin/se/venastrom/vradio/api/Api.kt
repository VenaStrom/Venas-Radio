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
/**
 * A feed answer that knows where it came from: [offline] means the network was
 * unreachable and [episodes] are the newest cached data — the UI says so
 * instead of letting "offline" masquerade as "nothing new".
 */
data class EpisodesFeed(val episodes: List<EpisodeDto>, val offline: Boolean)

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

  /** Feed data goes stale fast; the server itself re-asks SR after 15 minutes. */
  private const val EPISODES_TTL_MS = 15L * 60 * 1000

  /** The value plus whether it is current (network or unexpired cache) or a stale fallback. */
  private data class CacheResult<T>(val value: T, val fresh: Boolean)

  /** The server orders by id, which is lexicographic varchar order; name order is what the UI wants. */
  suspend fun channels(context: Context): List<ChannelDto> =
    cached<ChannelsResponse>(context, "channels", "/api/channels?page=1&pagesize=$PAGE_SIZE")
      .value.channels.sortedBy { it.name }

  suspend fun programs(context: Context): List<ProgramDto> =
    cached<ProgramsResponse>(context, "programs", "/api/programs?page=1&pagesize=$PAGE_SIZE")
      .value.programs.sortedBy { it.name }

  /**
   * Latest episodes for [programIds], newest first. The cache key carries the
   * id set, so changing what you follow can never serve the wrong feed.
   * [force] skips the freshness check (pull-to-refresh) but still falls back
   * to stale cache when the network is down.
   */
  suspend fun episodes(context: Context, programIds: Collection<String>, force: Boolean = false): EpisodesFeed {
    val ids = programIds.sorted()
    val key = "episodes-${ids.joinToString(",").hashCode().toUInt().toString(16)}"
    val path = "/api/episodes?programIds=${ids.joinToString(",")}"
    return try {
      val result = cached<EpisodesResponse>(context, key, path, ttlMs = EPISODES_TTL_MS, force = force)
      EpisodesFeed(result.value.episodes, offline = !result.fresh)
    }
    catch (e: Throwable) {
      // The key hashes the followed set, so changing follows while offline
      // points at a cache file that does not exist. The newest cached feed,
      // filtered to what is followed now, beats an empty error page.
      val fallback = staleEpisodesAnyKey(context, ids.toSet()) ?: throw e
      EpisodesFeed(fallback, offline = true)
    }
  }

  private suspend fun staleEpisodesAnyKey(context: Context, programIds: Set<String>): List<EpisodeDto>? =
    withContext(Dispatchers.IO) {
      File(context.cacheDir, CACHE_DIR)
        .listFiles { file -> file.name.startsWith("episodes-") && file.name.endsWith(".json") }
        ?.maxByOrNull { it.lastModified() }
        ?.let { file -> runCatching { json.decodeFromString<EpisodesResponse>(file.readText()) }.getOrNull() }
        ?.episodes
        ?.filter { it.programId in programIds }
        ?.takeIf { it.isNotEmpty() }
        ?.also { Log.d("Api", "episodes: cross-key stale fallback served ${it.size}") }
    }

  private suspend inline fun <reified T> cached(
    context: Context,
    key: String,
    path: String,
    ttlMs: Long = TTL_MS,
    force: Boolean = false,
  ): CacheResult<T> =
    withContext(Dispatchers.IO) {
      val startedAt = System.currentTimeMillis()
      // Not a local fun: those are unsupported inside inline functions.
      val elapsed = { "${System.currentTimeMillis() - startedAt}ms" }

      val file = File(File(context.cacheDir, CACHE_DIR), "$key.json")

      if (!force) {
        readCache<T>(file, ttlMs)?.let {
          Log.d("Api", "$key: cache hit in ${elapsed()}")
          return@withContext CacheResult(it, fresh = true)
        }
      }

      lockFor(key).withLock {
        // Whoever held the lock first may have already refreshed it.
        if (!force) {
          readCache<T>(file, ttlMs)?.let {
            Log.d("Api", "$key: cache hit after lock in ${elapsed()}")
            return@withLock CacheResult(it, fresh = true)
          }
        }

        try {
          val body = httpGet("${BuildConfig.API_BASE_URL}$path")
          val value = json.decodeFromString<T>(body)
          writeCache(file, body)
          Log.d("Api", "$key: fetched over network in ${elapsed()}")
          CacheResult(value, fresh = true)
        }
        catch (e: Throwable) {
          readCache<T>(file, ttlMs = null)
            ?.also { Log.d("Api", "$key: network failed, stale cache in ${elapsed()}") }
            ?.let { CacheResult(it, fresh = false) }
            ?: throw e
        }
      }
    }

  /** Null on missing, expired (when [ttlMs] is given), or undecodable — all mean "go to network". */
  private inline fun <reified T> readCache(file: File, ttlMs: Long?): T? {
    if (!file.isFile) return null
    if (ttlMs != null && System.currentTimeMillis() - file.lastModified() >= ttlMs) return null
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
