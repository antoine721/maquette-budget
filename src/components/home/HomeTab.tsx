import { FULL_YEAR, ST, STATUT_OPTS, type Statut } from "../../data/constants";
import { REX } from "../../data/chantiers";
import type { Store } from "../../state/store";
import { BRAND, INK, STATE } from "../../theme";
import BudgetDonutCard from "./BudgetDonutCard";
import CaGaugeCard from "./CaGaugeCard";
import CampaignBanner from "./CampaignBanner";
import ChantierListCard, { type ChantierListRow } from "./ChantierListCard";
import MonthlyEvolutionChart from "./MonthlyEvolutionChart";
import { Kpi } from "../ui";

/**
 * Accueil : où en est la campagne, et que faire ensuite.
 *
 * La page suit l'exercice choisi dans le header. Elle se lit de haut en bas dans
 * l'ordre où l'on s'en sert : le cadre de la campagne, les quatre chiffres qui la
 * résument, le travail à faire, puis l'analyse. Chaque chiffre n'apparaît qu'une
 * fois et porte son dénominateur — quatre pourcentages d'avancement se
 * disputaient auparavant le même écran sans qu'on puisse les rapprocher.
 */
export default function HomeTab({ store }: { store: Store }) {
  const { engine } = store;
  const block = engine.activeBlock();

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: "20px 28px 48px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <CampaignBanner store={store} />

      {/* Une période bloquante posée par le contrôle de gestion s'annonce ici, avec sa raison. */}
      {block && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            background: STATE.dangerTint,
            border: "1px solid #f5c6c2",
            borderLeft: "3px solid " + STATE.danger,
            borderRadius: 12,
          }}
        >
          <span style={{ fontSize: 15 }}>🔒</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: STATE.danger }}>
              Période « {block.label} » — modifications bloquées
            </div>
            <div style={{ fontSize: 12, color: STATE.danger, marginTop: 1 }}>
              {block.reason || "Aucune raison précisée par le contrôle de gestion."}
              <span style={{ color: INK.muted }}> · {block.window}</span>
            </div>
          </div>
        </div>
      )}

      <KpiRow store={store} />
      <Work store={store} />
    </div>
  );
}

/**
 * Les quatre chiffres de la campagne. Le premier est la mesure de référence — la
 * part des mois de budget renseignés ; les trois autres l'éclairent sous un autre
 * angle, chacun avec le dénominateur sur lequel il se calcule.
 */
function KpiRow({ store }: { store: Store }) {
  const { engine, set } = store;
  const p = engine.progress(!engine.isExploit);
  const closed = engine.closed();

  const goTable = (patch: Record<string, unknown>) => () =>
    set({ tab: "Tableau prévisionnel", fSearch: "", searchDraft: "", ...patch });

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <Kpi
        label="BUDGETS DÉCLARÉS"
        value={p.declares + " / " + p.chantiers}
        meter={{ pct: p.chantiers ? (p.declares / p.chantiers) * 100 : 0, color: ST["À valider"].accent }}
        hint={closed ? "exercice clos" : p.aDeclarer + " chantiers pas encore commencés"}
        onClick={goTable({ fStatuts: ["À valider", "Validé"] as Statut[], onlyTodo: false })}
      />
      <Kpi
        label="BUDGETS VALIDÉS"
        value={p.termines + " / " + p.chantiers}
        meter={{ pct: p.chantiers ? (p.termines / p.chantiers) * 100 : 0, color: ST["Validé"].accent }}
        hint={closed ? "exercice clos" : p.aControler + " en attente de contrôle"}
        onClick={goTable({ fStatuts: ["Validé"] as Statut[], onlyTodo: false })}
      />
      <Kpi
        label="CA DÉCLARÉ"
        value={engine.fmt(p.declare)}
        meter={{ pct: p.partObjectif, color: BRAND.strong }}
        hint={p.partObjectif + " % de l'objectif CDG (" + engine.fmt(p.objectif) + ")"}
      />
      <Kpi
        label={engine.isExploit ? "À TRAITER" : "À CONTRÔLER"}
        value={String(p.aTraiter)}
        tone={p.critiques ? STATE.danger : INK.strong}
        hint={
          p.aTraiter === 0
            ? "rien en attente sur ce périmètre"
            : p.critiques + " critique" + (p.critiques > 1 ? "s" : "") + " · les plus gros CA d'abord"
        }
        onClick={goTable({ fStatuts: [...STATUT_OPTS], onlyTodo: true })}
      />
    </div>
  );
}

