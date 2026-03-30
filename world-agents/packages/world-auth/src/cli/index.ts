#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';

// Load .env from current dir, then walk up parent dirs
dotenv.config(); // ./env
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '..', '..', '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '..', '..', '..', '.env') });

import { Command } from 'commander';
import { loginFlow } from './login';
import { initAgentFlow } from './init-agent';

const program = new Command();

program
  .name('openclaw-world-auth')
  .description('CLI to authenticate humans via World ID and initialize agent identities')
  .version('1.0.0');

program
  .command('login')
  .description('Authenticate this device/runtime with World ID')
  .action(async () => {
    try {
      await loginFlow();
    } catch (err) {
      console.error('Login Error:', (err as Error).message);
      process.exit(1);
    }
  });

program
  .command('init-agent')
  .description('Initialize a new OpenClaw agent and delegate identity')
  .action(async () => {
    try {
      await initAgentFlow();
    } catch (err) {
      console.error('Init Agent Error:', (err as Error).message);
      process.exit(1);
    }
  });

program.parse(process.argv);
