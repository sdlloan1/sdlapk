package com.sdl.loanapp

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Messages the dashboard sends to every phone. The app asks the backend for anything new on
 * each launch and shows it as a system notification, so it needs no push service.
 */
class NotificationCenter(private val context: Context) {

    private val prefs = context.getSharedPreferences("sdl_notifications", Context.MODE_PRIVATE)

    fun ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(CHANNEL_ID, "App updates", NotificationManager.IMPORTANCE_DEFAULT)
        channel.description = "News and new app versions"
        manager().createNotificationChannel(channel)
    }

    /** Blocking network call — run it off the main thread. */
    fun fetchAndShow() {
        val base = BuildConfig.CONFIG_API.trim()
        if (base.isEmpty()) return
        val lastId = prefs.getLong(KEY_LAST_ID, 0L)
        val array = fetch("${base.trimEnd('/')}/api/notifications?after=$lastId") ?: return

        var newest = lastId
        for (index in 0 until array.length()) {
            val item = array.optJSONObject(index) ?: continue
            val id = item.optLong("id", 0L)
            if (id <= 0L) continue
            show(
                id = id,
                title = item.optString("title"),
                message = item.optString("message"),
                link = item.optString("link")
            )
            if (id > newest) newest = id
        }
        if (newest > lastId) prefs.edit().putLong(KEY_LAST_ID, newest).apply()
    }

    private fun show(id: Long, title: String, message: String, link: String) {
        if (title.isBlank() || message.isBlank()) return
        ensureChannel()

        val intent = if (link.startsWith("http")) {
            Intent(Intent.ACTION_VIEW, Uri.parse(link))
        } else {
            Intent(context, MainActivity::class.java)
        }.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)

        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        val contentIntent = PendingIntent.getActivity(context, id.toInt(), intent, flags)

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setAutoCancel(true)
            .setContentIntent(contentIntent)
            .build()

        try {
            manager().notify(id.toInt(), notification)
        } catch (e: Exception) {
            // Notifications blocked by the user or the OS.
        }
    }

    private fun manager(): NotificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    private fun fetch(url: String): org.json.JSONArray? {
        var connection: HttpURLConnection? = null
        return try {
            connection = (URL(url).openConnection() as HttpURLConnection).apply {
                connectTimeout = TIMEOUT_MS
                readTimeout = TIMEOUT_MS
                requestMethod = "GET"
            }
            if (connection.responseCode != HttpURLConnection.HTTP_OK) return null
            val body = connection.inputStream.bufferedReader().use { it.readText() }
            JSONObject(body).optJSONArray("notifications")
        } catch (e: Exception) {
            null
        } finally {
            connection?.disconnect()
        }
    }

    private companion object {
        const val CHANNEL_ID = "sdl_updates"
        const val KEY_LAST_ID = "lastId"
        const val TIMEOUT_MS = 2500
    }
}
