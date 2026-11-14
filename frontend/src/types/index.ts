export interface Source {
  id: string;
  organization: string;
  title: string;
  url: string;
  supports?: string;
  sourceType?: string;
  excerpt?: string;
  simplifiedExplanation?: string;
  dateAccessed?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string | null;
  dateEnd?: string | null;
  datePrecision?: string;
  description: string;
  category: string;
  chapterId?: string;
  sourceIds?: string[];
}

export interface Discovery {
  id: string;
  title: string;
  instrument: string;
  measurement: string;
  observation: string;
  scientificResult: string;
  simpleExplanation: string;
  technicalExplanation: string;
  sourceIds: string[];
}

export interface Artifact {
  id: string;
  name: string;
  body: string;
  mission?: { name?: string };
  missionName: string;
  artifactType: string;
  summary: string;
  image?: { url: string; alt: string; credit?: string };
  status: 'active' | 'inactive' | 'ended' | 'unknown';
  legacyStatus?: {
    operational?: string;
    communication?: string;
    physicalDisposition?: string;
  };
  location: {
    label: string;
    confidence: 'exact' | 'approximate' | 'unknown';
    description?: string;
    note: string;
    uncertaintyExplanation?: string;
    coordinates?: { lat?: number; lon?: number };
    sourceIds?: string[];
  };
  chapters: Chapter[];
  timeline: TimelineEvent[];
  discoveries?: Discovery[];
  sources: Source[];
}

export interface Chapter {
  id: string;
  key: 'why-sent' | 'carried' | 'found' | 'ended' | 'remains';
  title: string;
  text: string;
  body?: string[];
  deeper?: string;
  sourceIds: string[];
  dramatized?: boolean;
}

export interface AnswerResult {
  correct: boolean;
  correctOptionIndex: number;
  explanation: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  sourceIds: string[];
  correctOptionIndex?: number;
  explanation?: string;
}

export interface Quiz {
  artifactSlug: string;
  artifactName?: string;
  questions: QuizQuestion[];
}

export interface MissionDebriefFeatureProps {
  quiz: Quiz | null;
  onOpenSource: (sourceId: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
  evaluateAnswer?: (
    artifactSlug: string,
    questionId: string,
    optionIndex: number,
  ) => Promise<AnswerResult>;
  isDemoMode?: boolean;
  onComplete?: (result: { score: number; total: number }) => void;
}
