import fs from 'node:fs';
import path from 'node:path';
import type { Express } from 'express';
import type { Artifact, GuidedRoute, QuizDefinition } from '@echoes/shared';
import { buildDataset, getDataset, type Dataset } from '../src/data';
import { createApp } from '../src/app';

export interface RawData {
  artifacts: Artifact[];
  routes: GuidedRoute[];
  quizzes: QuizDefinition[];
}

export function dataDirectory(): string {
  const candidates = [
    path.resolve(process.cwd(), '../data'),
    path.resolve(process.cwd(), 'data'),
  ];
  const found = candidates.find((candidate) =>
    fs.existsSync(path.join(candidate, 'artifacts.json')),
  );
  if (!found) throw new Error('Could not locate the repository data directory');
  return found;
}

export function readRawData(): RawData {
  const directory = dataDirectory();
  return {
    artifacts: JSON.parse(
      fs.readFileSync(path.join(directory, 'artifacts.json'), 'utf8'),
    ) as Artifact[],
    routes: JSON.parse(
      fs.readFileSync(path.join(directory, 'guided-routes.json'), 'utf8'),
    ) as GuidedRoute[],
    quizzes: JSON.parse(
      fs.readFileSync(path.join(directory, 'quizzes.json'), 'utf8'),
    ) as QuizDefinition[],
  };
}

export function makeDataset(input: RawData = readRawData(), dataDir = 'test'): Dataset {
  return buildDataset(input, { dataDir });
}

export const dataset: Dataset = getDataset();

export function createTestApp(customDataset: Dataset = dataset): Express {
  return createApp({ dataset: customDataset });
}

export function findArtifact(data: RawData, slug: string): Artifact {
  const artifact = data.artifacts.find((candidate) => candidate.slug === slug);
  if (!artifact) throw new Error(`Missing fixture artifact ${slug}`);
  return artifact;
}
