"""Create one draft before the platform matrix starts uploading assets."""
import json
import os
from pathlib import Path
import re
import subprocess


def api(*args, body=None):
    result = subprocess.run(['gh', 'api', *args], check=True, text=True,
                            input=json.dumps(body) if body is not None else None,
                            capture_output=True)
    return json.loads(result.stdout)


tag = os.environ['GITHUB_REF_NAME']
repo = os.environ['GITHUB_REPOSITORY']
sha = os.environ['GITHUB_SHA']
version = json.loads(Path('package.json').read_text())['version']
if tag != f'v{version}' or not re.fullmatch(r'[0-9a-f]{40}', sha):
    raise ValueError('Release tag and source commit must match the checked-out version')
pages = api(f'repos/{repo}/releases?per_page=100', '--paginate', '--slurp')
matches = [release for page in pages for release in page if release['tag_name'] == tag]
if len(matches) > 1:
    raise ValueError('Duplicate release drafts must be consolidated before uploading')
if matches:
    release = matches[0]
    if not release['draft']:
        raise ValueError('Refusing to replace assets in a published release')
else:
    release = api(f'repos/{repo}/releases', '--method', 'POST', '--input', '-', body={
        'tag_name': tag, 'target_commitish': sha, 'name': f'Plainmark {tag}',
        'draft': True, 'prerelease': True,
        'body': Path('docs/PREVIEW-RELEASE.md').read_text(),
    })
release_id = release['id']
if type(release_id) is not int or release_id <= 0 or not release['draft']:
    raise ValueError('Expected an existing draft release ID')
with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
    output.write(f'id={release_id}\n')
print(f'All platform builders will upload to draft {release_id}.')
