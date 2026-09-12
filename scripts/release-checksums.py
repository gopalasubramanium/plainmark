"""Hash the exact distributable files; emit paths for GitHub build provenance."""
import hashlib
import json
import os
from pathlib import Path
import sys

root = Path(sys.argv[1])
target = sys.argv[2]
if not all(c.isalnum() or c == '-' for c in target):
    raise ValueError('Invalid target name')
version = json.loads(Path('package.json').read_text())['version']
files = sorted(p for p in root.rglob('*') if p.is_file() and ((f'_{version}_' in p.name and p.suffix.lower() in {'.dmg', '.exe', '.deb', '.appimage'}) or p.name.endswith('.app.tar.gz')))
if not files:
    raise ValueError('No installers found; refusing an empty checksum list')
if len({p.name for p in files}) != len(files):
    raise ValueError('Ambiguous installer names')
checksum = Path(f'SHA256SUMS-{target}.txt')
def digest(path):
    result = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            result.update(chunk)
    return result.hexdigest()
checksum.write_text(''.join(f'{digest(p)}  {p.name}\n' for p in files))
output = os.environ.get('GITHUB_OUTPUT')
if output:
    with open(output, 'a') as handle:
        handle.write('artifacts<<PLAINMARK_PATHS\n' + '\n'.join(str(p.resolve()) for p in [*files, checksum]) + '\nPLAINMARK_PATHS\n')
        handle.write(f'checksum={checksum}\n')
print(f'Created checksums for {len(files)} installers.')
