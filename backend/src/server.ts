import { DEFAULT_BACKEND_PORT } from '@echoes/shared';
import { createApp } from './app';
import { formatIssuesForTerminal, getDataset, type Dataset } from './data';

function main(): void {
  let dataset: Dataset;

  try {
    dataset = getDataset();
  } catch (error) {
    console.error('\n[echoes] Dataset validation failed. The API was not started.');
    console.error(formatIssuesForTerminal(error));
    console.error('');
    process.exitCode = 1;
    return;
  }

  const port = Number.parseInt(process.env.PORT ?? String(DEFAULT_BACKEND_PORT), 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(`[echoes] Invalid PORT value: ${process.env.PORT ?? ''}`);
    process.exitCode = 1;
    return;
  }

  const app = createApp({ dataset });
  const server = app.listen(port, () => {
    console.log(`[echoes] API listening on http://localhost:${port}/api/v1`);
    console.log(
      `[echoes] Dataset: ${dataset.counts.verified} verified, ` +
        `${dataset.counts.needsReview} needs_review, ${dataset.counts.routes} routes, ` +
        `${dataset.counts.quizzes} quizzes`,
    );
    console.log(`[echoes] Data directory: ${dataset.dataDir ?? 'unknown'}`);
  });

  const shutdown = (signal: string): void => {
    console.log(`[echoes] ${signal} received — closing server.`);
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
