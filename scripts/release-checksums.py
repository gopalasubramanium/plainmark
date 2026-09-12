"""Hash the exact distributable files; emit paths for GitHub build provenance."""
import hashlib
import json
import os
from pathlib import Path
import re
import sys

root = Path(sys.argv[1])
target = sys.argv[2]
version = json.loads(Path('package.json').read_text())['version']
if not re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?', version):
    raise ValueError('Invalid release version')
# Match the actual upload names used by tauri-action, including its renaming
# of Plainmark.app.tar.gz. Do not pick up older bundles from a restored cache.
if target in {'aarch64-apple-darwin', 'x86_64-apple-darwin'}:
    arch = 'aarch64' if target == 'aarch64-apple-darwin' else 'x64'
    name = f'Plainmark_{version}_{arch}'
    artifacts = [(root / 'dmg' / f'{name}.dmg', f'{name}.dmg'),
                 (root / 'macos' / 'Plainmark.app.tar.gz', f'{name}.app.tar.gz')]
elif target == 'x86_64-pc-windows-msvc':
    name = f'Plainmark_{version}_x64-setup.exe'
    artifacts = [(root / 'nsis' / name, name)]
elif target == 'x86_64-unknown-linux-gnu':
    name = f'Plainmark_{version}_amd64'
    artifacts = [(root / 'appimage' / f'{name}.AppImage', f'{name}.AppImage'),
                 (root / 'deb' / f'{name}.deb', f'{name}.deb')]
else:
    raise ValueError('Unsupported release target')
for path, _ in artifacts:
    if not path.is_file():
        raise ValueError(f'Missing release artifact: {path}')
checksum = Path(f'SHA256SUMS-{target}.txt')
def digest(path):
    result = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            result.update(chunk)
    return result.hexdigest()
checksum.write_text(''.join(f'{digest(path)}  {name}\n' for path, name in artifacts))
output = os.environ.get('GITHUB_OUTPUT')
if output:
    with open(output, 'a') as handle:
        handle.write('artifacts<<PLAINMARK_PATHS\n' + '\n'.join(str(p.resolve()) for p in [*(path for path, _ in artifacts), checksum]) + '\nPLAINMARK_PATHS\n')
        handle.write(f'checksum={checksum}\n')
print(f'Created checksums for {len(artifacts)} release artifacts.')
