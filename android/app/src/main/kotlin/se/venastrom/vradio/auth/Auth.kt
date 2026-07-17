package se.venastrom.vradio.auth

import android.content.Context
import android.net.Uri
import android.util.Base64
import androidx.browser.customtabs.CustomTabsIntent
import kotlinx.serialization.json.Json
import se.venastrom.vradio.BuildConfig
import se.venastrom.vradio.api.ExchangeRequest
import se.venastrom.vradio.api.MeDto
import se.venastrom.vradio.api.SessionDto
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.security.SecureRandom

/** An HTTP error with its status, so callers can tell "rejected" from "unreachable". */
class HttpException(val code: Int, body: String) : Exception("HTTP $code $body")

sealed interface SessionState {
  data object Loading : SessionState
  data object SignedOut : SessionState
  data class SignedIn(val userId: String, val username: String, val avatarUrl: String?) : SessionState
  data class Failed(val message: String) : SessionState
}

/**
 * Discord sign-in.
 *
 * The app is a public client, so it never sees the Discord client secret: the
 * browser goes to our server, which does the code exchange itself and hands back
 * a one-time code over a custom-scheme deep link.
 *
 * That deep link is the weak point — any installed app can register the same
 * scheme and receive it. So the code alone is not enough: redeeming it requires
 * [pendingVerifier], which is generated here and never transmitted until the
 * exchange POST. An interceptor gets a code it cannot spend.
 */
object Auth {
  private val json = Json { ignoreUnknownKeys = true }
  private val random = SecureRandom()

  /**
   * Held in memory only, for the few seconds between opening the browser and the
   * redirect. Persisting it would defeat its purpose; losing it on process death
   * just means the user taps sign-in again.
   */
  private var pendingVerifier: String? = null
  private var pendingState: String? = null

  fun storedToken(context: Context): String? = TokenStore.read(context)

  private fun storeToken(context: Context, token: String?) {
    if (token == null) TokenStore.clear(context) else TokenStore.write(context, token)
  }

  private fun randomUrlSafe(bytes: Int): String {
    val buf = ByteArray(bytes)
    random.nextBytes(buf)
    return Base64.encodeToString(buf, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)
  }

  /** base64url(SHA-256(verifier)), matching the server's sha256Base64Url. */
  private fun challengeFor(verifier: String): String {
    val digest = MessageDigest.getInstance("SHA-256").digest(verifier.toByteArray())
    return Base64.encodeToString(digest, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)
  }

  /**
   * Opens the flow in a Custom Tab.
   *
   * A Custom Tab, not a WebView: a WebView would let the app read the user's
   * Discord credentials as they type, which is exactly what OAuth exists to
   * avoid, and Discord blocks embedded webviews for that reason.
   */
  fun startSignIn(context: Context) {
    val verifier = randomUrlSafe(48)
    val state = randomUrlSafe(24)
    pendingVerifier = verifier
    pendingState = state

    val url = Uri.parse("${BuildConfig.API_BASE_URL}/auth/discord/start")
      .buildUpon()
      .appendQueryParameter("state", state)
      .appendQueryParameter("challenge", challengeFor(verifier))
      .build()

    CustomTabsIntent.Builder().setShowTitle(true).build().launchUrl(context, url)
  }

  /** True when this intent is our OAuth redirect coming back. */
  fun isRedirect(uri: Uri?): Boolean =
    uri != null && uri.scheme == BuildConfig.AUTH_SCHEME && uri.host == "auth"

  /**
   * Redeems the one-time code from the deep link. Blocking; call off the main
   * thread.
   */
  fun completeSignIn(context: Context, uri: Uri): SessionState {
    val code = uri.getQueryParameter("code")
      ?: return SessionState.Failed("Inloggningen saknade kod.")
    val state = uri.getQueryParameter("state")
    val verifier = pendingVerifier

    // Guards against a redirect we did not initiate.
    if (verifier == null || state == null || state != pendingState) {
      return SessionState.Failed("Inloggningen matchade ingen påbörjad begäran.")
    }
    pendingVerifier = null
    pendingState = null

    return try {
      val body = json.encodeToString(ExchangeRequest(code = code, verifier = verifier))
      val res = post("${BuildConfig.API_BASE_URL}/auth/discord/exchange", body)
      val session = json.decodeFromString<SessionDto>(res)
      storeToken(context, session.token)
      SessionState.SignedIn(session.userId, session.username, session.avatarUrl)
    } catch (e: Throwable) {
      SessionState.Failed(e.message ?: "Inloggningen misslyckades.")
    }
  }

  /** Confirms a stored token still works. Blocking; call off the main thread. */
  fun restore(context: Context): SessionState {
    val token = storedToken(context) ?: return SessionState.SignedOut
    return try {
      val res = get("${BuildConfig.API_BASE_URL}/auth/me", token)
      val me = json.decodeFromString<MeDto>(res)
      SessionState.SignedIn(me.userId, me.username, me.avatarUrl)
    } catch (e: HttpException) {
      if (e.code == 401 || e.code == 403) {
        // Actually rejected: the session is gone, so is the token.
        storeToken(context, null)
        SessionState.SignedOut
      }
      else {
        SessionState.Failed("Servern svarade med fel ${e.code}.")
      }
    } catch (_: Throwable) {
      // Unreachable is not rejected: keep the token, next launch retries.
      // Signing the user out over a network blip would throw away a valid session.
      SessionState.Failed("Kunde inte nå servern.")
    }
  }

  /** Blocking; call off the main thread. */
  fun signOut(context: Context): SessionState {
    val token = storedToken(context)
    storeToken(context, null)
    if (token != null) {
      runCatching { post("${BuildConfig.API_BASE_URL}/auth/signout", "", token) }
    }
    return SessionState.SignedOut
  }

  private fun post(url: String, body: String, token: String? = null): String =
    (URL(url).openConnection() as HttpURLConnection).run {
      requestMethod = "POST"
      doOutput = true
      setRequestProperty("Content-Type", "application/json")
      token?.let { setRequestProperty("Authorization", "Bearer $it") }
      outputStream.use { it.write(body.toByteArray()) }
      readOrThrow()
    }

  private fun get(url: String, token: String): String =
    (URL(url).openConnection() as HttpURLConnection).run {
      requestMethod = "GET"
      setRequestProperty("Authorization", "Bearer $token")
      readOrThrow()
    }

  private fun HttpURLConnection.readOrThrow(): String {
    val code = responseCode
    if (code !in 200..299) {
      val err = errorStream?.bufferedReader()?.readText().orEmpty()
      throw HttpException(code, err.take(200))
    }
    return if (code == 204) "" else inputStream.bufferedReader().use { it.readText() }
  }
}
