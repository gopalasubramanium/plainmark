# This never imports a certificate or changes Windows trust. The Valid status
# must come from Windows Authenticode, not from a self-issued certificate.
function Assert-PlainmarkSignature {
  param([Parameter(Mandatory=$true)]$Signature,
        [Parameter(Mandatory=$true)][ValidateNotNullOrEmpty()][string]$ExpectedSubject)
  if ($Signature.Status -ne 'Valid' -or
      $null -eq $Signature.SignerCertificate -or
      $Signature.SignerCertificate.Subject -cne $ExpectedSubject -or
      [string]::IsNullOrWhiteSpace($Signature.SignerCertificate.Thumbprint) -or
      $null -eq $Signature.TimeStamperCertificate) {
    throw 'A required file lacks a valid, timestamped Authenticode signature from the configured publisher.'
  }
}
