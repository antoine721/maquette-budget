import { CONFIG } from "../../config";
import { FULL_YEAR, ST, STATUT_OPTS, type Statut } from "../../data/constants";
import { REX } from "../../data/chantiers";
import type { Store } from "../../state/store";
import BudgetDonutCard from "./BudgetDonutCard";
import CampaignBanner from "./CampaignBanner";
import CaGaugeCard from "./CaGaugeCard";
import ChantierListCard, { type ChantierListRow } from "./ChantierListCard";
import MonthlyEvolutionChart from "./MonthlyEvolutionChart";

/**
 * Accueil. Deux situations à présenter :
 *
 * L'accueil est l'écran de la campagne en cours : il reste calé sur l'exercice
 * budgété, quel que soit l'exercice consulté dans le tableau. Chaque graphique
 * porte en revanche son propre sélecteur d'exercice.
 *
 * Le contrôle de gestion voit les mêmes blocs en valeurs globales, plus les
 * budgets à valider et les chantiers non traités. L'avancement par REX vit
 * dans Pilotage CDG › Responsables.
 */
export default function HomeTab({ store }: { store: Store }) {
  const { engine } = store;

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

      <CampaignLayout store={store} />
    </div>
  );
}

/** Pendant la fenêtre de déclaration : avancement et chantiers à traiter. */
function CampaignLayout({ store }: { store: Store }) {
  const { state, engine, set, openChantier } = store;
  // Les listes de l'accueil parlent toujours de la campagne, pas de l'exercice du tableau.
  const view = engine.atYear(CONFIG.campaignYear);

  // Chaque rôle a ses propres priorités : mois manquants pour l'exploitation,
  // baselines à publier et marges sous objectif pour le contrôle de gestion.
  const todoAll = view
    .perim()
    .map((ch) => ({ ch, t: view.todoFor(ch, FULL_YEAR, state.role) }))
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

  const aValider: ChantierListRow[] = view
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
        view.fmt(view.aggregate([ch], FULL_YEAR, "saisi", "ca", "Total")) +
        " déclarés — à contrôler",
      hintColor: "#0782b6",
    }));

  const nonTraites: ChantierListRow[] = view
    .nonTraites()
    .slice(0, 6)
    .map((ch) => {
      const st = view.st(ch) as Statut;
      const miss = view.missing(ch, FULL_YEAR).length;
      const crit = st === "Non budgétisé" || st === "En attente baseline CG";
      return {
        ch,
        tag: st === "En saisie" ? miss + " mois manquants" : view.statutLabel(st),
        tagBg: crit ? "#fee2e2" : "#fef3c7",
        tagFg: crit ? "#991b1b" : "#92400e",
        accent: crit ? "#dc2626" : "#f59e0b",
        hint:
          REX[ch.id] +
          " · " +
          view.fmt(ch.ca) +
          " de CA de référence" +
          (st === "En attente baseline CG" ? " — baseline pas encore publiée" : ""),
        hintColor: crit ? "#b91c1c" : "#92400e",
      };
    });

  const goTable = (fStatuts: Statut[], onlyTodo: boolean) => () =>
    set({
      tab: "Tableau prévisionnel",
      year: CONFIG.campaignYear,
      fStatuts,
      onlyTodo,
      fSearch: "",
      searchDraft: "",
    });

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
            onSeeAll={goTable([...STATUT_OPTS], true)}
          />
        </div>
      </div>

      <MonthlyEvolutionChart store={store} />

      {engine.isCG && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 420px", minWidth: 320 }}>
            <ChantierListCard
              title="Budgets à valider"
              dot="#0a9bd8"
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
              dot="#f59e0b"
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
