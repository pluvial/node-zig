#!/usr/bin/env node

import { install, uninstall } from './index.js';

try {
  await uninstall();
  await install();
} catch (error) {
  console.error(error);
  process.exit(1);
}
