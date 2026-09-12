import contextlib
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('provenance', Path(__file__).with_name('mac-release-provenance.py'))
provenance = importlib.util.module_from_spec(spec)
spec.loader.exec_module(provenance)


class MacSourceProvenance(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        original = Path.cwd()
        self.addCleanup(os.chdir, original)
        os.chdir(temporary.name)
        Path('package.json').write_text('{"version":"0.4.0"}')
        self.dmg = Path('src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/Plainmark_0.4.0_aarch64.dmg')
        self.dmg.parent.mkdir(parents=True)
        self.dmg.write_bytes(b'final-notarized-disk-image')
        self.env = {'RELEASE_TAG': 'v0.4.0', 'TARGET': 'aarch64-apple-darwin',
                    'GITHUB_SHA': 'b'*40, 'GITHUB_RUN_ID': '123', 'GITHUB_OUTPUT': 'step-output'}

    def test_distinguishes_app_commit_from_workflow_and_hashes_final_bytes(self):
        with patch.dict(os.environ, self.env), patch('subprocess.check_output', return_value='a'*40+'\n'), contextlib.redirect_stdout(io.StringIO()):
            provenance.main()
        record = json.loads(Path('Plainmark_0.4.0_aarch64_provenance.json').read_text())
        self.assertEqual(record['source_commit'], 'a'*40)
        self.assertEqual(record['workflow_commit'], 'b'*40)
        self.assertEqual(record['artifact']['sha256'], hashlib.sha256(self.dmg.read_bytes()).hexdigest())
        self.assertEqual(record['artifact']['size'], self.dmg.stat().st_size)

    def test_wrong_checkout_never_produces_a_manifest(self):
        with patch.dict(os.environ, self.env), patch('subprocess.check_output', side_effect=['a'*40,'c'*40]), self.assertRaises(ValueError):
            provenance.main()
        self.assertFalse(Path('step-output').exists())

    def test_version_mismatch_never_produces_a_manifest(self):
        with patch.dict(os.environ, dict(self.env, RELEASE_TAG='v0.4.1')), self.assertRaises(ValueError):
            provenance.main()
        self.assertFalse(Path('step-output').exists())
