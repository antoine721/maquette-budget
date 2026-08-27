import type { Role } from "../data/constants";
import type { Store } from "../state/store";

const ROLES: Role[] = ["Exploitation", "Contrôle de gestion", "Admin"];

/**
 * Barre haute : logo, titre, sélecteur de profil, agence, notifications, compte.
 * La sidebar du prototype a été retirée, le logo remonte donc dans le header.
 */
export default function Header({ store }: { store: Store }) {
  const { state, set } = store;

  return (
    <header
      style={{
        height: 68,
        flex: "0 0 68px",
        background: "#fff",
        borderBottom: "1px solid #e6eaee",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 16,
        padding: "0 28px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginRight: "auto", minWidth: 0 }}>
        <img src="/assets/logo-challancin.png" alt="Challancin" style={{ height: 34, width: "auto" }} />
        <span style={{ width: 1, height: 26, background: "#e6eaee" }} />
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.2px" }}>
          Tableau prévisionnel
        </div>
      </div>

      <div style={{ display: "flex", background: "#f4f6f8", borderRadius: 9, padding: 3 }}>
        {ROLES.map((r) => {
          const on = state.role === r;
          return (
            <button
              key={r}
              onClick={() => set({ role: r })}
              style={{
                border: 0,
                borderRadius: 7,
                padding: "7px 13px",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background: on ? "#fff" : "transparent",
                color: on ? "#17202a" : "#6b7681",
                boxShadow: on ? "0 1px 3px rgba(15,23,42,0.12)" : "none",
              }}
            >
              {r}
            </button>
          );
        })}
      </div>

      <div
        style={{
          padding: "7px 14px",
          borderRadius: 8,
          background: "#f4f6f8",
          fontSize: 14,
          fontWeight: 600,
          color: "#3b4753",
        }}
      >
        Saint Ouen
      </div>

      <div
        style={{
          position: "relative",
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "#f4f6f8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3b4753"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 15V10a6 6 0 1 0-12 0v5l-2 3h16z" />
          <path d="M10 21h4" />
        </svg>
        <div
          style={{
            position: "absolute",
            top: -3,
            right: -3,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            background: "#e0243a",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          2
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#0a9bd8",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          AB
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b7681"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </header>
  );
}
