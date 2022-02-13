#!/usr/bin/env node

import * as fs from 'fs/promises';
import { $ } from 'zx';
import { binaryPath, install, uninstall, version } from './index.js';

try {
  try {
    // an empty ./bin/zig file is used as a placeholder for npm/pnpm/yarn to
    // create the bin symlink, so if the file already exists and has non-zero
    // size, then zig is already installed
    const stats = await fs.stat(binaryPath);
    if (stats.size !== 0) {
      console.log('Skipping zig installation, binary exists');
      process.exit(0);
    }
  } catch {}
  // remove the empty placeholder file
  await uninstall();
  try {
    // check if there's already an installed zig binary
    const { stdout: installedVersion } = await $`zig version`;
    if (stdout.length !== 0) {
      console.log(
        `Skipping zig installation, ${installedVersion} already installed in system`,
      );
      console.log(
        `Manually run the zig-install script to install ${version} locally`,
      );
      process.exit(0);
    }
  } catch (error) {}
  console.log('Did not detect zig in system, will be installed locally');
  // force is not strictly necessary, but it's used to skip re-checking the file
  await install({ force: true });
} catch (error) {
  console.error(error);
  process.exit(1);
}
