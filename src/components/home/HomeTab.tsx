import { FULL_YEAR, ST, type Statut } from "../../data/constants";
import { REX } from "../../data/chantiers";
import type { Store } from "../../state/store";
import BudgetDonutCard from "./BudgetDonutCard";
import CampaignBanner from "./CampaignBanner";
import CampaignModal from "./CampaignModal";
import CaGaugeCard from "./CaGaugeCard";
import ChantierListCard, { type ChantierListRow } from "./ChantierListCard";
import MonthlyEvolutionChart from "./MonthlyEvolutionChart";
import { CARD, COL_HEAD } from "./cardStyles";

const REX_GRID = "210px 80px 1fr 160px 120px 100px";

/**
 * Accueil. Deux situations à présenter :
 *
 * - **en campagne** — l'avancement de la déclaration prime : rappel modal, deux
 *   anneaux (en CA et en nombre de chantiers) et les chantiers à traiter ;
 * - **hors campagne** — la saisie n'a plus d'objet : l'évolution mensuelle du CA
 *   passe au premier plan et les anneaux se réduisent sur la droite.
 *
 * Le contrôle de gestion voit les mêmes blocs en valeurs globales, plus les
 * budgets à valider, les chantiers non traités et l'avancement par REX.
 */
export default function HomeTab({ store }: { store: Store }) {
  const { state, engine } = store;
  const open = engine.campaignOpen();

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: "22px 28px 48px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <CampaignBanner store={store} />

      {/* Une période bloquante posée par le contrôle de gestion s'annonce ici, avec sa raison. */}
      {(() => {
        const block = engine.activeBlock();
        if (!block) return null;
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              background: "#fff7f7",
              border: "1px solid #fecaca",
              borderLeft: "3px solid #dc2626",
              borderRadius: 12,
            }}
          >
            <span style={{ fontSize: 15 }}>🔒</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#991b1b" }}>
                Période « {block.label} » — modifications bloquées
              </div>
              <div style={{ fontSize: 12.5, color: "#b91c1c", marginTop: 1 }}>
                {block.reason || "Aucune raison précisée par le contrôle de gestion."}
                <span style={{ color: "#c98b8b" }}> · {block.window}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {open ? <CampaignLayout store={store} /> : <HistoryLayout store={store} />}

      {engine.isCG && <RexConsolidated store={store} />}

      {open && state.campaignModal && <CampaignModal store={store} />}
    </div>
  );
}

