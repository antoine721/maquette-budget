import { AGENCES, MONTHS, SHORT } from "../../data/constants";
import type { Store } from "../../state/store";

/** Grille admin : ouvrir/fermer chaque mois de saisie par entité. */
export default function AdminPeriods({ store }: { store: Store }) {
  const { state, togglePeriod } = store;

  return (
    <div
      style={{
        marginTop: 20,
        border: "1px solid #dbeafe",
        background: "#f5faff",
        borderRadius: 12,
        padding: "18px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Gestion des périodes de saisie</div>
          <div style={{ fontSize: 13, color: "#6b7681", marginTop: 3 }}>
            Ouvrez ou fermez chaque mois de l'exercice budgété par entité. Un mois fermé bloque la
            saisie de l'exploitation.
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#6b7681" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: "#16a34a",
                display: "inline-block",
              }}
            />
            Ouvert
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: "#cbd5e1",
                display: "inline-block",
              }}
            />
            Fermé
          </div>
        </div>
      </div>

      <div style={{ overflowX: "auto", marginTop: 14 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "170px repeat(12, 60px)",
            gap: 6,
            minWidth: 890,
          }}
        >
          <div />
          {SHORT.map((s) => (
            <div
              key={s}
              style={{
                textAlign: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#8a95a1",
                letterSpacing: "0.4px",
              }}
            >
              {s}
            </div>
          ))}
          {AGENCES.map((a) => (
            <Row key={a} agence={a} periods={state.periods[a]} toggle={togglePeriod} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({
  agence,
  periods,
  toggle,
}: {
  agence: string;
  periods: boolean[];
  toggle: (agence: string, m: number) => void;
}) {
  return (
    <>
      <div
        style={{ fontSize: 13, fontWeight: 600, color: "#3b4753", display: "flex", alignItems: "center" }}
      >
        {agence}
      </div>
      {MONTHS.map((mo, m) => {
        const o = periods[m];
        return (
          <button
            key={mo}
            onClick={() => toggle(agence, m)}
            title={mo + " — " + agence}
            style={{
              height: 30,
              border: "1px solid " + (o ? "#bbf7d0" : "#e2e8f0"),
              borderRadius: 7,
              background: o ? "#dcfce7" : "#f1f5f9",
              color: o ? "#166534" : "#64748b",
              fontFamily: "inherit",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {o ? "Ouvert" : "Fermé"}
          </button>
        );
      })}
    </>
  );
}
