#!/usr/bin/env python3
"""Convertit l'export Gescof « Résultats par chantiers » en module TypeScript.

Lecture du .xlsx avec la seule bibliothèque standard (zipfile + ElementTree) :
le projet n'a pas de dépendance Python et n'en gagne pas une pour un script
lancé à la main.

    python3 scripts/extract_realise.py

Écrit src/data/gescof.ts. Ne pas éditer le résultat à la main.
"""

import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

RACINE = Path(__file__).resolve().parent.parent
SOURCE = RACINE / "src" / "data" / "Résultats par chantiers (1).xlsx"
CIBLE = RACINE / "src" / "data" / "gescof.ts"

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

# Feuille → exercice. « N » est l'exercice en cours, « N-1 » le précédent.
FEUILLES = {"N": 2026, "N-1": 2025}

# Libellé Excel → clé TypeScript. L'ordre fixe celui des lignes à l'écran.
LIGNES = [
    ("Budget heures", "budgetHeures"),
    ("Nombre d'heures", "heures"),
    ("Budget CA", "budgetCa"),
    ("Chiffre d'affaires (1 à 6)", "ca"),
    ("1. Forfait", "forfait"),
    ("2. Réel", "reel"),
    ("3. Pénalités", "penalites"),
    ("4. Ecritures de clôture (FAE et AAE)", "cloture"),
    ("5. PAD", "pad"),
    ("6. TE", "te"),
    ("dont Avoirs", "avoirs"),
    ("Total charges directes", "chargesDirectes"),
    ("Salaires", "salaires"),
    ("Immobilisations", "immobilisations"),
    ("Articles", "articles"),
    ("Charges", "charges"),
    ("Coûts analytiques", "coutsAnalytiques"),
    ("Marge 1 €", "marge1"),
    ("Marge 1 % ", "marge1Pct"),
    ("Frais d'agence", "fraisAgence"),
    ("Frais généraux", "fraisGeneraux"),
    ("Marge 2 €", "marge2"),
    ("Marge 2 % ", "marge2Pct"),
    ("Prix horaire vendu ", "phv"),
    ("Prix horaire revient ", "phr"),
]

# Ces deux lignes arrivent en ratio (0,1445) : on les stocke en points de %.
EN_POURCENT = {"marge1Pct", "marge2Pct"}


def chaines_partagees(z):
    data = z.read("xl/sharedStrings.xml")
    return [
        "".join(t.text or "" for t in si.iter(NS + "t"))
        for si in ET.fromstring(data).iter(NS + "si")
    ]


def colonne(ref):
    n = 0
    for c in re.match(r"([A-Z]+)", ref).group(1):
        n = n * 26 + (ord(c) - 64)
    return n - 1


def lignes(z, chemin, sst):
    for _, el in ET.iterparse(z.open(chemin), events=("end",)):
        if el.tag != NS + "row":
            continue
        vals = {}
        for c in el.findall(NS + "c"):
            v = c.find(NS + "v")
            if v is None or v.text is None:
                continue
            if c.get("t") == "s":
                val = sst[int(v.text)]
            else:
                try:
                    val = float(v.text)
                except ValueError:
                    val = v.text
            if val != "":
                vals[colonne(c.get("r"))] = val
        yield [vals.get(i) for i in range(max(vals) + 1)] if vals else []
        el.clear()


def lire_feuille(z, chemin, sst):
    """{code chantier: {clé de ligne: [valeurs mensuelles]}}, dans l'ordre du fichier."""
    libelles = dict(LIGNES)
    data, ordre, courant = {}, [], None
    for i, r in enumerate(lignes(z, chemin, sst)):
        if i == 0 or not any(x is not None for x in r):
            continue
        if r[0]:
            courant = r[0]
            data[courant] = {}
            ordre.append(courant)
        if courant is None or len(r) < 2 or r[1] not in libelles:
            continue
        # La dernière colonne est le total annuel : il se recalcule, on le jette.
        data[courant][libelles[r[1]]] = [x if isinstance(x, float) else None for x in r[2:-1]]
    return data, ordre


def dernier_mois_actif(data, cle):
    """Rang du dernier mois non nul d'une ligne, tous chantiers confondus."""
    fin = 0
    for lignes_ch in data.values():
        for m, v in enumerate(lignes_ch.get(cle) or []):
            if v:
                fin = max(fin, m + 1)
    return fin


def couvertures(data):
    """Les deux coupures d'un exercice : la facturation, puis la paie.

    Un zéro en cours d'année est un vrai zéro — la ligne « 2. Réel » vaut zéro
    toute l'année sur un chantier au forfait. Ce n'est qu'en fin de série que
    l'absence de valeur veut dire « pas encore remonté ». La coupure ne se lit
    donc pas ligne par ligne mais sur deux lignes témoins : le chiffre
    d'affaires porte tout ce qui est facturé, le nombre d'heures tout ce qui
    dépend de la paie et des charges. En 2026 la facturation est remontée
    jusqu'en août, la paie seulement jusqu'en juillet : les marges d'août ne
    veulent donc rien dire et sont coupées avec la paie.
    """
    return {
        "ca": dernier_mois_actif(data, "ca"),
        "paie": dernier_mois_actif(data, "heures"),
    }


