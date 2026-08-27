import { useMemo, useRef, useState } from "react";
import type { EChartsOption } from "echarts";
import { CONFIG } from "../../config";
import { CAT_COLORS, type CatKey } from "../../data/constants";
import type { Store } from "../../state/store";
import EChart, { type EChartsInstance } from "../EChart";
import { CARD } from "./cardStyles";
import YearSelect from "./YearSelect";

/** Part grise du portefeuille pas encore déclarée — l'anneau complet vaut l'objectif CDG. */
const RESTE = "reste";

/**
 * Avancement de la déclaration **en valeur de CA**.
 *
 * L'anneau complet vaut 100 % de l'objectif CDG ; les quatre catégories sont des
 * parts du déclaré et le solde ferme l'anneau en gris. Le centre porte le
 * pourcentage d'atteinte, la légende ne garde que la part de chaque catégorie.
 */
export default function CaGaugeCard({ store, compact }: { store: Store; compact?: boolean }) {
  const { state, engine, set } = store;
  const [year, setYear] = useState(CONFIG.campaignYear);
  const view = engine.atYear(year);
  const isGlobal = !engine.isExploit;
  const parts = view.caParts(isGlobal);
  const baseTotal = view.caBaseTotal(isGlobal);
  const declared = parts.reduce((a, x) => a + x.value, 0);
  const pct = view.caPct(isGlobal);
  const chartRef = useRef<EChartsInstance | null>(null);

  const ringPx = compact ? 132 : 176;
  const inset = Math.round(ringPx * (compact ? 0.2 : 0.24));

  const option = useMemo<EChartsOption>(() => {
    type Slice = {
      name: string;
      value: number;
      itemStyle: { color: string };
      emphasis?: { disabled: boolean };
    };
    const data: Slice[] = parts.map((x) => ({
      name: x.key,
      value: Math.max(0, x.value),
      itemStyle: { color: CAT_COLORS[x.key as CatKey] },
    }));
    const reste = Math.max(0, baseTotal - declared);
    if (reste > 0)
      data.push({
        name: RESTE,
        value: reste,
        itemStyle: { color: "#eef1f4" },
        emphasis: { disabled: true },
      });

    return {
      animationDuration: 420,
      series: [
        {
          type: "pie",
          radius: ["71%", "93%"],
          center: ["50%", "50%"],
          startAngle: 90,
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          cursor: "pointer",
          itemStyle: { borderWidth: 0 },
          emphasis: { focus: "self", scaleSize: 3 },
          blur: { itemStyle: { opacity: 0.35 } },
          data,
        },
      ],
    };
  }, [parts, baseTotal, declared]);

  const focusSegment = (key: string | null) => {
    set({ hoverSeg: key });
    const chart = chartRef.current;
    if (!chart) return;
    const index = parts.findIndex((x) => x.key === key);
    chart.dispatchAction({ type: "downplay", seriesIndex: 0 });
    if (index >= 0) chart.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex: index });
  };

  const hovered = parts.find((x) => x.key === state.hoverSeg);
  const centerPct = hovered && declared ? Math.round((hovered.value / declared) * 100) : pct;
  const centerLabel = hovered ? hovered.label : "de l'objectif CDG";
  const centerColor = hovered
    ? CAT_COLORS[hovered.key as CatKey]
    : pct >= 100
      ? "#15803d"
      : pct >= 70
        ? "#0a9bd8"
        : "#dc2626";

  return (
    <div style={CARD}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>
            {engine.isExploit ? "Avancement — en CA" : "Avancement — en CA (consolidé)"}
          </div>
          <div style={{ fontSize: 11.5, color: "#8a95a1", marginTop: 2 }}>
            {engine.isExploit
              ? "mon périmètre"
              : state.fEntity === "Toutes"
                ? "toutes entités"
                : state.fEntity}
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
              mouseover: (p: { name: string }) =>
                set({ hoverSeg: p.name === RESTE ? null : p.name }),
              mouseout: () => set({ hoverSeg: null }),
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
              {hovered ? centerLabel : compact ? "de l'objectif" : centerLabel}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 8,
          textAlign: "center",
          fontSize: 12.5,
          color: "#3b4753",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <strong style={{ fontWeight: 700, color: "#17202a" }}>{view.fmt(declared)}</strong>
        <span style={{ color: "#8a95a1" }}> déclarés sur {view.fmt(baseTotal)}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 8 }}>
        {parts.map((x) => {
          const share = declared ? Math.round((x.value / declared) * 100) : 0;
          return (
            <div
              key={x.key}
              onMouseEnter={() => focusSegment(x.key)}
              onMouseLeave={() => focusSegment(null)}
              title={
                x.label +
                " — déclaré " +
                view.fmt(x.value) +
                " · objectif " +
                view.fmt(x.base) +
                (x.base ? " (" + Math.round((x.value / x.base) * 100) + " % de l'objectif)" : "")
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 8px",
                borderRadius: 7,
                background: state.hoverSeg === x.key ? "#f4f6f8" : "transparent",
                transition: "background 140ms ease",
                cursor: "default",
              }}
            >
              <span
                style={{
                  flex: "0 0 auto",
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: CAT_COLORS[x.key as CatKey],
                }}
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
              <span
                style={{
                  flex: "0 0 auto",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#6b7681",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {share} %
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
