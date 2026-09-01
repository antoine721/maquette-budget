import type { Store } from "../state/store";
import { FS, INK, RADIUS, SHADOW } from "../theme";

/**
 * Message de confirmation, en bas d'écran.
 *
 * Quand l'action est annulable, l'annulation se propose ici — à l'endroit et au
 * moment où l'on constate l'erreur. Elle n'existait que dans la barre de filtres,
 * à l'autre bout de l'écran.
 */
export default function Toast({ store }: { store: Store }) {
  const { state, undoLast } = store;
  if (!state.toast) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        right: 26,
        bottom: 26,
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: INK.strong,
        color: "#fff",
        padding: "12px 14px 12px 18px",
        borderRadius: RADIUS.card,
        fontFamily: "Barlow, Helvetica, sans-serif",
        fontSize: FS.base,
        fontWeight: 500,
        boxShadow: SHADOW.menu,
        zIndex: 50,
      }}
    >
      {state.toast}
      {state.toastUndo && state.history.length > 0 && (
        <button
          onClick={undoLast}
          style={{
            padding: "6px 12px",
            border: "1px solid rgba(255,255,255,0.28)",
            borderRadius: RADIUS.control,
            background: "transparent",
            color: "#fff",
            fontFamily: "inherit",
            fontSize: FS.body,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Annuler
        </button>
      )}
    </div>
  );
}
