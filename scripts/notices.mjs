// Include upstream license texts in every desktop bundle. No application telemetry.
import { readFileSync, readdirSync, existsSync, realpathSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const records = new Map();
function licenseTexts(folder) {
  const names = readdirSync(folder).filter((name) => /^(licen[sc]e|copying|notice|copyright)(\b|[._-])/i.test(name));
  return names.sort().flatMap((name) => {
    try { return [`--- ${name} ---\n${readFileSync(join(folder, name), 'utf8')}`]; }
    catch { return []; }
  });
}
function resolveDependency(from, name) {
  let current = from;
  while (true) {
    const candidate = join(current, 'node_modules', name);
    if (existsSync(join(candidate, 'package.json'))) return realpathSync(candidate);
    const parent = dirname(current); if (parent === current) return undefined; current = parent;
  }
}
function npmNotice(folder) {
  const data = JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8'));
  const key = `npm ${data.name}@${data.version}`; if (records.has(key)) return;
  const texts = licenseTexts(folder);
  records.set(key, `${key}\nLicense: ${typeof data.license === 'string' ? data.license : JSON.stringify(data.license)}\nSource: https://www.npmjs.com/package/${data.name}/v/${data.version}\n${texts.join('\n\n')}`);
  for (const name of Object.keys({ ...data.dependencies, ...data.optionalDependencies })) {
    const dependency = resolveDependency(folder, name); if (dependency) npmNotice(dependency);
  }
}
const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
for (const name of Object.keys(manifest.dependencies)) {
  const folder = resolveDependency(root, name); if (!folder) throw new Error(`Install dependency ${name} first.`); npmNotice(folder);
}
const metadata = JSON.parse(execFileSync('cargo', ['metadata', '--locked', '--format-version', '1', '--manifest-path', 'src-tauri/Cargo.toml'], { maxBuffer: 32 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }));
for (const pkg of metadata.packages) {
  if (!pkg.source) continue;
  const key = `Rust ${pkg.name}@${pkg.version}`;
  const texts = licenseTexts(dirname(pkg.manifest_path));
  if (pkg.license_file && !texts.some((text) => text.startsWith(`--- ${pkg.license_file} ---`))) {
    const path = resolve(dirname(pkg.manifest_path), pkg.license_file);
    if (existsSync(path)) texts.push(readFileSync(path, 'utf8'));
  }
  records.set(key, `${key}\nLicense: ${pkg.license ?? 'See upstream license file'}\nSource: https://crates.io/crates/${pkg.name}/${pkg.version}\n${texts.join('\n\n')}`);
}
mkdirSync('src-tauri/resources', { recursive: true });
writeFileSync('src-tauri/resources/LICENSE.txt', readFileSync('LICENSE'));
writeFileSync('src-tauri/resources/THIRD_PARTY_NOTICES.txt', 'PLAINMARK THIRD-PARTY NOTICES\n\nUpstream dependencies retain their licenses. This inventory includes build-time and platform-specific crates as well as bundled frontend libraries. A dependency listed here is not necessarily linked into every platform binary. Exact source versions are recorded in Cargo.lock and pnpm-lock.yaml.\n\n' + [...records].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([, text]) => text).join('\n\n' + '='.repeat(78) + '\n\n'));
console.log(`Included license notices for ${records.size} dependencies.`);
