import { CAT, ENTITIES, METRICS, TAGS, YEARS } from "../../data/constants";
import type { Store } from "../../state/store";

const SELECT: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #dde3e8",
  borderRadius: 8,
  background: "#fff",
  fontSize: 13,
  color: "#17202a",
};

const GHOST_BUTTON: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #dde3e8",
  borderRadius: 8,
  background: "#fff",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 600,
  color: "#3b4753",
  cursor: "pointer",
};

/** Ligne compacte : recherche, exercice, entité, tag, indicateur, catégorie, exports. */
export default function FilterBar({ store }: { store: Store }) {
  const { state, engine, set, setSearch, undoLast, toast } = store;
  const catLabel = state.cat === "Total" ? "CA total" : "CA " + state.cat;
  const met = engine.metric;
  const metricLabel = met.key === "ca" ? catLabel : met.label;
  const list = engine.filtered();

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
      <input
        value={state.searchDraft}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Code chantier…"
        style={{
          flex: "1 1 200px",
          minWidth: 190,
          padding: "8px 12px",
          border: "1px solid #dde3e8",
          borderRadius: 8,
          background: "#fff",
          fontSize: 13.5,
          color: "#17202a",
        }}
      />

      <select
        value={state.year}
        onChange={(e) => set({ year: parseInt(e.target.value, 10) })}
        title="Exercice budgété"
        style={{ ...SELECT, fontWeight: 600 }}
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <div style={{ display: "flex", gap: 6 }}>
        {["Toutes", ...ENTITIES.map((e) => e.code)].map((code) => {
          const e = ENTITIES.find((x) => x.code === code);
          const on = state.fEntity === code;
          return (
            <button
              key={code}
              onClick={() => set({ fEntity: code })}
              title={e ? e.name : "Toutes les entités"}
              style={{
                padding: "8px 13px",
                border: "1px solid " + (on ? "#c7d2fe" : "#dde3e8"),
                borderRadius: 999,
                background: on ? "#eef2ff" : "#fff",
                color: on ? "#3730a3" : "#6b7681",
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {code}
            </button>
          );
        })}
      </div>

      {engine.isCG && (
        <select
          value={state.fTag}
          onChange={(e) => set({ fTag: e.target.value })}
          title="Filtrer par tag de suivi"
          style={{
            ...SELECT,
            border: "1px solid #ddd6fe",
            background: "#f8f7ff",
            fontWeight: 600,
            color: "#5b21b6",
          }}
        >
          {["Tous les tags", ...TAGS].map((tg) => (
            <option key={tg} value={tg}>
              {tg}
            </option>
          ))}
        </select>
      )}

      <span style={{ width: 1, height: 22, background: "#e6eaee" }} />

      <select
        value={metricLabel}
        onChange={(e) => {
          const lbl = e.target.value;
          const m = METRICS.find((x) => (x.key === "ca" ? catLabel : x.label) === lbl);
          if (m) set({ metric: m.key });
        }}
        title="Indicateur affiché"
        style={{
          ...SELECT,
          border: "1px solid #bfe3f6",
          background: "#f5fbff",
          fontWeight: 600,
          color: "#0782b6",
        }}
      >
        {METRICS.map((m) => {
          const label = m.key === "ca" ? catLabel : m.label;
          return (
            <option key={m.key} value={label}>
              {label}
            </option>
          );
        })}
      </select>

      <select
        value={state.cat}
        onChange={(e) => set({ cat: e.target.value, metric: "ca" })}
        title="Catégorie de CA"
        style={SELECT}
      >
        {["Total", ...CAT.map((c) => c.label)].map((co) => (
          <option key={co} value={co}>
            {co}
          </option>
        ))}
      </select>

      {state.history.length > 0 && (
        <button
          onClick={undoLast}
          title="Annuler la dernière action en masse"
          style={{
            ...GHOST_BUTTON,
            border: "1px solid #bfe3f6",
            color: "#0782b6",
          }}
        >
          Annuler
        </button>
      )}

      <span style={{ flex: 1 }} />

      <button
        className="hov-f8"
        onClick={() =>
          toast("Export Excel — " + list.length + " chantiers, " + state.fPeriode + " " + state.year)
        }
        style={GHOST_BUTTON}
      >
        Excel
      </button>
      <button
        className="hov-f8"
        onClick={() =>
          toast("Export CSV — " + list.length + " chantiers, " + state.fPeriode + " " + state.year)
        }
        style={GHOST_BUTTON}
      >
        CSV
      </button>
    </div>
  );
}
