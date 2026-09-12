"""Release creation must be serialized, draft-only, and shared by builders."""
import json
import os
from pathlib import Path
import runpy
import subprocess
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).with_name('prepare-release.py').resolve()


class PrepareRelease(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        previous = Path.cwd()
        os.chdir(self.root)
        self.addCleanup(os.chdir, previous)
        (self.root / 'package.json').write_text('{"version":"1.2.3"}')
        (self.root / 'docs').mkdir()
        (self.root / 'docs/PREVIEW-RELEASE.md').write_text('Clearly labeled preview.\n')
        self.output = self.root / 'output'
        self.environment = {'GITHUB_REF_NAME': 'v1.2.3', 'GITHUB_REPOSITORY': 'owner/project',
                            'GITHUB_SHA': 'a' * 40, 'GITHUB_OUTPUT': str(self.output)}

    def response(self, data):
        return subprocess.CompletedProcess([], 0, stdout=json.dumps(data))

    def execute(self, mock):
        with patch.dict(os.environ, self.environment, clear=True), patch('subprocess.run', mock):
            runpy.run_path(str(SCRIPT), run_name='__main__')

    def test_creates_one_draft_with_exact_source_and_emits_shared_id(self):
        with patch('subprocess.run') as request:
            request.side_effect = [self.response([[]]), self.response({'id': 123, 'draft': True})]
            self.execute(request)
            self.assertEqual(request.call_count, 2)
            body = json.loads(request.call_args.kwargs['input'])
            self.assertEqual(body['tag_name'], 'v1.2.3')
            self.assertEqual(body['target_commitish'], 'a' * 40)
            self.assertTrue(body['draft'])
            self.assertTrue(body['prerelease'])
            self.assertEqual(self.output.read_text(), 'id=123\n')

    def test_reuses_existing_draft_without_creating_a_second_release(self):
        with patch('subprocess.run') as request:
            request.return_value = self.response([[{'id': 456, 'tag_name': 'v1.2.3', 'draft': True}]])
            self.execute(request)
            self.assertEqual(request.call_count, 1)
            self.assertEqual(self.output.read_text(), 'id=456\n')

    def test_published_or_duplicate_releases_stop_before_any_write(self):
        for releases in [[{'id': 1, 'tag_name': 'v1.2.3', 'draft': False}],
                         [{'id': 1, 'tag_name': 'v1.2.3', 'draft': True},
                          {'id': 2, 'tag_name': 'v1.2.3', 'draft': True}]]:
            with self.subTest(releases=releases), patch('subprocess.run') as request:
                request.return_value = self.response([releases])
                with self.assertRaises(ValueError):
                    self.execute(request)
                self.assertEqual(request.call_count, 1)
                self.assertFalse(self.output.exists())

    def test_wrong_tag_never_calls_github(self):
        self.environment['GITHUB_REF_NAME'] = 'main'
        with patch('subprocess.run') as request:
            with self.assertRaises(ValueError):
                self.execute(request)
            request.assert_not_called()


if __name__ == '__main__':
    unittest.main()
