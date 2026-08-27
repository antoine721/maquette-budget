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
  taux horaire, d'où découle la masse salariale — puis envoie en validation. Les cases vides
  proposent la valeur N-1 en gris ; une valeur reprise reste en pointillés tant qu'elle n'est pas
  **ressaisie pour confirmation**.

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
| `src/components/EChart.tsx` | Enveloppe React autour d'Apache ECharts (rendu SVG, redimensionnement, événements) |
| `src/components/` | Header, onglets, Accueil, Pilotage CDG, Tableau |

### Graphiques

Les graphiques sont rendus par **Apache ECharts** (`echarts/core` + `PieChart` / `BarChart` /
`LineChart` + `SVGRenderer`, import ciblé, chunk séparé au build).

- **Avancement — en CA** — l'anneau complet vaut **100 % de l'objectif CDG** : les quatre catégories
  (Forfait / Réel / PAD / TE) sont des parts, et le solde non déclaré ferme l'anneau en gris. Le
  centre porte le pourcentage d'atteinte.
- **Avancement — en chantiers** — répartition des chantiers suivis par état, pourcentage de budgets
  terminés au centre ; un clic sur un segment ou sur sa ligne de légende ouvre le tableau filtré.
- **Évolution mensuelle du CA** — trois courbes : budgété N-1, budgété N et objectif CDG N.
  Toujours affichée ; chaque série se filtre par sa puce. L'infobulle donne l'évolution du mois.

Le survol utilise l'`emphasis: { focus: "self" }` et le `blur` natifs d'ECharts (la section visée
s'épaissit, les autres s'atténuent). La synchronisation légende ↔ anneau passe par
`dispatchAction({ type: "highlight" | "downplay" })`, et le texte central comme la carte de survol
restent du DOM applicatif pour garder la typographie du design.

### Performance

Le moteur mémoïse les calculs coûteux dans un cache invalidé par une **signature d'état** (exercice,
rôle, filtres, saisies…) : un survol ou l'ouverture d'une ligne ne recalcule rien. Le tableau ne rend
que 40 chantiers à la fois (bouton « Afficher 40 chantiers de plus »), mais les totaux du pied restent
calculés sur **tout** le périmètre filtré. La recherche est débouncée à 220 ms.

## Onglets

- **Accueil** — voir ci-dessous.
- **Tableau prévisionnel** — vue liste 12 mois, colonne chantier figée au scroll horizontal. Le REX
  n'y voit que ses chantiers ; le contrôle de gestion voit tout. Chaque ligne porte le nom du
  marché, son code, son entité, un **pourcentage de complétion** et un **drapeau de signalement**
  (filtrable par la puce « Signalés »). Les statuts affichés se **cochent** dans l'en-tête du
  tableau. Le marquage **N-2** n'apparaît que là où il a du sens : sur la ligne « Réalisé N-1 » du
  détail, de septembre à décembre, où les réalisés de l'année en cours ne sont pas encore connus.

  Le détail dépliable est découpé en trois groupes : **1 · Baseline** (réalisé N-1 → coefficients →
  baseline CG), **2 · À remplir** (CA par catégorie, nombre d'heures, taux horaire chargé, d'où
  découle la masse salariale), **3 · Indicateurs calculés**. Le menu ⋯ de chaque ligne propose deux
  gestes — appliquer un % d'évolution, recopier le 1er mois saisi — avec historique et annulation.
  Le récapitulatif **Prévu CG / Déclaré / % objectif / Couverture** est en bas, contre les boutons
  du circuit.
- **Pilotage CDG** — quatre onglets internes : **Vue d'ensemble** (indicateurs de portefeuille,
  évolution mensuelle du CA, anneaux d'avancement), **Chantiers** (Top 20 = 80 % du CA),
  **Responsables** (avancement de chaque REX) et **Réglages**.

## Cristallisations

Chaque envoi en validation crée une **cristallisation** que le contrôle de gestion doit valider.
Un budget validé reste modifiable : dès que l'exploitation y touche, il repasse automatiquement en
« À valider » et la cristallisation suivante s'ouvre. Le compteur est affiché dans le détail du
chantier (« Cristallisation n°2 à valider »).

## Coefficients et périodes

Les deux se règlent dans **Pilotage CDG › Réglages**.

Un coefficient de baseline est soit **commun** — une valeur mensuelle appliquée à tout le
portefeuille —, soit **particulier** : rattaché à tous les chantiers mais neutre (× 1) tant qu'il
n'est pas renseigné, chantier par chantier, depuis le détail du chantier. C'est ce qui permet de
porter une exigence de performance propre à un client sans fausser les autres calculs.

Les périodes de gestion (rebudgétisation, modification, fermeture) sont **informatives par
défaut**. Cocher « bloquante » sur une période active gèle réellement la saisie de l'exploitation
et affiche la raison sur la page d'accueil de tout le monde.

## L'accueil, situation par situation

C'est une maquette de présentation : l'accueil raconte deux situations. La tête de page porte
**deux conteneurs, un par exercice** — N-1 clos à gauche, N en campagne à droite. Cliquer sur l'un
cale le reste de la page dessus : c'est ainsi qu'on passe d'une situation à l'autre en démo.

### Pendant la campagne de déclaration

| Bloc | Rôle |
| --- | --- |
| Conteneurs d'exercice | Un par exercice : état, échéance, nombre de chantiers restant à déclarer, barre d'avancement, bouton « Remplir mon budget » ou « Consulter ». |
| Deux anneaux | Le même avancement mesuré de deux façons : **en valeur de CA** et **en nombre de chantiers**, pourcentage au centre. |
| À traiter en priorité | Les urgences du rôle connecté, les plus gros CA d'abord, cliquables vers le chantier. |

Le REX ne voit que ses chantiers ; le contrôle de gestion voit le portefeuille consolidé et gagne
deux listes — **Budgets à valider** et **Chantiers non traités** — puis la **vue consolidée des
REX** classée du moins avancé au plus avancé.

### Hors campagne

L'avancement de la saisie n'a plus d'objet : l'**évolution mensuelle du CA** passe au premier plan
et les deux anneaux se réduisent en colonne sur la droite. Les listes de chantiers à traiter
disparaissent, l'exercice étant clos.

## Rôles

Deux profils : **Exploitation** (le REX, limité à ses chantiers) et **Contrôle de gestion**
(portefeuille complet, validation des cristallisations, réglages).

## Bundle de design d'origine

`project/` contient le prototype exporté (HTML/CSS/JS + runtime Claude Design) et `chats/` la
conversation qui l'a produit. Ils servent de référence visuelle ; ils ne sont pas utilisés à
l'exécution.
