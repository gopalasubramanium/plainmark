import { readFileSync } from 'node:fs';
const packageVersion = JSON.parse(readFileSync('package.json', 'utf8')).version;
const tauriVersion = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8')).version;
const cargoVersion = readFileSync('src-tauri/Cargo.toml', 'utf8').match(/^version = "([^"]+)"/m)?.[1];
if ([tauriVersion, cargoVersion].some((version) => version !== packageVersion)) throw new Error('Package versions do not match.');
if (process.env.GITHUB_REF_NAME && process.env.GITHUB_REF_NAME !== `v${packageVersion}`) throw new Error('Release tag does not match package version.');
console.log(`Verified Plainmark ${packageVersion}`);
