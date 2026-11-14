/**
 * Mission Control navigation model. Views are client-side state rather than
 * routes, so the app keeps working when opened as a static build without a
 * server rewrite rule.
 */

export type ViewId =
  | 'home'
  | 'atlas'
  | 'story'
  | 'timeline'
  | 'science'
  | 'evidence'
  | 'dna'
  | 'archaeologist'
  | 'routes'
  | 'facts'
  | 'unknowns'
  | 'deeper'
  | 'compare'
  | 'legacy'
  | 'heritage'
  | 'resources'
  | 'passport'
  | 'teacher'
  | 'search';

export interface NavItem {
  id: ViewId;
  label: string;
  icon: string;
  hint: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Mission Control',
    items: [
      { id: 'home', label: 'Dashboard', icon: '◈', hint: 'Start here' },
      { id: 'atlas', label: 'Atlas', icon: '◎', hint: 'Moon and Mars maps' },
      { id: 'search', label: 'Search', icon: '⌕', hint: 'Across every module' },
    ],
  },
  {
    label: 'Investigate',
    items: [
      { id: 'story', label: 'Storybook', icon: '▤', hint: 'Narrated mission story' },
      { id: 'timeline', label: 'Time Machine', icon: '◷', hint: 'Mission chronology' },
      { id: 'science', label: 'Science Reveal', icon: '✦', hint: 'Hardware to discovery' },
      { id: 'dna', label: 'Artifact DNA', icon: '⬡', hint: 'Hardware explorer' },
      { id: 'evidence', label: 'Evidence Detective', icon: '⌖', hint: 'Test a claim' },
      { id: 'archaeologist', label: 'Space Archaeologist', icon: '⛏', hint: 'Guided investigation' },
      { id: 'routes', label: 'Guided Routes', icon: '↝', hint: 'Curated journeys' },
    ],
  },
  {
    label: 'Research',
    items: [
      { id: 'facts', label: 'Fact Vault', icon: '▣', hint: 'Searchable verified facts' },
      { id: 'unknowns', label: 'Unknowns Observatory', icon: '◌', hint: 'What is not known' },
      { id: 'deeper', label: 'Explore Deeper', icon: '⌂', hint: 'Source-grounded answers' },
      { id: 'compare', label: 'Compare Artifacts', icon: '⇄', hint: 'Side by side' },
      { id: 'legacy', label: 'Legacy Bridge', icon: '⤳', hint: 'Then to now' },
      { id: 'heritage', label: 'Space Heritage', icon: '⌂', hint: 'Why sites matter' },
      { id: 'resources', label: 'NASA Resources', icon: '☍', hint: 'Data provenance' },
    ],
  },
  {
    label: 'Learn',
    items: [
      { id: 'passport', label: 'Discovery Passport', icon: '✧', hint: 'Your progress' },
      { id: 'teacher', label: 'Teacher Mode', icon: '✎', hint: 'Classroom kit' },
    ],
  },
];

export const VIEW_TITLES: Record<ViewId, string> = {
  home: 'Mission Control',
  atlas: 'Planetary Atlas',
  story: 'Storybook',
  timeline: 'Mission Time Machine',
  science: 'Science Reveal',
  evidence: 'Evidence Detective',
  dna: 'Artifact DNA',
  archaeologist: 'Digital Space Archaeologist',
  routes: 'Guided Story Routes',
  facts: 'Fact Vault',
  unknowns: 'Unknowns Observatory',
  deeper: 'Explore Deeper',
  compare: 'Compare Artifacts',
  legacy: 'Legacy Bridge',
  heritage: 'Space Heritage',
  resources: 'NASA Resources',
  passport: 'Discovery Passport',
  teacher: 'Teacher Mode',
  search: 'Search the Archive',
};


export function isViewId(value: string): value is ViewId {
  return value in VIEW_TITLES;
}
