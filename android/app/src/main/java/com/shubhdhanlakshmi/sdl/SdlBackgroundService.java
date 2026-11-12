package com.shubhdhanlakshmi.sdl;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

/**
 * Keeps the app process (and with it the WebView notification poll) alive after
 * the user leaves the app, so loan, repayment and wallet alerts still arrive as
 * phone notifications instead of waiting for the next launch.
 *
 * Android requires a visible notification for a foreground service, so this one
 * is silent and low priority: it never makes a sound or heads-up popup.
 */
public class SdlBackgroundService extends Service {

    private static final String CHANNEL_ID = "sdl-background";
    private static final int NOTIFICATION_ID = 4242;

    public static void start(Context context) {
        try {
            ContextCompat.startForegroundService(context, new Intent(context, SdlBackgroundService.class));
        } catch (Exception e) {
            // Android can refuse a background start (e.g. right after a reboot);
            // the next app launch starts the service again.
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        createChannel();
        Notification notification = buildNotification();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CHANNEL_ID) != null) return;

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Background alerts",
                NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Keeps SDL listening for loan, repayment and wallet alerts");
        channel.setShowBadge(false);
        channel.enableVibration(false);
        manager.createNotificationChannel(channel);
    }

    private Notification buildNotification() {
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
                this,
                0,
                open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_sdl)
                .setContentTitle("SDL is active")
                .setContentText("Loan, repayment and wallet alerts will appear on this phone.")
                .setContentIntent(contentIntent)
                .setOngoing(true)
                .setSilent(true)
                .setShowWhen(false)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .build();
    }
}
