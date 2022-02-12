#!/usr/bin/env node

import * as fs from 'fs/promises';
import * as path from 'path';
import * as url from 'url';
import { $ } from 'zx';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// ignore the first 2 entries in argv:
// argv[0] is the node executable, argv[1] is this script
const args = process.argv.slice(2);

// TODO: remove lines below, changed due to migrating from zx to this script as the top-level runner script
// ignore the first 3 entries in argv:
// argv[0] is the node executable, argv[1] is the zx entrypoint, argv[2] is this script
// const args = process.argv.slice(3);

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
  // await $`rm -rf ${installDirectory}`;
  await $`mkdir -p ${installDirectory}`;

  // TODO: currently hardcoded, find a way to fetch the latest version
  // const version = require('./package.json').version;
  const version = '0.10.0-dev.675+beb275b37';
  const url = `https://ziglang.org/builds/zig-${platform}-${arch}-${version}.tar.xz`;

  await $`curl -fsSL ${url} | tar xJ -C ${installDirectory} --strip-components=1`;
}

export async function run(...cliArgs) {
  try {
    await fs.access(binaryPath);
  } catch (err) {
    throw new Error(`You must install ${name} before you can run it`);
  }

  // if used as a function, pass any arguments to the zig CLI, otherwise use the
  // arguments passed to the script itself, removing the first `mode` argument
  const zigArgs = cliArgs.length > 0 ? cliArgs : args.slice(1);
  const result = await $`${binaryPath} ${zigArgs}`;
  process.exit(result.exitCode);
}

export async function uninstall() {
  await $`rm -rf ${installDirectory}`;
}

const fns = { install, run, uninstall };
const mode = args[0];
const fn = fns[mode];

if (!fn) {
  const supported = Object.keys(fns);
  console.error(`invalid script mode: ${args}\nSupported modes: ${supported}`);
  process.exit(1);
}

try {
  await fn();
} catch (error) {
  console.error(error);
  process.exit(1);
}
