/**
 * Cross-platform dev runner. Starts the API and Vite in one terminal without
 * adding a process-management dependency.
 */
import { spawn } from 'node:child_process';

const workspace = process.platform === 'win32' ? { shell: true } : {};

const targets = [
  ['backend', ['run', 'dev', '--workspace=@echoes/backend']],
  ['frontend', ['run', 'dev', '--workspace=@echoes/frontend']],
];

const children = targets.map(([name, args]) => {
  const child = spawn('npm', args, { stdio: 'inherit', ...workspace });
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[echoes] ${name} exited with code ${code}`);
    }
  });
  return child;
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[echoes] ${signal} received — stopping dev servers.`);
  for (const child of children) {
    child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(0), 300).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
