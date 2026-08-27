import { useMemo, useRef, useState } from "react";
import type { EChartsOption } from "echarts";
import { CONFIG } from "../../config";
import { ST, STATUT_OPTS, type Statut } from "../../data/constants";
import type { Chantier } from "../../data/chantiers";
import type { Engine } from "../../lib/engine";
import type { Store } from "../../state/store";
import EChart, { type EChartsInstance } from "../EChart";
import { CARD } from "./cardStyles";
import YearSelect from "./YearSelect";

export interface StatutSegment {
  key: Statut;
  label: string;
  color: string;
  hint: string;
  list: Chantier[];
  pick: () => void;
}

const HINTS: Record<Statut, string> = {
  "En attente baseline CG": "la saisie n'est pas encore ouverte à l'exploitation",
  "Non budgétisé": "baseline publiée, aucun mois saisi",
  "En saisie": "saisie commencée, pas encore envoyée",
  "À valider": "envoyé, en attente du contrôle de gestion",
  Validé: "cristallisation validée",
  Clôturé: "exercice clos, consultation seule",
};

/** Répartition du portefeuille par statut du cycle, dans l'ordre du circuit. */
export function statutSegments(store: Store, view: Engine): StatutSegment[] {
  const { set } = store;
  const list = view.perim();
  return STATUT_OPTS.map((st) => ({
    key: st,
    label: view.statutLabel(st),
    color: ST[st].accent,
    hint: HINTS[st],
    list: list.filter((ch) => view.st(ch) === st),
    pick: () =>
      set({
        tab: "Tableau prévisionnel",
        year: view.s.year,
        fStatuts: [st],
        onlyTodo: false,
        fSearch: "",
        searchDraft: "",
        hoverSeg: null,
      }),
  })).filter((x) => x.list.length);
}

/**
 * Avancement de la déclaration **en nombre de chantiers**, ventilé par statut.
 * Le centre porte la part de budgets terminés ; chaque segment renvoie au tableau filtré.
 */
export default function BudgetDonutCard({ store, compact }: { store: Store; compact?: boolean }) {
  const { state, engine, set } = store;
  const [year, setYear] = useState(CONFIG.campaignYear);
  const view = engine.atYear(year);

  const segs = statutSegments(store, view);
  const tot = segs.reduce((a, x) => a + x.list.length, 0) || 1;
  const done = segs
    .filter((x) => x.key === "Validé" || x.key === "Clôturé")
    .reduce((a, x) => a + x.list.length, 0);
  const donePct = Math.round((done / tot) * 100);
  const chartRef = useRef<EChartsInstance | null>(null);

  const ringPx = compact ? 132 : 176;
  const inset = Math.round(ringPx * (compact ? 0.2 : 0.24));

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

  const focusSegment = (key: string | null) => {
    set({ hoverSeg: key });
    const chart = chartRef.current;
    if (!chart) return;
    const index = segs.findIndex((x) => x.key === key);
    chart.dispatchAction({ type: "downplay", seriesIndex: 0 });
    if (index >= 0) chart.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex: index });
  };

  const hit = segs.find((x) => x.key === state.hoverSeg);
  const centerPct = hit ? Math.round((hit.list.length / tot) * 100) : donePct;
  const centerColor = hit
    ? hit.color
    : donePct >= 90
      ? "#16a34a"
      : donePct >= 50
        ? "#0a9bd8"
        : "#dc2626";

  return (
    <div style={CARD}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>
            Avancement — en chantiers
          </div>
          <div style={{ fontSize: 11.5, color: "#8a95a1", marginTop: 2 }}>
            {tot} chantiers suivis · par statut
          </div>
        </div>
        <YearSelect year={year} onChange={setYear} />
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
        <div
          onMouseLeave={() => set({ hoverSeg: null })}
          style={{ position: "relative", width: ringPx, height: ringPx }}
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
              inset,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontSize: compact ? 22 : 32,
                fontWeight: 700,
                letterSpacing: "-1px",
                color: centerColor,
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {centerPct} %
            </span>
            <span
              style={{
                fontSize: compact ? 9.5 : 10.5,
                fontWeight: 600,
                color: "#8a95a1",
                marginTop: 3,
                textAlign: "center",
                lineHeight: 1.2,
                overflow: "hidden",
              }}
            >
              {hit ? hit.label : compact ? "terminés" : "budgets terminés"}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 8 }}>
        {segs.map((x) => {
          const on = state.hoverSeg === x.key;
          return (
            <button
              key={x.key}
              onClick={x.pick}
              onMouseEnter={() => focusSegment(x.key)}
              onMouseLeave={() => focusSegment(null)}
              title={x.hint + " — cliquer pour filtrer le tableau"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 8px",
                border: 0,
                borderRadius: 7,
                background: on ? "#f4f6f8" : "#fff",
                fontFamily: "inherit",
                textAlign: "left",
                cursor: "pointer",
                transition: "background 150ms ease",
              }}
            >
              <span
                style={{ flex: "0 0 auto", width: 8, height: 8, borderRadius: 2, background: x.color }}
              />
              <span
                style={{
                  minWidth: 0,
                  flex: 1,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#3b4753",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {x.label}
              </span>
              <span style={{ flex: "0 0 auto", fontSize: 12, fontWeight: 700, color: x.color }}>
                {x.list.length}
              </span>
              <span
                style={{
                  flex: "0 0 auto",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#6b7681",
                  width: 44,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums",
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
