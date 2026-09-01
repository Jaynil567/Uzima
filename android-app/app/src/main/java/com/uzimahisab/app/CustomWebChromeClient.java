package com.uzimahisab.app;

import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import androidx.appcompat.app.AppCompatActivity;

public class CustomWebChromeClient extends WebChromeClient {
    private final AppCompatActivity activity;

    public CustomWebChromeClient(AppCompatActivity activity) {
        this.activity = activity;
    }

    @Override
    public boolean onJsAlert(WebView view, String url, String message, final JsResult result) {
        new android.app.AlertDialog.Builder(activity)
            .setTitle("Uzima Hisab")
            .setMessage(message)
            .setPositiveButton(android.R.string.ok, new AlertClickListener(result))
            .setCancelable(false)
            .create()
            .show();
        return true;
    }

    @Override
    public boolean onJsConfirm(WebView view, String url, String message, final JsResult result) {
        new android.app.AlertDialog.Builder(activity)
            .setTitle("Confirm Action")
            .setMessage(message)
            .setPositiveButton(android.R.string.ok, new ConfirmClickListener(result, true))
            .setNegativeButton(android.R.string.cancel, new ConfirmClickListener(result, false))
            .setCancelable(false)
            .create()
            .show();
        return true;
    }
}