/** Pendant la fenêtre de déclaration : avancement et chantiers à traiter. */
function CampaignLayout({ store }: { store: Store }) {
  const { state, engine, set, openChantier } = store;

  // Chaque rôle a ses propres priorités : mois manquants pour l'exploitation,
  // baselines à publier et marges sous objectif pour le contrôle de gestion.
  const todoAll = engine
    .perim()
    .map((ch) => ({ ch, t: engine.todoFor(ch, FULL_YEAR, state.role) }))
    .filter((x) => x.t)
    .sort((a, b) => (a.t!.crit ? 0 : 1) - (b.t!.crit ? 0 : 1) || b.ch.ca - a.ch.ca);

  const todo: ChantierListRow[] = todoAll.slice(0, 6).map(({ ch, t }) => ({
    ch,
    tag: t!.tag,
    tagBg: t!.crit ? "#fee2e2" : "#fef3c7",
    tagFg: t!.crit ? "#991b1b" : "#92400e",
    accent: t!.crit ? "#dc2626" : "#f59e0b",
    hint: t!.hint,
    hintColor: t!.crit ? "#b91c1c" : "#92400e",
  }));

  const crit = todoAll.filter((x) => x.t!.crit).length;
  const todoCount = todoAll.length
    ? todoAll.length +
      " chantier" +
      (todoAll.length > 1 ? "s" : "") +
      (crit ? " · " + crit + " critique" + (crit > 1 ? "s" : "") : "")
    : "rien à traiter";

  const aValider: ChantierListRow[] = engine
    .aValider()
    .slice(0, 6)
    .map((ch) => ({
      ch,
      tag: "À valider",
      tagBg: ST["À valider"].bg,
      tagFg: ST["À valider"].fg,
      accent: ST["À valider"].accent,
      hint:
        REX[ch.id] +
        " · " +
        engine.fmt(engine.aggregate([ch], FULL_YEAR, "saisi", "ca", "Total")) +
        " déclarés — à contrôler",
      hintColor: "#0782b6",
    }));

  const nonTraites: ChantierListRow[] = engine
    .nonTraites()
    .slice(0, 6)
    .map((ch) => {
      const st = engine.st(ch) as Statut;
      const miss = engine.missing(ch, FULL_YEAR).length;
      const crit = st === "Non budgétisé" || st === "Baseline CG";
      return {
        ch,
        tag: st === "En saisie" ? miss + " mois manquants" : st,
        tagBg: crit ? "#fee2e2" : "#fef3c7",
        tagFg: crit ? "#991b1b" : "#92400e",
        accent: crit ? "#dc2626" : "#f59e0b",
        hint:
          REX[ch.id] +
          " · " +
          engine.fmt(ch.ca) +
          " de CA de référence" +
          (st === "Baseline CG" ? " — baseline pas encore publiée" : ""),
        hintColor: crit ? "#b91c1c" : "#92400e",
      };
    });

  const goTable = (fStatut: string, onlyTodo: boolean) => () =>
    set({ tab: "Tableau prévisionnel", fStatut, onlyTodo, fSearch: "", searchDraft: "" });

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "stretch" }}>
        <div style={{ flex: "0 1 330px", minWidth: 290 }}>
          <CaGaugeCard store={store} />
        </div>
        <div style={{ flex: "0 1 330px", minWidth: 290 }}>
          <BudgetDonutCard store={store} />
        </div>
        <div style={{ flex: "1 1 420px", minWidth: 320 }}>
          <ChantierListCard
            title="À traiter en priorité"
            dot="#dc2626"
            count={todoCount}
            rows={todo}
            empty="Rien à traiter sur ce périmètre."
            onOpen={openChantier}
            onSeeAll={goTable("Tous les statuts", true)}
          />
        </div>
      </div>

      {engine.isCG && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 420px", minWidth: 320 }}>
            <ChantierListCard
              title="Budgets à valider"
              dot="#0a9bd8"
              count={engine.aValider().length + " en attente de contrôle"}
              rows={aValider}
              empty="Aucune saisie en attente de contrôle."
              onOpen={openChantier}
              onSeeAll={goTable("À valider", false)}
            />
          </div>
          <div style={{ flex: "1 1 420px", minWidth: 320 }}>
            <ChantierListCard
              title="Chantiers non traités"
              dot="#f59e0b"
              count={engine.nonTraites().length + " chantiers"}
              rows={nonTraites}
              empty="Tous les chantiers sont engagés."
              onOpen={openChantier}
              onSeeAll={goTable("Tous les statuts", true)}
            />
          </div>
        </div>
      )}
    </>
  );
}

/** Hors campagne : lecture de l'exercice clos, les anneaux passent au second plan. */
function HistoryLayout({ store }: { store: Store }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "stretch" }}>
      <div style={{ flex: "1 1 560px", minWidth: 380 }}>
        <MonthlyEvolutionChart store={store} />
      </div>
      <div
        style={{
          flex: "0 1 300px",
          minWidth: 260,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <CaGaugeCard store={store} compact />
        <BudgetDonutCard store={store} compact />
      </div>
    </div>
  );
}

