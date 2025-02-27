import { useEffect, useState } from "react";
import useAxios from "../hooks/useAxios";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../Navbar";
import useAuth from "../hooks/useAuth";

type Sprint = {
  _id: number;
  proj_id: number; // Project
  name: string;
  team: number[]; // User[]
  PO: number; // User
  scrumMaster: number; // User
  tasks: number[]; // Task[]
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export function ViewAllSprints() {
  const [ShowNav, setShowNav] = useState(false);
  const { session } = useAuth();
  const Axios = useAxios();

  const displayNav = () => {
    setShowNav(true);
  };

  const hideNav = () => {
    setShowNav(false);
  };
  const navigate = useNavigate();

  const gotoEditSprintPage = (s: Sprint) => () => {
    navigate("/sprints/edit", { state: { sprint: s } });
  };

  const gotoSprintPage = (s: Sprint) => () => {
    navigate(`/sprints/${s._id}`);
  };

  const deleteSprint = (s: Sprint) => () => {
    if (!window.confirm(`Are you sure you want to delete the sprint:\n${s.name}?`)) {
      return;
    }
    Axios.delete(`/api/projects/1/sprints/${s._id}`)
    setSprints(sprints.filter((sprint) => sprint._id !== s._id));
  }

  function createSprintCard(s: Sprint) {
    return (
      <div
        key={s._id}
        className="flex items-center justify-between gap-2 px-4 py-2 rounded-lg bg-muted border md:w-[100%] mt-4"
      >
        <div className="border-spacing-5">
          <p className="font-bold">{s.name}</p>
          <p>
            {new Date(s.startDate).toLocaleDateString("en-US")} -{" "}
            {new Date(s.endDate).toLocaleDateString("en-US")}
          </p>
        </div>
        <div>
          <button
            onClick={gotoSprintPage(s)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            View
          </button>
          {session?.role === "developer" && (
            <>
              <button
                onClick={gotoEditSprintPage(s)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded ml-4"
              >
                Edit
              </button>
              <button 
              onClick={deleteSprint(s)}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded ml-4">
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const [sprints, setSprints] = useState<Sprint[]>([]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const getSprints = async () => {
      try {
        const dbSprints: Array<Sprint> = (
          await Axios.get("/api/projects/1/sprints", {
            signal: controller.signal,
          })
        ).data;

        if (isMounted) {
          setSprints(dbSprints);
        }
      } catch (err) {
        console.log(err);
      }
    };

    getSprints();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [Axios]);

  return (
    <>
      <div className="relative z-10">
        {ShowNav ? <Navbar ShowNav={ShowNav} hideNav={hideNav} /> : null}
      </div>
      <div className="flex items-center justify-between mb-8">
        <svg
          className={"w-10 h-10 md:hidden"}
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          onClick={displayNav}
        >
          <path
            d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z"
            fill="currentColor"
            fill-rule="evenodd"
            clip-rule="evenodd"
          ></path>
        </svg>
        <h1 className="text-4xl font-bold flex items-center justify-center md:justify-start md:items-start w-[80vw]">
          All Sprints
        </h1>
        <div className="flex items-center gap-2">
          {session?.role == "developer" && (
            <button
              onClick={() => navigate("/sprints/edit")}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Create
            </button>
          )}
        </div>
      </div>
      {sprints.length != 0 ? 
      sprints.map(createSprintCard) : 
      <div className="flex items-center justify-center mt-16">
        <p className="text-lg text-gray-500">No sprints found.</p>
      </div>}
    </>
  );
}
