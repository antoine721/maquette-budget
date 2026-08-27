import { SHORT } from "../../data/constants";
import type { Store } from "../../state/store";

/**
 * Coefficients de baseline du contrôle de gestion — éditables en rôle CG,
 * ils recalculent la baseline de tous les chantiers du périmètre.
 */
export default function Coefficients({
  store,
  mIdx,
  gridCols,
  tableMin,
}: {
  store: Store;
  mIdx: number[];
  gridCols: string;
  tableMin: string;
}) {
  const { state, engine, addRef, setRefValue } = store;
  const isCG = engine.isCG;

  return (
    <div
      style={{
        marginTop: 14,
        border: "1px solid #e6eaee",
        borderRadius: 12,
        padding: "18px 20px",
        background: "#fbfcfd",
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
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            Coefficients de baseline — contrôle de gestion
          </div>
          <div style={{ fontSize: 13, color: "#6b7681", marginTop: 3 }}>
            {isCG
              ? "Éditez les coefficients mensuels : ils recalculent la baseline de tous les chantiers du périmètre."
              : "Coefficients posés par le contrôle de gestion, appliqués au réalisé N-1 pour produire la baseline."}
          </div>
        </div>
        <button
          onClick={addRef}
          style={{
            padding: "8px 13px",
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
          + Ajouter un coefficient
        </button>
      </div>

      <div style={{ overflowX: "auto", marginTop: 14 }}>
        <div style={{ minWidth: tableMin }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridCols,
              alignItems: "center",
              borderBottom: "1px solid #eef1f4",
            }}
          >
            <div
              style={{
                padding: "8px 0",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.7px",
                textTransform: "uppercase",
                color: "#8a95a1",
              }}
            >
              Coefficient
            </div>
            {mIdx.map((m) => (
              <div
                key={m}
                style={{
                  padding: 8,
                  textAlign: "right",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#8a95a1",
                }}
              >
                {SHORT[m]}
              </div>
            ))}
            <div
              style={{
                padding: "8px 16px",
                textAlign: "right",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.7px",
                textTransform: "uppercase",
                color: "#8a95a1",
              }}
            >
              Moy.
            </div>
          </div>

          {state.refs.map((r, ri) => (
            <div
              key={r.id}
              style={{
                display: "grid",
                gridTemplateColumns: gridCols,
                alignItems: "center",
                borderBottom: "1px solid #f1f4f7",
              }}
            >
              <div
                style={{
                  padding: "9px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 0,
                }}
              >
                <span
                  style={{ width: 7, height: 7, borderRadius: 2, flex: "0 0 7px", background: r.dot }}
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.label}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{r.role}</div>
                </div>
              </div>

              {mIdx.map((m) => (
                <div key={m} style={{ padding: "5px 4px", textAlign: "right" }}>
                  {isCG ? (
                    <input
                      value={String(r.values[m])}
                      onChange={(e) => setRefValue(ri, m, e.target.value)}
                      style={{
                        width: "100%",
                        padding: "5px 6px",
                        textAlign: "right",
                        border: "1px solid #bfe3f6",
                        borderRadius: 6,
                        background: "#fff",
                        fontSize: 12.5,
                        fontVariantNumeric: "tabular-nums",
                        color: "#17202a",
                      }}
                    />
                  ) : (
                    <span
                      style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums", color: "#475569" }}
                    >
                      {(Number(r.values[m]) || 0).toFixed(1).replace(".", ",") + " %"}
                    </span>
                  )}
                </div>
              ))}

              <div
                style={{
                  padding: "9px 16px",
                  textAlign: "right",
                  fontSize: 13,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: "#475569",
                }}
              >
                {(mIdx.reduce((a, m) => a + (Number(r.values[m]) || 0), 0) / mIdx.length)
                  .toFixed(2)
                  .replace(".", ",") + " %"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
