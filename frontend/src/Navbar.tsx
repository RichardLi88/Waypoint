import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useAuth from "./hooks/useAuth";
import useAxios from "./hooks/useAxios";
import zoomInIcon from "./assets/zoomInIcon.png";
import zoomOutIcon from "./assets/zoomOutIcon.png";

export function Navbar({ ShowNav = false, hideNav = function () {} }) {
  const [zoomLevel, setZoomLevel] = useState(
    parseFloat(localStorage.getItem("zoomLevel") || "1"),
  );

  const [isDesktopView, setIsDesktopView] = useState(
    window.matchMedia("(min-width: 768px)").matches,
  );
  const [showModal, setShowModal] = useState(false);
  const { session, setSession } = useAuth();
  const navigate = useNavigate();
  const Axios = useAxios();

  useEffect(() => {
    const handleResize = () => {
      setIsDesktopView(window.matchMedia("(min-width: 768px)").matches);
    };

    window.addEventListener("resize", handleResize);

    handleResize();

    const contentElement = document.getElementById("main-content");
    if (contentElement) {
      contentElement.style.zoom = `${zoomLevel}`;
    }

    return () => window.removeEventListener("resize", handleResize);
  }, [zoomLevel]);

  const handleZoomIn = () => {
    const newZoomLevel = Math.min(zoomLevel + 0.1, 2);
    setZoomLevel(newZoomLevel);
    localStorage.setItem("zoomLevel", newZoomLevel.toString());
  };

  const handleZoomOut = () => {
    const newZoomLevel = Math.max(zoomLevel - 0.1, 1);
    setZoomLevel(newZoomLevel);
    localStorage.setItem("zoomLevel", newZoomLevel.toString());
  };

  const handleLogout = () => {
    setShowModal(false);

    Axios.get("/api/auth/logout");

    setSession({
      username: null,
      role: null,
      name: null,
      accessToken: null,
    });

    navigate("/login");
  };

  return (
    <>
      {ShowNav && (
        <div className="fixed top-0 left-0 w-[50%] md:w-[20%] min-w-56 max-w-64 h-full bg-purple-400 text-white">
          <p className="flex pl-16 pt-10 md:p-10 text-2xl font-bold justify-center text-center items-center">
            Waypoint
            {ShowNav && !isDesktopView ? (
              <div>
                <svg
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  onClick={hideNav}
                  className="w-12 h-12 text-black ml-5"
                >
                  <path
                    d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
            ) : null}
          </p>

          <nav className="flex flex-col justify-center ">
            <ul className="p-4 flex flex-col justify-center items-center ">
              <li className="p-4">
                {session?.role === "admin" ? (
                  <NavLink to="/admin">Admin Panel</NavLink>
                ) : (
                  <NavLink to="/">Sprint (Kanban View)</NavLink>
                )}
              </li>
              {session?.role === "developer" && (
                <li className="p-4">
                  <NavLink to="/sprints/current">Sprint (List View)</NavLink>
                </li>
              )}
              <li className="p-4">
                <NavLink to="/backlog">Product Backlog</NavLink>
              </li>
              <li className="p-4">
                <NavLink to="/sprints/all">View All Sprints</NavLink>
              </li>
                <button id="logout_btn" className="p-4" onClick={() => setShowModal(true)}>
                Log Out
                </button>
              </ul>

              <div className="absolute bottom-4 right-4 flex flex-col space-y-1">
                <button onClick={handleZoomIn} disabled={zoomLevel >= 1.5}>
                <img src={zoomInIcon} alt="Zoom In" className="w-12 h-12" />
                </button>
                <button onClick={handleZoomOut}>
                <img src={zoomOutIcon} alt="Zoom Out" className="w-12 h-12" />
                </button>
              </div>
          </nav>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="mb-6 text-lg">Are you sure you want to log out?</p>
            <div className="flex justify-center space-x-4">
              <button
                className="bg-gray-300 text-black py-2 px-6 rounded hover:bg-gray-400 w-24"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600 w-24"
                onClick={handleLogout}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
