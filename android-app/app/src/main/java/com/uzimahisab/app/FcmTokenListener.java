package com.uzimahisab.app;

import android.content.Context;
import androidx.annotation.NonNull;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;

public class FcmTokenListener implements OnCompleteListener<String> {
    private final Context context;

    public FcmTokenListener(Context context) {
        this.context = context.getApplicationContext();
    }

    @Override
    public void onComplete(@NonNull Task<String> task) {
        if (task.isSuccessful() && task.getResult() != null) {
            context.getSharedPreferences("UzimaPrefs", Context.MODE_PRIVATE)
                .edit()
                .putString("fcm_token", task.getResult())
                .apply();
        }
    }
}
