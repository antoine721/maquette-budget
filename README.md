# Tableau prévisionnel budgétaire

Application de saisie et de pilotage du **budget prévisionnel** : en septembre N-1, l'exploitation
renseigne les 12 mois de l'exercice N sur la base d'une baseline posée par le contrôle de gestion.

Implémentation React + TypeScript + Vite du design exporté depuis Claude Design
(`project/Tableau prévisionnel.dc.html`). **La sidebar du prototype a été retirée** : le titre, le
sélecteur d'exercice et la navigation de profil vivent dans le header.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + bundle de production
npm run typecheck
```

## Données

Il n'y a **pas de backend**, mais les chiffres sont réels. Ils viennent de l'export Gescof
« Résultats par chantiers » (`src/data/Résultats par chantiers (1).xlsx`), deux feuilles :

| Feuille | Exercice | Couverture |
| --- | --- | --- |
| `N-1` | 2025 | les 12 mois |
| `N` | 2026 | facturation jusqu'en **août**, paie jusqu'en **juillet** |

**10 chantiers** — SNCF (EPT4, Ligne J, TSEE TMV, EOLE incendie, Transilien D & R), AP-HP
(Georges Pompidou, Necker), Disneyland Paris (parcs, Ranch hôtelier), Aéroport de Paris Orly —
soit **47,3 M€ de CA réalisé en 2025**, chacun avec les **25 lignes** de son compte de résultat
mensuel : budget CA et budget heures, les six lignes de facturation, les avoirs, le détail des
charges directes, marge 1, frais d'agence et frais généraux, marge 2, prix horaires vendu et de
revient.

### Ce qui vient du fichier et ce qui n'en vient pas

Tous les **montants, heures et marges** viennent de l'export. En revanche l'export ne porte
**aucun attribut de rattachement** : ni ville, ni agence, ni secteur, ni entité, ni responsable
exploitation, ni état d'avancement du budget. Ces champs sont posés à la main dans `FICHES`
(`src/data/chantiers.ts`) pour que la maquette ait des filtres et un circuit de validation à
montrer — ils sont **plausibles, pas authentiques**, et ne doivent pas être présentés comme des
données du client.

La saisie prévisionnelle **2027** est, elle aussi, une démonstration : personne n'a encore déclaré
ce budget. Elle est dérivée de la baseline pour que les écrans d'avancement aient de quoi montrer.

### Chaîne de lecture

```
Résultats par chantiers (1).xlsx
  └── scripts/extract_realise.py       (bibliothèque standard seule, lancé à la main)
        └── src/data/gescof.ts         FICHIER GÉNÉRÉ — export brut, 25 lignes × 12 mois × 2 exercices
              └── src/data/realise.ts  jonction avec le modèle de l'application
                    ├── src/data/chantiers.ts   le portefeuille
                    └── src/lib/engine.ts       n1 / baseField / saisiField
