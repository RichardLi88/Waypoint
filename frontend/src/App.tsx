import "./App.css";
import { Route, Routes } from "react-router-dom";
import EditSprintDetails from "./pages/EditSprintDetails";
import ListViewSprintBacklog from "./pages/ListViewSprintBacklog";
import ListViewProductBacklog from "./pages/ListViewProductBacklog";
import KanbanBoard from "./pages/SprintKanban";
import LoginPage from "./pages/Login";

import EditBacklogTask from "./pages/EditBacklogTask";
import { NotFound } from "./pages/NotFound";
import { Navbar } from "./Navbar";
import RequireAuth from "./pages/RequireAuth";
import { useEffect, useState } from "react";
import useAuth from "./hooks/useAuth";
import AdminPanel from "./pages/Admin";
import TaskPage from "./pages/ExtendedTaskView";
import { ViewAllSprints } from "./pages/ViewAllSprints";
import ExtendedSprintView from "./pages/ExtendedSprintView";

function App() {
  const [IsDesktopView, setIsDesktopView] = useState(
    window.matchMedia("(min-width: 768px)").matches,
  );

  const { session } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsDesktopView(window.matchMedia("(min-width: 768px)").matches);
    };

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-[#ffffff] flex">
        <div
          id="main-content"
          className={
            "flex-1 p-8 overflow-auto " +
            (IsDesktopView && !(session?.username == null) ? "ml-64" : "")
          }
        >
          <Navbar ShowNav={IsDesktopView && !(session?.username == null)} />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={<RequireAuth AllowedRoles={["developer", "admin"]} />}
            >
              <Route path="/" element={<KanbanBoard />}></Route>
              <Route path="/tasks/:id" element={<TaskPage />} />
              <Route
                path="/sprints/edit"
                element={<EditSprintDetails />}
              ></Route>
              <Route
                path="/sprints/current"
                element={<ListViewSprintBacklog />}
              ></Route>
              <Route path="/sprints/all" element={<ViewAllSprints />}></Route>
              <Route path="/sprints/:id" element={<ExtendedSprintView />} />
              <Route
                path="/backlog"
                element={<ListViewProductBacklog />}
              ></Route>
              <Route path="/backlog/edit" element={<EditBacklogTask />} />
            </Route>
            <Route element={<RequireAuth AllowedRoles={["admin"]} />}>
              <Route path="/admin" element={<AdminPanel />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default App;
