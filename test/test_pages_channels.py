import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location("channels", Path(__file__).resolve().parents[1] / "scripts/build-pages-channels.py")
channels = importlib.util.module_from_spec(spec)
spec.loader.exec_module(channels)

class ChannelsTest(unittest.TestCase):
    def test_stable_and_snapshots_survive_preview_changes(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            preview = root / "preview"
            preview.mkdir()
            (preview / "index.html").write_text('<span data-app-version>v0.2.0</span> new feature')
            bundles = {}
            releases = [{"tag_name": "v0.1.0", "prerelease": False}, {"tag_name": "v0.2.0-rc.1", "prerelease": True}]
            for release in releases:
                tag = release["tag_name"]
                archive = root / (tag + ".zip")
                with zipfile.ZipFile(archive, "w") as bundle:
                    bundle.writestr(tag + "/dist/index.html", tag)
                    bundle.writestr(tag + "/dist/vendor/lib.js", "vendor")
                    bundle.writestr(tag + "/server.mjs", "private server")
                sums = root / (tag + ".txt")
                sums.write_text(hashlib.sha256(archive.read_bytes()).hexdigest() + "  " + archive.name)
                bundles[tag] = archive, sums
            target = root / "site"
            channels.compose(preview, releases, "v0.1.0", bundles, target, "abcdef123")
            self.assertEqual((target / "index.html").read_text(), "v0.1.0")
            self.assertEqual((target / "versions/v0.1.0/index.html").read_bytes(), (target / "index.html").read_bytes())
            self.assertEqual((target / "versions/v0.2.0-rc.1/index.html").read_text(), "v0.2.0-rc.1")
            self.assertIn("preview · abcdef1", (target / "preview/index.html").read_text())
            self.assertFalse((target / "server.mjs").exists())
            (preview / "index.html").write_text("next preview")
            channels.compose(preview, releases, "v0.1.0", bundles, target, "new")
            self.assertEqual((target / "index.html").read_text(), "v0.1.0")
            self.assertEqual(json.loads((target / "channels.json").read_text())["preview"]["commit"], "new")
            with self.assertRaises(ValueError):
                channels.compose(preview, releases, "v0.2.0-rc.1", bundles, target, "new")
            archive, sums = bundles["v0.1.0"]
            archive.write_bytes(b"corrupt")
            with self.assertRaises(ValueError):
                channels.unpack_release(archive, sums, root / "bad")

if __name__ == "__main__":
    unittest.main()
