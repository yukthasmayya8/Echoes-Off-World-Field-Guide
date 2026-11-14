import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import type { QuizDefinition } from '@echoes/shared';
import {
  DatasetLoadError,
  DatasetValidationError,
  loadDataset,
} from '../src/data';
import {
  createTestApp,
  dataset,
  findArtifact,
  makeDataset,
  readRawData,
  type RawData,
} from './helpers';

const tempDirs: string[] = [];

function makeTempDir(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'echoes-data-'));
  tempDirs.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function expectValidationError(data: RawData): DatasetValidationError {
  try {
    makeDataset(data);
  } catch (error) {
    expect(error).toBeInstanceOf(DatasetValidationError);
    return error as DatasetValidationError;
  }
  throw new Error('Expected the dataset to fail validation');
}

function issueText(error: DatasetValidationError): string {
  return error.issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n');
}

describe('dataset loading', () => {
  it('loads the repository JSON store and keeps counts stable', () => {
    expect(dataset.counts).toEqual({
      artifacts: 5,
      verified: 4,
      needsReview: 1,
      routes: 2,
      quizzes: 4,
    });
  });

  it('never promotes a needs_review record', () => {
    expect(dataset.artifactsBySlug.get('apollo-12-intrepid')?.verificationStatus).toBe(
      'needs_review',
    );
  });

  it('fails with a readable error for malformed JSON', () => {
    const directory = makeTempDir();
    const data = readRawData();

    fs.writeFileSync(path.join(directory, 'artifacts.json'), '{"broken": [');
    fs.writeFileSync(path.join(directory, 'guided-routes.json'), JSON.stringify(data.routes));
    fs.writeFileSync(path.join(directory, 'quizzes.json'), JSON.stringify(data.quizzes));

    try {
      loadDataset(directory);
      throw new Error('Expected malformed JSON to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(DatasetLoadError);
      expect((error as Error).message).toContain('Malformed JSON');
      expect((error as DatasetLoadError).issues.length).toBeGreaterThan(0);
    }
  });

  it('fails when a required data file is missing', () => {
    const directory = makeTempDir();
    expect(() => loadDataset(directory)).toThrowError(DatasetLoadError);
  });
});

describe('cross-record integrity', () => {
  it('rejects a claim that references a missing source', () => {
    const data = readRawData();
    const sojourner = findArtifact(data, 'sojourner');
    sojourner.sources = sojourner.sources.filter((source) => source.id !== 'nssdca-mesurpr');

    const error = expectValidationError(data);
    expect(issueText(error)).toContain('Unknown source "nssdca-mesurpr"');
  });

  it('rejects broken parent-child relationships', () => {
    const data = readRawData();
    findArtifact(data, 'sojourner').parentArtifactId = null;

    const error = expectValidationError(data);
    expect(issueText(error)).toContain('does not point back');
  });

  it('rejects a one-sided child relationship', () => {
    const data = readRawData();
    findArtifact(data, 'mars-pathfinder-lander').childArtifactIds = [];

    const error = expectValidationError(data);
    expect(issueText(error)).toContain('does not list');
  });

  it('rejects duplicate slugs', () => {
    const data = readRawData();
    const clone = JSON.parse(JSON.stringify(findArtifact(data, 'apollo-11-eagle'))) as RawData['artifacts'][number];
    clone.id = 'apollo-11-eagle-copy';
    data.artifacts.push(clone);

    const error = expectValidationError(data);
    expect(issueText(error)).toContain('Duplicate value "apollo-11-eagle"');
  });

  it('rejects duplicate artifact IDs', () => {
    const data = readRawData();
    const clone = JSON.parse(JSON.stringify(findArtifact(data, 'apollo-11-eagle'))) as RawData['artifacts'][number];
    clone.slug = 'apollo-11-eagle-copy';
    data.artifacts.push(clone);

    const error = expectValidationError(data);
    expect(issueText(error)).toContain('Duplicate value "apollo-11-lunar-module-eagle"');
  });

  it('rejects a non-NSSDCA archive URL', () => {
    const data = readRawData();
    findArtifact(data, 'apollo-11-eagle').nssdca.recordUrl = 'https://example.com/record';

    const error = expectValidationError(data);
    expect(issueText(error)).toContain('NSSDCA');
  });

  it('rejects an NSSDCA URL whose ID disagrees with recordId', () => {
    const data = readRawData();
    findArtifact(data, 'apollo-11-eagle').nssdca.recordUrl =
      'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C';

    const error = expectValidationError(data);
    expect(issueText(error)).toContain('does not match recordId');
  });

  it('rejects a missing image credit', () => {
    const data = readRawData();
    const image = findArtifact(data, 'apollo-11-eagle').image;
    if (!image) throw new Error('Fixture image missing');
    image.credit = '';

    const error = expectValidationError(data);
    expect(issueText(error)).toContain('Must not be empty');
  });

  it('rejects a story without exactly five chapters', () => {
    const data = readRawData();
    findArtifact(data, 'apollo-11-eagle').story.chapters.pop();

    const error = expectValidationError(data);
    expect(issueText(error)).toContain('exactly 5 chapters');
  });

  it('rejects out-of-order timeline events', () => {
    const data = readRawData();
    const timeline = findArtifact(data, 'apollo-11-eagle').timeline;
    timeline[0].date = '1970-01-01';

    const error = expectValidationError(data);
    expect(issueText(error)).toContain('not chronological');
  });

  it('rejects a quiz that targets a needs_review artifact', () => {
    const data = readRawData();
    const quiz: QuizDefinition = {
      artifactSlug: 'apollo-12-intrepid',
      title: 'Unverified debrief',
      questions: [
        {
          id: 'intrepid-question',
          prompt: 'A question that should not be public yet?',
          options: [
            { id: 'a', text: 'Option A' },
            { id: 'b', text: 'Option B' },
          ],
          correctOptionId: 'a',
          explanation: 'Fixture explanation.',
          sourceIds: ['nssdca-1969-099c'],
        },
      ],
    };
    data.quizzes.push(quiz);

    const error = expectValidationError(data);
    expect(issueText(error)).toContain('needs_review artifact');
  });

  it('rejects a quiz answer key that is not an option', () => {
    const data = readRawData();
    data.quizzes[0].questions[0].correctOptionId = 'not-an-option';

    const error = expectValidationError(data);
    expect(issueText(error)).toContain('is not one of the question options');
  });

  it('rejects a quiz source that the artifact does not own', () => {
    const data = readRawData();
    data.quizzes[0].questions[0].sourceIds = ['nssdca-1967-035a'];

    const error = expectValidationError(data);
    expect(issueText(error)).toContain('Unknown source "nssdca-1967-035a"');
  });

  it('rejects a route that references a needs_review artifact', () => {
    const data = readRawData();
    data.routes[0].steps.push({
      id: 'moon-left-behind-step-3',
      order: 3,
      artifactSlug: 'apollo-12-intrepid',
      title: 'Unverified stop',
      narrative: 'This stop must not be public.',
      focus: 'Nothing yet.',
    });

    const error = expectValidationError(data);
    expect(issueText(error)).toContain('references needs_review artifact');
  });

  it('rejects route steps that are not numbered sequentially', () => {
    const data = readRawData();
    data.routes[0].steps[1].order = 5;

    const error = expectValidationError(data);
    expect(issueText(error)).toContain('Expected order 2');
  });
});

describe('empty verified dataset', () => {
  it('serves an empty public catalog safely and reports degraded health', async () => {
    const data = readRawData();

    for (const artifact of data.artifacts) {
      artifact.verificationStatus = 'needs_review';
      artifact.editorialNote = 'Fixture: public release review is still pending.';
    }
    data.routes = [];
    data.quizzes = [];

    const emptyDataset = makeDataset(data);
    expect(emptyDataset.counts.verified).toBe(0);

    const app = createTestApp(emptyDataset);

    const health = await request(app).get('/api/v1/health').expect(200);
    expect(health.body.data.status).toBe('degraded');
    expect(health.body.data.dataset.verified).toBe(0);

    const catalog = await request(app).get('/api/v1/catalog/search').expect(200);
    expect(catalog.body.data.count).toBe(0);
    expect(catalog.body.data.results).toEqual([]);

    const artifacts = await request(app).get('/api/v1/artifacts').expect(200);
    expect(artifacts.body.data.count).toBe(0);

    const routes = await request(app).get('/api/v1/routes').expect(200);
    expect(routes.body.data.count).toBe(0);

    await request(app).get('/api/v1/quizzes/sojourner').expect(404);
    await request(app).get('/api/v1/artifacts/sojourner').expect(404);
  });
});
