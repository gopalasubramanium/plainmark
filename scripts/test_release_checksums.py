"""Exercise platform names, exact uploaded filenames and incomplete bundles."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('release-checksums.py').resolve()


class ReleaseChecksums(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='plainmark release ')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.bundle = self.root / 'bundle'
        self.output = self.root / 'github-output'
        (self.root / 'package.json').write_text(json.dumps({'version': '1.2.3'}))

    def add(self, relative, content=b'installer bytes'):
        path = self.bundle / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        return path

    def run_script(self, target):
        return subprocess.run([sys.executable, str(SCRIPT), str(self.bundle), target],
                              cwd=self.root, capture_output=True, text=True,
                              env={**os.environ, 'GITHUB_OUTPUT': str(self.output)})

    def test_all_platforms_match_download_names(self):
        platforms = {
            'aarch64-apple-darwin': [('dmg/Plainmark_1.2.3_aarch64.dmg', 'Plainmark_1.2.3_aarch64.dmg'),
                                     ('macos/Plainmark.app.tar.gz', 'Plainmark_1.2.3_aarch64.app.tar.gz')],
            'x86_64-apple-darwin': [('dmg/Plainmark_1.2.3_x64.dmg', 'Plainmark_1.2.3_x64.dmg'),
                                    ('macos/Plainmark.app.tar.gz', 'Plainmark_1.2.3_x64.app.tar.gz')],
            'x86_64-pc-windows-msvc': [('nsis/Plainmark_1.2.3_x64-setup.exe', 'Plainmark_1.2.3_x64-setup.exe')],
            'x86_64-unknown-linux-gnu': [('appimage/Plainmark_1.2.3_amd64.AppImage', 'Plainmark_1.2.3_amd64.AppImage'),
                                         ('deb/Plainmark_1.2.3_amd64.deb', 'Plainmark_1.2.3_amd64.deb')],
        }
        self.add('dmg/Plainmark_0.9.0_x64.dmg', b'old cached release')
        for target, entries in platforms.items():
            with self.subTest(target=target):
                expected = []
                paths = []
                for index, (relative, uploaded) in enumerate(entries):
                    content = bytes([index]) * 200
                    paths.append(self.add(relative, content))
                    expected.append(f'{hashlib.sha256(content).hexdigest()}  {uploaded}\n')
                self.output.write_text('')
                result = self.run_script(target)
                self.assertEqual(result.returncode, 0, result.stderr)
                checksum = self.root / f'SHA256SUMS-{target}.txt'
                self.assertEqual(checksum.read_text(), ''.join(expected))
                self.assertEqual(self.output.read_text(),
                                 'artifacts<<PLAINMARK_PATHS\n' +
                                 '\n'.join(str(p.resolve()) for p in [*paths, checksum]) +
                                 f'\nPLAINMARK_PATHS\nchecksum={checksum.name}\n')

    def test_missing_archive_fails_before_publishing_a_partial_manifest(self):
        self.add('dmg/Plainmark_1.2.3_x64.dmg')
        result = self.run_script('x86_64-apple-darwin')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Missing release artifact', result.stderr)
        self.assertFalse(self.output.exists())
        self.assertFalse(list(self.root.glob('SHA256SUMS*')))

    def test_unknown_or_injected_target_cannot_write_outputs(self):
        for target in ['unknown', '../outside', 'x86_64-apple-darwin\nmalicious=value']:
            with self.subTest(target=target):
                self.assertNotEqual(self.run_script(target).returncode, 0)
                self.assertFalse(self.output.exists())


if __name__ == '__main__':
    unittest.main()
