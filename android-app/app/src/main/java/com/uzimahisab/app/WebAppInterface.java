package com.uzimahisab.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.webkit.JavascriptInterface;
import androidx.core.app.NotificationCompat;

public class WebAppInterface {
    private final Context context;
    private static final String CHANNEL_ID = "uzima_transactions_v1";

    public WebAppInterface(Context context) {
        this.context = context;
        createNotificationChannel();
    }

    @JavascriptInterface
    public void showNotification(String type, String amount, String notes) {
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager == null) return;

        Uri soundUri = Uri.parse("android.resource://" + context.getPackageName() + "/" + R.raw.uzima);

        String title = "New Transaction Logged";
        String displayType = type.equals("INVEST") ? "Investment (-)" : "Cash Collection (+)";
        String message = displayType + " of ₹" + amount + " for: " + notes;

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setSound(soundUri)
            .setAutoCancel(true);

        notificationManager.notify((int) System.currentTimeMillis(), builder.build());
    }

    @JavascriptInterface
    public String getFcmToken() {
        return context.getSharedPreferences("UzimaPrefs", Context.MODE_PRIVATE).getString("fcm_token", "");
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            if (manager.getNotificationChannel(CHANNEL_ID) == null) {
                Uri soundUri = Uri.parse("android.resource://" + context.getPackageName() + "/" + R.raw.uzima);
                
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build();

                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Transaction Notifications",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Notifies when a new transaction is logged");
                channel.setSound(soundUri, audioAttributes);
                channel.enableLights(true);
                channel.enableVibration(true);

                manager.createNotificationChannel(channel);
            }
        }
    }
}
