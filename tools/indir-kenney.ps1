# indir-kenney.ps1 — kenney.nl'deki CC0 paketleri indirir ve açar.
#
# NEDEN VAR: bu ortamda Bash'in ağı yok (`tools/indir-itch.ps1` başında ölçüldü), PowerShell'in var.
# Kenney'nin asset sayfasında indirme düğmesi bir lity modalı açar; gerçek .zip adresi o modalın
# "Continue without donating" bağlantısındadır:
#     <a id='donate-text' href='https://kenney.nl/media/pages/assets/<slug>/<hash>/kenney_<slug>.zip'>
# Adresteki <hash> paket güncellenince DEĞİŞİR, o yüzden sabit adres yazılmaz — sayfa her seferinde
# okunup href çıkarılır.
#
# KULLANIM
#   pwsh tools/indir-kenney.ps1 -Slug interface-sounds -Hedef indirilen
#   pwsh tools/indir-kenney.ps1 -Slug rpg-audio -Hedef indirilen -Ac
#
# LİSANS UYARISI: indirmek lisansı doğrulamaz. `docs/assets.md` §8 gereği her paketin lisansı
# `public/assets/README.md` manifestine kaynağıyla yazılır; belirsizse commit'lenmez.

param(
  [Parameter(Mandatory = $true)][string[]]$Slug,
  [string]$Hedef = "indirilen",
  [switch]$Ac
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

if (-not (Test-Path $Hedef)) { New-Item -ItemType Directory -Path $Hedef | Out-Null }

foreach ($s in $Slug) {
  $sayfa = "https://kenney.nl/assets/$s"
  Write-Host "1/3  sayfa: $sayfa"
  $html = (Invoke-WebRequest -Uri $sayfa -UseBasicParsing -TimeoutSec 120).Content
  if ($html -notmatch "id='donate-text'\s+href='([^']+\.zip)'") {
    if ($html -notmatch 'id="donate-text"\s+href="([^"]+\.zip)"') {
      throw "$s : .zip adresi bulunamadi - sayfa yapisi degismis olabilir"
    }
  }
  $zipUrl = $Matches[1]
  $ad = [System.IO.Path]::GetFileName(([System.Uri]$zipUrl).AbsolutePath)
  $cikti = Join-Path $Hedef $ad

  Write-Host "2/3  indiriliyor: $ad"
  Invoke-WebRequest -Uri $zipUrl -OutFile $cikti -UseBasicParsing -TimeoutSec 600
  $mb = [Math]::Round((Get-Item $cikti).Length / 1MB, 2)
  Write-Host "     OK $cikti  ($mb MB)"

  if ($Ac) {
    # -Force zaten uzerine yazar; klasoru silmiyoruz (silme yok = kaza yok).
    $klasor = Join-Path $Hedef ([System.IO.Path]::GetFileNameWithoutExtension($ad))
    Write-Host "3/3  aciliyor: $klasor"
    Expand-Archive -Path $cikti -DestinationPath $klasor -Force
  }
}
Write-Host "Bitti -> $Hedef"