/**
 * Space Heritage — why landing sites matter and a short decision activity.
 * ECHOES is not a preservation authority; the copy says so explicitly.
 */

import { useState } from 'react';

const NASA_HERITAGE = 'https://www.nasa.gov/wp-content/uploads/static/history/humanartifacts.html';
const NASA_LUNAR_SITES =
  'https://www.nasa.gov/wp-content/uploads/2023/12/nasa-usg-lunar-historic-sites-reva.pdf';

interface ScenarioChoice {
  id: string;
  label: string;
  verdict: 'best' | 'risky' | 'unsafe';
  feedback: string;
}

const CHOICES: ScenarioChoice[] = [
  {
    id: 'close',
    label: 'Land directly beside the descent stage and walk between the hardware.',
    verdict: 'unsafe',
    feedback:
      'Landing and walking close to the hardware would put the site at risk from descent exhaust, dust, and physical disturbance. NASA’s lunar historic-site recommendations discuss approach limits and exclusion zones for exactly this reason. The record does not give ECHOES authority to approve such a mission.',
  },
  {
    id: 'buffer',
    label: 'Land outside a documented exclusion zone and study the site remotely from a distance.',
    verdict: 'best',
    feedback:
      'This is the most defensible option in the scenario: keep a buffer, use remote sensing first, and treat the site as a finite historical and scientific resource. Any real mission would still need its own formal review and authorization.',
  },
  {
    id: 'ordinary',
    label: 'Treat the site as ordinary terrain and follow normal exploration rules.',
    verdict: 'risky',
    feedback:
      'Historic sites are not ordinary terrain. The hardware, footprints and experiment packages are both historical evidence and material records of engineering. NASA’s heritage documentation explains why a normal-terrain approach is not sufficient.',
  },
];

export function SpaceHeritage() {
  const [choice, setChoice] = useState<string | null>(null);
  const selected = CHOICES.find((entry) => entry.id === choice) ?? null;

  return (
    <section className="heritage" aria-label="Space Heritage">
      <header className="module-header">
        <p className="eyebrow">WHY SITES MATTER</p>
        <h2>Space Heritage</h2>
        <p>
          The Moon and Mars are not only destinations. They are archives of
          engineering, science and human history, and every new mission can add
          to — or erase — the record.
        </p>
      </header>

      <div className="heritage-grid">
        <article className="heritage-card">
          <span className="heritage-card__icon" aria-hidden="true">⌂</span>
          <h3>Historical value</h3>
          <p>
            A landing site records a specific moment in exploration: where people
            or robots first did something, what they left behind, and how they
            worked. The physical arrangement can carry information that a written
            summary cannot.
          </p>
        </article>
        <article className="heritage-card">
          <span className="heritage-card__icon" aria-hidden="true">✦</span>
          <h3>Scientific value</h3>
          <p>
            Hardware and experiment packages are material samples of engineering
            history. Later observations can compare their condition with the
            original design and with the environment around them.
          </p>
        </article>
        <article className="heritage-card">
          <span className="heritage-card__icon" aria-hidden="true">◌</span>
          <h3>Fragility</h3>
          <p>
            Descent exhaust, dust, heat and physical contact can disturb a site.
            The Moon has no weather to erase footprints quickly, but that also
            means a disturbance can persist.
          </p>
        </article>
        <article className="heritage-card">
          <span className="heritage-card__icon" aria-hidden="true">⇄</span>
          <h3>Responsible exploration</h3>
          <p>
            Preservation and exploration are not opposites. Remote sensing,
            documented approach limits and transparent mission planning can let
            us study a site while protecting it.
          </p>
        </article>
      </div>

      <section className="scenario" aria-label="Future mission decision activity">
        <div className="scenario__head">
          <p className="eyebrow">DECISION ACTIVITY</p>
          <h3>A future mission is planned near Tranquility Base</h3>
          <p>
            A hypothetical rover team wants to study how lunar dust has settled on
            the Apollo 11 hardware. Which approach is most defensible?
          </p>
        </div>
        <div className="scenario__choices">
          {CHOICES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`scenario-choice ${choice === entry.id ? 'scenario-choice--selected' : ''}`}
              onClick={() => setChoice(entry.id)}
              aria-pressed={choice === entry.id}
            >
              <span className="scenario-choice__mark" aria-hidden="true">
                {choice === entry.id ? '●' : '○'}
              </span>
              {entry.label}
            </button>
          ))}
        </div>
        {selected ? (
          <div className={`scenario-feedback scenario-feedback--${selected.verdict}`} role="status">
            <strong>
              {selected.verdict === 'best'
                ? 'Most defensible'
                : selected.verdict === 'risky'
                  ? 'Risky'
                  : 'Not defensible'}
            </strong>
            <p>{selected.feedback}</p>
          </div>
        ) : null}
      </section>

      <div className="heritage-sources">
        <h3>Reference material</h3>
        <p>
          These are NASA documents for further reading. ECHOES does not claim to
          be an official preservation body, and this activity is educational, not
          a regulatory decision.
        </p>
        <ul>
          <li>
            <a href={NASA_HERITAGE} target="_blank" rel="noreferrer noopener">
              NASA — Human Artifacts on the Moon ↗
            </a>
          </li>
          <li>
            <a href={NASA_LUNAR_SITES} target="_blank" rel="noreferrer noopener">
              NASA — Lunar Historic Sites Recommendations (PDF) ↗
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
