import { useState, useEffect } from "react";
import story_points_image from "../assets/story_points.jpeg";
import filter_image from "../assets/filter.jpeg";
import { Navbar } from "../Navbar";
import Select, { SingleValue } from "react-select";
import useAxios from "../hooks/useAxios";
import useAuth from "../hooks/useAuth";
import { Link } from "react-router-dom";

type Column = {
  id: string;
  title: string;
  items: TransformedTask[];
};

type TransformedTask = Omit<Task, "assignees"> & {
  assignees?: string[];
};

type Change<T> = {
  oldValue?: T;
  newValue?: T;
};

type Priority = "low" | "medium" | "high" | "critical";
type TaskStatus = "completed" | "in_progress" | "not_started";
type UserRole = "admin" | "developer";
type TaskHistoryItem = {
  _id: number;
  type: "work_log" | "update" | "comment" | "creation";
  createdAt: Date;
  userRef: number; // User
  comment?: string;
  workTime?: Date;
  changes?: {
    name?: Change<string>;
    description?: Change<string>;
    assignees?: Change<number[]>; // Change<User[]>
    weight?: Change<number>;
    priority?: Change<Priority>;
    tags?: Change<string[]>;
    status?: Change<TaskStatus>;
  };
};

type Task = {
  _id: number;
  proj_id: number; // Project
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  history: TaskHistoryItem[];
  status: TaskStatus;
  priority: Priority;
  tags: string[];
  weight: number;
  assignees?: number[]; // User[]
  sprint?: number; // Sprint
};

type User = {
  _id: number;
  name: string;
  username: string;
  role: UserRole;
};

