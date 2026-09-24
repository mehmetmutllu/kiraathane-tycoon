package com.memedobro.teahousetycoon;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Uygulamanın kendi eklentileri npm'den gelmez; köprüye elle kaydedilir (F4b · D-153).
        registerPlugin(PlayGamesPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
