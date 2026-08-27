import { CONFIG } from "../../config";
import type { Engine } from "../../lib/engine";
import type { Store } from "../../state/store";

/**
 * Tête de l'accueil : deux conteneurs côte à côte, un par exercice.
 *
 * À gauche l'exercice **N-1**, clos, en consultation. À droite l'exercice **N**,
 * celui de la campagne en cours, avec son avancement et l'accès à la saisie.
 * Cliquer sur un conteneur cale le reste de la page sur cet exercice.
 */
export default function CampaignBanner({ store }: { store: Store }) {
  const { state, set } = store;
  const campaignYear = CONFIG.campaignYear;
  const closedYear = campaignYear - 1;

  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "stretch" }}>
      <ExerciceCard
        store={store}
        year={closedYear}
        active={state.year === closedYear}
        onPick={() => set({ year: closedYear, hoverSeg: null })}
      />
      <ExerciceCard
        store={store}
        year={campaignYear}
        active={state.year === campaignYear}
        onPick={() => set({ year: campaignYear, hoverSeg: null })}
      />
    </div>
  );
}

function ExerciceCard({
  store,
  year,
  active,
  onPick,
}: {
  store: Store;
  year: number;
  active: boolean;
  onPick: () => void;
}) {
  const { engine, set } = store;
  const view: Engine = engine.atYear(year);
  const open = view.campaignOpen();
  const pct = view.campaignPct();
  const g = view.budgetGroups();
  const reste = g.remplir.length + g.attente.length;
  const accent = open ? "#0a9bd8" : "#94a3b8";

  return (
    <div
      onClick={onPick}
      style={{
        flex: "1 1 380px",
        minWidth: 320,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "14px 16px",
        background: "#fff",
        border: "1px solid " + (active ? accent + "66" : "#e6eaee"),
        borderLeft: "3px solid " + (active ? accent : "#e6eaee"),
        borderRadius: 12,
        cursor: "pointer",
        boxShadow: active ? "0 2px 10px rgba(15,23,42,0.06)" : "none",
        transition: "border-color 150ms ease, box-shadow 150ms ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <span
          style={{
            padding: "3px 9px",
            borderRadius: 20,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.4px",
            textTransform: "uppercase",
            background: open ? "#e8f6fd" : "#f1f5f9",
            color: open ? "#0782b6" : "#64748b",
          }}
        >
          {open ? "Campagne ouverte" : "Budget clos"}
        </span>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.2px" }}>
          Exercice {year}
        </span>
        {active && (
          <span style={{ fontSize: 11, fontWeight: 700, color: accent }}>· affiché</span>
        )}
      </div>

      <div style={{ fontSize: 12, color: "#8a95a1", lineHeight: 1.4 }}>
        {open
          ? "Les 12 mois de " +
            year +
            " sont à renseigner sur la base des réalisés " +
            (year - 1) +
            " · à rendre avant fin septembre " +
            (year - 1)
          : "Consultation seule · conservé comme référence pour les campagnes suivantes"}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 140px", minWidth: 120 }}>
          <div style={{ height: 6, borderRadius: 6, background: "#eef1f4", overflow: "hidden" }}>
            <div style={{ height: 6, width: pct, background: accent }} />
          </div>
          <div style={{ fontSize: 11, color: "#8a95a1", marginTop: 4 }}>
            {open
              ? reste
                ? reste + " chantiers à déclarer"
                : "tout est déclaré"
              : g.fini.length + " budgets clôturés"}
          </div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: accent }}>{pct}</div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            set({
              year,
              tab: "Tableau prévisionnel",
              onlyTodo: open && engine.isExploit,
              fSearch: "",
              searchDraft: "",
            });
          }}
          style={{
            padding: "8px 13px",
            border: open ? 0 : "1px solid #dde3e8",
            borderRadius: 8,
            background: open ? "#0a9bd8" : "#fff",
            color: open ? "#fff" : "#3b4753",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {open ? (engine.isExploit ? "Remplir mon budget" : "Suivre la campagne") : "Consulter"}
        </button>
      </div>
    </div>
  );
}
