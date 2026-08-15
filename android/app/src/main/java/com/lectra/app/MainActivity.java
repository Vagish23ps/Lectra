package com.lectra.app;

import android.app.AlarmManager;
import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestExactAlarmPermission();
    }

    @Override
    public void onResume() {
        super.onResume();

        requestExactAlarmPermission();
    }

    private void requestExactAlarmPermission() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {

            AlarmManager alarmManager =
                    (AlarmManager) getSystemService(ALARM_SERVICE);

            if (alarmManager != null &&
                    !alarmManager.canScheduleExactAlarms()) {

                Intent intent = new Intent(
                        Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM
                );

                intent.setData(
                        android.net.Uri.parse(
                                "package:" + getPackageName()
                        )
                );

                startActivity(intent);
            }
        }
    }
}