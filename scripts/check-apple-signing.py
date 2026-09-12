import os
required = ['APPLE_CERTIFICATE', 'APPLE_CERTIFICATE_PASSWORD', 'APPLE_SIGNING_IDENTITY', 'APPLE_ID', 'APPLE_PASSWORD', 'APPLE_TEAM_ID']
missing = [name for name in required if not os.environ.get(name, '').strip()]
if missing:
    raise SystemExit('Signing is not configured. Missing secret names: ' + ', '.join(missing))
if not os.environ['APPLE_SIGNING_IDENTITY'].startswith('Developer ID Application:'):
    raise SystemExit('A Developer ID Application identity is required; ad-hoc and development identities are not accepted.')
print('Required signing credentials are present. Values are never printed.')
