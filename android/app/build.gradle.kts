plugins {
    alias(libs.plugins.android.application)
    // No kotlin.android plugin: AGP 9 compiles Kotlin natively via built-in Kotlin.
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "se.venastrom.vradio"
    compileSdk = 37

    defaultConfig {
        applicationId = "se.venastrom.vradio"
        minSdk = 26
        targetSdk = 37
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
        }
        release {
            isMinifyEnabled = false
        }
    }

    buildFeatures {
        compose = true
    }

    // Built-in Kotlin defaults kotlin.compilerOptions.jvmTarget to targetCompatibility,
    // so this drives both the Java and Kotlin targets.
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

// Pin the JDK used to run the build. Without this, Gradle's auto-detection can
// select a JRE (the system java-21/java-25 packages and VS Code's bundled Java
// are all JRE-only), and AGP's JdkImageTransform then fails for want of jlink.
// Gradle auto-provisions a real JDK if none is present.
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
        vendor = JvmVendorSpec.ADOPTIUM
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
}
