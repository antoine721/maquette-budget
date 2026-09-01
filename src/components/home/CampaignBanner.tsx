import type { Store } from "../../state/store";
import { BRAND, NEUTRAL, RADIUS } from "../../theme";
import { Button, PageHead } from "../ui";

/**
 * En-tête de l'accueil : de quel exercice on parle, où il en est du calendrier,
 * et le geste principal du rôle connecté.
 *
 * Il ne porte plus aucun compteur : les chiffres d'avancement sont regroupés
 * juste en dessous, chacun nommé une seule fois. Le bandeau encadré a laissé
 * place à un titre posé sur le fond de page — le contenu commence aux cartes.
 */
export default function CampaignBanner({ store }: { store: Store }) {
  const { state, engine, set } = store;
  const year = state.year;
  const closed = engine.closed();

  return (
    <PageHead
      dot={closed ? NEUTRAL : BRAND.base}
      eyebrow={closed ? "Exercice clos" : "Campagne ouverte"}
      title={"Budget prévisionnel " + year}
      hint={
        closed
          ? "Janvier – décembre " + year + " · budget arrêté, consultation seule"
          : "Janvier – décembre " +
            year +
            " · construit sur les réalisés " +
            (year - 1) +
            ", à rendre avant fin septembre " +
            (year - 1)
      }
      right={
        <Button
          tone={closed ? "ghost" : "primary"}
          onClick={() =>
            set({
              tab: "Tableau prévisionnel",
              onlyTodo: !closed && engine.isExploit,
              fSearch: "",
              searchDraft: "",
            })
          }
          style={{ borderRadius: RADIUS.control }}
        >
          {closed
            ? "Consulter le tableau"
            : engine.isExploit
              ? "Remplir mon budget"
              : "Suivre la campagne"}
        </Button>
      }
    />
  );
}
