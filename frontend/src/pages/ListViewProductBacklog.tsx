import story_points_image from "../assets/story_points.jpeg";
import { Navbar } from "../Navbar";
import { useState, useEffect } from "react";
import useAxios from "../hooks/useAxios";
import useAuth from "../hooks/useAuth";
import { Link } from "react-router-dom";

type Change<T> = {
  oldValue?: T;
  newValue?: T;
};

type Priority = "low" | "medium" | "high" | "critical";
type TaskStatus = "completed" | "in_progress" | "not_started";
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

export default function Component() {
  const [ShowNav, setShowNav] = useState(false);
  const Axios = useAxios();
  const session = useAuth().session;
  const [tasks, setTasks] = useState<Task[]>([]);

  const displayNav = () => {
    setShowNav(true);
  };

  const hideNav = () => {
    setShowNav(false);
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const getTasks = async () => {
      try {
        const tasksReq = await Axios.get("/api/projects/1/tasks", {
          signal: controller.signal,
        });

        if (isMounted) {
          const task_list = (tasksReq.data as Array<Task>).filter(
            (task) => task.sprint == null
          );
          setTasks(task_list);
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

  return (
    <>
      <div className="relative z-10">
        {ShowNav ? <Navbar ShowNav={ShowNav} hideNav={hideNav} /> : null}
      </div>
      <div className="flex items-center justify-between mb-8">
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
        <h1 className="text-4xl font-bold flex items-center justify-center md:justify-start md:items-start w-[80vw]">
          Product Backlog
        </h1>
        <div className="flex items-center gap-2">
          {session?.role == "developer" && (
            <Link to="/backlog/edit">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Create
              </button>
            </Link>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.length != 0 ? (
          tasks.map((item: Task) => (
            <Link to={`/tasks/${item._id}`}>
              <div
                key={item.proj_id}
                className="flex items-center justify-between gap-2 px-4 py-2 rounded-lg bg-muted border md:w-[100%]"
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
        ) : (
          <div className="flex items-center justify-center mt-16">
            <p className="text-lg text-gray-500">No Tasks found.</p>
          </div>
        )}
      </div>
    </>
  );
}
