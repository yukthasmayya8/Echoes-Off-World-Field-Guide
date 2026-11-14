/**
 * Live end-to-end API walkthrough.
 *
 * Exercises the real HTTP surface (no mocks) in the order the UI uses it:
 * health -> catalog search -> artifact detail -> story/timeline/discoveries ->
 * guided route -> quiz -> answer -> source.
 *
 * Usage: node scripts/smoke.mjs [baseUrl]
 */
const baseUrl = (process.argv[2] ?? 'http://localhost:4000/api/v1').replace(/\/+$/, '');

let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    ...options,
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  return { status: response.status, body };
}

function section(title) {
  console.log(`\n== ${title} ==`);
}

async function main() {
  console.log(`Echoes live API walkthrough against ${baseUrl}`);

  section('1. Health');
  const health = await api('/health');
  check('health returns 200', health.status === 200, `status ${health.status}`);
  check('health success envelope', health.body?.success === true);
  check('health reports ok', health.body?.data?.status === 'ok');
  check(
    'dataset counts are 5/4/1/2/4',
    JSON.stringify(health.body?.data?.dataset) ===
      JSON.stringify({ artifacts: 5, verified: 4, needsReview: 1, routes: 2, quizzes: 4 }),
    JSON.stringify(health.body?.data?.dataset),
  );

  section('2. Catalog search');
  const search = await api('/catalog/search?q=sojour');
  check('search returns 200', search.status === 200);
  check('search finds Sojourner by partial name', search.body?.data?.results?.[0]?.slug === 'sojourner');

  const aliasSearch = await api('/catalog/search?q=Rocky%20IV');
  check(
    'search finds Sojourner by alias',
    aliasSearch.body?.data?.results?.some((entry) => entry.slug === 'sojourner'),
  );

  const moonSearch = await api('/catalog/search?q=moon');
  check('Moon search returns 2 verified records', moonSearch.body?.data?.count === 2);

  const hidden = await api('/catalog/search?q=intrepid');
  check('needs_review record is not searchable', hidden.body?.data?.count === 0);

  const badFilter = await api('/catalog/search?body=pluto');
  check('invalid body filter returns 400', badFilter.status === 400, `status ${badFilter.status}`);

  section('3. Artifact detail — Moon');
  const eagle = await api('/artifacts/apollo-11-eagle');
  const eagleData = eagle.body?.data;
  check('Eagle detail returns 200', eagle.status === 200);
  check('Eagle has 5 story chapters', eagleData?.story?.chapters?.length === 5);
  check('Eagle timeline has 5 events', eagleData?.timeline?.length === 5);
  check('Eagle has discoveries', (eagleData?.discoveries?.length ?? 0) >= 2);
  check('Eagle carries NSSDCA ID 1969-059C', eagleData?.nssdca?.recordId === '1969-059C');
  check(
    'Eagle NSSDCA URL matches its ID',
    eagleData?.nssdca?.recordUrl?.includes('id=1969-059C'),
  );
  check('Eagle keeps original archive wording', Boolean(eagleData?.story?.chapters?.[0]?.originalWording));
  check('Eagle keeps simplified wording', Boolean(eagleData?.story?.chapters?.[0]?.simplifiedWording));
  check('Eagle has exact coordinates', eagleData?.location?.confidence === 'exact');
  check('Eagle image has a credit', Boolean(eagleData?.image?.credit));
  check('Eagle is verified', eagleData?.verificationStatus === 'verified');

  const intrepid = await api('/artifacts/apollo-12-intrepid');
  check('needs_review detail returns 404', intrepid.status === 404, `status ${intrepid.status}`);
  check('404 uses the error envelope', intrepid.body?.success === false && intrepid.body?.error?.code === 'NOT_FOUND');

  section('4. Artifact detail — Mars (parent/child)');
  const sojourner = await api('/artifacts/sojourner');
  const sojournerData = sojourner.body?.data;
  check('Sojourner detail returns 200', sojourner.status === 200);
  check('Sojourner points at the Pathfinder lander parent', sojournerData?.parentArtifactId === 'mars-pathfinder-lander');
  check('Sojourner explains the relationship', Boolean(sojournerData?.relationshipDescription));
  check('Sojourner has 5 chapters', sojournerData?.story?.chapters?.length === 5);

  const lander = await api('/artifacts/mars-pathfinder-lander');
  check(
    'Lander lists Sojourner as a child',
    lander.body?.data?.childArtifactIds?.includes('mars-pathfinder-rover'),
  );
  check('Lander location is approximate', lander.body?.data?.location?.confidence === 'approximate');

  section('5. Guided routes');
  const routes = await api('/routes');
  check('routes returns 2 curated routes', routes.body?.data?.count === 2);
  const routeSlugs = routes.body?.data?.routes?.map((route) => route.slug) ?? [];
  check('route list includes the Mars pair', routeSlugs.includes('mars-lander-and-rover'));

  const marsRoute = await api('/routes/mars-lander-and-rover');
  const steps = marsRoute.body?.data?.steps ?? [];
  check(
    'Mars route orders lander then rover',
    JSON.stringify(steps.map((step) => step.artifactSlug)) ===
      JSON.stringify(['mars-pathfinder-lander', 'sojourner']),
  );
  check('route steps are 1-based sequential', steps.every((step, index) => step.order === index + 1));

  section('6. Quiz retrieval (no answer keys)');
  const quiz = await api('/quizzes/sojourner');
  const question = quiz.body?.data?.questions?.[0];
  check('quiz returns 200', quiz.status === 200);
  check('quiz has at least one question', (quiz.body?.data?.questions?.length ?? 0) >= 1);
  check('public quiz hides correctOptionId', question?.correctOptionId === undefined);
  check('public quiz hides explanation', question?.explanation === undefined);
  check('public quiz keeps claim sources', (question?.sourceIds?.length ?? 0) > 0);

  section('7. Quiz answer evaluation');
  const correct = await api('/quizzes/sojourner/answer', {
    method: 'POST',
    body: JSON.stringify({ optionId: 'ramp' }),
  });
  check('correct answer returns 200', correct.status === 200);
  check('correct answer is marked correct', correct.body?.data?.correct === true);
  check('answer is evaluated by the server', correct.body?.data?.evaluatedBy === 'server');
  check('answer returns an explanation', Boolean(correct.body?.data?.explanation));
  check('answer hydrates claim sources', (correct.body?.data?.sources?.length ?? 0) > 0);
  check(
    'hydrated source is an NSSDCA record',
    correct.body?.data?.sources?.[0]?.url?.includes('nssdc.gsfc.nasa.gov'),
  );

  const wrong = await api('/quizzes/sojourner/answer', {
    method: 'POST',
    body: JSON.stringify({ optionId: 'airdrop' }),
  });
  check('incorrect answer is marked incorrect', wrong.body?.data?.correct === false);
  check('incorrect answer reveals the key only after submitting', wrong.body?.data?.correctOptionId === 'ramp');

  const invalid = await api('/quizzes/sojourner/answer', {
    method: 'POST',
    body: JSON.stringify({ optionId: 'not-an-option' }),
  });
  check('unknown option returns 400', invalid.status === 400, `status ${invalid.status}`);
  check('unknown option uses INVALID_ANSWER', invalid.body?.error?.code === 'INVALID_ANSWER');

  const malformed = await api('/quizzes/sojourner/answer', {
    method: 'POST',
    body: '{"optionId":',
  });
  check('malformed JSON returns 400', malformed.status === 400, `status ${malformed.status}`);
  check('malformed JSON uses INVALID_JSON', malformed.body?.error?.code === 'INVALID_JSON');

  section('8. Evidence / source trail');
  const source = eagleData?.sources?.[0];
  check('artifact exposes a claim-level source', Boolean(source?.supportedClaims?.length));
  check('source keeps original wording', Boolean(source?.originalWording));
  check('source keeps a check date', /^\d{4}-\d{2}-\d{2}$/.test(source?.accessedOn ?? ''));
  check('source URL is the NSSDCA record', source?.url === eagleData?.nssdca?.recordUrl);

  console.log(`\n${failed === 0 ? 'RESULT: PASS' : 'RESULT: FAIL'} — ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('\nWalkthrough aborted:', error.message);
  console.error('Is the API running? Try: npm run dev:backend');
  process.exitCode = 1;
});
