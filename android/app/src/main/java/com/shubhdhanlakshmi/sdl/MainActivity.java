package com.shubhdhanlakshmi.sdl;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // The splash theme starts the window fullscreen; drop that flag so the
        // window stays a normal resizable window (fullscreen windows are not
        // resized for the soft keyboard) and take over the system bars below.
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);

        // Keep the notification poll alive once the app goes to the background.
        SdlBackgroundService.start(this);

        // Draw edge to edge and hide the status and navigation bars.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        hideSystemBars();

        // The app owns the whole screen, so nothing resizes the web view when the
        // keyboard opens: the keyboard covered the focused field and the button
        // below it. Shrink the page by the keyboard height instead.
        View webView = getBridge().getWebView();
        ViewCompat.setOnApplyWindowInsetsListener(webView, (view, windowInsets) -> {
            Insets edges = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets keyboard = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
            view.setPadding(edges.left, edges.top, edges.right, Math.max(edges.bottom, keyboard.bottom));
            return windowInsets;
        });
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Swiping from an edge reveals the bars; hide them again when focus returns.
        if (hasFocus) hideSystemBars();
    }

    private void hideSystemBars() {
        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
