import { useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import { SHORT } from "../../data/constants";
import type { Store } from "../../state/store";
import { BRAND, FS, INK, LINE, STATE, SURFACE } from "../../theme";
import EChart from "../EChart";
import { Card, CardHead, EmptyState, Toggle } from "../ui";

type SerieKey = "prev" | "declare" | "objectif";

/**
 * Évolution mensuelle du CA : le budget de l'exercice, celui de N-1, et l'objectif.
 *
 * Une seule série est colorée — celle qu'on vient lire. Les deux autres sont du
 * contexte et restent grises : trois couleurs vives faisaient trois sujets là où
 * il n'y en a qu'un.
 *
 * Par défaut la courbe ne porte que sur les chantiers **entièrement budgétés**. En
 * pleine campagne, additionner les budgets à moitié remplis fait plonger la courbe
 * sur les mois non saisis : on lit une chute d'activité là où il n'y a qu'un retard
 * de déclaration. La case « Chantiers entièrement budgétés » bascule sur tout le
 * saisi, mois partiels compris — l'évolution vs N-1 n'est alors plus comparable et
 * n'est plus affichée.
 */
export default function MonthlyEvolutionChart({ store }: { store: Store }) {
  const { state, engine } = store;
  // L'exercice est celui choisi dans le header : le graphique n'a pas de période à lui.
  const year = state.year;
  const view = engine;
  const isGlobal = !engine.isExploit;
  const [comparable, setComparable] = useState(true);
  const { rows, count, total: portefeuille } = view.monthly(isGlobal, comparable);
  const [shown, setShown] = useState<Record<SerieKey, boolean>>({
    prev: true,
    declare: true,
    objectif: true,
  });

  const series: { key: SerieKey; label: string; color: string; dashed?: boolean; width: number }[] = [
    { key: "declare", label: "Budgété " + year, color: BRAND.base, width: 2.5 },
    { key: "objectif", label: "Objectif CDG " + year, color: INK.muted, dashed: true, width: 1.5 },
    { key: "prev", label: "Budgété " + (year - 1), color: "#b6c0c9", width: 1.5 },
  ];

  // Les deux totaux se lisent sur les mêmes mois, sinon l'écart mesure le remplissage.
  const months = rows.filter((r) => r.declare !== null && r.prev !== null);
  const total = months.reduce((a, r) => a + r.declare!, 0);
  const totalPrev = months.reduce((a, r) => a + r.prev!, 0);
  // Hors périmètre comparable, un mois partiel se compare à un mois complet : on se tait.
  const evolution = comparable && totalPrev ? ((total - totalPrev) / totalPrev) * 100 : null;
  const vide = comparable && count === 0;

  const option = useMemo<EChartsOption>(() => {
    const data: Record<SerieKey, (number | null)[]> = {
      prev: rows.map((r) => (r.prev === null ? null : Math.round(r.prev))),
      declare: rows.map((r) => (r.declare === null ? null : Math.round(r.declare))),
      objectif: rows.map((r) => (r.objectif === null ? null : Math.round(r.objectif))),
    };

    return {
      animationDuration: 500,
      grid: { top: 20, right: 16, bottom: 24, left: 62 },
      tooltip: {
        trigger: "axis",
        backgroundColor: INK.strong,
        borderWidth: 0,
        padding: [9, 12],
        textStyle: { color: "#fff", fontSize: 12, fontFamily: "Barlow, Helvetica, sans-serif" },
        axisPointer: { type: "line", lineStyle: { color: "#cbd5e1", width: 1 } },
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
                (d >= 0 ? "#86efac" : "#fca5a5") +
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
        axisLine: { lineStyle: { color: LINE.base } },
        axisLabel: { color: INK.muted, fontSize: 11, fontFamily: "Barlow, Helvetica, sans-serif" },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: LINE.soft } },
        axisLabel: {
          color: INK.muted,
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
          symbolSize: 6,
          // Une courbe qui s'interrompt dit le trou ; un trait qui l'enjambe le cache.
          connectNulls: false,
          z: s.key === "declare" ? 3 : 1,
          lineStyle: { color: s.color, width: s.width, type: s.dashed ? "dashed" : "solid" },
          itemStyle: { color: s.color, borderWidth: 2, borderColor: SURFACE.card },
        })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, view, year, shown.prev, shown.declare, shown.objectif]);

  return (
    <Card style={{ display: "flex", flexDirection: "column" }}>
      <CardHead
        title="Évolution mensuelle du CA"
        hint={
          (engine.isExploit ? "mon périmètre · " : "") +
          (comparable
            ? count + " chantiers entièrement budgétés sur " + portefeuille
            : portefeuille + " chantiers, mois partiels compris")
        }
        right={
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span
              style={{
                fontSize: FS.lead,
                fontWeight: 700,
                color: INK.strong,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {view.fmt(total)}
            </span>
            {evolution !== null ? (
              <span
                title={"Comparé aux mêmes mois de " + (year - 1) + ", sur les mêmes chantiers."}
                style={{
                  fontSize: FS.body,
                  fontWeight: 700,
                  color: evolution >= 0 ? STATE.good : STATE.danger,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {(evolution >= 0 ? "+" : "−") +
                  Math.abs(evolution).toFixed(1).replace(".", ",") +
                  " % vs " +
                  (year - 1)}
              </span>
            ) : (
              !comparable && (
                <span style={{ fontSize: FS.small, fontWeight: 600, color: STATE.warn }}>
                  saisie partielle — évolution non comparable
                </span>
              )
            )}
          </div>
        }
      />

      {/* Ce qu'on compare, et sur quel périmètre on le compare. */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {series.map((s) => (
          <Toggle
            key={s.key}
            on={shown[s.key]}
            accent={s.color}
            onClick={() => setShown((p) => ({ ...p, [s.key]: !p[s.key] }))}
          >
            {s.label}
          </Toggle>
        ))}

        <span style={{ flex: 1 }} />

        <Toggle
          on={comparable}
          onClick={() => setComparable((c) => !c)}
          title={
            comparable
              ? "Décocher pour agréger aussi les budgets incomplets — la courbe descendra sur les mois non saisis, qui comptent alors pour zéro."
              : "Cocher pour ne garder que les chantiers dont les douze mois sont saisis : les seuls comparables d'un exercice à l'autre."
          }
        >
          Chantiers entièrement budgétés
        </Toggle>
      </div>

      {/* Hauteur explicite : un enfant en height 100 % dans un parent flex auto se replierait à zéro. */}
      <div style={{ height: 280, marginTop: 10 }}>
        {vide ? (
          <EmptyState
            title={"Aucun budget complet sur l'exercice " + year}
            hint="La courbe apparaîtra dès qu'un chantier aura ses douze mois saisis. Décochez « Chantiers entièrement budgétés » pour visualiser la saisie en cours, mois partiels compris."
          />
        ) : (
          <EChart option={option} />
        )}
      </div>

      {!comparable && (
        <div style={{ fontSize: FS.small, color: STATE.warn, marginTop: 10 }}>
          Tous les chantiers saisis sont agrégés : sur les mois qu'un budget n'a pas encore
          renseignés, il compte pour zéro et tire la courbe vers le bas.
        </div>
      )}
    </Card>
  );
}
