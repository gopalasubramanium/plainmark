param([Parameter(Mandatory=$true)][string]$PackagePath)
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
    Get-Process plainmark -ErrorAction SilentlyContinue | Stop-Process
    Remove-AppxPackage -Package $installed.PackageFullName
    if (Get-AppxPackage -Name $identity) { throw 'Uninstall left the package registered.' }
    if ((Get-FileHash $PackagePath -Algorithm SHA256).Hash -ne $unsignedHash) {
        throw 'The unsigned Store candidate changed during testing.'
    }
    Write-Output 'Installation, visible editor launch, uninstall, and unchanged submission-package hash passed.'
    Write-Output 'Manual file activation, save, print, upgrade, accessibility and missing-WebView2 tests are still required.'
} finally {
    Get-Process plainmark -ErrorAction SilentlyContinue | Stop-Process -ErrorAction SilentlyContinue
    Get-AppxPackage -Name $identity | Remove-AppxPackage -ErrorAction SilentlyContinue
    if ($trusted) { Remove-Item -LiteralPath "Cert:\LocalMachine\TrustedPeople\$($trusted.Thumbprint)" -ErrorAction SilentlyContinue }
    if ($certificate) { Remove-Item -LiteralPath "Cert:\CurrentUser\My\$($certificate.Thumbprint)" -ErrorAction SilentlyContinue }
    Remove-Item -LiteralPath $scratch -Recurse -Force -ErrorAction SilentlyContinue
}
