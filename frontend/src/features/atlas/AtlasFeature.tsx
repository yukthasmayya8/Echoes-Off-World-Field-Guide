import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import "./AtlasFeature.css";

export interface ArtifactSummary {
  id: string;
  name: string;
  body: "Moon" | "Mars";
  type: string;
  mission: {
    name: string;
  };
  description?: string;
  status?: {
    operational?: string;
  };
  nssdc?: {
    recordId?: string;
    url?: string;
  };
  imageUrl?: string;
  aliases?: string[];
  /** Archived location text; coordinates only when the record provides them. */
  location?: ArtifactMapLocation;
}

export interface ArtifactMapLocation {
  label: string;
  confidence?: string;
  coordinates?: { lat: number; lon: number };
}

type AtlasView = "story" | "timeline" | "science" | "evidence";

interface AtlasFeatureProps {
  records: ArtifactSummary[];
  selectedArtifactId: string | null;
  onSelectArtifact: (id: string) => void;
  /** Optional parent navigation, used by the selected-artifact panel. */
  onOpenView?: (artifactSlug: string, view: AtlasView) => void;
}

const BODIES = ["Moon", "Mars"] as const;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * Wraps archive longitudes into [-180, 180) for the equirectangular
 * projection only. Displayed text always shows the recorded value.
 */
function wrapLongitude(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
}

/** Pan is limited so the projection cannot be dragged completely off-screen. */
function clampPan(value: number, zoom: number): number {
  const limit = (zoom - 1) * 190;
  return Math.min(limit, Math.max(-limit, value));
}

function confidenceClass(confidence: string | undefined): string {
  const normalised = (confidence ?? "unknown").toLowerCase();
  if (normalised === "exact") return "exact";
  if (normalised === "approximate") return "approximate";
  return "unknown";
}

