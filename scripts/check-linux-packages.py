"""Check actual release packages and launch their desktop entries through GIO.

Uses a capture executable so file-manager argument forwarding is tested without
starting the GUI. Run on Linux after the AppImage and Debian bundles are built.
"""

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time


def run(*args, **kwargs):
    return subprocess.run(args, check=True, text=True, capture_output=True, **kwargs).stdout


def check(root, scratch, label):
    desktop = root / "usr/share/applications/Plainmark.desktop"
    run("desktop-file-validate", str(desktop))
    fields = dict(line.split("=", 1) for line in desktop.read_text().splitlines() if "=" in line)
    assert fields["Exec"] == "plainmark %F", fields
    assert "text/markdown" in fields["MimeType"].split(";"), fields

    # Build an isolated MIME database from the packaged extension declaration.
    data = scratch / "data"
    packages = data / "mime/packages"
    packages.mkdir(parents=True)
    mime = root / "usr/share/mime/packages/plainmark-markdown.xml"
    (packages / mime.name).write_bytes(mime.read_bytes())
    run("update-mime-database", str(data / "mime"))

    capture = scratch / "arguments.json"
    bin_dir = scratch / "bin"
    bin_dir.mkdir()
    executable = bin_dir / "plainmark"
    executable.write_text(
        "#!/usr/bin/env python3\n"
        "import json, os, sys\n"
        "from pathlib import Path\n"
        "Path(os.environ['PLAINMARK_TEST_CAPTURE']).write_text(json.dumps(sys.argv[1:]))\n"
    )
    executable.chmod(0o755)
    env = {
        **os.environ,
        "PATH": f"{bin_dir}{os.pathsep}{os.environ['PATH']}",
        "XDG_DATA_HOME": str(data),
        "PLAINMARK_TEST_CAPTURE": str(capture),
    }
    files = []
    for name in ["a note.md", "second.markdown", "日本語.mdown"]:
        path = scratch / name
        path.write_text("A Markdown document.\n")
        info = run("gio", "info", "-a", "standard::content-type", str(path), env=env)
        assert "standard::content-type: text/markdown" in info, info
        files.append(str(path))

    run("gio", "launch", str(desktop), *files, env=env)
    for _ in range(100):
        if capture.exists():
            try:
                actual = json.loads(capture.read_text())
                break
            except json.JSONDecodeError:
                pass
        time.sleep(0.05)
    else:
        raise AssertionError(f"{label}: desktop launcher did not invoke Plainmark")
    assert actual == files, (label, actual, files)
    print(f"{label}: valid launcher, all Markdown extensions, multiple paths with spaces/Unicode passed")


bundle = Path(sys.argv[1]).resolve()
debs = list((bundle / "deb").glob("*.deb"))
appimages = list((bundle / "appimage").glob("*.AppImage"))
assert len(debs) == len(appimages) == 1, (debs, appimages)
with tempfile.TemporaryDirectory(prefix="plainmark-packages-") as temp:
    scratch = Path(temp)
    deb_root = scratch / "deb"
    run("dpkg-deb", "--extract", str(debs[0]), str(deb_root))
    check(deb_root, scratch / "deb-test", "Debian")

    app_root = scratch / "appimage"
    app_root.mkdir()
    run(str(appimages[0]), "--appimage-extract", cwd=app_root)
    extracted = app_root / "squashfs-root"
    assert (extracted / "Plainmark.desktop").read_bytes() == (
        extracted / "usr/share/applications/Plainmark.desktop"
    ).read_bytes()
    check(extracted, scratch / "appimage-test", "AppImage")
