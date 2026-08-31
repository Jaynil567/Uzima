package com.uzimahisab.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String CHANNEL_ID = "uzima_transactions_v1";

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        // Cache the new token in SharedPreferences so it can be synced to backend via WebView
        getSharedPreferences("UzimaPrefs", MODE_PRIVATE)
            .edit()
            .putString("fcm_token", token)
            .apply();
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager == null) return;

        createNotificationChannel(notificationManager);

        // Get notification content from payload data or notification body
        String title = "New Transaction Logged";
        String message = "";

        if (remoteMessage.getNotification() != null) {
            title = remoteMessage.getNotification().getTitle();
            message = remoteMessage.getNotification().getBody();
        } else if (remoteMessage.getData().size() > 0) {
            String type = remoteMessage.getData().get("type");
            String amount = remoteMessage.getData().get("amount");
            String notes = remoteMessage.getData().get("notes");
            String username = remoteMessage.getData().get("username");

            String displayType = "INVEST".equals(type) ? "Investment (-)" : "Cash Collection (+)";
            message = displayType + " of ₹" + amount + " for: " + notes + " (by " + username + ")";
        }

        if (message == null || message.isEmpty()) return;

        Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.uzima);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setSound(soundUri)
            .setAutoCancel(true);

        notificationManager.notify((int) System.currentTimeMillis(), builder.build());
    }

    private void createNotificationChannel(NotificationManager manager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (manager.getNotificationChannel(CHANNEL_ID) == null) {
                Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.uzima);
                
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
