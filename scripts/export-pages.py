"""Build only the public browser assets; never publish private example plans."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
source = root / "editor/dist"
target = root / "_site"
if target.exists():
    shutil.rmtree(target)
target.mkdir()
files = ["index.html", "style.css", "app.mjs", "browser-render.mjs", "renderer.html", "renderer.mjs", "source-edit.mjs", "preview-zoom.mjs", "workspace-ui.mjs", "vendor/mermaid.js", "vendor/MERMAID-LICENSE"]
for name in files:
    dest = target / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source / name, dest)
shutil.copyfile(root / "editor/examples/public.mmd", target / "example.mmd")
for name in ["app.mjs", "index.html"]:
    path = target / name
    text = path.read_text().replace("推动 WS53 裸片上架云汉芯城，时间待定", "确认负责人及跨团队依赖").replace("求助", "备注").replace("本地工作台", "浏览器工作台").replace("本地运行", "浏览器运行").replace('class="brand-local">本地', 'class="brand-local">在线')
    path.write_text(text)
for path in target.rglob("*"):
    if path.is_file() and "vendor" not in path.parts:
        text = path.read_text()
        for token in ["WS53", "GTD", "云汉", "LoaderBoot", "ROM 符号"]:
            if token in text:
                raise RuntimeError(f"Private example marker in {path.name}: {token}")
(target / ".nojekyll").touch()
print("Public browser assets exported to _site")
