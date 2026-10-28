package com.sdl.loanapp

import org.json.JSONObject

data class LogoConfig(
    val shape: String = "rounded",
    val fit: String = "cover",
    val sizePercent: Int = 32,
    val imageUrl: String = ""
)

data class SplashConfig(
    val enabled: Boolean = true,
    val animation: String = "zoom",
    val background: String = "#FFFFFF",
    val showProgress: Boolean = true,
    val durationMs: Int = 1500
)

data class OfflineConfig(
    val enabled: Boolean = true,
    val title: String = "You're offline",
    val message: String = "Check your internet connection and try again.",
    val buttonLabel: String = "Retry"
)

/** Settings the dashboard controls. Cached on the device so the app launches instantly. */
data class AppConfig(
    val appUrl: String = DEFAULT_APP_URL,
    val startPath: String = "/",
    val logo: LogoConfig = LogoConfig(),
    val splash: SplashConfig = SplashConfig(),
    val offline: OfflineConfig = OfflineConfig()
) {
    val startUrl: String
        get() {
            val base = appUrl.trimEnd('/')
            val path = startPath.trim().ifBlank { "/" }
            return base + if (path.startsWith("/")) path else "/$path"
        }

    fun toJson(): String = JSONObject()
        .put("appUrl", appUrl)
        .put("startPath", startPath)
        .put(
            "logo",
            JSONObject()
                .put("shape", logo.shape)
                .put("fit", logo.fit)
                .put("sizePercent", logo.sizePercent)
                .put("imageUrl", logo.imageUrl)
        )
        .put(
            "splash",
            JSONObject()
                .put("enabled", splash.enabled)
                .put("animation", splash.animation)
                .put("background", splash.background)
                .put("showProgress", splash.showProgress)
                .put("durationMs", splash.durationMs)
        )
        .put(
            "offline",
            JSONObject()
                .put("enabled", offline.enabled)
                .put("title", offline.title)
                .put("message", offline.message)
                .put("buttonLabel", offline.buttonLabel)
        )
        .toString()

    companion object {
        const val DEFAULT_APP_URL = "https://shubhdhanlakshmi-beta-version.base44.app"

        fun parse(raw: String?): AppConfig? {
            if (raw.isNullOrBlank()) return null
            return try {
                val o = JSONObject(raw)
                val logo = o.optJSONObject("logo") ?: JSONObject()
                val splash = o.optJSONObject("splash") ?: JSONObject()
                val offline = o.optJSONObject("offline") ?: JSONObject()
                AppConfig(
                    appUrl = o.optString("appUrl", DEFAULT_APP_URL).ifBlank { DEFAULT_APP_URL },
                    startPath = o.optString("startPath", "/").ifBlank { "/" },
                    logo = LogoConfig(
                        shape = logo.optString("shape", "rounded"),
                        fit = logo.optString("fit", "cover"),
                        sizePercent = logo.optInt("sizePercent", 32).coerceIn(15, 80),
                        imageUrl = logo.optString("imageUrl", "")
                    ),
                    splash = SplashConfig(
                        enabled = splash.optBoolean("enabled", true),
                        animation = splash.optString("animation", "zoom"),
                        background = splash.optString("background", "#FFFFFF"),
                        showProgress = splash.optBoolean("showProgress", true),
                        durationMs = splash.optInt("durationMs", 1500)
                    ),
                    offline = OfflineConfig(
                        enabled = offline.optBoolean("enabled", true),
                        title = offline.optString("title", "You're offline"),
                        message = offline.optString(
                            "message",
                            "Check your internet connection and try again."
                        ),
                        buttonLabel = offline.optString("buttonLabel", "Retry")
                    )
                )
            } catch (e: Exception) {
                null
            }
        }
    }
}
