"""Package a checked-out tag, with an offline web bundle and SHA256 checksums."""
from pathlib import Path
import hashlib, json, subprocess, zipfile, shutil, os
root = Path(__file__).resolve().parents[1]
os.chdir(root)
version = json.loads((root / 'package.json').read_text())['version']
tag = 'v' + version
subprocess.run(['node', 'scripts/version.mjs', 'release', tag], check=True)
if subprocess.check_output(['git', 'status', '--porcelain', '--untracked-files=no'], text=True).strip():
    raise RuntimeError('Package only a clean committed checkout')
subprocess.run(['python3', 'scripts/export-pages.py'], check=True)
out = root / 'release-artifacts'
out.mkdir(exist_ok=True)
base = 'mermaid-gantt-studio-' + tag
source = out / (base + '-source.zip')
subprocess.run(['git', 'archive', '--format=zip', '--prefix=' + base + '/', '-o', str(source), 'HEAD'], check=True)
web = out / (base + '-web.zip')
with zipfile.ZipFile(web, 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in sorted((root / '_site').rglob('*')):
        if file.is_file(): archive.write(file, base + '/dist/' + str(file.relative_to(root / '_site')))
    for name in ['server.mjs', '启动编辑器.command']:
        archive.write(root / 'editor' / name, base + '/' + name)
    archive.writestr(base + '/package.json', json.dumps({'name':'mermaid-gantt-studio-web','version':version,'private':True,'type':'module','scripts':{'start':'node server.mjs --open'}}, indent=2)+'\n')
    archive.writestr(base + '/README.md', '# Mermaid Gantt Studio '+tag+'\n\n需要 Node.js 20+。解压后运行 `npm start`，或在 macOS 双击启动脚本。无需安装依赖。\n本安装包只包含通用示例。\n')
for file in [source, web]:
    with zipfile.ZipFile(file) as archive:
        if archive.testzip(): raise RuntimeError('Invalid archive')
checksums=''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in [source,web])
(out / 'SHA256SUMS.txt').write_text(checksums)
text=(root/'CHANGELOG.md').read_text().split('## ['+version+'] - ',1)[1].split('\n## ',1)[0]
(out/'release-notes.md').write_text('# '+tag+'\n\n'+text.split('\n',1)[1].strip()+'\n\n## Downloads\n- `*-web.zip`: offline editor, generic example, no dependency installation.\n- `*-source.zip`: complete source including CLI, examples and tests.\n- `SHA256SUMS.txt`: SHA-256 checksums.\n')
print(out)
