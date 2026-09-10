"""Compose stable, preview and immutable version paths from release web bundles."""
from pathlib import Path, PurePosixPath
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TAG = re.compile(r"v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?")

def unpack_release(archive, checksums, target):
    """Verify before extracting only public dist assets; never execute release code."""
    expected = {}
    for line in checksums.read_text().splitlines():
        digest, name = line.split(maxsplit=1)
        expected[name.lstrip("*")] = digest
    if expected.get(archive.name) != hashlib.sha256(archive.read_bytes()).hexdigest():
        raise ValueError("Release bundle checksum mismatch: " + archive.name)
    with zipfile.ZipFile(archive) as bundle:
        found = False
        for item in bundle.infolist():
            path = PurePosixPath(item.filename)
            if path.is_absolute() or ".." in path.parts or (item.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError("Unsafe release archive entry")
            if len(path.parts) < 3 or path.parts[1] != "dist" or item.is_dir():
                continue
            relative = Path(*path.parts[2:])
            if relative.parts[0] in {"preview", "versions", "channels.json"}:
                raise ValueError("Reserved channel path in release bundle")
            dest = target / relative
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(bundle.read(item))
            found = True
    if not found or not (target / "index.html").is_file():
        raise ValueError("Release has no public editor entrypoint")

def compose(preview, releases, latest, bundles, target, sha):
    if latest not in {r["tag_name"] for r in releases if not r["prerelease"]}:
        raise ValueError("Latest must be a published stable release")
    for release in releases:
        if not TAG.fullmatch(release["tag_name"]):
            raise ValueError("Unsupported release tag")
    if target.exists():
        shutil.rmtree(target)
    target.mkdir(parents=True)
    for release in releases:
        tag = release["tag_name"]
        archive, sums = bundles[tag]
        unpack_release(archive, sums, target / "versions" / tag)
    stable = target / "versions" / latest
    for path in stable.iterdir():
        dest = target / path.name
        if path.is_dir():
            shutil.copytree(path, dest)
        else:
            shutil.copy2(path, dest)
    shutil.copytree(preview, target / "preview")
    page = target / "preview" / "index.html"
    text = page.read_text()
    text = re.sub(r'(data-app-version>)[^<]+', lambda m: m[1] + 'preview · ' + sha[:7], text)
    page.write_text(text)
    (target / ".nojekyll").touch()
    (target / "channels.json").write_text(json.dumps({
        "stable": {"version": latest, "path": "./"},
        "preview": {"commit": sha, "path": "preview/"},
        "versions": [{"version": r["tag_name"], "prerelease": r["prerelease"],
                      "path": "versions/" + r["tag_name"] + "/"} for r in releases]
    }, indent=2) + "\n")

def main():
    repo = os.environ.get("GITHUB_REPOSITORY", "sanchuanhehe/mermaid-gantt-studio")
    def api(endpoint, *flags):
        return json.loads(subprocess.check_output(["gh", "api", endpoint, *flags], text=True))
    pages = api("repos/" + repo + "/releases?per_page=100", "--paginate", "--slurp")
    releases = [r for page in pages for r in page if not r["draft"]]
    latest = api("repos/" + repo + "/releases/latest")["tag_name"]
    sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    with tempfile.TemporaryDirectory() as temp:
        temp = Path(temp)
        subprocess.run(["python3", "scripts/export-pages.py"], cwd=ROOT, check=True)
        preview = temp / "preview"
        shutil.move(ROOT / "_site", preview)
        bundles = {}
        for release in releases:
            tag = release["tag_name"]
            if not TAG.fullmatch(tag):
                raise ValueError("Unsupported release tag: " + tag)
            folder = temp / tag
            name = "mermaid-gantt-studio-" + tag + "-web.zip"
            subprocess.run(["gh", "release", "download", tag, "--repo", repo,
                            "--pattern", name, "--pattern", "SHA256SUMS.txt",
                            "--dir", str(folder)], check=True)
            bundles[tag] = (folder / name, folder / "SHA256SUMS.txt")
        compose(preview, releases, latest, bundles, ROOT / "_site", sha)
    print("Stable: " + latest + " at /; preview: " + sha[:7] + "; version snapshots: " + str(len(releases)))

if __name__ == "__main__":
    main()
