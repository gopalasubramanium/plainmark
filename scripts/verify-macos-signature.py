import os
import subprocess
app = os.environ['BUNDLE_PATH']
team = os.environ['EXPECTED_TEAM_ID']
subprocess.run(['codesign', '--verify', '--deep', '--strict', '--verbose=2', app], check=True)
details = subprocess.run(['codesign', '-d', '--verbose=4', app], check=True, capture_output=True, text=True).stderr
if f'TeamIdentifier={team}\n' not in details or 'Authority=Developer ID Application:' not in details or '(runtime)' not in details:
    raise SystemExit('Missing expected publisher identity or hardened runtime.')
subprocess.run(['xcrun', 'stapler', 'validate', app], check=True)
subprocess.run(['spctl', '--assess', '--type', 'execute', '--verbose=2', app], check=True)
print('Developer ID, expected team, hardened runtime, stapled notarization and Gatekeeper checks passed.')
