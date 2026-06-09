#!/usr/bin/env node
import 'dotenv/config';
import { runCli } from './iwish/cli';

runCli().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
