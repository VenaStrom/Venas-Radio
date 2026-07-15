package se.venastrom.vradio.auth

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * Stores the session token encrypted under a key held in the Android Keystore.
 *
 * Not androidx.security's EncryptedSharedPreferences: that is deprecated as of
 * security-crypto 1.1.0, partly over keyset-corruption crashes on some OEM
 * builds. The sanctioned replacement is DataStore + Tink, which is a protobuf
 * schema and a streaming-AEAD serializer — considerable machinery for one
 * 32-byte token.
 *
 * This is the platform's own AES/GCM with a Keystore-held key instead. The key
 * material never enters the app's process (it lives in the TEE/StrongBox where
 * available) and cannot be extracted even from a rooted device, though anything
 * with code execution as this app can still ask the Keystore to decrypt.
 */
internal object TokenStore {
  private const val PREFS = "vradio_auth"
  private const val KEY_ALIAS = "vradio_session_key"
  private const val PREF_PAYLOAD = "session_token_gcm"
  private const val GCM_TAG_BITS = 128

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  private fun secretKey(): SecretKey {
    val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    (keyStore.getEntry(KEY_ALIAS, null) as? KeyStore.SecretKeyEntry)?.let { return it.secretKey }

    val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
    generator.init(
      KeyGenParameterSpec.Builder(
        KEY_ALIAS,
        KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
      )
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        // No setUserAuthenticationRequired: the token must survive being read
        // while the screen is locked, since playback outlives the foreground.
        .build(),
    )
    return generator.generateKey()
  }

  fun read(context: Context): String? {
    val stored = prefs(context).getString(PREF_PAYLOAD, null) ?: return null
    return try {
      val blob = Base64.decode(stored, Base64.NO_WRAP)
      // Layout: [1 byte IV length][IV][ciphertext+tag]
      val ivLength = blob[0].toInt()
      val iv = blob.copyOfRange(1, 1 + ivLength)
      val payload = blob.copyOfRange(1 + ivLength, blob.size)

      val cipher = Cipher.getInstance("AES/GCM/NoPadding")
      cipher.init(Cipher.DECRYPT_MODE, secretKey(), GCMParameterSpec(GCM_TAG_BITS, iv))
      String(cipher.doFinal(payload))
    } catch (_: Throwable) {
      // Keystore keys are dropped on events like a lockscreen change, so a
      // failure here means "signed out", not a bug worth crashing over.
      clear(context)
      null
    }
  }

  fun write(context: Context, token: String) {
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    // Let the provider generate the IV: GCM is catastrophic on IV reuse, and
    // this is the one path guaranteed never to repeat one for a given key.
    cipher.init(Cipher.ENCRYPT_MODE, secretKey())
    val iv = cipher.iv
    val payload = cipher.doFinal(token.toByteArray())

    val blob = ByteArray(1 + iv.size + payload.size)
    blob[0] = iv.size.toByte()
    iv.copyInto(blob, 1)
    payload.copyInto(blob, 1 + iv.size)

    prefs(context).edit()
      .putString(PREF_PAYLOAD, Base64.encodeToString(blob, Base64.NO_WRAP))
      .apply()
  }

  fun clear(context: Context) {
    prefs(context).edit().remove(PREF_PAYLOAD).apply()
  }
}
