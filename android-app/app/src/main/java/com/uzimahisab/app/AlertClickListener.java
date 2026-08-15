package com.uzimahisab.app;

import android.content.DialogInterface;
import android.webkit.JsResult;

public class AlertClickListener implements DialogInterface.OnClickListener {
    private final JsResult result;

    public AlertClickListener(JsResult result) {
        this.result = result;
    }

    @Override
    public void onClick(DialogInterface dialog, int which) {
        result.confirm();
    }
}