# Ce qui est facturé suit la coupure « ca » ; tout ce qui touche aux charges,
# aux heures et aux marges suit la coupure « paie ».
COUPURE = {
    "budgetHeures": "ca",
    "budgetCa": "ca",
    "ca": "ca",
    "forfait": "ca",
    "reel": "ca",
    "penalites": "ca",
    "cloture": "ca",
    "pad": "ca",
    "te": "ca",
    "avoirs": "ca",
}


def mois_renseignes(data, cle):
    return couvertures(data)[COUPURE.get(cle, "paie")]


def num(x):
    if x is None:
        return "null"
    r = round(x, 2)
    return str(int(r)) if r == int(r) else str(r)


def main():
    z = zipfile.ZipFile(SOURCE)
    sst = chaines_partagees(z)
    rels = {}
    for s in ET.fromstring(z.read("xl/workbook.xml")).iter(NS + "sheet"):
        rels[s.get("name")] = s.get("sheetId")

    exercices, ordre_ref = {}, None
    for nom, annee in FEUILLES.items():
        chemin = "xl/worksheets/sheet%s.xml" % rels[nom]
        data, ordre = lire_feuille(z, chemin, sst)
        exercices[annee] = data
        ordre_ref = ordre_ref or ordre

    out = []
    w = out.append
    w("/**")
    w(" * Export Gescof « Résultats par chantiers » — feuilles « N » (2026) et « N-1 » (2025).")
    w(" *")
    w(" * FICHIER GÉNÉRÉ — ne pas éditer à la main.")
    w(" * Source : src/data/Résultats par chantiers (1).xlsx")
    w(" * Régénérer : python3 scripts/extract_realise.py")
    w(" *")
    w(" * Les montants sont en euros, les heures en heures, les marges en points de %.")
    w(" * `null` signale un mois que l'export ne couvre pas — ce n'est pas un zéro.")
    w(" */")
    w("")
    w("/** Lignes du compte de résultat, dans l'ordre de l'export. */")
    w("export type LigneGescof =")
    for _, cle in LIGNES:
        w('  | "%s"' % cle)
    w(";")
    w("")
    w("/**")
    w(" * Les deux coupures de chaque exercice : le dernier mois facturé, le dernier")
    w(" * mois de paie. En 2026 la facturation est remontée jusqu'en août et la paie")
    w(" * jusqu'en juillet — les marges d'août n'ont donc pas de sens.")
    w(" */")
    w("export const COUVERTURE: Record<number, { ca: number; paie: number }> = {")
    for annee in sorted(exercices):
        c = couvertures(exercices[annee])
        w("  %d: { ca: %d, paie: %d }," % (annee, c["ca"], c["paie"]))
    w("};")
    w("")
    w("/** Exercices couverts par l'export, du plus ancien au plus récent. */")
    w("export const EXERCICES = [%s] as const;" % ", ".join(str(a) for a in sorted(exercices)))
    w("")
    w("/** Dernier exercice remonté — c'est lui qui sert de référence N-1. */")
    w("export const DERNIER_EXERCICE = %d;" % max(exercices))
    w("")
    w("/** Libellé complet du chantier tel qu'il sort de Gescof, par code. */")
    w("export const LIBELLES: Record<string, string> = {")
    for ref in ordre_ref:
        code, libelle = [p.strip() for p in ref.split("|", 1)]
        w('  "%s": %s,' % (code, '"' + libelle.replace('"', '\\"') + '"'))
    w("};")
    w("")
    w("/** Codes chantier, du plus gros CA au plus petit sur l'exercice 2025. */")
    tri = sorted(
        ordre_ref,
        key=lambda ref: -sum(x or 0 for x in (exercices[2025][ref].get("ca") or [])),
    )
    w("export const CODES = [")
    for ref in tri:
        w('  "%s",' % ref.split("|", 1)[0].strip())
    w("] as const;")
    w("")
    w("/** valeurs[exercice][code][ligne][mois] — 12 entrées, `null` hors couverture. */")
    w("export const GESCOF: Record<number, Record<string, Record<LigneGescof, (number | null)[]>>> = {")
    for annee in sorted(exercices):
        w("  %d: {" % annee)
        for ref in tri:
            code = ref.split("|", 1)[0].strip()
            w('    "%s": {' % code)
            for _, cle in LIGNES:
                serie = exercices[annee][ref].get(cle) or []
                fin = mois_renseignes(exercices[annee], cle)
                cells = []
                for m in range(12):
                    if m >= fin:
                        cells.append("null")
                        continue
                    v = serie[m] if m < len(serie) else None
                    if v is not None and cle in EN_POURCENT:
                        v = v * 100
                    cells.append(num(v if v is not None else 0.0))
                w("      %s: [%s]," % (cle, ", ".join(cells)))
            w("    },")
        w("  },")
    w("};")
    w("")

    CIBLE.write_text("\n".join(out), encoding="utf-8")
    print("écrit %s (%d octets)" % (CIBLE, CIBLE.stat().st_size))
    for annee in sorted(exercices):
        print(
            "  %d : %d chantiers, CA connu sur %d mois, paie sur %d mois"
            % (
                annee,
                len(exercices[annee]),
                mois_renseignes(exercices[annee], "ca"),
                mois_renseignes(exercices[annee], "heures"),
            )
        )


if __name__ == "__main__":
    main()
