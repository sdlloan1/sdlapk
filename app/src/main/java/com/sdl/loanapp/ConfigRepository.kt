package com.sdl.loanapp

import android.content.Context
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Reads the dashboard settings from BuildConfig.CONFIG_API and keeps the last good copy
 * on the device, so a launch works even when the network or the backend is unavailable.
 */
class ConfigRepository(context: Context) {

    private val prefs = context.getSharedPreferences("sdl_config", Context.MODE_PRIVATE)

    fun cached(): AppConfig = AppConfig.parse(prefs.getString(KEY_CONFIG, null)) ?: AppConfig()

    fun save(config: AppConfig) {
        prefs.edit().putString(KEY_CONFIG, config.toJson()).apply()
    }

    /** Returns null when the endpoint is not configured, unreachable or returns junk. */
    fun fetchRemote(): AppConfig? {
        val base = BuildConfig.CONFIG_API.trim()
        if (base.isEmpty()) return null

        var connection: HttpURLConnection? = null
        return try {
            connection = (URL(base.trimEnd('/') + "/api/config").openConnection() as HttpURLConnection).apply {
                connectTimeout = TIMEOUT_MS
                readTimeout = TIMEOUT_MS
                requestMethod = "GET"
            }
            if (connection.responseCode != HttpURLConnection.HTTP_OK) return null
            val body = connection.inputStream.bufferedReader().use { it.readText() }
            AppConfig.parse(JSONObject(body).optJSONObject("config")?.toString())?.also { save(it) }
        } catch (e: Exception) {
            null
        } finally {
            connection?.disconnect()
        }
    }

    private companion object {
        const val KEY_CONFIG = "config"
        const val TIMEOUT_MS = 2500
    }
}
