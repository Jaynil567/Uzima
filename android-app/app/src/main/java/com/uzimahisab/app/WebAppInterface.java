package com.uzimahisab.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.content.Context;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.webkit.JavascriptInterface;
import androidx.core.app.NotificationCompat;

public class WebAppInterface {
    private final Context context;
    private static final String CHANNEL_ID = "uzima_voice_alerts_v3";

    public WebAppInterface(Context context) {
        this.context = context;
        createNotificationChannel();
    }

    @JavascriptInterface
    public void showNotification(String type, String amount, String notes) {
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager == null) return;

        createNotificationChannel();

        Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/" + R.raw.uzima);

        String title = "New Transaction Logged";
        String displayType = type.equals("INVEST") ? "Investment (-)" : "Cash Collection (+)";
        String message = displayType + " of ₹" + amount + " for: " + notes;

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setSound(soundUri)
            .setVibrate(new long[]{0, 300, 200, 300})
            .setAutoCancel(true);

        notificationManager.notify((int) System.currentTimeMillis(), builder.build());

        // Play the "Uzima" audio directly via MediaPlayer to guarantee sound playback on all devices
        SoundHelper.playUzimaSound(context);
    }

    @JavascriptInterface
    public String getFcmToken() {
        return context.getSharedPreferences("UzimaPrefs", Context.MODE_PRIVATE).getString("fcm_token", "");
    }

    @JavascriptInterface
    public void playSound() {
        SoundHelper.playUzimaSound(context);
    }

    @JavascriptInterface
    public String getPendingTxId() {
        String txId = context.getSharedPreferences("UzimaPrefs", Context.MODE_PRIVATE).getString("pending_tx_id", "");
        if (!txId.isEmpty()) {
            context.getSharedPreferences("UzimaPrefs", Context.MODE_PRIVATE).edit().remove("pending_tx_id").apply();
        }
        return txId;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            // Clean up previous silent channel if present
            try {
                manager.deleteNotificationChannel("uzima_transactions_v1");
            } catch (Exception ignored) {}

            if (manager.getNotificationChannel(CHANNEL_ID) == null) {
                Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/" + R.raw.uzima);
                
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                    .build();

                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Uzima Voice Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Voice notifications when transactions are logged");
                channel.setSound(soundUri, audioAttributes);
                channel.enableLights(true);
                channel.enableVibration(true);
                channel.setVibrationPattern(new long[]{0, 300, 200, 300});

                manager.createNotificationChannel(channel);
            }
        }
    }
}
