"""Verify the vendored crate against its published archive plus the upstream fix."""
import hashlib
import io
from pathlib import Path
import tarfile
import urllib.request

archive = urllib.request.urlopen('https://static.crates.io/crates/glib/glib-0.18.5.crate', timeout=60).read()
assert hashlib.sha256(archive).hexdigest() == '233daaf6e83ae6a12a52055f568f9d7cf4671dabb78ff9560ab6da230ce00ee5'
expected = {}
with tarfile.open(fileobj=io.BytesIO(archive), mode='r:gz') as tar:
    for entry in tar.getmembers():
        if entry.isfile():
            path = '/'.join(entry.name.split('/')[1:])
            if path == '.cargo_vcs_info.json':
                continue
            content = tar.extractfile(entry).read()
            if path == 'src/variant_iter.rs':
                assert content.count(b'let p: *mut libc::c_char = std::ptr::null_mut();') == 1
                content = content.replace(b'let p: *mut libc::c_char = std::ptr::null_mut();', b'let mut p: *mut libc::c_char = std::ptr::null_mut();').replace(b'                &p,', b'                &mut p,')
            expected[path] = content
root = Path('src-tauri/vendor/glib')
actual = {str(path.relative_to(root)): path.read_bytes() for path in root.rglob('*') if path.is_file()}
assert actual.keys() == expected.keys(), (actual.keys() - expected.keys(), expected.keys() - actual.keys())
for path, content in expected.items():
    assert actual[path] == content, f'Unexpected change in {path}'
print('GLib matches its verified upstream archive plus the exact RUSTSEC-2024-0429 fix.')
