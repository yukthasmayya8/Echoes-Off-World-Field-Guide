import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { API_VERSION, STORY_CHAPTER_COUNT } from '@echoes/shared';
import { createTestApp } from './helpers';

const app = createTestApp();

describe('GET /api/v1/health', () => {
  it('reports API status, version, timestamp and dataset counts', async () => {
    const response = await request(app).get('/api/v1/health').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.apiVersion).toBe(API_VERSION);
    expect(Number.isNaN(Date.parse(response.body.data.timestamp))).toBe(false);
    expect(response.body.data.dataset).toMatchObject({
      artifacts: 5,
      verified: 4,
      needsReview: 1,
      routes: 2,
      quizzes: 4,
    });
    expect(response.body.meta.apiVersion).toBe(API_VERSION);
  });
});

describe('GET /api/v1/catalog/search', () => {
  it('finds an artifact by partial, case-insensitive name', async () => {
    const response = await request(app)
      .get('/api/v1/catalog/search')
      .query({ q: 'sojour' })
      .expect(200);

    expect(response.body.data.count).toBe(1);
    expect(response.body.data.results[0].slug).toBe('sojourner');
    expect(response.body.data.results[0].matchedOn).toContain('name');
  });

  it('finds an artifact by alias', async () => {
    const response = await request(app)
      .get('/api/v1/catalog/search')
      .query({ q: 'Rocky IV' })
      .expect(200);

    expect(response.body.data.results.map((entry: { slug: string }) => entry.slug)).toContain(
      'sojourner',
    );
    expect(response.body.data.results[0].matchedOn).toContain('alias');
  });

  it('finds an artifact by NSSDCA record ID, case-insensitively', async () => {
    const response = await request(app)
      .get('/api/v1/catalog/search')
      .query({ q: 'mesurpr' })
      .expect(200);

    expect(response.body.data.count).toBe(1);
    expect(response.body.data.results[0].nssdcaRecordId).toBe('MESURPR');
    expect(response.body.data.results[0].matchedOn).toContain('nssdcaRecordId');
  });

  it('finds artifacts by destination term', async () => {
    const response = await request(app)
      .get('/api/v1/catalog/search')
      .query({ q: 'moon' })
      .expect(200);

    expect(response.body.data.count).toBe(2);
    for (const entry of response.body.data.results) {
      expect(entry.body).toBe('moon');
      expect(entry.matchedOn).toContain('body');
    }
  });

  it('applies a Moon/Mars body filter to a query', async () => {
    const response = await request(app)
      .get('/api/v1/catalog/search')
      .query({ q: 'apollo', body: 'mars' })
      .expect(200);

    expect(response.body.data.count).toBe(0);

    const moonResponse = await request(app)
      .get('/api/v1/catalog/search')
      .query({ q: 'apollo', body: 'moon' })
      .expect(200);

    expect(moonResponse.body.data.count).toBe(1);
    expect(moonResponse.body.data.results[0].slug).toBe('apollo-11-eagle');
  });

  it('returns all verified artifacts for an empty query and excludes needs_review', async () => {
    const response = await request(app).get('/api/v1/catalog/search').expect(200);

    expect(response.body.data.count).toBe(4);
    expect(
      response.body.data.results.every(
        (entry: { verificationStatus: string }) => entry.verificationStatus === 'verified',
      ),
    ).toBe(true);
    expect(
      response.body.data.results.some(
        (entry: { slug: string }) => entry.slug === 'apollo-12-intrepid',
      ),
    ).toBe(false);
  });

  it('rejects an invalid body filter', async () => {
    const response = await request(app)
      .get('/api/v1/catalog/search')
      .query({ body: 'pluto' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an over-long query', async () => {
    const response = await request(app)
      .get('/api/v1/catalog/search')
      .query({ q: 'x'.repeat(121) })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/artifacts', () => {
  it('returns verified artifacts by default', async () => {
    const response = await request(app).get('/api/v1/artifacts').expect(200);

    expect(response.body.data.count).toBe(4);
    expect(response.body.data.filters.status).toBe('verified');
    expect(
      response.body.data.artifacts.some(
        (artifact: { slug: string }) => artifact.slug === 'apollo-12-intrepid',
      ),
    ).toBe(false);
  });

  it('supports status=needs_review and status=all', async () => {
    const needsReview = await request(app)
      .get('/api/v1/artifacts')
      .query({ status: 'needs_review' })
      .expect(200);

    expect(needsReview.body.data.count).toBe(1);
    expect(needsReview.body.data.artifacts[0].slug).toBe('apollo-12-intrepid');

    const all = await request(app)
      .get('/api/v1/artifacts')
      .query({ status: 'all' })
      .expect(200);

    expect(all.body.data.count).toBe(5);
  });

  it('combines body, type and query filters', async () => {
    const response = await request(app)
      .get('/api/v1/artifacts')
      .query({ body: 'mars', type: 'rover', q: 'sojourner' })
      .expect(200);

    expect(response.body.data.count).toBe(1);
    expect(response.body.data.artifacts[0].slug).toBe('sojourner');
  });

  it('filters Moon lunar modules without exposing needs_review records', async () => {
    const response = await request(app)
      .get('/api/v1/artifacts')
      .query({ body: 'moon', type: 'lunar-module' })
      .expect(200);

    expect(response.body.data.count).toBe(1);
    expect(response.body.data.artifacts[0].slug).toBe('apollo-11-eagle');
  });

  it('rejects an invalid artifact type', async () => {
    const response = await request(app)
      .get('/api/v1/artifacts')
      .query({ type: 'hovercraft' })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/artifacts/:slug', () => {
  it('returns the complete artifact contract', async () => {
    const response = await request(app)
      .get('/api/v1/artifacts/apollo-11-eagle')
      .expect(200);

    const artifact = response.body.data;
    expect(artifact.slug).toBe('apollo-11-eagle');
    expect(artifact.story.chapters).toHaveLength(STORY_CHAPTER_COUNT);
    expect(artifact.timeline.length).toBeGreaterThanOrEqual(4);
    expect(artifact.discoveries.length).toBeGreaterThanOrEqual(1);
    expect(artifact.sources.length).toBeGreaterThanOrEqual(1);
    expect(artifact.nssdca.recordId).toBe('1969-059C');
    expect(artifact.nssdca.recordUrl).toContain('nssdc.gsfc.nasa.gov');
    expect(artifact.location.confidence).toBe('exact');
    expect(artifact.location.coordinates.latitude).toBeCloseTo(0.67416);
    expect(artifact.image.credit.length).toBeGreaterThan(0);

    for (const chapter of artifact.story.chapters) {
      expect(chapter.originalWording.length).toBeGreaterThan(0);
      expect(chapter.simplifiedWording.length).toBeGreaterThan(0);
      expect(chapter.sourceIds.length).toBeGreaterThan(0);
    }
  });

  it('returns parent-child relationships', async () => {
    const response = await request(app).get('/api/v1/artifacts/sojourner').expect(200);

    expect(response.body.data.parentArtifactId).toBe('mars-pathfinder-lander');
    expect(response.body.data.relationshipDescription).toContain('deployment ramp');
  });

  it('returns 404 for a missing artifact', async () => {
    const response = await request(app)
      .get('/api/v1/artifacts/not-a-real-artifact')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.stack).toBeUndefined();
  });

  it('returns 404 instead of exposing a needs_review artifact', async () => {
    const response = await request(app)
      .get('/api/v1/artifacts/apollo-12-intrepid')
      .expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects a malformed slug', async () => {
    const response = await request(app)
      .get('/api/v1/artifacts/Apollo_11')
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/routes', () => {
  it('lists curated routes with ordered artifact references', async () => {
    const response = await request(app).get('/api/v1/routes').expect(200);

    expect(response.body.data.count).toBe(2);
    for (const route of response.body.data.routes) {
      expect(route.steps.length).toBeGreaterThan(0);
      route.steps.forEach((step: { order: number; artifactSlug: string }, index: number) => {
        expect(step.order).toBe(index + 1);
        expect(step.artifactSlug.length).toBeGreaterThan(0);
      });
    }
  });

  it('returns one route by slug', async () => {
    const response = await request(app)
      .get('/api/v1/routes/mars-lander-and-rover')
      .expect(200);

    expect(response.body.data.title).toBe('Mars: A Lander and Its Rover');
    expect(response.body.data.steps.map((step: { artifactSlug: string }) => step.artifactSlug)).toEqual(
      ['mars-pathfinder-lander', 'sojourner'],
    );
  });

  it('returns 404 for a missing route', async () => {
    const response = await request(app).get('/api/v1/routes/nope').expect(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

describe('GET /api/v1/quizzes/:artifactSlug', () => {
  it('returns a public quiz without the correct answer or explanation', async () => {
    const response = await request(app).get('/api/v1/quizzes/sojourner').expect(200);

    const quiz = response.body.data;
    expect(quiz.artifactSlug).toBe('sojourner');
    expect(quiz.questions.length).toBe(1);
    expect(quiz.questions[0].options.length).toBeGreaterThanOrEqual(2);
    expect(quiz.questions[0].correctOptionId).toBeUndefined();
    expect(quiz.questions[0].explanation).toBeUndefined();
    expect(quiz.questions[0].sourceIds).toContain('nssdca-mesurpr');
  });

  it('returns 404 for an artifact without a debrief', async () => {
    const response = await request(app).get('/api/v1/quizzes/surveyor-3').expect(200);
    expect(response.body.data.artifactSlug).toBe('surveyor-3');

    await request(app).get('/api/v1/quizzes/apollo-12-intrepid').expect(404);
    await request(app).get('/api/v1/quizzes/unknown-artifact').expect(404);
  });
});

describe('POST /api/v1/quizzes/:artifactSlug/answer', () => {
  it('evaluates a correct answer and returns explanation plus sources', async () => {
    const response = await request(app)
      .post('/api/v1/quizzes/sojourner/answer')
      .send({ optionId: 'ramp' })
      .expect(200);

    expect(response.body.data.correct).toBe(true);
    expect(response.body.data.evaluatedBy).toBe('server');
    expect(response.body.data.explanation).toContain('deployment ramp');
    expect(response.body.data.sources[0].id).toBe('nssdca-mesurpr');
    expect(response.body.data.sources[0].url).toContain('nssdc.gsfc.nasa.gov');
  });

  it('evaluates an incorrect answer without revealing it in advance', async () => {
    const response = await request(app)
      .post('/api/v1/quizzes/sojourner/answer')
      .send({ optionId: 'airdrop' })
      .expect(200);

    expect(response.body.data.correct).toBe(false);
    expect(response.body.data.correctOptionId).toBe('ramp');
  });

  it('accepts an explicit question ID', async () => {
    const response = await request(app)
      .post('/api/v1/quizzes/apollo-11-eagle/answer')
      .send({ optionId: 'unknown-crash', questionId: 'eagle-debrief-1' })
      .expect(200);

    expect(response.body.data.correct).toBe(true);
  });

  it('rejects an option that is not part of the question', async () => {
    const response = await request(app)
      .post('/api/v1/quizzes/sojourner/answer')
      .send({ optionId: 'made-up-option' })
      .expect(400);

    expect(response.body.error.code).toBe('INVALID_ANSWER');
  });

  it('rejects a missing body and malformed JSON', async () => {
    const missing = await request(app)
      .post('/api/v1/quizzes/sojourner/answer')
      .send({})
      .expect(400);
    expect(missing.body.error.code).toBe('VALIDATION_ERROR');

    const malformed = await request(app)
      .post('/api/v1/quizzes/sojourner/answer')
      .set('Content-Type', 'application/json')
      .send('{"optionId":')
      .expect(400);
    expect(malformed.body.error.code).toBe('INVALID_JSON');
  });

  it('returns 404 for an unknown question ID', async () => {
    const response = await request(app)
      .post('/api/v1/quizzes/sojourner/answer')
      .send({ optionId: 'ramp', questionId: 'missing-question' })
      .expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

describe('fallbacks', () => {
  it('returns a consistent 404 envelope for unknown routes', async () => {
    const response = await request(app).get('/api/v1/does-not-exist').expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    });
    expect(response.body.meta.apiVersion).toBe(API_VERSION);
  });
});
