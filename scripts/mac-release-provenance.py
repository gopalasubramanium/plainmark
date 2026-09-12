"""Record the checked-out app source separately from the signing workflow source.

GitHub's built-in provenance identifies the workflow commit for workflow_dispatch.
This manifest is attested with the same trusted workflow and binds the release
tag, checked-out app commit and final notarized disk image together.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess


def main():
    tag = os.environ['RELEASE_TAG']
    target = os.environ['TARGET']
    arch = {'aarch64-apple-darwin': 'aarch64', 'x86_64-apple-darwin': 'x64'}[target]
    number = json.loads(Path('package.json').read_text())['version']
    if not re.fullmatch(r'\d+\.\d+\.\d+', number) or tag != 'v' + number:
        raise ValueError('The release tag and app version must match')
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    tagged = subprocess.check_output(['git', 'rev-parse', tag + '^{commit}'], text=True).strip()
    if commit != tagged:
        raise ValueError('The checkout differs from the release tag')
    dmg = Path(f'src-tauri/target/{target}/release/bundle/dmg/Plainmark_{number}_{arch}.dmg')
    digest = hashlib.sha256()
    with dmg.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    manifest = Path(f'Plainmark_{number}_{arch}_provenance.json')
    manifest.write_text(json.dumps({
        'schema': 1,
        'repository': 'gopalasubramanium/plainmark',
        'tag': tag,
        'source_commit': commit,
        'workflow_commit': os.environ['GITHUB_SHA'],
        'run_id': os.environ['GITHUB_RUN_ID'],
        'artifact': {'name': dmg.name, 'size': dmg.stat().st_size, 'sha256': digest.hexdigest()},
    }, indent=2) + '\n')
    with open(os.environ['GITHUB_OUTPUT'], 'a') as handle:
        handle.write(f'manifest={manifest}\n')
    print('Recorded the exact app source and notarized disk image')


if __name__ == '__main__':
    main()
