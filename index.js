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

const installDirectory = path.join(__dirname, 'bin');
const name = platform === 'windows' ? 'zig.exe' : 'zig';
const binaryPath = path.join(installDirectory, name);

export async function install() {
  try {
    await fs.access(binaryPath);
    console.log(
      `${name} is already installed, did you mean to reinstall?\nlocation: ${binaryPath}`,
    );
    process.exit(0);
  } catch {}

  await $`rm -rf ${installDirectory}`;
  await $`mkdir -p ${installDirectory}`;

  // TODO: currently hardcoded, find a way to fetch the latest version
  // const version = require('./package.json').version;
  const version = '0.10.0-dev.675+beb275b37';
  const url = `https://ziglang.org/builds/zig-${platform}-${arch}-${version}.tar.xz`;

  await $`curl -fsSL ${url} | tar xJ -C ${installDirectory} --strip-components=1`;
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
    console.error(error);
  }
}

export async function uninstall() {
  await $`rm -rf ${installDirectory}`;
}
