package org.afrikaburn.map;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Keep the WebView below the status bar so header controls are not obscured.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
