package in.pixbe.crm;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import in.pixbe.crm.calltracker.CallTrackerPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CallTrackerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
