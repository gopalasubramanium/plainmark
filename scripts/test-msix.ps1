param([Parameter(Mandatory=$true)][string]$PackagePath, [string]$EvidenceDirectory)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if ($env:GITHUB_ACTIONS -ne 'true' -or $env:RUNNER_ENVIRONMENT -ne 'github-hosted') {
    throw 'This test changes certificate trust only on an ephemeral GitHub-hosted Windows runner.'
}
$identity = 'GopalaSubramanium.PlainmarkMarkdownEditor'
$publisher = 'CN=CB824A42-D5E4-447F-BB19-DEE3229EF8E6'
$scratch = Join-Path $env:RUNNER_TEMP ('plainmark-msix-test-' + [guid]::NewGuid())
New-Item -ItemType Directory $scratch | Out-Null
$testPackage = Join-Path $scratch 'Plainmark-CI-only.msix'
Copy-Item $PackagePath $testPackage
$unsignedHash = (Get-FileHash $PackagePath -Algorithm SHA256).Hash
$certificate = $null
$trusted = $null
try {
    # Never upload this certificate or test-signed copy. Store candidates remain unsigned.
    $certificate = New-SelfSignedCertificate -Type Custom -Subject $publisher `
        -KeyUsage DigitalSignature -FriendlyName 'Plainmark ephemeral CI test only' `
        -CertStoreLocation 'Cert:\CurrentUser\My' `
        -TextExtension @('2.5.29.37={text}1.3.6.1.5.5.7.3.3','2.5.29.19={text}')
    Export-Certificate -Cert $certificate -FilePath "$scratch/test.cer" | Out-Null
    $trusted = Import-Certificate -FilePath "$scratch/test.cer" -CertStoreLocation 'Cert:\LocalMachine\TrustedPeople'
    $sdk = Get-ChildItem "${env:ProgramFiles(x86)}/Windows Kits/10/bin" -Directory |
        Where-Object { $_.Name -match '^10\.0\.\d+\.0$' } |
        Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
    & "$($sdk.FullName)/x64/signtool.exe" sign /fd SHA256 /sha1 $certificate.Thumbprint $testPackage
    if ($LASTEXITCODE -ne 0) { throw 'Ephemeral test signing failed.' }
    Add-AppxPackage -Path $testPackage
    $installed = Get-AppxPackage -Name $identity
    if (!$installed) { throw 'The package was not registered.' }
    $manifest = Get-AppxPackageManifest $installed
    $applicationId = @($manifest.Package.Applications.Application)[0].Id
    Start-Process explorer.exe -ArgumentList "shell:AppsFolder\$($installed.PackageFamilyName)!$applicationId"
    $deadline = (Get-Date).AddSeconds(45)
    $window = $null
    Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
    while ((Get-Date) -lt $deadline) {
        $app = Get-Process plainmark -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
        if ($app) {
            $window = [Windows.Automation.AutomationElement]::FromHandle($app.MainWindowHandle)
            $nodes = $window.FindAll([Windows.Automation.TreeScope]::Descendants, [Windows.Automation.Condition]::TrueCondition)
            $labels = @($nodes | ForEach-Object { $_.Current.Name })
            if ($labels -match 'Open a file|New document|Visual editor') { break }
        }
        Start-Sleep -Milliseconds 500
    }
    if (!$window -or !($labels -match 'Open a file|New document|Visual editor')) {
        throw 'The installed app did not render its editor within 45 seconds.'
    }
    $version = $installed.Version.ToString()
    Write-Output "Installed and launched Store identity $identity, version $version; editor accessibility controls are present."
    if ($EvidenceDirectory) {
        New-Item -ItemType Directory -Force $EvidenceDirectory | Out-Null
        $evidence = (Resolve-Path $EvidenceDirectory).Path
        Add-Type -AssemblyName System.Windows.Forms, System.Drawing
        Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class PlainmarkTestWindow {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr window);
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr window, IntPtr after, int x, int y, int width, int height, uint flags);
}
'@
        if (Get-Command Set-DisplayResolution -ErrorAction SilentlyContinue) {
            Set-DisplayResolution -Width 1600 -Height 1000 -Force
        }
        [PlainmarkTestWindow]::SetWindowPos($app.MainWindowHandle, [IntPtr]::Zero, 0, 0, 1500, 940, 0x0040) | Out-Null
        [PlainmarkTestWindow]::SetForegroundWindow($app.MainWindowHandle) | Out-Null
        function Find-AppControl([string]$name) {
            $condition = [Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::NameProperty, $name)
            $limit = (Get-Date).AddSeconds(15)
            do {
                $node = $window.FindFirst([Windows.Automation.TreeScope]::Descendants, $condition)
                if ($node) { return $node }
                Start-Sleep -Milliseconds 250
            } while ((Get-Date) -lt $limit)
            throw "Missing app control: $name"
        }
        function Capture-App([string]$name) {
            Start-Sleep -Milliseconds 600
            $bounds = $window.Current.BoundingRectangle
            $screen = [Windows.Forms.Screen]::PrimaryScreen.Bounds
            if ($bounds.Width -lt 1366 -or $bounds.Height -lt 768 -or $bounds.Right -gt $screen.Right -or $bounds.Bottom -gt $screen.Bottom) {
                throw 'The test desktop cannot capture the Store screenshot at its actual required size.'
            }
            $bitmap = [Drawing.Bitmap]::new([int]$bounds.Width, [int]$bounds.Height)
            $graphics = [Drawing.Graphics]::FromImage($bitmap)
            try {
                $graphics.CopyFromScreen([int]$bounds.X, [int]$bounds.Y, 0, 0, $bitmap.Size)
                $bitmap.Save((Join-Path $evidence $name), [Drawing.Imaging.ImageFormat]::Png)
            } finally { $graphics.Dispose(); $bitmap.Dispose() }
        }
        Capture-App '01-visual-editor.png'
        $fixture = Join-Path $scratch 'Windows-store-test.md'
        $original = "# Plainmark on Windows`n`nA local document opened from the installed Store package.`n"
        [IO.File]::WriteAllText($fixture, $original)
        (Find-AppControl 'Open a file').GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern).Invoke()
        Start-Sleep -Seconds 1
        Set-Clipboard -Value $fixture
        [Windows.Forms.SendKeys]::SendWait('^v{ENTER}')
        $null = Find-AppControl 'Windows-store-test.md'
        [PlainmarkTestWindow]::SetForegroundWindow($app.MainWindowHandle) | Out-Null
        [Windows.Forms.SendKeys]::SendWait('^2')
        $source = Find-AppControl 'Markdown editor'
        $source.SetFocus()
        $updated = $original + "`nSaved from the installed editor.`n"
        Set-Clipboard -Value $updated
        [Windows.Forms.SendKeys]::SendWait('^a^v')
        Start-Sleep -Milliseconds 500
        [Windows.Forms.SendKeys]::SendWait('^s')
        $limit = (Get-Date).AddSeconds(15)
        while ([IO.File]::ReadAllText($fixture) -ne $updated -and (Get-Date) -lt $limit) { Start-Sleep -Milliseconds 300 }
        if ([IO.File]::ReadAllText($fixture) -ne $updated) { throw 'Editing and native saving did not persist the expected Markdown.' }
        Write-Output 'PASS: Native file picker, source editing and save persisted the expected document.'
        [Windows.Forms.SendKeys]::SendWait('^3')
        $null = Find-AppControl 'Rendered document'
        Capture-App '02-source-and-preview.png'
        $nodes = $window.FindAll([Windows.Automation.TreeScope]::Descendants, [Windows.Automation.Condition]::TrueCondition)
        @($nodes | ForEach-Object { $_.Current.Name }) | Set-Content (Join-Path $evidence 'editor-accessibility.txt')
    }
    Get-Process plainmark -ErrorAction SilentlyContinue | Stop-Process
    Remove-AppxPackage -Package $installed.PackageFullName
    if (Get-AppxPackage -Name $identity) { throw 'Uninstall left the package registered.' }
    if ((Get-FileHash $PackagePath -Algorithm SHA256).Hash -ne $unsignedHash) {
        throw 'The unsigned Store candidate changed during testing.'
    }
    Write-Output 'Installation, visible editor launch, uninstall, and unchanged submission-package hash passed.'
    Write-Output 'Default file association, multi-file activation, folders, print, upgrade, accessibility usability and missing-WebView2 tests are still required.'
} finally {
    Get-Process plainmark -ErrorAction SilentlyContinue | Stop-Process -ErrorAction SilentlyContinue
    Get-AppxPackage -Name $identity | Remove-AppxPackage -ErrorAction SilentlyContinue
    if ($trusted) { Remove-Item -LiteralPath "Cert:\LocalMachine\TrustedPeople\$($trusted.Thumbprint)" -ErrorAction SilentlyContinue }
    if ($certificate) { Remove-Item -LiteralPath "Cert:\CurrentUser\My\$($certificate.Thumbprint)" -ErrorAction SilentlyContinue }
    Remove-Item -LiteralPath $scratch -Recurse -Force -ErrorAction SilentlyContinue
}
