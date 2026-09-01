package com.uzimahisab.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.content.Context;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String CHANNEL_ID = "uzima_voice_alerts_v3";

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
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

        Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/" + R.raw.uzima);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setSound(soundUri)
            .setVibrate(new long[]{0, 300, 200, 300})
            .setAutoCancel(true);

        notificationManager.notify((int) System.currentTimeMillis(), builder.build());

        // Play the custom audio directly
        SoundHelper.playUzimaSound(this);
    }

    private void createNotificationChannel(NotificationManager manager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                manager.deleteNotificationChannel("uzima_transactions_v1");
            } catch (Exception ignored) {}

            if (manager.getNotificationChannel(CHANNEL_ID) == null) {
                Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/" + R.raw.uzima);
                
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
