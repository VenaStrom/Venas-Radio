// Not referenced as java.util.Properties inline: inside this script `java`
// resolves to the JavaPluginExtension accessor, shadowing the package.
import java.util.Properties

plugins {
  alias(libs.plugins.android.application)
  // No kotlin.android plugin: AGP 9 compiles Kotlin natively via built-in Kotlin.
  alias(libs.plugins.kotlin.compose)
  alias(libs.plugins.kotlin.serialization)
}

/**
 * Where debug builds reach the dev server. Machine-specific, so it lives in
 * local.properties (gitignored) as `vradio.apiBaseUrl`, e.g. the workstation's
 * LAN address so a physical phone can reach it over Wi-Fi. The VRADIO_API_URL
 * env var wins when set; localhost (via `adb reverse tcp:3000 tcp:3000`) is
 * the fallback.
 */
val devApiBaseUrl: String = System.getenv("VRADIO_API_URL")
  ?: Properties().let { props ->
    val file = rootProject.file("local.properties")
    if (file.exists()) file.inputStream().use(props::load)
    props.getProperty("vradio.apiBaseUrl")
  }
  ?: "http://localhost:3000"

/**
 * Read via providers.exec so the configuration cache can track it. Falls back to
 * "" rather than failing: the build must not depend on git being present.
 */
fun git(vararg args: String): String =
  runCatching {
    providers.exec { commandLine("git", *args) }
      .standardOutput.asText.get().trim()
  }.getOrDefault("")

android {
  namespace = "se.venastrom.vradio"
  compileSdk = 37

  defaultConfig {
    applicationId = "se.venastrom.vradio"
    minSdk = 26
    targetSdk = 37
    versionCode = 1
    versionName = "0.1.0"

    // Surfaced in the sidebar footer, mirroring the web client's build links.
    buildConfigField("String", "GIT_BRANCH", "\"${git("rev-parse", "--abbrev-ref", "HEAD")}\"")
    buildConfigField("String", "GIT_COMMIT", "\"${git("rev-parse", "HEAD")}\"")
  }

  buildTypes {
    debug {
      applicationIdSuffix = ".debug"
      // Distinct scheme and API base per build type: a debug install must not
      // be able to claim the release app's OAuth redirect.
      manifestPlaceholders["authScheme"] = "vradio-debug"
      buildConfigField("String", "AUTH_SCHEME", "\"vradio-debug\"")
      buildConfigField("String", "API_BASE_URL", "\"$devApiBaseUrl\"")
    }
    release {
      isMinifyEnabled = false
      manifestPlaceholders["authScheme"] = "vradio"
      buildConfigField("String", "AUTH_SCHEME", "\"vradio\"")
      buildConfigField("String", "API_BASE_URL", "\"https://vr.venastrom.se\"")
    }
  }

  buildFeatures {
    compose = true
    buildConfig = true
  }

  // Built-in Kotlin defaults kotlin.compilerOptions.jvmTarget to targetCompatibility,
  // so this drives both the Java and Kotlin targets.
  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }
}

// Pin the JDK used to compile. Without this, AGP falls back to the JVM running
// Gradle, which on this machine is a JRE (the system java-21/java-25 packages
// are JRE-only), and JdkImageTransform then fails for want of jlink. Any real
// JDK 21 satisfies this, Android Studio's embedded JBR included, and Gradle
// auto-provisions one if none is found. No vendor constraint on purpose.
java {
  toolchain {
    languageVersion = JavaLanguageVersion.of(21)
  }
}

dependencies {
  implementation(libs.androidx.core.ktx)
  implementation(libs.androidx.activity.compose)
  implementation(libs.androidx.lifecycle.runtime.compose)

  implementation(platform(libs.androidx.compose.bom))
  implementation(libs.androidx.compose.ui)
  implementation(libs.androidx.compose.material3)
  implementation(libs.androidx.compose.ui.tooling.preview)
  debugImplementation(libs.androidx.compose.ui.tooling)

  implementation(libs.media3.exoplayer)
  implementation(libs.media3.session)
  implementation(libs.kotlinx.serialization.json)
  implementation(libs.androidx.browser)
  implementation(libs.coil.compose)
  implementation(libs.coil.network.okhttp)
}
