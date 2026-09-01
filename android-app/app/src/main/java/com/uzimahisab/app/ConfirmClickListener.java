package com.uzimahisab.app;

import android.content.DialogInterface;
import android.webkit.JsResult;

public class ConfirmClickListener implements DialogInterface.OnClickListener {
    private final JsResult result;
    private final boolean confirm;

    public ConfirmClickListener(JsResult result, boolean confirm) {
        this.result = result;
        this.confirm = confirm;
    }

    @Override
    public void onClick(DialogInterface dialog, int which) {
        if (confirm) {
            result.confirm();
        } else {
            result.cancel();
        }
    }
}