/** Le travail à faire, puis l'analyse. */
function Work({ store }: { store: Store }) {
  const { state, engine, set, openChantier } = store;
  const view = engine;

  // Chaque rôle a ses propres priorités : mois manquants pour l'exploitation,
  // baselines à publier et marges sous objectif pour le contrôle de gestion.
  const todoAll = view
    .perim()
    .map((ch) => ({ ch, t: view.todoFor(ch, FULL_YEAR, state.role) }))
    .filter((x) => x.t)
    .sort((a, b) => (a.t!.crit ? 0 : 1) - (b.t!.crit ? 0 : 1) || b.ch.ca - a.ch.ca);

  /** Ce qui distingue une ligne d'une autre : son poids, son reste à faire, son REX. */
  const meta = (ch: (typeof todoAll)[number]["ch"]) => {
    const miss = view.missing(ch, FULL_YEAR).length;
    return [
      view.fmt(ch.ca) + " de CA de référence",
      // Sur un budget vierge, « 12 mois à saisir » ne fait que répéter le tag.
      miss && miss < FULL_YEAR.length ? miss + " mois à saisir" : null,
      view.isCG ? REX[ch.id] : null,
    ]
      .filter(Boolean)
      .join(" · ");
  };

  const todo: ChantierListRow[] = todoAll.slice(0, 6).map(({ ch, t }) => ({
    ch,
    tag: t!.tag,
    tagBg: t!.crit ? STATE.dangerTint : STATE.warnTint,
    tagFg: t!.crit ? STATE.danger : STATE.warn,
    accent: t!.crit ? STATE.danger : STATE.warn,
    hint: meta(ch),
    hintColor: INK.muted,
  }));

  const crit = todoAll.filter((x) => x.t!.crit).length;
  const todoCount = todoAll.length
    ? todoAll.length +
      " chantier" +
      (todoAll.length > 1 ? "s" : "") +
      (crit ? " · " + crit + " critique" + (crit > 1 ? "s" : "") : "")
    : "rien à traiter";

  const aValider: ChantierListRow[] = view
    .aValider()
    .slice(0, 5)
    .map((ch) => ({
      ch,
      tag: "À valider",
      tagBg: BRAND.tint,
      tagFg: BRAND.ink,
      accent: ST["À valider"].accent,
      hint:
        view.fmt(view.aggregate([ch], FULL_YEAR, "saisi", "ca", "Total")) +
        " déclarés · " +
        REX[ch.id],
      hintColor: INK.muted,
    }));

  const nonTraites: ChantierListRow[] = view
    .nonTraites()
    .slice(0, 5)
    .map((ch) => {
      const st = view.st(ch) as Statut;
      const miss = view.missing(ch, FULL_YEAR).length;
      const crit = st === "Non budgétisé" || st === "En attente baseline CG";
      return {
        ch,
        tag: st === "En saisie" ? miss + " mois manquants" : view.statutLabel(st),
        tagBg: crit ? STATE.dangerTint : STATE.warnTint,
        tagFg: crit ? STATE.danger : STATE.warn,
        accent: ST[st].accent,
        hint: view.fmt(ch.ca) + " de CA de référence · " + REX[ch.id],
        hintColor: INK.muted,
      };
    });

  const goTable = (fStatuts: Statut[], onlyTodo: boolean) => () =>
    set({ tab: "Tableau prévisionnel", fStatuts, onlyTodo, fSearch: "", searchDraft: "" });

  return (
    <>
      {/* Le travail d'abord — c'est ce pour quoi on ouvre l'écran —, la mesure à côté. */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 460px", minWidth: 340 }}>
          <ChantierListCard
            title={engine.isExploit ? "À traiter en priorité" : "À contrôler en priorité"}
            count={todoCount}
            rows={todo}
            empty="Rien à traiter sur ce périmètre."
            onOpen={openChantier}
            onSeeAll={goTable([...STATUT_OPTS], true)}
          />
        </div>
        <div style={{ flex: "0 1 320px", minWidth: 290 }}>
          <CaGaugeCard store={store} />
        </div>
        <div style={{ flex: "0 1 320px", minWidth: 290 }}>
          <BudgetDonutCard store={store} />
        </div>
      </div>

      <MonthlyEvolutionChart store={store} />

      {engine.isCG && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "stretch" }}>
          <div style={{ flex: "1 1 420px", minWidth: 320 }}>
            <ChantierListCard
              title="Budgets à valider"
              count={view.aValider().length + " en attente de contrôle"}
              rows={aValider}
              empty="Aucune saisie en attente de contrôle."
              onOpen={openChantier}
              onSeeAll={goTable(["À valider"], false)}
            />
          </div>
          <div style={{ flex: "1 1 420px", minWidth: 320 }}>
            <ChantierListCard
              title="Chantiers non traités"
              count={view.nonTraites().length + " chantiers"}
              rows={nonTraites}
              empty="Tous les chantiers sont engagés."
              onOpen={openChantier}
              onSeeAll={goTable([...STATUT_OPTS], true)}
            />
          </div>
        </div>
      )}
    </>
  );
}
