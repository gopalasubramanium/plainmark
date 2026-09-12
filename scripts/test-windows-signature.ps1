$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/windows-signature-policy.ps1"
$Expected = 'CN=Plainmark test publisher'
function New-TestSignature {
  return [PSCustomObject]@{
    Status = 'Valid'
    SignerCertificate = [PSCustomObject]@{ Subject = $Expected; Thumbprint = 'TEST-ONLY' }
    TimeStamperCertificate = [PSCustomObject]@{ Subject = 'Test timestamp' }
  }
}
# Synthetic policy cases do not create certificates or sign real binaries.
Assert-PlainmarkSignature -Signature (New-TestSignature) -ExpectedSubject $Expected
foreach ($Status in @('NotSigned', 'HashMismatch', 'NotTrusted', 'UnknownError')) {
  $Invalid = New-TestSignature
  $Invalid.Status = $Status
  $Rejected = $false
  try { Assert-PlainmarkSignature -Signature $Invalid -ExpectedSubject $Expected }
  catch { $Rejected = $true }
  if (-not $Rejected) { throw "Accepted invalid signature status: $Status" }
}
foreach ($Fault in @('publisher', 'timestamp', 'certificate', 'thumbprint')) {
  $Invalid = New-TestSignature
  switch ($Fault) {
    publisher { $Invalid.SignerCertificate.Subject = 'CN=Different publisher' }
    timestamp { $Invalid.TimeStamperCertificate = $null }
    certificate { $Invalid.SignerCertificate = $null }
    thumbprint { $Invalid.SignerCertificate.Thumbprint = '' }
  }
  $Rejected = $false
  try { Assert-PlainmarkSignature -Signature $Invalid -ExpectedSubject $Expected }
  catch { $Rejected = $true }
  if (-not $Rejected) { throw "Accepted invalid signature: $Fault" }
}
# Exercise the actual Windows API without executing an installer or modifying
# the trust store. This repository script is deliberately unsigned.
$Actual = Get-AuthenticodeSignature -LiteralPath $PSCommandPath
$Rejected = $false
try { Assert-PlainmarkSignature -Signature $Actual -ExpectedSubject $Expected }
catch { $Rejected = $true }
if (-not $Rejected) { throw 'Accepted an unsigned file as publisher-signed.' }

# Exercise the public verifier with controlled signature results. In particular,
# a signed outer installer must never hide an unsigned app or a different signer.
$Fixture = Join-Path ([IO.Path]::GetTempPath()) ([Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $Fixture | Out-Null
$Installer = Join-Path $Fixture 'setup.exe'
$Application = Join-Path $Fixture 'plainmark.exe'
New-Item -ItemType File -Path $Installer, $Application | Out-Null
try {
  function Get-AuthenticodeSignature {
    param([string]$LiteralPath)
    $Result = New-TestSignature
    if ($LiteralPath -eq $Application) {
      if ($Case -eq 'unsigned-app') { $Result.Status = 'NotSigned' }
      if ($Case -eq 'different-certificate') { $Result.SignerCertificate.Thumbprint = 'ANOTHER-TEST-CERTIFICATE' }
    }
    return $Result
  }
  foreach ($Case in @('valid', 'unsigned-app', 'different-certificate', 'missing-app', 'same-file')) {
    $AppPath = $Application
    if ($Case -eq 'missing-app') { $AppPath = Join-Path $Fixture 'missing.exe' }
    if ($Case -eq 'same-file') { $AppPath = $Installer }
    $Rejected = $false
    try { & "$PSScriptRoot/verify-windows-signature.ps1" -Installer $Installer -Application $AppPath -ExpectedSubject $Expected | Out-Null }
    catch { $Rejected = $true }
    if (($Case -eq 'valid') -eq $Rejected) { throw "Unexpected verification result: $Case" }
  }
} finally {
  Remove-Item Function:\Get-AuthenticodeSignature
  Remove-Item -LiteralPath $Fixture -Recurse -Force
}
Write-Output 'Windows signature checks: policy and installer/application verification cases passed.'