type Sprint = {
  _id: number;
  proj_id: number; // Project
  name: string;
  team: number[]; // User[]
  PO: number; // User
  scrumMaster: number; // User
  tasks: number[]; // Task[]
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export default function Component() {
  const Axios = useAxios();
  const session = useAuth().session;
  const [columns, setColumns] = useState<Column[]>([]);
  const [ShowNav, setShowNav] = useState(false);
  const [sprints, setSprints] = useState<Sprint[] | null>(null);
  const [CurSprint, setCurSprint] = useState<Sprint>();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const getTasks = async () => {
      try {
        const tasksReq = await Axios.get("/api/projects/1/tasks", {
          signal: controller.signal,
        });

        const team = await Axios.get("/api/projects/1/team", {
          signal: controller.signal,
        });

        const sprintsReq = await Axios.get("/api/projects/1/sprints", {
          signal: controller.signal,
        });
        const developers = (team.data as Array<User>).filter(
          (user) => user.role === "developer"
        );

        const id_map = developers.reduce(
          (acc: Record<number, User>, { _id, name, username, role }) => {
            acc[_id] = { _id, name, username, role };
            return acc;
          },
          {}
        );

        const currentDev =
          developers.find((dev) => dev.username == session?.username) || null;

        if (isMounted && currentDev != null) {
          const currSprints = (sprintsReq.data as Array<Sprint>).filter(
            (sprint) => sprint.team.includes(currentDev._id)
          );
          setSprints(currSprints);
          setCurSprint(currSprints[0]);

          const tasks = (tasksReq.data as Array<Task>)
            .filter((task) =>
              currSprints
                .map((sprint) => sprint._id)
                .includes(task.sprint ?? -1)
            )
            .map((task) => {
              return {
                ...task,
                assignees: task.assignees?.map((id) => id_map[id].name),
              };
            });

            setColumns([
            {
              id: "not_started",
              title: "Not started",
              items: tasks.filter((Task) => Task.status == "not_started"),
            },
            {
              id: "in_progress",
              title: "In progress",
              items: tasks.filter((Task) => Task.status == "in_progress"),
            },
            {
              id: "done",
              title: "Done",
              items: tasks.filter((Task) => Task.status == "completed"),
            },
          ]);
        }
      } catch (err) {
        console.log(err);
      }
    };

    getTasks();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [Axios]);

  const handleSprintChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSprintId = event.target.value;
    const selectedSprint = sprints?.find(
      (sprint) => (sprint._id as unknown as string) === selectedSprintId
    );
    setCurSprint(selectedSprint);
  };

  type filterOptions = "all" | "in_progress" | "not_started" | "done";

  // const tagColours: string[] = [
  //   "bg-sky-500",
  //   "bg-pink-500",
  //   "bg-indigo-500",
  //   "bg-cyan-500",
  //   "bg-teal-500",
  //   "bg-amber-500",
  //   "bg-red-300",
  //   "bg-gray-500",
  // ];

  const [filter, setFilter] = useState<filterOptions>("all");

  const changeFilter = (
    newValue: SingleValue<{ value: string; label: string }>
  ) => {
    if (newValue) {
      setFilter(newValue.value.toLowerCase() as filterOptions);
    }
  };

  const displayNav = () => {
    setShowNav(true);
  };

  const hideNav = () => {
    setShowNav(false);
  };

  const options = [
    { value: "all", label: "All" },
    { value: "not_started", label: "Not Started" },
    { value: "in_progress", label: "In Progress" },
    { value: "done", label: "Done" },
  ];

  return (
    <div className="flex flex-col gap-4 pr-4 md:p-6 w-[100%]">
      <div className="relative z-10">
        {ShowNav ? <Navbar ShowNav={ShowNav} hideNav={hideNav} /> : null}
      </div>
      <div className="flex items-center justify-between pb-4">
        <svg
          className="w-10 h-10 md:hidden"
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
        <h1 className="text-4xl font-bold flex items-center justify-center w-[80vw] md:items-start md:justify-start md:w-[50%]">
          Sprint Backlog
        </h1>

        {sprints && sprints.length > 0 && (
            <div className="flex items-center">
              <div className="mr-1">
                <h2 className="text-md font-semibold mb-2 pt-2">Select Sprint</h2>
              </div>
              <select
              className={`flex items-center justify-center rounded-md md:justify-start md:items-start w-[${sprints.sort(
                function (a, b) {
                return b.name.length - a.name.length;
                }
              )[0].name.length}px]`}
              onChange={handleSprintChange}
              value={CurSprint?._id || ""}
              >
              {sprints.map((sprint) => (
                <option key={sprint._id} value={sprint._id}>
                {sprint.name}
                </option>
              ))}
              </select>
            </div>
          )}

        <div className="hidden items-center ml-4 gap-2 md:flex">
          <button
            className={`px-4 py-2 rounded-lg ${
              filter === "all" ? "font-bold" : "bg-muted text-muted-foreground"
            }`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              filter === "not_started"
                ? "font-bold"
                : "bg-muted text-muted-foreground"
            }`}
            onClick={() => setFilter("not_started")}
          >
            Not Started
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              filter === "in_progress"
                ? "font-bold"
                : "bg-muted text-muted-foreground"
            }`}
            onClick={() => setFilter("in_progress")}
          >
            In Progress
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              filter === "done" ? "font-bold" : "bg-muted text-muted-foreground"
            }`}
            onClick={() => setFilter("done")}
          >
            Done
          </button>
        </div>
      </div>

      <div className="relative flex justify-end md:hidden">
        <img src={filter_image} alt="filter icon" className="w-10 h-10 pt-2" />

        <Select
          name="category"
          value={options.find((opt) => opt.value === filter)}
          onChange={changeFilter}
          className="block w-full mt-1 bg-white border border-gray-300 rounded-md"
          menuPlacement="bottom"
          options={options}
        ></Select>
      </div>

      {columns.filter(
        (column) =>
          column.id == filter || (filter == "all" && column.items.length > 0)
      ).length > 0
        ? columns
            .filter(
              (column) =>
                column.id == filter ||
                (filter == "all" &&
                  column.items.filter((item) => item.sprint == CurSprint?._id)
                    .length > 0)
            )
            .map((column: Column) => (
              <div
                key={column.title}
                className="flex flex-col gap-4 py-2 w-[100]"
              >
                <h2 className="text-2xl px-2">{column.title}</h2>
                <div className="flex flex-col gap-2">
                  {column.items.filter((item) => item.sprint == CurSprint?._id)
                    .length > 0
                    ? column.items
                        .filter((item) => item.sprint == CurSprint?._id)
                        .map((item: TransformedTask) => (
                          <Link to={`/tasks/${item._id}`}>
                            <div
                              key={item._id}
                              className="flex items-center justify-between gap-2 px-4 py-2 rounded-lg bg-muted border md:w-[100]"
                            >
                              <div className="border-spacing-5">
                                <span className="font-bold">{item.name}</span>

                                <div className="mt-2">
                                  <span
                                    className={`px-2 py-1 rounded-lg text-xs mr-1 ${
                                      item.priority === "critical"
                                        ? "bg-red-500 text-gray-800"
                                        : item.priority === "high"
                                        ? "bg-red-100 text-red-800"
                                        : item.priority === "medium"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {item.priority}
                                  </span>
                                  {item.tags.map((tag: string) => (
                                    <span
                                      className={`px-2 py-1 rounded-lg text-xs m-1 text-white ${
                                        // tagColours[Number(tag[tag.length - 1]) - 1]
                                        "bg-slate-400"
                                      }`}
                                    >
                                      {tag.toUpperCase()}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="hidden items-center gap-2 md:flex">
                                <img
                                  src={story_points_image}
                                  alt="story points image"
                                  className="w-14 h-14 mr-2"
                                />
                                <span className="font-bold">{item.weight}</span>
                              </div>
                            </div>
                          </Link>
                        ))
                    : "No tasks to display!"}
                </div>
              </div>
            ))
        : "No tasks to display!"}
    </div>
  );
}
