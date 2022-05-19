#!/usr/bin/env node

import { install, checkInstallation } from './index.js';

try {
  await checkInstallation();
  // use force to remove the empty placeholder and skip re-checking the file
  await install({ force: true });
} catch (error) {
  console.error(error);
  process.exit(1);
}
