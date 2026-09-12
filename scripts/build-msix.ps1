param([Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$root = Split-Path $PSScriptRoot -Parent
$version = (Get-Content "$root/package.json" -Raw | ConvertFrom-Json).version
if ($version -notmatch '^\d+\.\d+\.\d+$') { throw 'MSIX requires a numbered app version.' }
$binary = Join-Path $root 'src-tauri/target/release/plainmark.exe'
if (!(Test-Path $binary)) { throw 'Build the Windows application before packaging.' }
$sdkRoot = "${env:ProgramFiles(x86)}/Windows Kits/10/bin"
$sdk = Get-ChildItem $sdkRoot -Directory | Where-Object { $_.Name -match '^10\.0\.\d+\.0$' } | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
if (!$sdk) { throw 'Windows SDK MakeAppx is required.' }
$makeappx = Join-Path $sdk.FullName 'x64/makeappx.exe'
$stage = Join-Path ([IO.Path]::GetTempPath()) ('Plainmark-MSIX-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path "$stage/Assets", "$stage/resources" -Force | Out-Null
Copy-Item $binary "$stage/plainmark.exe"
Copy-Item "$root/src-tauri/resources/*.txt" "$stage/resources/"
$loader = Join-Path (Split-Path $binary) 'WebView2Loader.dll'
if (Test-Path $loader) { Copy-Item $loader $stage }
[xml]$manifest = Get-Content "$root/packaging/windows/AppxManifest.xml" -Raw
$manifest.Package.Identity.Version = "$version.0"
$manifest.Save("$stage/AppxManifest.xml")
# Derive store-size icons from the existing product artwork; no new branding.
Add-Type -AssemblyName System.Drawing
$source = [Drawing.Image]::FromFile("$root/src-tauri/icons/128x128@2x.png")
try {
    foreach ($item in @(@('StoreLogo',50), @('Square44x44Logo',44), @('Square150x150Logo',150))) {
        $size = [int]$item[1]
        $bitmap = New-Object Drawing.Bitmap($size,$size)
        $graphics = [Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.DrawImage($source, 0, 0, $size, $size)
            $bitmap.Save("$stage/Assets/$($item[0]).png", [Drawing.Imaging.ImageFormat]::Png)
        } finally { $graphics.Dispose(); $bitmap.Dispose() }
    }
} finally { $source.Dispose() }
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$package = Join-Path $OutputDirectory "Plainmark_${version}_x64.msix"
if (Test-Path $package) { throw 'Refusing to overwrite an existing package.' }
& $makeappx pack /d $stage /p $package /h SHA256
if ($LASTEXITCODE -ne 0) { throw 'MakeAppx validation/packaging failed.' }
Get-FileHash $package -Algorithm SHA256 | Format-List
Write-Output 'This package is unsigned and prepared for Store validation. It is not certified or publicly released.'
