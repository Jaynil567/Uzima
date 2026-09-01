package com.uzimahisab.app;

import android.media.MediaPlayer;

public class MediaPlayerCompletionListener implements MediaPlayer.OnCompletionListener {
    @Override
    public void onCompletion(MediaPlayer mp) {
        if (mp != null) {
            try {
                mp.stop();
                mp.release();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
