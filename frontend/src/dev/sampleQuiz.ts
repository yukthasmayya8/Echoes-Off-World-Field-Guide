import type { Quiz } from '../types';

/**
 * SAMPLE / DEMO DATA ONLY – for local preview and tests.
 * Real questions come from GET /api/v1/quizzes/:artifactSlug and must be
 * built from verified artifact records (verificationStatus: "verified").
 * Source IDs are placeholders; the URLs they point to are listed in the field guide.
 */
export const sampleQuiz: Quiz = {
  artifactSlug: 'sojourner',
  artifactName: 'Sojourner',
  questions: [
    {
      id: 'q1',
      question: 'In the Mars Pathfinder mission, which object is the rover?',
      options: ['Sojourner', 'The Mars Pathfinder lander', 'They are the same object', 'Neither of them'],
      sourceIds: ['src-nssdca-sojourner', 'src-nssdca-pathfinder-lander'],
      correctOptionIndex: 0,
      explanation:
        'Sojourner is the rover. The Mars Pathfinder lander is a separate, related record in the NSSDCA archive.',
    },
    {
      id: 'q2',
      question: 'When a mission stops communicating, what does Echoes say about the equipment?',
      options: [
        'It was destroyed',
        'Its physical disposition must be checked separately; the end of communication does not mean it vanished',
        'It returned to Earth',
        'Nothing can be known',
      ],
      sourceIds: ['src-nssdca-sojourner'],
      correctOptionIndex: 1,
      explanation:
        'End of communication, end of operations and physical disposition are three different things, so each one needs its own source.',
    },
    {
      id: 'q3',
      question: 'Which source does Echoes use as its primary reference for an artifact’s archival identity?',
      options: [
        'NASA’s National Space Science Data Center (NSSDCA)',
        'Social media posts',
        'Unsourced fan wikis',
        'The team’s own estimates',
      ],
      sourceIds: ['src-nssdca-catalog'],
      correctOptionIndex: 0,
      explanation: 'The NSSDCA Master Catalog is the archival reference for identity and mission record information.',
    },
  ],
};
