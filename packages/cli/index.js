#!/usr/bin/env node

import { exec, execFile } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as url from 'url';
import { promisify } from 'util';
import download from 'download';
import which from 'which';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);


const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const arch = {
  x64: 'x86_64',
  arm64: 'aarch64',
}[process.arch];
const platform = {
  darwin: 'macos',
  freebsd: 'freebsd',
  linux: 'linux',
  win32: 'windows',
}[process.platform];

const windows = platform === 'windows';

export const installDirectory = path.join(__dirname, 'bin');
export const name = windows ? 'zig.exe' : 'zig';
export const binaryPath = path.join(installDirectory, name);
export const extension = windows ? 'zip' : 'tar.xz';

export async function install({ force = false } = {}) {
  if (!force) {
    try {
      // an empty ./bin/zig file is used as a placeholder for npm/pnpm/yarn to
      // create the bin symlink, so the file exists but will have a zero size in
      // the base case, check for it here
      const stats = await fs.lstat(binaryPath);
      if (stats.isSymbolicLink()) {
        console.log(`Replacing symlink with local installation: ${binaryPath}`);
      } else if (stats.size !== 0) {
        console.log(`${name} is already installed, did you mean to reinstall?`);
        return;
      }
    } catch {}
  }

  await uninstall();
  await fs.mkdir(installDirectory, { recursive: true });

  const data = await fs.readFile('package.json', 'utf8');
  const version = JSON.parse(data).zig_version;

  const url = `https://ziglang.org/builds/zig-${platform}-${arch}-${version}.${extension}`;

  await download(url, installDirectory, { strip: 1 });
}

export async function uninstall() {
  await fs.rm(installDirectory, { recursive: true });
}

export async function checkInstallation() {
  try {
    const stats = await fs.lstat(binaryPath);
    // if the binary is a symlink, it should link to the system-wide zig
    if (stats.isSymbolicLink()) {
      console.log('Skipping zig installation, symlink to system zig exists');
      process.exit(0);
    }
    // an empty ./bin/zig file is used as a placeholder for npm/pnpm/yarn to
    // create the bin symlink, so if the file already exists and has non-zero
    // size, and is not a symlink, then zig is already installed locally
    if (stats.size !== 0) {
      console.log('Skipping zig installation, binary exists');
      process.exit(0);
    }
  } catch {}
  try {
    // remove the node_modules/.bin symlinks from the PATH before checking if a
    // zig is installed system-wide, to avoid hitting the symlink
    const pathSep = windows ? ';' : ':';
    const pathDirs = process.env.PATH.split(pathSep);
    const path = pathDirs
      .filter(dir => !dir.endsWith(path.join('node_modules', '.bin')))
      .join(pathSep);
    // check if there's already an installed zig binary
    const systemZig = await which('zig', { path });

    const zigVersion = await execAsync('zig version');
    const systemZigVersion = zigVersion.stdout.trim();

    if (systemZig.length !== 0 && systemZigVersion.length !== 0) {
      console.log(
        `Skipping zig installation, ${systemZigVersion} already installed in system`,
      );
      console.log(`Creating symlink to: ${systemZig}`);
      await fs.unlink(binaryPath);
      await fs.link(systemZig, binaryPath);
      console.log(
        `Manually run the zig-install script to install it locally`,
      );
      process.exit(0);
    }
  } catch (error) {}
  console.log('Did not detect zig in system, will be installed locally');
}
