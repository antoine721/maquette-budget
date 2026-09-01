import Header from "./components/Header";
import TabsBar from "./components/TabsBar";
import Toast from "./components/Toast";
import HomeTab from "./components/home/HomeTab";
import PilotTab from "./components/pilot/PilotTab";
import TableTab from "./components/table/TableTab";
import { useApp } from "./state/store";

export default function App() {
  const store = useApp();
  const { state } = store;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "Barlow, Helvetica, Arial, sans-serif",
        color: "#17202a",
        background: "#f4f6f8",
      }}
    >
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Header store={store} />
        <TabsBar store={store} />

        {state.tab === "Accueil" && <HomeTab store={store} />}
        {state.tab === "Pilotage CDG" && <PilotTab store={store} />}
        {state.tab === "Tableau prévisionnel" && <TableTab store={store} />}
      </main>

      <Toast store={store} />
    </div>
  );
}
