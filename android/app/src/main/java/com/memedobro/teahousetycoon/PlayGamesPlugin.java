package com.memedobro.teahousetycoon;

import android.content.Context;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.games.PlayGames;
import com.google.android.gms.games.PlayGamesSdk;
import com.google.android.gms.games.SnapshotsClient;
import com.google.android.gms.games.snapshot.Snapshot;
import com.google.android.gms.games.snapshot.SnapshotMetadataChange;

import java.nio.charset.StandardCharsets;

/*
 * PLAY GAMES KÖPRÜSÜ (F4b · D-153). JS tarafı: `src/game/bulut.ts`.
 *
 * NEDEN KENDİ EKLENTİMİZ: hazır Capacitor eklentileri Capacitor 5'te kaldı ve Saved Games'i
 * taşımıyordu. İhtiyaç altı çağrı — giriş, bulut oku/yaz, başarım aç/göster — bu dosya kadar.
 *
 * APP_ID (`game_services_project_id`, strings.xml) BOŞKEN SDK hiç kurulmaz ve `durum` "kullanılamaz"
 * der: kimliksiz kurulum Play Games'in kendi hata penceresini açardı. Oyun o hâlde Play Games'siz oynanır.
 *
 * ÇAKIŞMA: Saved Games'e ilerleme değeri (`progressValue` = toplam kazanç) yazılır ve kayıt
 * RESOLUTION_POLICY_HIGHEST_PROGRESS ile açılır — iki cihazın çakışmasını Google da "en ileri" kuralıyla
 * çözer; oyunun kendi kuralıyla aynı (bulut.ts `kayitIleriMi`).
 */
@CapacitorPlugin(name = "PlayGames")
public class PlayGamesPlugin extends Plugin {

    private static final int BASARIM_EKRANI = 9001;
    private boolean kurulu = false;

    @Override
    public void load() {
        Context c = getContext();
        int id = c.getResources().getIdentifier("game_services_project_id", "string", c.getPackageName());
        if (id == 0 || c.getString(id).trim().isEmpty()) return;
        PlayGamesSdk.initialize(c);
        kurulu = true;
    }

    private boolean hazir(PluginCall call) {
        if (kurulu) return true;
        call.reject("Play Games kurulu degil");
        return false;
    }

    @PluginMethod
    public void durum(PluginCall call) {
        JSObject r = new JSObject();
        r.put("kullanilabilir", kurulu);
        if (!kurulu) {
            r.put("girisli", false);
            call.resolve(r);
            return;
        }
        PlayGames.getGamesSignInClient(getActivity()).isAuthenticated().addOnCompleteListener(t -> {
            r.put("girisli", t.isSuccessful() && t.getResult().isAuthenticated());
            call.resolve(r);
        });
    }

    @PluginMethod
    public void girisYap(PluginCall call) {
        if (!hazir(call)) return;
        PlayGames.getGamesSignInClient(getActivity()).signIn().addOnCompleteListener(t -> {
            JSObject r = new JSObject();
            r.put("girisli", t.isSuccessful() && t.getResult().isAuthenticated());
            call.resolve(r);
        });
    }

    @PluginMethod
    public void bulutOku(PluginCall call) {
        if (!hazir(call)) return;
        String ad = call.getString("ad");
        SnapshotsClient sc = PlayGames.getSnapshotsClient(getActivity());
        sc.open(ad, true, SnapshotsClient.RESOLUTION_POLICY_HIGHEST_PROGRESS).addOnCompleteListener(t -> {
            if (!t.isSuccessful() || t.getResult().isConflict()) {
                call.reject("Bulut kaydi acilamadi");
                return;
            }
            Snapshot s = t.getResult().getData();
            try {
                byte[] b = s.getSnapshotContents().readFully();
                JSObject r = new JSObject();
                r.put("veri", b.length == 0 ? null : new String(b, StandardCharsets.UTF_8));
                call.resolve(r);
            } catch (Exception e) {
                call.reject("Bulut kaydi okunamadi", e);
            } finally {
                sc.discardAndClose(s);
            }
        });
    }

    @PluginMethod
    public void bulutYaz(PluginCall call) {
        if (!hazir(call)) return;
        String ad = call.getString("ad");
        String veri = call.getString("veri", "");
        long ilerleme = (long) (double) call.getDouble("ilerleme", 0.0);
        String aciklama = call.getString("aciklama", "");
        SnapshotsClient sc = PlayGames.getSnapshotsClient(getActivity());
        sc.open(ad, true, SnapshotsClient.RESOLUTION_POLICY_HIGHEST_PROGRESS).addOnCompleteListener(t -> {
            if (!t.isSuccessful() || t.getResult().isConflict()) {
                call.reject("Bulut kaydi acilamadi");
                return;
            }
            Snapshot s = t.getResult().getData();
            if (!s.getSnapshotContents().writeBytes(veri.getBytes(StandardCharsets.UTF_8))) {
                sc.discardAndClose(s);
                call.reject("Bulut kaydi yazilamadi");
                return;
            }
            SnapshotMetadataChange m = new SnapshotMetadataChange.Builder()
                .setProgressValue(ilerleme)
                .setDescription(aciklama)
                .build();
            sc.commitAndClose(s, m).addOnCompleteListener(k -> {
                if (k.isSuccessful()) call.resolve();
                else call.reject("Bulut kaydi gonderilemedi");
            });
        });
    }

    @PluginMethod
    public void basarimAc(PluginCall call) {
        if (!hazir(call)) return;
        String kimlik = call.getString("kimlik");
        if (kimlik == null || kimlik.isEmpty()) {
            call.reject("Basarim kimligi yok");
            return;
        }
        PlayGames.getAchievementsClient(getActivity()).unlock(kimlik);
        call.resolve();
    }

    @PluginMethod
    public void basarimlariGoster(PluginCall call) {
        if (!hazir(call)) return;
        PlayGames.getAchievementsClient(getActivity()).getAchievementsIntent().addOnCompleteListener(t -> {
            if (!t.isSuccessful()) {
                call.reject("Basarim ekrani acilamadi");
                return;
            }
            getActivity().startActivityForResult(t.getResult(), BASARIM_EKRANI);
            call.resolve();
        });
    }
}
