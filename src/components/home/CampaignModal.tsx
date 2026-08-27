import type { Store } from "../../state/store";

/**
 * Rappel affiché à l'ouverture pendant la fenêtre de déclaration : ce qu'il reste
 * à faire, le pourcentage de complétion, et l'accès direct à la saisie.
 * C'est le point d'entrée qui garantit que le REX ne passe pas à côté de la campagne.
 */
export default function CampaignModal({ store }: { store: Store }) {
  const { state, engine, set } = store;
  const pct = engine.campaignPct();
  const g = engine.budgetGroups();
  const isExploit = engine.isExploit;

  const reste = g.remplir.length + g.attente.length;
  const total = g.remplir.length + g.cours.length + g.fini.length + g.attente.length;
  const aValider = engine.aValider().length;

  const close = () => set({ campaignModal: false });

  const lignes = isExploit
    ? [
        { label: "Chantiers à déclarer", value: reste, color: reste ? "#dc2626" : "#16a34a" },
        { label: "Déclarés, en attente de validation", value: g.cours.length, color: "#f59e0b" },
        { label: "Budgets terminés", value: g.fini.length, color: "#16a34a" },
      ]
    : [
        { label: "Budgets à valider", value: aValider, color: "#0a9bd8" },
        { label: "Chantiers non traités", value: reste, color: reste ? "#dc2626" : "#16a34a" },
        { label: "Budgets terminés", value: g.fini.length, color: "#16a34a" },
      ];

  return (
    <div
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(15,23,42,0.38)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(15,23,42,0.26)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px 22px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                padding: "3px 9px",
                borderRadius: 20,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.4px",
                textTransform: "uppercase",
                background: "#e8f6fd",
                color: "#0782b6",
              }}
            >
              Campagne ouverte
            </span>
            <span style={{ flex: 1 }} />
            <button
              onClick={close}
              title="Fermer"
              style={{
                width: 28,
                height: 28,
                border: 0,
                borderRadius: 8,
                background: "#f4f6f8",
                color: "#6b7681",
                fontFamily: "inherit",
                fontSize: 15,
                cursor: "pointer",
                padding: 0,
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 19, fontWeight: 700, letterSpacing: "-0.4px" }}>
            Budget prévisionnel {state.year}
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: "#6b7681", lineHeight: 1.45 }}>
            {isExploit
              ? "Les 12 mois de " +
                state.year +
                " sont à renseigner sur vos chantiers, sur la base des réalisés " +
                (state.year - 1) +
                ". À rendre avant fin septembre " +
                (state.year - 1) +
                "."
              : "Suivi de la campagne " +
                state.year +
                " sur l'ensemble du portefeuille : baselines à publier, saisies à contrôler, budgets à valider."}
          </div>

          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{ flex: 1, height: 8, borderRadius: 6, background: "#eef1f4", overflow: "hidden" }}
            >
              <div style={{ height: 8, width: pct, background: "#0a9bd8" }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#0a9bd8", letterSpacing: "-0.5px" }}>
              {pct}
            </span>
          </div>
          <div style={{ marginTop: 2, fontSize: 11.5, color: "#8a95a1" }}>
            complétion de la saisie sur {total} chantiers
          </div>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 2 }}>
            {lignes.map((l) => (
              <div
                key={l.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "#fbfcfd",
                }}
              >
                <span
                  style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flex: "0 0 auto" }}
                />
                <span style={{ flex: 1, fontSize: 13, color: "#3b4753" }}>{l.label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: l.color }}>{l.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "18px 22px 20px",
          }}
        >
          <button
            onClick={() => {
              set({
                campaignModal: false,
                tab: "Tableau prévisionnel",
                onlyTodo: true,
                fStatut: "Tous les statuts",
                fSearch: "",
                searchDraft: "",
              });
            }}
            style={{
              flex: 1,
              padding: "11px 14px",
              border: 0,
              borderRadius: 9,
              background: "#0a9bd8",
              color: "#fff",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isExploit ? "Remplir mon budget" : "Voir les chantiers à traiter"}
          </button>
          <button
            className="hov-f8"
            onClick={close}
            style={{
              padding: "11px 16px",
              border: "1px solid #dde3e8",
              borderRadius: 9,
              background: "#fff",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 600,
              color: "#6b7681",
              cursor: "pointer",
            }}
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
