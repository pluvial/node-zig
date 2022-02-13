#!/usr/bin/env node

import * as fs from 'fs/promises';
import { $ } from 'zx';
import { binaryPath, install, uninstall, version } from './index.js';

try {
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
    const pathDirs = process.env.PATH.split(':');
    process.env.PATH = pathDirs
      .filter(dir => !dir.endsWith('node_modules/.bin'))
      .join(':');
    // check if there's already an installed zig binary
    const which = await $`which zig`;
    const zigVersion = await $`zig version`;
    const systemZig = which.stdout.trim();
    const systemZigVersion = zigVersion.stdout.trim();
    if (systemZig.length !== 0 && systemZigVersion.length !== 0) {
      console.log(
        `Skipping zig installation, ${systemZigVersion} already installed in system`,
      );
      console.log(`Creating symlink to: ${systemZig}`);
      await $`ln -sf ${systemZig} ${binaryPath}`;
      console.log(
        `Manually run the zig-install script to install ${version} locally`,
      );
      process.exit(0);
    }
  } catch (error) {}
  console.log('Did not detect zig in system, will be installed locally');
  // use force to remove the empty placeholder and skip re-checking the file
  await install({ force: true });
} catch (error) {
  console.error(error);
  process.exit(1);
}
