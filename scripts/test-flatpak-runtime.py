#!/usr/bin/env python3
"""Exercise a real installed Flatpak on an isolated CI desktop, without extra grants."""
import os
from pathlib import Path
import subprocess
import tempfile
import time

if os.environ.get("GITHUB_ACTIONS") != "true" or os.environ.get("RUNNER_ENVIRONMENT") != "github-hosted":
    raise SystemExit("This desktop test is restricted to an ephemeral GitHub-hosted runner.")

import gi
gi.require_version("Gdk", "3.0")
from gi.repository import Gdk, GLib
import pyatspi

APP = "io.github.gopalasubramanium.plainmark"
pyatspi.Registry.registerEventListener(lambda event: None, "object:children-changed", "object:state-changed")

# A minimal Xvfb session has no desktop accessibility settings daemon. Enable
# the same AT-SPI status a screen reader requests before WebKit is launched.
for status in ("IsEnabled", "ScreenReaderEnabled"):
    subprocess.run(["gdbus", "call", "--session", "--dest", "org.a11y.Bus",
                    "--object-path", "/org/a11y/bus", "--method",
                    "org.freedesktop.DBus.Properties.Set", "org.a11y.Status",
                    status, "<true>"], check=True)


def snapshot():
    result = []
    remaining = 6000
    def visit(node, depth=0):
        nonlocal remaining
        if node is None or remaining <= 0 or depth > 24:
            return
        remaining -= 1
        try:
            node.clearCache()
            result.append(f"{'  ' * depth}{node.getRoleName()}: {node.name}")
            try:
                text = node.queryText()
                result.append(text.getText(0, min(text.characterCount, 12000)))
            except (NotImplementedError, AttributeError):
                pass
            for child in node:
                visit(child, depth + 1)
        except Exception as error:
            result.append(f"Accessibility read: {type(error).__name__}")
    visit(pyatspi.Registry.getDesktop(0))
    return "\n".join(result)


with tempfile.TemporaryDirectory(prefix="plainmark-portal-test-") as directory:
    document = Path(directory) / "portal-note.md"
    marker = "A document opened through the file portal"
    document.write_text(f"# Plainmark on Linux\n\n{marker}.\n\n- Local Markdown\n- No account required\n", encoding="utf-8")
    # Flatpak forwards only this selected file through the document portal.
    with open("flatpak-runtime.log", "w") as log:
        # The Ubuntu host's older AT-SPI client cannot reach private socket paths
        # advertised inside a Flatpak. Keep accessibility on its filtered bus.
        process = subprocess.Popen(["flatpak", "run", "--env=ATSPI_DISABLE_P2P=1", "--file-forwarding", APP, "@@", str(document), "@@"], stdout=log, stderr=subprocess.STDOUT)
        try:
            deadline = time.monotonic() + 70
            while time.monotonic() < deadline:
                context = GLib.MainContext.default()
                while context.pending():
                    context.iteration(False)
                state = snapshot()
                Path("flatpak-accessibility.txt").write_text(state, encoding="utf-8")
                if marker in state and "portal-note.md" in state and "Open a file" in state:
                    print("PASS: Installed Flatpak rendered the editor and read the portal-granted Markdown document.")
                    break
                if process.poll() is not None:
                    raise RuntimeError(f"Flatpak exited with status {process.returncode}; see runtime log.")
                time.sleep(1)
            else:
                raise RuntimeError("The editor and portal document were not accessible within 70 seconds.")
        finally:
            root = Gdk.get_default_root_window()
            if root:
                picture = Gdk.pixbuf_get_from_window(root, 0, 0, root.get_width(), root.get_height())
                if picture:
                    picture.savev("flatpak-desktop.png", "png", [], [])
            subprocess.run(["flatpak", "kill", APP], check=False)
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
print("Folder pickers, editing/saving, attachments, printing, upgrades and assistive-technology usability still require separate validation.")
