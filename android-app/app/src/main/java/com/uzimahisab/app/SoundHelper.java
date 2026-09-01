package com.uzimahisab.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.MediaPlayer;

public class SoundHelper {

    public static void playUzimaSound(Context context) {
        try {
            MediaPlayer mediaPlayer = MediaPlayer.create(context, R.raw.uzima);
            if (mediaPlayer != null) {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                    AudioAttributes attributes = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                        .build();
                    mediaPlayer.setAudioAttributes(attributes);
                }
                mediaPlayer.setOnCompletionListener(new MediaPlayerCompletionListener());
                mediaPlayer.start();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
