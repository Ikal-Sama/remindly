package com.ikalsama.remindly;

import android.os.Bundle;
import android.webkit.CookieManager;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
    }

    /**
     * The Android WebView writes cookies to disk lazily. If the app is killed
     * (swiped from recents, or force-stopped) before that write happens, the
     * Better Auth session cookie is lost and the next launch looks signed out
     * even though the user never logged out. Flushing on pause forces the
     * cookie store to disk while the activity is still alive.
     *
     * @see <a href="https://github.com/ionic-team/capacitor/issues/3012">Capacitor #3012</a>
     */
    @Override
    public void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
    }
}
