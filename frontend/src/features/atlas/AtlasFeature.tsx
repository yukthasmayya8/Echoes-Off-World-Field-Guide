
import { useMemo, useState } from "react";
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

interface AtlasFeatureProps {
  records: ArtifactSummary[];
  selectedArtifactId: string | null;
  onSelectArtifact: (id: string) => void;
}

const BODIES = ["Moon", "Mars"] as const;

/**
 * Wraps archive longitudes into [-180, 180) for the equirectangular
 * projection only. Displayed text always shows the recorded value.
 */
function wrapLongitude(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

function BodyMap({
  body,
  items,
  selectedArtifactId,
  onSelectArtifact,
}: {
  body: (typeof BODIES)[number];
  items: ArtifactSummary[];
  selectedArtifactId: string | null;
  onSelectArtifact: (id: string) => void;
}) {
  const located = items.filter((item) => item.location?.coordinates);
  const unmapped = items.filter((item) => !item.location?.coordinates);
  if (located.length === 0 && unmapped.length === 0) return null;

  const listItems = [...located, ...unmapped];

  return (
    <section className="atlas-map" aria-label={`${body} artifact map`}>
      <h2>{body} map</h2>
      {located.length > 0 && (
        <div className="atlas-map__stage">
          <svg
            viewBox="0 0 360 180"
            role="img"
            aria-label={`Schematic ${body} map in equirectangular projection. Marker positions come only from coordinates recorded in the archive.`}
          >
            <rect
              x="0"
              y="0"
              width="360"
              height="180"
              rx="8"
              className="atlas-map__surface"
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
          </svg>
          {located.map((item) => {
            const location = item.location;
            const coords = location?.coordinates;
            if (!location || !coords) return null;

            const left = ((wrapLongitude(coords.lon) + 180) / 360) * 100;
            const top = ((90 - coords.lat) / 180) * 100;
            const isSelected = selectedArtifactId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`atlas-map__marker ${isSelected ? "active" : ""}`}
                style={{ left: `${left}%`, top: `${top}%` }}
                aria-pressed={isSelected}
                aria-label={`${item.name} — ${location.label} (${location.confidence ?? "unspecified"} location)`}
                title={`${item.name} — ${location.label}`}
                onClick={() => onSelectArtifact(item.id)}
              >
                <span aria-hidden="true">●</span>
              </button>
            );
          })}
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
                    <span> · {location.confidence} location</span>
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
        coordinates appear in the list only.
      </p>
    </section>
  );
}

export default function AtlasFeature({
  records,
  selectedArtifactId,
  onSelectArtifact,
}: AtlasFeatureProps) {
  const [search, setSearch] = useState("");
  const [destination, setDestination] = useState("All");
  const [type, setType] = useState("All");

  const types = useMemo(
    () => [...new Set(records.map((item) => item.type))],
    [records]
  );

  const filteredRecords = records.filter((item) => {
    const query = search.toLowerCase();

    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.mission.name.toLowerCase().includes(query) ||
      item.nssdc?.recordId?.toLowerCase().includes(query) ||
      item.aliases?.some((alias) =>
        alias.toLowerCase().includes(query)
      );

    const matchesDestination =
      destination === "All" || item.body === destination;

    const matchesType = type === "All" || item.type === type;

    return matchesSearch && matchesDestination && matchesType;
  });

  const selected = records.find(
    (item) => item.id === selectedArtifactId
  );

  return (
    <main className="atlas">
      <header className="atlas-header">
        <p className="atlas-label">ECHOES • OFF-WORLD ARCHIVE</p>
        <h1>Archive Atlas</h1>
        <p>
          Explore the human-made equipment left behind on the Moon
          and Mars. Every artifact has a story.
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
          Reset
        </button>
      </section>

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
                  <img src={item.imageUrl} alt={item.name} />
                ) : (
                  <span>{item.body === "Moon" ? "☾" : "♂"}</span>
                )}
              </div>

              <div className="atlas-card-content">
                <span className="atlas-tag">{item.body}</span>
                <h3>{item.name}</h3>
                <p>{item.mission.name}</p>
                <small>{item.type}</small>
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

      {selected && (
        <section className="atlas-detail">
          <p className="atlas-label">SELECTED ARTIFACT</p>
          <h2>{selected.name}</h2>
          <p>
            {selected.description || "Description not available."}
          </p>

          <div className="atlas-detail-grid">
            <div>
              <strong>Destination</strong>
              <p>{selected.body}</p>
            </div>
            <div>
              <strong>Mission</strong>
              <p>{selected.mission.name}</p>
            </div>
            <div>
              <strong>Equipment</strong>
              <p>{selected.type}</p>
            </div>
            <div>
              <strong>Status</strong>
              <p>{selected.status?.operational || "Unknown"}</p>
            </div>
            <div>
              <strong>NASA Record ID</strong>
              <p>{selected.nssdc?.recordId || "Not listed"}</p>
            </div>
          </div>

          {selected.nssdc?.url && (
            <a href={selected.nssdc.url} target="_blank" rel="noreferrer">
              View NASA archive record ↗
            </a>
          )}
        </section>
      )}
    </main>
  );
}
