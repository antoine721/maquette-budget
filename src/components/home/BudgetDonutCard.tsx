import { useMemo, useRef } from "react";
import type { EChartsOption } from "echarts";
import type { Chantier } from "../../data/chantiers";
import type { Store } from "../../state/store";
import EChart, { type EChartsInstance } from "../EChart";

export interface BudgetSegment {
  key: string;
  label: string;
  color: string;
  hint: string;
  list: Chantier[];
  pick: () => void;
}

/** Les quatre états de budget suivis par l'anneau, et le filtre que chacun applique au tableau. */
export function budgetSegments(store: Store): BudgetSegment[] {
  const { engine, set } = store;
  const g = engine.budgetGroups();
  const go = (fStatut: string, onlyTodo: boolean) => () =>
    set({
      tab: "Tableau prévisionnel",
      fStatut,
      onlyTodo,
      fSearch: "",
      searchDraft: "",
      hoverSeg: null,
    });
  return [
    {
      key: "remplir",
      label: "À remplir",
      color: "#dc2626",
      hint: "mois ouverts non saisis",
      list: g.remplir,
      pick: go("Tous les statuts", true),
    },
    {
      key: "cours",
      label: "En cours",
      color: "#f59e0b",
      hint: "saisie faite, en attente de validation",
      list: g.cours,
      pick: go("À valider", false),
    },
    {
      key: "fini",
      label: "Terminés",
      color: "#16a34a",
      hint: "validés ou clôturés",
      list: g.fini,
      pick: go("Validé", false),
    },
    {
      key: "attente",
      label: "Non budgétisés / baseline non publiée",
      color: "#94a3b8",
      hint: "pas de budget ou saisie pas encore ouverte",
      list: g.attente,
      pick: go("Non budgétisé", false),
    },
  ].filter((x) => x.list.length || x.key !== "attente");
}

/** Anneau « État des budgets » — chaque segment renvoie au tableau filtré. */
export default function BudgetDonutCard({ store }: { store: Store }) {
  const { state, engine, set } = store;
  const segs = budgetSegments(store);
  const tot = segs.reduce((a, x) => a + x.list.length, 0) || 1;
  const chartRef = useRef<EChartsInstance | null>(null);

  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 420,
      series: [
        {
          type: "pie",
          radius: ["62%", "89%"],
          center: ["50%", "50%"],
          startAngle: 90,
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          cursor: "pointer",
          itemStyle: { borderWidth: 0 },
          emphasis: { focus: "self", scaleSize: 4 },
          blur: { itemStyle: { opacity: 0.32 } },
          data: segs.map((x) => ({
            name: x.key,
            value: x.list.length,
            itemStyle: { color: x.color },
          })),
        },
      ],
    }),
    // Les segments sont reconstruits à chaque rendu ; seule leur substance compte ici.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [segs.map((x) => x.key + ":" + x.list.length).join("|")],
  );

  /** Synchronise la légende vers l'anneau. */
  const focusSegment = (key: string | null) => {
    set({ hoverSeg: key });
    const chart = chartRef.current;
    if (!chart) return;
    const index = segs.findIndex((x) => x.key === key);
    chart.dispatchAction({ type: "downplay", seriesIndex: 0 });
    if (index >= 0) chart.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex: index });
  };

  const hit = segs.find((x) => x.key === state.hoverSeg);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e6eaee",
        borderRadius: 14,
        padding: "16px 18px",
      }}
    >
      <div style={{ fontSize: 13.5, fontWeight: 700 }}>État des budgets</div>
      <div style={{ fontSize: 11.5, color: "#8a95a1", marginTop: 2 }}>
        {engine.isExploit
          ? "Exercice " + state.year + " · mon périmètre"
          : "Exercice " +
            state.year +
            (state.fEntity === "Toutes" ? " · toutes entités" : " · " + state.fEntity)}
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
        <div
          onMouseLeave={() => set({ hoverSeg: null })}
          style={{ position: "relative", width: 176, height: 176 }}
        >
          <EChart
            option={option}
            instanceRef={chartRef}
            events={{
              mouseover: (p: { name: string }) => set({ hoverSeg: p.name }),
              mouseout: () => set({ hoverSeg: null }),
              click: (p: { name: string }) => segs.find((x) => x.key === p.name)?.pick(),
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 30,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.8px",
                color: hit ? hit.color : "#17202a",
                lineHeight: 1,
              }}
            >
              {hit ? hit.list.length : engine.perim().length}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#8a95a1",
                marginTop: 4,
                textAlign: "center",
                lineHeight: 1.25,
              }}
            >
              {hit ? hit.label : "chantiers suivis"}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8 }}>
        {segs.map((x) => {
          const on = state.hoverSeg === x.key;
          return (
            <button
              key={x.key}
              onClick={x.pick}
              onMouseEnter={() => focusSegment(x.key)}
              onMouseLeave={() => focusSegment(null)}
              title={x.hint}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "7px 9px",
                border: 0,
                borderRadius: 8,
                background: on ? "#f8fafb" : "#fff",
                fontFamily: "inherit",
                textAlign: "left",
                cursor: "pointer",
                transition: "background 150ms ease",
              }}
            >
              <span
                style={{ flex: "0 0 auto", width: 9, height: 9, borderRadius: 3, background: x.color }}
              />
              <span
                style={{
                  minWidth: 0,
                  flex: 1,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#3b4753",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {x.label}
              </span>
              <span style={{ flex: "0 0 auto", fontSize: 13, fontWeight: 700, color: x.color }}>
                {x.list.length}
              </span>
              <span
                style={{
                  flex: "0 0 auto",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#6b7681",
                  width: 40,
                  textAlign: "right",
                }}
              >
                {Math.round((x.list.length / tot) * 100)} %
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
