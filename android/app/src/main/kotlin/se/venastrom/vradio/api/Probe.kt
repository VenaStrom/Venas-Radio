package se.venastrom.vradio.api

import android.util.Log
import kotlinx.serialization.json.Json
import java.net.URL

/**
 * TEMPORARY. Decodes the live server responses with the generated DTOs,
 * strictly, so any drift between the contract and the routes throws here rather
 * than in front of a user.
 *
 * Reaches the dev machine via `adb reverse tcp:3000 tcp:3000`; on a device,
 * localhost is the phone.
 */
object Probe {
  private const val TAG = "APIPROBE"
  private val json = Json { ignoreUnknownKeys = false }

  fun run() {
    Thread {
      check("channels", "http://localhost:3000/api/channels?page=1&pagesize=10") {
        val r = json.decodeFromString<ChannelsResponse>(it)
        val first = r.channels.first()
        "${r.channels.size}/${r.total}, allIds=${r.allIds.size}, first=${first.name} stream=${first.streamUrl}"
      }
      check("programs", "http://localhost:3000/api/programs?page=1&pagesize=10") {
        val r = json.decodeFromString<ProgramsResponse>(it)
        val orphan = r.programs.count { p -> p.channelId == null }
        "${r.programs.size}/${r.total}, allIds=${r.allIds.size}, nullChannelId=$orphan"
      }
    }.start()
  }

  private fun check(name: String, url: String, decode: (String) -> String) {
    try {
      Log.i(TAG, "PASS $name: ${decode(URL(url).readText())}")
    } catch (e: Throwable) {
      Log.e(TAG, "FAIL $name: ${e::class.simpleName}: ${e.message}")
    }
  }
}
