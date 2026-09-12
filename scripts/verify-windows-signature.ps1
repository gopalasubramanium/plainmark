param([Parameter(Mandatory=$true)][string]$Installer,
      [Parameter(Mandatory=$true)][string]$Application,
      [Parameter(Mandatory=$true)][string]$ExpectedSubject,
      [string]$Uninstaller)
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/windows-signature-policy.ps1"

$Paths = @($Installer, $Application)
if ($Uninstaller) { $Paths += $Uninstaller }
$PublisherThumbprint = $null
$VerifiedPaths = @()
foreach ($Path in $Paths) {
  $Resolved = (Resolve-Path -LiteralPath $Path -ErrorAction Stop).Path
  if ($VerifiedPaths -contains $Resolved) {
    throw 'Provide the installer and its actual application as distinct files.'
  }
  if (-not (Test-Path -LiteralPath $Resolved -PathType Leaf)) {
    throw 'A required signed file is missing.'
  }
  $Signature = Get-AuthenticodeSignature -LiteralPath $Resolved
  Assert-PlainmarkSignature -Signature $Signature -ExpectedSubject $ExpectedSubject
  if ($PublisherThumbprint -and $Signature.SignerCertificate.Thumbprint -cne $PublisherThumbprint) {
    throw 'The installer and its contents were not signed with the same publisher certificate.'
  }
  $PublisherThumbprint = $Signature.SignerCertificate.Thumbprint
  $VerifiedPaths += $Resolved
  Write-Output "Verified publisher and timestamp: $([IO.Path]::GetFileName($Resolved))"
}
Write-Output 'Installer and application signatures verified. SmartScreen reputation is a separate platform decision.'
