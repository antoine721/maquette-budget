import { useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import { CONFIG } from "../../config";
import { SHORT } from "../../data/constants";
import type { Store } from "../../state/store";
import EChart from "../EChart";
import { CARD } from "./cardStyles";
import YearSelect from "./YearSelect";

type SerieKey = "prev" | "declare" | "objectif";

/**
 * Évolution mensuelle du CA, en courbes : budgété N-1, budgété N et objectif CDG N.
 * Toujours affichée ; seules les séries se filtrent.
 */
export default function MonthlyEvolutionChart({ store }: { store: Store }) {
  const { engine } = store;
  const [year, setYear] = useState(CONFIG.campaignYear);
  const view = engine.atYear(year);
  const isGlobal = !engine.isExploit;
  const rows = view.monthly(isGlobal);
  const [shown, setShown] = useState<Record<SerieKey, boolean>>({
    prev: true,
    declare: true,
    objectif: true,
  });

  const series: { key: SerieKey; label: string; color: string; dashed?: boolean }[] = [
    { key: "prev", label: "Budgété " + (year - 1), color: "#94a3b8" },
    { key: "declare", label: "Budgété " + year, color: "#0a9bd8" },
    { key: "objectif", label: "Objectif CDG " + year, color: "#8b5cf6", dashed: true },
  ];

  const total = rows.reduce((a, r) => a + (r.declare || 0), 0);
  const totalPrev = rows.reduce((a, r) => a + (r.prev || 0), 0);
  const evolution = totalPrev ? ((total - totalPrev) / totalPrev) * 100 : null;

  const option = useMemo<EChartsOption>(() => {
    const data: Record<SerieKey, (number | null)[]> = {
      prev: rows.map((r) => (r.prev === null ? null : Math.round(r.prev))),
      declare: rows.map((r) => (r.declare === null ? null : Math.round(r.declare))),
      objectif: rows.map((r) => Math.round(r.objectif)),
    };

    return {
      animationDuration: 500,
      grid: { top: 26, right: 16, bottom: 24, left: 58 },
      tooltip: {
        trigger: "axis",
        backgroundColor: "#17202a",
        borderWidth: 0,
        padding: [8, 11],
        textStyle: { color: "#fff", fontSize: 12, fontFamily: "Barlow, Helvetica, sans-serif" },
        formatter: (params: unknown) => {
          const list = params as { dataIndex: number }[];
          const i = list[0].dataIndex;
          const a = data.declare[i];
          const b = data.prev[i];
          const d = a !== null && b ? ((a - b) / b) * 100 : null;
          const lines = series
            .filter((s) => shown[s.key])
            .map(
              (s) =>
                '<span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:' +
                s.color +
                ';margin-right:6px"></span>' +
                s.label +
                "&nbsp;: <b>" +
                view.fmt(data[s.key][i]) +
                "</b>",
            );
          if (d !== null)
            lines.push(
              '<span style="color:' +
                (d >= 0 ? "#4ade80" : "#fca5a5") +
                '">' +
                (d >= 0 ? "+" : "−") +
                Math.abs(d).toFixed(1).replace(".", ",") +
                " % vs " +
                (year - 1) +
                "</span>",
            );
          return "<b>" + SHORT[i] + "</b><br/>" + lines.join("<br/>");
        },
      },
      xAxis: {
        type: "category",
        data: SHORT.slice(),
        boundaryGap: false,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#e6eaee" } },
        axisLabel: { color: "#8a95a1", fontSize: 11, fontFamily: "Barlow, Helvetica, sans-serif" },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#f1f4f7" } },
        axisLabel: {
          color: "#8a95a1",
          fontSize: 11,
          fontFamily: "Barlow, Helvetica, sans-serif",
          formatter: (v: number) => view.fmt(v),
        },
      },
      series: series
        .filter((s) => shown[s.key])
        .map((s) => ({
          name: s.label,
          type: "line" as const,
          data: data[s.key],
          smooth: true,
          symbol: "circle",
          symbolSize: 5,
          connectNulls: true,
          lineStyle: { color: s.color, width: 2, type: s.dashed ? "dashed" : "solid" },
          itemStyle: { color: s.color },
        })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, view, year, shown.prev, shown.declare, shown.objectif]);

  return (
    <div style={{ ...CARD, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>Évolution mensuelle du CA</span>
        <span style={{ fontSize: 11.5, color: "#8a95a1" }}>
          {engine.isExploit ? "mon périmètre" : "consolidé"}
        </span>
        <YearSelect year={year} onChange={setYear} />
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#17202a" }}>{view.fmt(total)}</span>
        {evolution !== null && (
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: evolution >= 0 ? "#15803d" : "#dc2626",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {(evolution >= 0 ? "+" : "−") +
              Math.abs(evolution).toFixed(1).replace(".", ",") +
              " % vs " +
              (year - 1)}
          </span>
        )}
      </div>

      {/* Filtres de séries : on choisit ce que l'on compare. */}
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        {series.map((s) => {
          const on = shown[s.key];
          return (
            <button
              key={s.key}
              onClick={() => setShown((p) => ({ ...p, [s.key]: !p[s.key] }))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "5px 11px",
                border: "1px solid " + (on ? s.color + "55" : "#e6eaee"),
                borderRadius: 999,
                background: on ? s.color + "14" : "#fff",
                color: on ? "#17202a" : "#a8b1ba",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 0,
                  borderTop: (s.dashed ? "2px dashed " : "2px solid ") + (on ? s.color : "#cbd5e1"),
                }}
              />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Hauteur explicite : un enfant en height 100 % dans un parent flex auto se replierait à zéro. */}
      <div style={{ height: 290, marginTop: 6 }}>
        <EChart option={option} />
      </div>
    </div>
  );
}
