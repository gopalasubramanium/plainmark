"""Disk-image publication must fail closed on trust and credential errors."""
import contextlib
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

WORKFLOW = Path(__file__).resolve().parents[1] / '.github/workflows/signed-macos.yml'
BLOCK = WORKFLOW.read_text().split("          python3 - <<'PY'\n", 1)[1].split('\n          PY', 1)[0]
CODE = compile('\n'.join(line[10:] for line in BLOCK.splitlines()), str(WORKFLOW), 'exec')


class DiskImageNotarization(unittest.TestCase):
    def setUp(self):
        folder = tempfile.TemporaryDirectory()
        self.addCleanup(folder.cleanup)
        previous = Path.cwd()
        os.chdir(folder.name)
        self.addCleanup(os.chdir, previous)
        Path('package.json').write_text('{"version":"0.3.3"}')
        self.dmg = Path('src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/Plainmark_0.3.3_aarch64.dmg')
        self.dmg.parent.mkdir(parents=True)
        self.dmg.touch()
        self.env = {'TARGET': 'aarch64-apple-darwin', 'RELEASE_TAG': 'v0.3.3',
                    'APPLE_TEAM_ID': 'TESTTEAM', 'APPLE_ID': 'test@example.invalid',
                    'APPLE_PASSWORD': 'TEST-SECRET-MUST-NOT-APPEAR'}
        self.calls = []
        self.notary_code = 0
        self.notary_status = 'Accepted'
        self.team = 'TESTTEAM'
        self.gatekeeper_code = 0
        self.draft = True

    def run_command(self, args, **kwargs):
        self.calls.append(args)
        result = subprocess.CompletedProcess(args, 0, stdout='', stderr='')
        if args[:2] == ['codesign', '-d']:
            result.stderr = f'TeamIdentifier={self.team}\nAuthority=Developer ID Application: Test\n'
        if args[:3] == ['xcrun', 'notarytool', 'submit']:
            result.returncode = self.notary_code
            result.stdout = json.dumps({'status': self.notary_status, 'id': 'test-submission'})
            result.stderr = self.env['APPLE_PASSWORD']  # A tool error must never echo credentials.
        if args[0] == 'spctl' and self.gatekeeper_code:
            raise subprocess.CalledProcessError(self.gatekeeper_code, args)
        return result

    def execute(self):
        with patch.dict(os.environ, self.env, clear=True), \
             patch('subprocess.run', side_effect=self.run_command), \
             patch('subprocess.check_output', return_value=json.dumps({'isDraft': self.draft}).encode()):
            exec(CODE, {'__name__': '__main__'})

    def uploads(self):
        return [args for args in self.calls if args[:3] == ['gh', 'release', 'upload']]

    def test_upload_requires_accepted_notarization_stapled_ticket_and_gatekeeper(self):
        with contextlib.redirect_stdout(io.StringIO()):
            self.execute()
        self.assertEqual(len(self.uploads()), 1)
        upload_index = self.calls.index(self.uploads()[0])
        for prefix in [['xcrun', 'stapler', 'staple'], ['xcrun', 'stapler', 'validate'], ['spctl', '--assess']]:
            index = next(i for i, args in enumerate(self.calls) if args[:len(prefix)] == prefix)
            self.assertLess(index, upload_index)

    def test_notary_auth_error_never_prints_password_or_uploads(self):
        self.notary_code = 1
        output = io.StringIO()
        with contextlib.redirect_stdout(output), self.assertRaises(SystemExit) as error:
            self.execute()
        self.assertNotIn(self.env['APPLE_PASSWORD'], output.getvalue() + str(error.exception))
        self.assertFalse(self.uploads())

    def test_rejected_notarization_never_uploads(self):
        self.notary_status = 'Invalid'
        with self.assertRaises(SystemExit):
            self.execute()
        self.assertFalse(self.uploads())

    def test_gatekeeper_rejection_never_uploads(self):
        self.gatekeeper_code = 3
        with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(subprocess.CalledProcessError):
            self.execute()
        self.assertFalse(self.uploads())

    def test_public_release_is_not_overwritten(self):
        self.draft = False
        with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(SystemExit):
            self.execute()
        self.assertFalse(self.uploads())

    def test_wrong_publisher_stops_before_notarization(self):
        self.team = 'WRONGTEAM'
        with self.assertRaises(SystemExit):
            self.execute()
        self.assertFalse(any(args[:2] == ['xcrun', 'notarytool'] for args in self.calls))
        self.assertFalse(self.uploads())


if __name__ == '__main__':
    unittest.main()
