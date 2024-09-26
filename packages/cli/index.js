#!/usr/bin/env node

import * as fs from 'fs/promises';
import * as path from 'path';
import * as url from 'url';
import { $, ProcessOutput } from 'zx';

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

const index = await fetch('https://ziglang.org/download/index.json').then(response =>
  response.json(),
);
const { master } = index;
const { tarball } = master[`${arch}-${platform}`];
// TODO: use fixed stable version if requested by user
// export const version = '0.13.0';
export const version = index.master.version;

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
  await $`mkdir -p ${installDirectory}`;

  await $`curl -fsSL ${tarball} | tar xJ -C ${installDirectory} --strip-components=1`;
}

export async function run(...args) {
  try {
    await fs.access(binaryPath);
  } catch (err) {
    throw new Error(`You must install ${name} before you can run it`);
  }

  try {
    await $`${binaryPath} ${args}`;
  } catch (error) {
    if (error instanceof ProcessOutput && error.exitCode) {
      // console.error({ stderr: error.stderr, stdout: error.stdout });
      process.exit(error.exitCode);
    }
    throw error;
  }
}

export async function uninstall() {
  await $`rm -rf ${installDirectory}`;
}
