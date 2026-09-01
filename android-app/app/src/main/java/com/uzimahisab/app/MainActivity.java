package com.uzimahisab.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);

        // Request notification permission dynamically on Android 13+ (API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }

        // Configure WebView settings for full dynamic execution
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true); // CRITICAL for persistent session localStorage tokens
        webSettings.setDatabaseEnabled(true);
        webSettings.setLoadsImagesAutomatically(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        
        // Prevent opening urls in phone's default browser chrome/safari, load inside webview
        webView.setWebViewClient(new WebViewClient());

        // Delegate standard JS alert/confirm dialog supports to our CustomWebChromeClient
        webView.setWebChromeClient(new CustomWebChromeClient(this));

        // Bind JavaScript Interface for transaction notifications
        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidInterface");

        // Retrieve and cache current Firebase Messaging token
        com.google.firebase.messaging.FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(new FcmTokenListener(this));

        // Load the deployed frontend vercel URL
        webView.loadUrl("https://uzima-yzmc.vercel.app/");
    }

    // Capture back button press to navigate back inside web view history instead of exiting app
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