```

Régénérer après un nouvel export : `python3 scripts/extract_realise.py`.

Deux points de jonction méritent d'être connus :

- **Les catégories de CA sont recalées sur le CA facturé.** L'application budgète quatre
  catégories (Forfait / Réel / PAD / TE) ; l'export en porte six, avec les pénalités et les
  écritures de clôture (FAE et AAE) qui basculent des montants considérables d'un mois sur
  l'autre — sur SNCF EPT4, janvier porte 912 k€ d'écritures que février reprend. Prises telles
  quelles, les catégories donneraient un janvier à zéro et un février au double. `realise.ts`
  garde donc le mix du mois et le met à l'échelle du CA total : chaque mois vaut exactement ce
  qui a été facturé, réparti comme il l'a été.
- **Un mois sans paie n'existe pas pour l'application.** Août 2026 est facturé mais ni les heures
  ni les salaires ne sont remontés. Un mois auquel il manque une des six valeurs du budget
  n'entre dans aucun calcul : le laisser passer sur son seul CA gonflerait les totaux d'un côté
  sans les charges de l'autre. Le compte de résultat détaillé, lui, continue de l'afficher — il
  lit les lignes brutes.

Pour brancher un vrai backend, c'est `src/data/gescof.ts` qu'il faut remplacer : `realise.ts` et
le moteur n'en connaissent que la forme.

## Circuit métier

```
En attente baseline CG → Non budgétisé → En saisie → À valider → Validé
                                                                    ↓ (changement d'exercice)
                                                                 Clôturé
```

Un budget **n'est jamais refusé** : tant qu'il n'est pas validé, il reste en attente. Le statut
`Clôturé` n'est pas une action, il tombe tout seul quand l'exercice n'est plus d'actualité.

Le même état se dit différemment selon le profil : l'exploitation lit **« En attente de
validation »** là où le contrôle de gestion lit **« À valider »**.

L'envoi en validation n'est possible **qu'une fois tous les champs des mois ouverts renseignés** ;
le bouton indique sinon combien il en reste.

- Le **contrôle de gestion** pose les coefficients (inflation, revalorisation contractuelle), édite
  la baseline par code chantier, publie à l'exploitation, vérifie et clôture. Il pose aussi les
  **tags** de suivi (Sensible, Renégociation, Perte de marge, Nouveau marché).
- L'**exploitation** saisit les 12 mois — CA par catégorie (Forfait / Réel / PAD / TE), heures et
  taux horaire, d'où découle la masse salariale — puis envoie en validation. Les cases vides
  proposent la valeur N-1 en gris ; une valeur reprise reste en pointillés tant qu'elle n'est pas
  **ressaisie pour confirmation**.

**2025 et 2026 sont en lecture seule** : leur budget est clos, et ce que l'application y affiche
est le réalisé Gescof en regard de l'objectif que le contrôle de gestion avait posé (lignes
« Budget CA » et « Budget heures » de l'export). La campagne active est **2027**.

## L'exercice, choisi une seule fois

L'application travaille toujours sur **une période**. Le sélecteur d'exercice du header
(`src/components/YearPicker.tsx`) pilote `state.year`, donc l'accueil, le tableau et le pilotage
d'un seul geste : il n'y a plus de sélecteur d'année par écran ni par graphique. La liste annonce
l'état de chaque exercice — campagne en cours ou clos.

## Le système visuel

Tout ce qui est dessiné vient de `src/theme.ts` : sept tailles de police, trois encres
de texte, une palette de statut, deux rayons. Les écrans n'écrivent plus de couleur ni de
taille en dur, et les contrôles passent par les primitives de `src/components/ui.tsx` —
auparavant cinq mécaniques de sélection différentes cohabitaient à quelques pixels
(onglets soulignés, onglets en pilules, segmented control, pilules, cases à cocher, plus
des `<select>` système).

**Couleur.** Une seule échelle décrit le cycle de vie d'un budget, la même sur les filtres,
les badges, l'anneau d'avancement et le liseré des lignes : gris « en attente », rouge
« non budgétisé », ambre « en saisie », bleu « à valider », vert « validé ». Les teintes
sont adoucies et vérifiées pour la vision des couleurs (ΔE 13,6 sur la pire paire
adjacente en deutéranopie) ; chaque emploi porte un libellé, jamais la couleur seule. Le
reste de l'interface est neutre : ni fond de badge teinté, ni cellule peinte selon le
statut de sa ligne.

**Encre et contraste.** Les textes secondaires étaient sous le seuil AA — `#8a95a1` à
3,0:1, `#a8b1ba` à 2,4:1 sur du 11 px. Ils passent tous par `INK.muted` (4,6:1). Le gris le
plus clair (`INK.faint`) est réservé aux traits et aux icônes. Le focus clavier est visible
(`:focus-visible`), et `prefers-reduced-motion` coupe les transitions.

## Structure

| Chemin | Rôle |
| --- | --- |
| `src/config.ts` | Réglages de campagne et d'affichage (exercice, rôle et onglet de départ, taille de l'anneau, confirmation N-1) |
| `src/theme.ts` | Jetons de design : encres, surfaces, couleurs de statut, échelle typographique, rayons |
| `src/components/ui.tsx` | Primitives : carte, bouton, bascule, menu déroulant, filtre actif, jauge, tuile d'indicateur, en-tête d'écran, écran vide |
| `src/components/StatutBadge.tsx` | Badge de statut — pastille de couleur + libellé, identique sur tous les écrans |
| `src/state/persist.ts` | Ce qui survit à un F5 (stockage local) et ce qui vit dans l'URL (onglet, exercice, chantier) |
| `src/data/constants.ts` | Référentiels : mois, entités, catégories de CA, statuts et leurs couleurs, indicateurs, tags, périodes |
| `src/data/chantiers.ts` | Générateur déterministe du portefeuille de démo |
| `src/lib/engine.ts` | Moteur de calcul : réalisé N-1, baseline, saisie, agrégats, filtres, tri, à-faire par rôle |
| `src/lib/detail.ts` | Construction du détail dépliable d'un chantier et des actions en masse |
| `src/state/store.ts` | État applicatif et actions (saisie, actions en masse, historique/annulation, tags, périodes) |
| `src/components/EChart.tsx` | Enveloppe React autour d'Apache ECharts (rendu SVG, redimensionnement, événements) |
| `src/components/` | Header, sélecteur d'exercice, onglets, Accueil, Pilotage CDG, Tableau |

