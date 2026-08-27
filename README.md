# Tableau prévisionnel budgétaire — Challancin

Application de saisie et de pilotage du **budget prévisionnel** : en septembre N-1, l'exploitation
renseigne les 12 mois de l'exercice N sur la base d'une baseline posée par le contrôle de gestion.

Implémentation React + TypeScript + Vite du design exporté depuis Claude Design
(`project/Tableau prévisionnel.dc.html`). **La sidebar du prototype a été retirée** : le logo et la
navigation de profil vivent dans le header.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + bundle de production
npm run typecheck
```

## Données

Il n'y a **pas de backend** : tout est mocké en mémoire. `src/data/chantiers.ts` génère de façon
déterministe (PRNG mulberry32, graine fixe) **350 chantiers**, dont **20 gros qui concentrent ~80 %
du CA**, répartis sur **12 REX** et 3 entités (EGC / CPS / CAS). Les réalisés N-1, la baseline et la
saisie sont dérivés de la même graine, donc le jeu de démo est identique à chaque chargement.

Pour brancher un vrai backend plus tard, seuls `src/data/chantiers.ts` (les chantiers) et les
lectures `n1` / `baseField` / `saisiField` de `src/lib/engine.ts` sont à remplacer.

## Circuit métier

```
Baseline CG  →  Saisie exploitation  →  À valider  →  Validé  →  Clôturé
```

- Le **contrôle de gestion** pose les coefficients (inflation, revalorisation contractuelle), édite
  la baseline par code chantier, publie à l'exploitation, vérifie et clôture. Il pose aussi les
  **tags** de suivi (Sensible, Renégociation, Perte de marge, Nouveau marché).
- L'**exploitation** saisit les 12 mois — CA par catégorie (Forfait / Réel / PAD / TE), heures et
  masse salariale — puis envoie en validation. Les cases vides proposent la valeur N-1 en gris ; une
  valeur reprise reste en pointillés tant qu'elle n'est pas **ressaisie pour confirmation**.
- L'**admin** ouvre et ferme les périodes de saisie par entité.

Les exercices 2024–2026 sont clos et en lecture seule ; la campagne active est 2027.

## Structure

| Chemin | Rôle |
| --- | --- |
| `src/config.ts` | Réglages de campagne et d'affichage (exercice, rôle et onglet de départ, taille de l'anneau, confirmation N-1) |
| `src/data/constants.ts` | Référentiels : mois, entités, catégories de CA, statuts et leurs couleurs, indicateurs, tags, périodes |
| `src/data/chantiers.ts` | Générateur déterministe du portefeuille de démo |
| `src/lib/engine.ts` | Moteur de calcul : réalisé N-1, baseline, saisie, agrégats, filtres, tri, à-faire par rôle |
| `src/lib/detail.ts` | Construction du détail dépliable d'un chantier et des actions en masse |
| `src/state/store.ts` | État applicatif et actions (saisie, actions en masse, historique/annulation, tags, périodes) |
| `src/components/` | Header, onglets, Accueil, Pilotage CDG, Tableau |

### Performance

Le moteur mémoïse les calculs coûteux dans un cache invalidé par une **signature d'état** (exercice,
rôle, filtres, saisies…) : un survol ou l'ouverture d'une ligne ne recalcule rien. Le tableau ne rend
que 40 chantiers à la fois (bouton « Afficher 40 chantiers de plus »), mais les totaux du pied restent
calculés sur **tout** le périmètre filtré. La recherche est débouncée à 220 ms.

## Onglets

- **Accueil** — bandeau de campagne, carré « CA déclaré » (anneau segmenté par catégorie, gradué sur
  l'objectif CDG), anneau « État des budgets », liste « À traiter en priorité », « Budgets terminés »,
  et vue consolidée des REX pour le contrôle de gestion.
- **Tableau prévisionnel** — vue liste 12 mois, colonne chantier figée au scroll horizontal, détail
  dépliable par chantier (réalisé N-1 → coefficients → baseline → saisie → indicateurs calculés),
  menu ⋯ d'actions en masse par ligne avec historique et annulation.
- **Pilotage CDG** — indicateurs de portefeuille, Top 20 chantiers (80 % du CA) et avancement par REX.

## Bundle de design d'origine

`project/` contient le prototype exporté (HTML/CSS/JS + runtime Claude Design) et `chats/` la
conversation qui l'a produit. Ils servent de référence visuelle ; ils ne sont pas utilisés à
l'exécution.
