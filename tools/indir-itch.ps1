# indir-itch.ps1 — itch.io'daki ücretsiz / "ne verirsen" paketleri indirir.
#
# NEDEN VAR: bu ortamda **Bash'in ağı yok** (`curl` HTTP 000, çıkış 43) ama **PowerShell'in var**.
# 2026-09-09'da S1 turunda ölçüldü; o tura kadar "paketleri kullanıcı indirsin" deniyordu.
# Akış itch'in kendi uçlarını kullanır, üçüncü parti yok:
#   1) oyun sayfasını çek → gizli `csrf_token`
#   2) POST /download_url        → süreli indirme sayfasının adresi
#   3) indirme sayfası           → dosya listesi (`upload_id`)
#   4) POST {oyun sayfası}/file/<upload_id>?source=game_download → gerçek dosya adresi (CDN)
#      (2026-09-14/S13'te düzeltildi: 4. adım indirme sayfasına atılınca 404 dönüyordu.)
#
# KULLANIM
#   pwsh tools/indir-itch.ps1 -Sayfa https://kaylousberg.itch.io/board-game-bits -Hedef indirilen
#   pwsh tools/indir-itch.ps1 -Sayfa ... -Listele          # indirmeden yalnız dosyaları göster
#   pwsh tools/indir-itch.ps1 -Sayfa ... -Suzgec 'gltf'    # adında geçen dosyaları indir
#
# LİSANS UYARISI: indirmek lisansı doğrulamaz. `docs/assets.md` §8 gereği her paketin lisansı
# `public/assets/README.md` manifestine kaynağıyla yazılır; belirsizse commit'lenmez.

param(
  [Parameter(Mandatory = $true)][string]$Sayfa,
  [string]$Hedef = "indirilen",
  [string]$Suzgec = "",
  [switch]$Listele
)

$ErrorActionPreference = 'Stop'
$oturum = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$Sayfa = $Sayfa.TrimEnd('/')

function Getir($url, $yontem = 'GET', $govde = $null) {
  $p = @{ Uri = $url; UseBasicParsing = $true; WebSession = $oturum; TimeoutSec = 120; Method = $yontem }
  if ($govde) { $p.Body = $govde }
  return Invoke-WebRequest @p
}

Write-Host "1/4  oyun sayfası: $Sayfa"
$sayfaHtml = (Getir $Sayfa).Content
if ($sayfaHtml -notmatch 'csrf_token"\s*value="([^"]+)"') { throw "csrf_token bulunamadı — sayfa yapısı değişmiş olabilir" }
$tok = $Matches[1]

Write-Host "2/4  indirme adresi isteniyor"
$cevap = (Getir "$Sayfa/download_url" 'POST' @{ csrf_token = $tok }).Content
if ($cevap -notmatch '"url"\s*:\s*"([^"]+)"') { throw "download_url yanıtı beklenen biçimde değil: $cevap" }
$indirmeSayfasi = ($Matches[1] -replace '\\/', '/')

Write-Host "3/4  dosya listesi okunuyor"
$listeHtml = (Getir $indirmeSayfasi).Content
$dosyalar = @()
foreach ($m in [regex]::Matches($listeHtml, 'data-upload_id="(\d+)"[\s\S]{0,900}?upload_name[^>]*>([^<]+)<')) {
  $dosyalar += [pscustomobject]@{ Id = $m.Groups[1].Value; Ad = $m.Groups[2].Value.Trim() }
}
if ($dosyalar.Count -eq 0) {
  foreach ($m in [regex]::Matches($listeHtml, 'upload_id["\s:=]+(\d+)')) {
    $dosyalar += [pscustomobject]@{ Id = $m.Groups[1].Value; Ad = "upload_$($m.Groups[1].Value)" }
  }
  $dosyalar = $dosyalar | Sort-Object Id -Unique
}
if ($dosyalar.Count -eq 0) { throw "dosya listesi çıkarılamadı" }

$dosyalar | ForEach-Object { Write-Host "     [$($_.Id)] $($_.Ad)" }
if ($Listele) { Write-Host "`n-Listele verildi, indirme yapılmadı."; exit 0 }

if ($Suzgec) { $dosyalar = $dosyalar | Where-Object { $_.Ad -like "*$Suzgec*" } }
if ($dosyalar.Count -eq 0) { throw "süzgeç '$Suzgec' hiçbir dosyayla eşleşmedi" }

if (-not (Test-Path $Hedef)) { New-Item -ItemType Directory -Path $Hedef | Out-Null }
$indirmeSayfasi = $indirmeSayfasi.TrimEnd('/')

foreach ($d in $dosyalar) {
  Write-Host "4/4  indiriliyor: $($d.Ad)"
  # 4. adım İNDİRME SAYFASINA DEĞİL OYUN SAYFASINA gider (2026-09-14, S13'te ölçüldü):
  #   {indirme sayfası}/file/{id}          → 404
  #   {oyun sayfası}/file/{id}?key={...}   → 200 {"errors":["invalid key"]}
  #   {oyun sayfası}/file/{id}?source=game_download → 200 {"url": ...}   ← bu
  # Süreli indirme sayfası yine de gerekli: upload_id yalnız orada duruyor.
  $j = (Getir "$Sayfa/file/$($d.Id)?source=game_download" 'POST' @{ csrf_token = $tok }).Content
  if ($j -notmatch '"url"\s*:\s*"([^"]+)"') { Write-Warning "  adres alınamadı: $j"; continue }
  $dosyaUrl = ($Matches[1] -replace '\\/', '/')
  # Ad sayfadan okunamadıysa (itch dosya adını her zaman listede vermiyor) imzalı CDN adresinin
  # `response-content-disposition` alanından türet; son çare adresin son parçası (upload id).
  $ad = $d.Ad
  if ($ad -like 'upload_*') {
    if ($dosyaUrl -match 'filename%3D(?:%22)?([^%&]+)') { $ad = [System.Uri]::UnescapeDataString($Matches[1]) }
    elseif ($dosyaUrl -match 'filename="?([^"&]+)') { $ad = [System.Uri]::UnescapeDataString($Matches[1]) }
    else {
      # CDN adresi de ad taşımıyor (KayKit paketlerinde durum bu): oyun sayfasının slug'ı + id.
      $ad = "$(([System.Uri]$Sayfa).Segments[-1].TrimEnd('/'))_$($d.Id).zip"
    }
  }
  $cikti = Join-Path $Hedef $ad
  Invoke-WebRequest -Uri $dosyaUrl -OutFile $cikti -UseBasicParsing -WebSession $oturum -TimeoutSec 600
  $mb = [Math]::Round((Get-Item $cikti).Length / 1MB, 2)
  Write-Host "     ✓ $cikti  ($mb MB)"
}
Write-Host "`nBitti → $Hedef"