### Graphiques

Les graphiques sont rendus par **Apache ECharts** (`echarts/core` + `PieChart` / `BarChart` /
`LineChart` + `SVGRenderer`, import ciblé, chunk séparé au build).

- **Avancement — en CA** — l'anneau complet vaut **100 % de l'objectif CDG** : les quatre catégories
  (Forfait / Réel / PAD / TE) sont des parts, et le solde non déclaré ferme l'anneau en gris. Le
  centre porte le pourcentage d'atteinte.
- **Avancement — en chantiers** — répartition du portefeuille **par statut du cycle**, pourcentage
  de budgets terminés au centre ; un clic sur un segment ou sur sa ligne de légende ouvre le tableau
  avec ce statut coché.
- **Évolution mensuelle du CA** — trois courbes : budgété N-1, budgété N et objectif CDG N.
  Toujours affichée ; chaque série se filtre par sa puce. L'infobulle donne l'évolution du mois.

  La courbe ne porte par défaut que sur les **chantiers entièrement budgétés** — ceux dont les douze
  mois sont saisis. En pleine campagne, additionner les budgets à moitié remplis fait plonger la
  courbe sur les mois manquants : on lit une chute d'activité là où il n'y a qu'un retard de
  déclaration (le prototype affichait ainsi « −33,6 % vs N-1 »). Les trois séries portent sur le même
  sous-ensemble, donc l'évolution vs N-1 se lit sans biais. La case **« Chantiers entièrement
  budgétés »** bascule sur tout le saisi, mois partiels compris : l'évolution est alors remplacée par
  la mention « saisie partielle — évolution non comparable ».

