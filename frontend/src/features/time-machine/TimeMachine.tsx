/**
 * Time Machine — chronological mission experience.
 *
 * Presents an artifact's documented history as an interactive timeline.
 * Visitors can travel through mission events (launch, landing, deployment,
 * science, departure, afterlife) and see each event's photograph, explanation,
 * and supporting source. Only events present in the verified artifact record
 * are shown — no events are invented.
 */

import { useMemo, useState } from 'react';
import type { Artifact, Source, TimelineEvent } from '@echoes/shared';

const EVENT_LABELS: Record<string, string> = {
  launch: 'Launch',
  arrival: 'Arrival',
  landing: 'Landing',
  deployment: 'Deployment',
  'surface-operations': 'Surface Operations',
  science: 'Science Operations',
  departure: 'Departure',
  'end-of-mission': 'End of Mission',
  afterlife: 'Afterlife',
  other: 'Other Event',
};

const EVENT_ICONS: Record<string, string> = {
  launch: '🚀',
  arrival: '🛰️',
  landing: '🌑',
  deployment: '🔧',
  'surface-operations': '🔭',
  science: '🧪',
  departure: '🛬',
  'end-of-mission': '🏁',
  afterlife: '🌠',
  other: '📋',
};

export interface TimeMachineEvent extends TimelineEvent {
  label: string;
  icon: string;
}

export function buildTimeMachineEvents(
  artifact: Artifact,
): TimeMachineEvent[] {
  return [...artifact.timeline]
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
    .map((event) => ({
      ...event,
      label: EVENT_LABELS[event.eventType] ?? event.eventType,
      icon: EVENT_ICONS[event.eventType] ?? EVENT_ICONS.other,
    }));
}

interface TimeMachineProps {
  artifact: Artifact;
  sources: Source[];
}

export function TimeMachine({ artifact, sources }: TimeMachineProps) {
  const events = buildTimeMachineEvents(artifact);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const sourcesById = useMemo(
    () => new Map(sources.map((s) => [s.id, s])),
    [sources],
  );

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <section className="time-machine" aria-label="Time Machine — mission history">
      <div className="tm-header">
        <h2 className="tm-title">Time Machine: {artifact.name}</h2>
        <p className="tm-subtitle">
          Travel through the documented mission history of{' '}
          <strong>{artifact.name}</strong> ({artifact.missionName}).
        </p>
      </div>

      <div className="tm-timeline" role="list" aria-label="Mission events">
        {events.map((event) => {
          const isSelected = selectedEventId === event.id;
          return (
            <article
              key={event.id}
              className={`tm-event ${isSelected ? 'tm-event--selected' : ''}`}
              role="listitem"
            >
              <button
                type="button"
                className="tm-event-button"
                onClick={() =>
                  setSelectedEventId(selectedEventId === event.id ? null : event.id)
                }
                aria-expanded={isSelected}
              >
                <div className="tm-event-row">
                  <span className="tm-event-icon">{event.icon}</span>
                  <div className="tm-event-info">
                    <span className="tm-event-date">{event.date}</span>
                    <span className="tm-event-label">{event.label}</span>
                  </div>
                </div>
                <div className="tm-event-description">{event.description}</div>
              </button>

              {isSelected && selectedEvent && (
                <div className="tm-event-detail">
                  <h3 className="tm-detail-title">{selectedEvent.label}</h3>
                  <p className="tm-detail-body">{selectedEvent.description}</p>
                  {selectedEvent.sourceIds.length > 0 && (
                    <>
                      <h4 className="tm-detail-source-title">Supporting sources</h4>
                      <ul className="tm-detail-source-list">
                        {selectedEvent.sourceIds.map((id) => {
                          const source = sourcesById.get(id);
                          return (
                            <li key={id} className="tm-detail-source-item">
                              {source ? (
                                <>
                                  <span className="tm-detail-source-mark" aria-hidden="true">
                                    ↗
                                  </span>
                                  <div>
                                    <span className="tm-detail-source-title">
                                      {source.title}
                                    </span>
                                    <small className="tm-detail-source-org">
                                      {source.organization}
                                    </small>
                                  </div>
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="tm-detail-source-link"
                                  >
                                    Open NSSDCA record
                                  </a>
                                </>
                              ) : (
                                <span className="tm-detail-source-missing">
                                  Source record {id} not found.
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                  <p className="tm-detail-note">
                    Every event above comes directly from the verified NSSDCA
                    archive record. No events are invented or filled in.
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="tm-disclosure">
        <p className="tm-disclosure-text">
          All mission events and their dates are taken from the verified
          artifact record. Events not documented in the archive are not shown.
        </p>
      </div>
    </section>
  );
}
