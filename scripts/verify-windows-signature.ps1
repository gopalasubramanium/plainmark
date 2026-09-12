param([Parameter(Mandatory=$true)][string]$Installer, [Parameter(Mandatory=$true)][string]$ExpectedSubject)
$ErrorActionPreference = 'Stop'
$Signature = Get-AuthenticodeSignature -LiteralPath $Installer
if ($Signature.Status -ne 'Valid' -or $Signature.SignerCertificate.Subject -ne $ExpectedSubject -or $null -eq $Signature.TimeStamperCertificate) {
  throw 'Installer lacks a valid, timestamped Authenticode signature from the configured publisher.'
}
Write-Output 'Expected publisher signature and timestamp verified. SmartScreen reputation is a separate platform decision.'