Les trois graphiques suivent l'exercice choisi dans le header, comme le reste de l'application.

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
- **Tableau prévisionnel** — vue liste 12 mois, colonne chantier figée au scroll horizontal,
  en-tête des mois et ligne de total figés au scroll vertical : le tableau a son propre cadre
  de défilement, pour qu'on ne perde jamais ni le mois ni le total. Le REX n'y voit que ses
  chantiers ; le contrôle de gestion voit tout.

  La **barre de filtres** porte la recherche, l'entité, les signalés, l'indicateur, la
  catégorie, la période et le tri. En dessous, une ligne de **filtres actifs** énumère tout ce
  qui retire des lignes — y compris les filtres posés par un clic depuis l'accueil ou le
  pilotage —, chacun avec sa croix, plus un « Tout réinitialiser ». C'est la réponse au
  « il me manque des chantiers » : aucun filtre ne s'applique en silence.

  Les **étapes du circuit** se cochent comme légende-filtre, chacune avec sa couleur. Une
  valeur n'est colorée qu'au-delà de **5 % d'écart** à la baseline (rouge
  au-delà de 15 %) — en deçà elle reste en encre normale, sinon le tableau entier vire au
  rouge et au vert et plus rien n'y ressort. Une légende sous le tableau dit ce que veulent
  dire le fond crème, le liseré bleu et les couleurs d'écart.

  Le marquage **N-2** n'est plus une convention de calendrier, il se lit dans les données : la
  campagne 2027 se monte en septembre 2026, date à laquelle la paie 2026 n'est remontée que
  jusqu'en juillet. La référence de janvier à juillet est donc le **réalisé 2026**, celle d'août
  à décembre le **réalisé 2025**. Ces mois-là portent l'exposant ᴺ⁻² sur la ligne de référence,
  et leurs cases de saisie sont **violettes** tant qu'elles reposent sur la valeur proposée ;
  elles passent au bleu dès qu'elles sont reconfirmées. Sur un exercice déjà réalisé, où la
  référence est franchement N-1 sur les douze mois, le violet ne s'affiche pas.

  Le détail dépliable se lit en **quatre zones encadrées et numérotées** : **1 · Baseline —
  contrôle de gestion** (réalisé de référence → coefficients → baseline ; sur un exercice
  révolu, l'objectif Gescof directement, sans coefficients), **2 · À remplir — exploitation**
  (CA par catégorie, heures, taux horaire chargé, d'où découle la masse salariale — intitulée
  « Réalisé » sur un exercice révolu), **3 · Indicateurs calculés**, et **4 · Réalisé Gescof —
  compte de résultat**, replié par défaut. Cette dernière zone n'entre dans aucun calcul : elle
  déroule les 25 lignes de l'export, du budget CA à la marge 2, parce que c'est là que se lit
  *pourquoi* un chantier va bien ou mal. Chaque mois y est lu sur son propre exercice de
  référence. Le menu ⋯ de chaque ligne de saisie propose deux gestes — appliquer un %
  d'évolution, recopier le 1er mois saisi — avec historique et annulation. Le récapitulatif
  **Prévu CG / Déclaré / % objectif / Couverture** est en bas, contre les boutons du circuit.
- **Pilotage CDG** — quatre onglets internes : **Vue d'ensemble** (nombre de chantiers, avancement
  global, évolution mensuelle du CA, anneaux d'avancement), **Chantiers** (Top 20),
  **Responsables** (le tableau complet des REX : chantiers, gros chantiers en retard, avancement,
  reste à faire, CA déclaré, objectif CG, écart, avec le total du portefeuille) et **Réglages**
  (les coefficients de baseline).

## Cristallisations

Chaque envoi en validation crée une **cristallisation** que le contrôle de gestion doit valider.
Un budget validé reste modifiable : dès que l'exploitation y touche, il repasse automatiquement en
« À valider » et la cristallisation suivante s'ouvre. Le compteur est affiché dans le détail du
chantier (« Cristallisation n°2 à valider »).

## Coefficients

Ils se règlent dans **Pilotage CDG › Réglages**.

Un coefficient de baseline est soit **commun** — une valeur mensuelle appliquée à tout le
portefeuille —, soit **particulier** : rattaché à tous les chantiers mais neutre (× 1) tant qu'il
n'est pas renseigné, chantier par chantier, depuis le détail du chantier. C'est ce qui permet de
porter une exigence de performance propre à un client sans fausser les autres calculs.

Les périodes de gestion (rebudgétisation, modification, fermeture) et l'ouverture des mois de
saisie par entité ne sont plus affichées. La mécanique reste dans l'état — aucune période bloquante
active, tous les mois ouverts — et une période bloquante afficherait sa raison sur l'accueil de
tout le monde.

## L'accueil

L'accueil suit **l'exercice choisi dans le header** et se lit de haut en bas dans l'ordre
où l'on s'en sert : le cadre de la campagne, les chiffres qui la résument, le travail à
faire, puis l'analyse.

| Bloc | Rôle |
| --- | --- |
| En-tête | Exercice, fenêtre de saisie, échéance, et le geste principal du rôle — « Remplir mon budget » ou « Suivre la campagne ». Sur un exercice clos, il bascule en consultation seule. |
| Quatre indicateurs | Budgets déclarés, budgets validés, CA déclaré, à traiter. |
| À traiter en priorité | Les urgences du rôle connecté, les plus gros CA d'abord, cliquables vers le chantier. |
| CA déclaré | L'anneau de progression vers l'objectif CDG, et la répartition du déclaré par catégorie. |
| Avancement du portefeuille | La répartition par étape du circuit ; un clic ouvre le tableau filtré sur l'étape. |
| Évolution mensuelle du CA | Voir « Graphiques » ci-dessus. |

Le REX ne voit que ses chantiers ; le contrôle de gestion voit le portefeuille consolidé et
gagne deux listes — **Budgets à valider** et **Chantiers non traités**.

### Des chiffres qui se recoupent

Quatre pourcentages d'avancement se disputaient l'écran sans qu'on puisse les rapprocher :
« 51 % » de campagne, « 65 % de l'objectif CDG », « 19 % de budgets terminés », « 58 % de
cellules saisies » côté pilotage. Ils viennent maintenant d'un seul calcul,
`engine.progress()`, qui les nomme et les publie avec leur dénominateur :

| Mesure | Ce qu'elle compte | Dénominateur |
| --- | --- | --- |
| **Budgets déclarés** | budgets partis en validation — en attente ou déjà validés | chantiers du périmètre |
| **Budgets validés** | budgets validés par le contrôle de gestion, ou clos | chantiers du périmètre |
| **CA déclaré** | euros déclarés | objectif du contrôle de gestion |
| **À traiter** | chantiers où le rôle connecté a une action | — |

Les deux premiers se lisent l'un dans l'autre : les déclarés moins les validés donnent
exactement ce qui attend le contrôle de gestion, et c'est ce que dit la précision sous le
chiffre. Le taux de remplissage en mois saisis reste calculé (`progress().remplissage`)
pour qui en a besoin, mais il ne prend plus une tuile : « 51 % » ne disait pas où en était
un budget, seulement combien de cases étaient noircies.

Le pilotage affiche les mêmes mesures sur le portefeuille entier, avec les mêmes mots.

## Ce que l'application retient

La saisie et les actions en masse sont conservées dans le **stockage local du navigateur** :
une campagne se remplit en plusieurs fois, et un rafraîchissement ne doit pas effacer le
travail. La **position** — onglet, exercice, chantier ouvert — vit dans l'adresse
(`#/tableau?exercice=2027&chantier=C00109-001`), donc un lien s'envoie à un collègue, le
bouton Précédent revient à l'écran précédent, et un F5 rouvre la même vue. Changer d'écran
empile une étape d'historique ; ouvrir un chantier remplace l'étape courante.

Toute action en masse annonce son résultat par un message qui porte **« Annuler »** : la
correction se propose là où l'erreur se constate, pas à l'autre bout de l'écran.

## Rôles

Deux profils : **Exploitation** (le REX, limité à ses chantiers) et **Contrôle de gestion**
(portefeuille complet, validation des cristallisations, réglages).

## Bundle de design d'origine

`project/` contient le prototype exporté (HTML/CSS/JS + runtime Claude Design) et `chats/` la
conversation qui l'a produit. Ils servent de référence visuelle ; ils ne sont pas utilisés à
l'exécution.