/** Vue consolidée réservée au contrôle de gestion : une ligne par responsable exploitation. */
function RexConsolidated({ store }: { store: Store }) {
  const { state, engine, set } = store;
  const names = Array.from(new Set(Object.values(REX)));

  const rows = names
    .map((nom) => {
      const list = engine
        .scope()
        .filter(
          (ch) =>
            REX[ch.id] === nom &&
            (state.fTag === "Tous les tags" || (state.tags[ch.id] || []).includes(state.fTag)),
        );
      let done = 0,
        tot = 0;
      list.forEach((ch) =>
        FULL_YEAR.forEach((m) => {
          tot++;
          if (engine.prims(ch, m, "saisi")) done++;
        }),
      );
      const pct = tot ? Math.round((done / tot) * 100) : 0;
      const aFaire = list.filter((ch) => engine.todoFor(ch, FULL_YEAR, "Exploitation")).length;
      const crit = list.filter((ch) => {
        const t = engine.todoFor(ch, FULL_YEAR, "Exploitation");
        return t && t.crit;
      }).length;
      const ca = engine.aggregate(list, FULL_YEAR, "saisi", "ca", "Total");
      const base = engine.aggregate(list, FULL_YEAR, "base", "ca", "Total", true);
      const ecart = ca === null || base === null || !base ? null : ((ca - base) / base) * 100;
      return {
        nom,
        pctNum: pct,
        initials: engine.initials(nom),
        agence: Array.from(new Set(list.map((ch) => ch.agence))).join(", ") || "—",
        nb: list.length,
        pct: pct + "%",
        color: pct >= 90 ? "#16a34a" : pct >= 50 ? "#0a9bd8" : "#dc2626",
        rest: aFaire
          ? aFaire + " à traiter" + (crit ? " · " + crit + " critique" + (crit > 1 ? "s" : "") : "")
          : "à jour",
        restColor: crit ? "#b91c1c" : aFaire ? "#92400e" : "#16a34a",
        ca: engine.fmt(ca),
        ecart:
          ecart === null ? "—" : (ecart >= 0 ? "+" : "") + ecart.toFixed(1).replace(".", ",") + " %",
        ecartColor:
          ecart === null ? "#94a3b8" : ecart >= 0 ? "#15803d" : ecart > -3 ? "#b45309" : "#dc2626",
        pick: () =>
          set({
            tab: "Tableau prévisionnel",
            fRex: state.fRex === nom ? "Tous" : nom,
            fSearch: "",
            searchDraft: "",
          }),
      };
    })
    // Les REX les moins avancés en premier : c'est là que le contrôle de gestion doit agir.
    .sort((a, b) => a.pctNum - b.pctNum);

  return (
    <div style={CARD}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Vue consolidée — avancement des REX</span>
        <span style={{ fontSize: 11.5, color: "#8a95a1" }}>
          {"Campagne " +
            state.year +
            (state.fEntity === "Toutes" ? " · toutes entités" : " · " + state.fEntity) +
            (state.fTag === "Tous les tags" ? "" : " · tag " + state.fTag) +
            " · les moins avancés en premier"}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: REX_GRID,
          alignItems: "center",
          gap: 10,
          marginTop: 14,
          paddingBottom: 8,
          borderBottom: "1px solid #eef1f4",
        }}
      >
        <span style={COL_HEAD}>Responsable exploitation</span>
        <span style={COL_HEAD}>Chantiers</span>
        <span style={COL_HEAD}>Avancement</span>
        <span style={COL_HEAD}>Reste à faire</span>
        <span style={{ ...COL_HEAD, textAlign: "right" }}>CA déclaré</span>
        <span style={{ ...COL_HEAD, textAlign: "right" }}>Écart obj.</span>
      </div>

      {rows.map((r) => (
        <div
          key={r.nom}
          className="hov-fa"
          onClick={r.pick}
          style={{
            display: "grid",
            gridTemplateColumns: REX_GRID,
            alignItems: "center",
            gap: 10,
            padding: "11px 0",
            borderBottom: "1px solid #f4f6f8",
            cursor: "pointer",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
            <span
              style={{
                flex: "0 0 auto",
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "#eef2ff",
                color: "#3730a3",
                fontSize: 10.5,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {r.initials}
            </span>
            <span style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#17202a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.nom}
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{r.agence}</span>
            </span>
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#3b4753" }}>{r.nb}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span
              style={{ flex: 1, height: 7, borderRadius: 6, background: "#eef1f4", overflow: "hidden" }}
            >
              <span style={{ display: "block", height: 7, width: r.pct, background: r.color }} />
            </span>
            <span style={{ flex: "0 0 auto", width: 40, fontSize: 12, fontWeight: 700, color: r.color }}>
              {r.pct}
            </span>
          </span>
          <span style={{ fontSize: 12, color: r.restColor, fontWeight: 600 }}>{r.rest}</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#17202a",
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {r.ca}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: r.ecartColor,
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {r.ecart}
          </span>
        </div>
      ))}
    </div>
  );
}
