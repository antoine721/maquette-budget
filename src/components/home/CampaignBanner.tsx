import { YEARS } from "../../data/constants";
import type { Store } from "../../state/store";

/**
 * Bandeau de tête de l'accueil : cadrage de la campagne, avancement, accès direct
 * au tableau. Le sélecteur d'exercice fait aussi basculer la maquette entre les
 * deux situations à présenter — en campagne et hors campagne.
 */
export default function CampaignBanner({ store }: { store: Store }) {
  const { state, engine, set } = store;
  const open = engine.campaignOpen();
  const pct = engine.campaignPct();
  const g = engine.budgetGroups();
  const reste = g.remplir.length + g.attente.length;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
        padding: "12px 16px",
        background: "#fff",
        border: "1px solid " + (open ? "#bfe3f6" : "#e6eaee"),
        borderLeft: "3px solid " + (open ? "#0a9bd8" : "#cbd5e1"),
        borderRadius: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.2px" }}>
          {open
            ? "Budget prévisionnel janvier – décembre " + state.year
            : "Exercice " + state.year + " — budget clos"}
        </div>
        <div style={{ fontSize: 12, color: "#8a95a1", marginTop: 1 }}>
          {open
            ? "Campagne ouverte par le contrôle de gestion · à rendre avant fin septembre " +
              (state.year - 1)
            : "Consultation seule · conservé comme référence pour les campagnes suivantes"}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <select
        value={state.year}
        onChange={(e) =>
          // Rejouer le rappel : chaque changement d'exercice remet la maquette dans son état initial.
          set({ year: parseInt(e.target.value, 10), campaignModal: true, hoverSeg: null })
        }
        title="Exercice consulté"
        style={{
          padding: "8px 10px",
          border: "1px solid #dde3e8",
          borderRadius: 8,
          background: "#fff",
          fontSize: 13,
          fontWeight: 600,
          color: "#17202a",
        }}
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      {open && (
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ fontSize: 12, color: "#6b7681" }}>
            {reste ? reste + " chantiers à déclarer" : "tout est déclaré"}
          </span>
          <div
            style={{ width: 130, height: 6, borderRadius: 6, background: "#eef1f4", overflow: "hidden" }}
          >
            <div style={{ height: 6, width: pct, background: "#0a9bd8" }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0a9bd8" }}>{pct}</div>
        </div>
      )}

      {open && !state.campaignModal && (
        <button
          className="hov-f8"
          onClick={() => set({ campaignModal: true })}
          style={{
            padding: "8px 12px",
            border: "1px solid #dde3e8",
            borderRadius: 8,
            background: "#fff",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            color: "#3b4753",
            cursor: "pointer",
          }}
        >
          Rappel campagne
        </button>
      )}

      <button
        onClick={() =>
          set({ tab: "Tableau prévisionnel", onlyTodo: open && engine.isExploit, fSearch: "", searchDraft: "" })
        }
        style={{
          padding: "8px 13px",
          border: 0,
          borderRadius: 8,
          background: "#0a9bd8",
          color: "#fff",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {open
          ? engine.isExploit
            ? "Remplir mon budget " + state.year
            : "Suivre la campagne " + state.year
          : "Ouvrir le tableau"}
      </button>
    </div>
  );
}
