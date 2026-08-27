import { YEARS } from "../../data/constants";

/** Sélecteur d'exercice propre à un graphique — le plus récent en tête. */
export default function YearSelect({
  year,
  onChange,
}: {
  year: number;
  onChange: (year: number) => void;
}) {
  return (
    <select
      value={year}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      title="Exercice affiché sur ce graphique"
      onClick={(e) => e.stopPropagation()}
      style={{
        padding: "4px 8px",
        border: "1px solid #dde3e8",
        borderRadius: 7,
        background: "#fff",
        fontSize: 12,
        fontWeight: 600,
        color: "#3b4753",
        cursor: "pointer",
      }}
    >
      {[...YEARS].reverse().map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}