function BodyMap({
  body,
  items,
  selectedArtifactId,
  onSelectArtifact,
  onOpenView,
}: {
  body: (typeof BODIES)[number];
  items: ArtifactSummary[];
  selectedArtifactId: string | null;
  onSelectArtifact: (id: string) => void;
  onOpenView?: (artifactSlug: string, view: AtlasView) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const located = items.filter((item) => item.location?.coordinates);
  const unmapped = items.filter((item) => !item.location?.coordinates);
  if (located.length === 0 && unmapped.length === 0) return null;

  const listItems = [...located, ...unmapped];
  const selected = items.find((item) => item.id === selectedArtifactId);
  const confidenceCounts = located.reduce<Record<string, number>>((counts, item) => {
    const key = confidenceClass(item.location?.confidence);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

  const zoomBy = (delta: number) => {
    const next = clampZoom(zoom + delta);
    setZoom(next);
    setPan((current) => ({
      x: clampPan(current.x, next),
      y: clampPan(current.y, next),
    }));
  };

  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    setDragging(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const start = dragStart.current;
    setPan({
      x: clampPan(start.panX + (event.clientX - start.x), zoom),
      y: clampPan(start.panY + (event.clientY - start.y), zoom),
    });
  };

  const endDrag = () => {
    dragStart.current = null;
    setDragging(false);
  };

  return (
    <section
      className={`atlas-map ${expanded ? "atlas-map--expanded" : ""}`}
      aria-label={`${body} artifact map`}
    >
      <div className="atlas-map__head">
        <div>
          <h2>{body} map</h2>
          <p className="atlas-map__subtitle">
            Equirectangular coordinate chart · {located.length} mapped,{" "}
            {unmapped.length} text-only
          </p>
        </div>
        <div className="atlas-map__tools" role="group" aria-label={`${body} map controls`}>
          <button
            type="button"
            className="atlas-map__tool"
            onClick={() => zoomBy(0.5)}
            disabled={zoom >= MAX_ZOOM}
            aria-label={`Zoom in on ${body} map`}
          >
            +
          </button>
          <button
            type="button"
            className="atlas-map__tool"
            onClick={() => zoomBy(-0.5)}
            disabled={zoom <= MIN_ZOOM}
            aria-label={`Zoom out of ${body} map`}
          >
            −
          </button>
          <span className="atlas-map__zoom" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="atlas-map__tool atlas-map__tool--wide"
            onClick={reset}
            aria-label={`Reset ${body} map view`}
          >
            Reset
          </button>
          <button
            type="button"
            className="atlas-map__tool atlas-map__tool--wide"
            onClick={() => setExpanded((value) => !value)}
            aria-pressed={expanded}
            aria-label={expanded ? `Exit fullscreen ${body} map` : `Fullscreen ${body} map`}
          >
            {expanded ? "Exit" : "Fullscreen"}
          </button>
        </div>
      </div>

      <div className="atlas-map__legend" aria-label={`${body} location confidence legend`}>
        <span className="atlas-legend atlas-legend--exact">
          ● Exact {confidenceCounts.exact ?? 0}
        </span>
        <span className="atlas-legend atlas-legend--approximate">
          ● Approximate {confidenceCounts.approximate ?? 0}
        </span>
        <span className="atlas-legend atlas-legend--unknown">
          ● Unspecified {confidenceCounts.unknown ?? 0}
        </span>
        <span className="atlas-map__drag-hint">Drag to pan · zoom controls above</span>
      </div>

      {located.length > 0 && (
        <div
          className={`atlas-map__stage ${dragging ? "atlas-map__stage--dragging" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        >
          <div
            className="atlas-map__canvas"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            <svg
              viewBox="0 0 360 180"
              role="img"
              aria-label={`Schematic ${body} map in equirectangular projection. Marker positions come only from coordinates recorded in the archive.`}
            >
              <defs>
                <radialGradient id={`atlas-${body}-glow`} cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
              </defs>
              <rect
                x="0"
                y="0"
                width="360"
                height="180"
                rx="8"
                className="atlas-map__surface"
              />
              <rect
                x="0"
                y="0"
                width="360"
                height="180"
                rx="8"
                fill={`url(#atlas-${body}-glow)`}
              />
              {[30, 60, 90, 120, 150].map((y) => (
                <line
                  key={`h-${y}`}
                  x1="0"
                  x2="360"
                  y1={y}
                  y2={y}
                  className="atlas-map__grid"
                />
              ))}
              {[30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((x) => (
                <line
                  key={`v-${x}`}
                  x1={x}
                  x2={x}
                  y1="0"
                  y2="180"
                  className="atlas-map__grid"
                />
              ))}
              <line
                x1="0"
                x2="360"
                y1="90"
                y2="90"
                className="atlas-map__equator"
              />
              <text x="6" y="12" className="atlas-map__axis-label">
                +90°
              </text>
              <text x="6" y="176" className="atlas-map__axis-label">
                −90°
              </text>
              <text x="314" y="100" className="atlas-map__axis-label">
                180°
              </text>
            </svg>

            {located.map((item) => {
              const location = item.location;
              const coords = location?.coordinates;
              if (!location || !coords) return null;

              const left = ((wrapLongitude(coords.lon) + 180) / 360) * 100;
              const top = ((90 - coords.lat) / 180) * 100;
              const isSelected = selectedArtifactId === item.id;
              const confidence = confidenceClass(location.confidence);

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`atlas-map__marker atlas-map__marker--${confidence} ${
                    isSelected ? "active" : ""
                  }`}
                  style={{ left: `${left}%`, top: `${top}%` }}
                  aria-pressed={isSelected}
                  aria-label={`${item.name} — ${location.label} (${location.confidence ?? "unspecified"} location)`}
                  title={`${item.name} — ${location.label}`}
                  onClick={() => onSelectArtifact(item.id)}
                >
                  <span aria-hidden="true">●</span>
                  <span className="atlas-map__marker-label">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <ul className="atlas-map__list">
        {listItems.map((item) => {
          const location = item.location;
          const coords = location?.coordinates;
          return (
            <li key={item.id}>
              <button type="button" onClick={() => onSelectArtifact(item.id)}>
                {item.name}
              </button>{" "}
              {location ? (
                <>
                  — {location.label}
                  {coords && (
                    <span className="atlas-map__coords">
                      {" "}
                      ({coords.lat}°, {coords.lon}° as recorded)
                    </span>
                  )}
                  {location.confidence && (
                    <span
                      className={`atlas-confidence atlas-confidence--${confidenceClass(
                        location.confidence,
                      )}`}
                    >
                      {" "}
                      · {location.confidence} location
                    </span>
                  )}
                </>
              ) : (
                <span> — location text is not listed in the source record</span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="atlas-map__note">
        Marker positions use only the coordinates recorded in each artifact's
        archive source; nothing is inferred. Artifacts without recorded
        coordinates appear in the list only. This is a documented coordinate
        chart, not a live NASA imagery layer.
      </p>

      {selected && (
        <article
          className={`atlas-location-panel atlas-location-panel--${confidenceClass(
            selected.location?.confidence,
          )}`}
          aria-label={`Selected location: ${selected.name}`}
        >
          <div className="atlas-location-panel__top">
            <span className="atlas-tag">{selected.body}</span>
            <span
              className={`atlas-confidence atlas-confidence--${confidenceClass(
                selected.location?.confidence,
              )}`}
            >
              {selected.location?.confidence ?? "unspecified"} location
            </span>
          </div>
          <h3>{selected.name}</h3>
          <p className="atlas-location-panel__mission">{selected.mission.name}</p>
          <dl className="atlas-location-panel__facts">
            <div>
              <dt>Archived location</dt>
              <dd>{selected.location?.label ?? "Not listed in the source record"}</dd>
            </div>
            <div>
              <dt>Recorded coordinates</dt>
              <dd>
                {selected.location?.coordinates
                  ? `${selected.location.coordinates.lat}°, ${selected.location.coordinates.lon}° (as recorded)`
                  : "No coordinates in the source record"}
              </dd>
            </div>
            <div>
              <dt>Equipment</dt>
              <dd>{selected.type}</dd>
            </div>
            <div>
              <dt>NASA record</dt>
              <dd>{selected.nssdc?.recordId ?? "Not listed"}</dd>
            </div>
          </dl>
          {selected.description && (
            <p className="atlas-location-panel__description">{selected.description}</p>
          )}
          <div className="atlas-location-panel__actions">
            {onOpenView && (
              <>
                <button type="button" onClick={() => onOpenView(selected.id, "story")}>
                  Open storybook
                </button>
                <button type="button" onClick={() => onOpenView(selected.id, "timeline")}>
                  Time machine
                </button>
                <button type="button" onClick={() => onOpenView(selected.id, "evidence")}>
                  Evidence
                </button>
              </>
            )}
            {selected.nssdc?.url && (
              <a href={selected.nssdc.url} target="_blank" rel="noreferrer noopener">
                NSSDCA record ↗
              </a>
            )}
          </div>
        </article>
      )}
    </section>
  );
}

export default function AtlasFeature({
  records,
  selectedArtifactId,
  onSelectArtifact,
  onOpenView,
}: AtlasFeatureProps) {
  const [search, setSearch] = useState("");
  const [destination, setDestination] = useState("All");
  const [type, setType] = useState("All");

  const types = useMemo(
    () => [...new Set(records.map((item) => item.type))],
    [records],
  );

  const filteredRecords = records.filter((item) => {
    const query = search.toLowerCase();

    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.mission.name.toLowerCase().includes(query) ||
      item.nssdc?.recordId?.toLowerCase().includes(query) ||
      item.aliases?.some((alias) => alias.toLowerCase().includes(query));

    const matchesDestination =
      destination === "All" || item.body === destination;

    const matchesType = type === "All" || item.type === type;

    return matchesSearch && matchesDestination && matchesType;
  });

  const selected = records.find((item) => item.id === selectedArtifactId);

  return (
    <main className="atlas">
      <header className="atlas-header">
        <p className="atlas-label">ECHOES • OFF-WORLD ARCHIVE</p>
        <h1>Archive Atlas</h1>
        <p>
          Explore the human-made equipment left behind on the Moon and Mars.
          Zoom, pan and select a site to read its archived location record.
        </p>
      </header>

      <section className="atlas-controls">
        <input
          type="search"
          placeholder="Search artifacts, missions or NASA IDs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search artifacts"
        />

        <select
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          aria-label="Filter by destination"
        >
          <option value="All">All destinations</option>
          <option value="Moon">Moon</option>
          <option value="Mars">Mars</option>
        </select>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Filter by equipment type"
        >
          <option value="All">All equipment types</option>
          {types.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setSearch("");
            setDestination("All");
            setType("All");
          }}
        >
          Reset filters
        </button>
      </section>

      <p className="atlas-count" aria-live="polite">
        {filteredRecords.length} artifact{filteredRecords.length === 1 ? "" : "s"} in view
        {selected ? ` · Selected: ${selected.name}` : " · No site selected"}
      </p>

      {BODIES.map((body) => {
        const items = filteredRecords.filter((item) => item.body === body);
        if (items.length === 0) return null;
        return (
          <BodyMap
            key={body}
            body={body}
            items={items}
            selectedArtifactId={selectedArtifactId}
            onSelectArtifact={onSelectArtifact}
            onOpenView={onOpenView}
          />
        );
      })}

      <section className="atlas-results">
        <h2>Artifact Collection</h2>
        <p>{filteredRecords.length} artifacts found</p>

        <div className="atlas-grid">
          {filteredRecords.map((item) => (
            <button
              key={item.id}
              className={`atlas-card ${
                selectedArtifactId === item.id ? "active" : ""
              }`}
              onClick={() => onSelectArtifact(item.id)}
              type="button"
            >
              <div className="atlas-image">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} loading="lazy" />
                ) : (
                  <span aria-hidden="true">{item.body === "Moon" ? "☾" : "♂"}</span>
                )}
              </div>

              <div className="atlas-card-content">
                <span className="atlas-tag">{item.body}</span>
                <h3>{item.name}</h3>
                <p>{item.mission.name}</p>
                <small>{item.type}</small>
                {item.location && (
                  <span
                    className={`atlas-confidence atlas-confidence--${confidenceClass(
                      item.location.confidence,
                    )}`}
                  >
                    {item.location.confidence ?? "unspecified"} location
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <p className="atlas-empty">
            No artifacts found. Try another search.
          </p>
        )}
      </section>
    </main>
  );
}
