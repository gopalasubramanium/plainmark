import json
import os
from pathlib import Path
import re
import subprocess

tag = os.environ['RELEASE_TAG']
if not re.fullmatch(r'v\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?', tag):
    raise SystemExit('Choose a version tag, not a branch or arbitrary ref.')
if json.loads(Path('package.json').read_text())['version'] != tag[1:]:
    raise SystemExit('The requested tag does not match the package version.')
subprocess.run(['git', 'describe', '--exact-match', '--tags', '--match', tag, 'HEAD'], check=True)
# Require a draft prepared by the ordinary all-platform release checks.
release = json.loads(subprocess.check_output(['gh', 'release', 'view', tag, '--json', 'isDraft']))
if not release['isDraft']:
    raise SystemExit('Refusing to replace a public release. Create a new version tag.')
sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
runs = json.loads(subprocess.check_output(['gh', 'run', 'list', '--workflow', 'release.yml', '--commit', sha, '--json', 'status,conclusion', '--limit', '20']))
if not runs or any(run['status'] != 'completed' for run in runs) or not any(run['conclusion'] == 'success' for run in runs):
    raise SystemExit('Complete the ordinary all-platform release workflow successfully before signing this draft.')
