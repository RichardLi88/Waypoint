import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useAxios from "../hooks/useAxios";
import { Navbar } from "../Navbar";
import BurndownChart from "./BurndownChart";

type User = {
  _id: number;
  name: string;
  username: string;
  role: "admin" | "developer";
};

type Change<T> = {
  from?: T;
  to?: T;
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

type Sprint = {
  _id: number;
  proj_id: number;
  name: string;
  team: number[];
  PO: number;
  scrumMaster: number;
  tasks: number[];
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
};

const SprintPage = () => {
  const { id } = useParams();
  const Axios = useAxios();
  const [ShowNav, setShowNav] = useState(false);
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [team, setTeam] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayNav = () => {
    setShowNav(true);
  };

  const hideNav = () => {
    setShowNav(false);
  };

  useEffect(() => {
    const fetchSprintData = async () => {
      try {
        const sprintResponse = await Axios.get(`/api/projects/1/sprints/${id}`);
        setSprint(sprintResponse.data);

        const teamResponse = await Axios.get("/api/projects/1/team");
        setTeam(teamResponse.data);

        const tasksPromises = sprintResponse.data.tasks.map((taskId: number) =>
          Axios.get(`/api/projects/1/tasks/${taskId}`)
        );
        const tasksResponses = await Promise.all(tasksPromises);
        setTasks(tasksResponses.map((response) => response.data));

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load sprint data. Please try again later.");
        setLoading(false);
      }
    };

    fetchSprintData();
  }, [Axios, id]);

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  if (!sprint) {
    return <div className="text-center p-4">Sprint not found</div>;
  }

  const getTeamMemberName = (userId: number) => {
    const user = team.find((u) => u._id === userId);
    return user ? user.name : "Unknown";
  };

  return (
    <div className="flex flex-col gap-4 md:p-6">
      <div className="relative z-10">
        {ShowNav ? <Navbar ShowNav={ShowNav} hideNav={hideNav} /> : null}
      </div>
      <div className="flex items-center justify-between">
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
            fillRule="evenodd"
            clipRule="evenodd"
          ></path>
        </svg>
        <h1 className="text-4xl font-bold flex items-center justify-center w-[80%] md:items-start md:justify-start md:w-[50%]">
          {sprint.name}
        </h1>
      </div>

      <div className="p-4 border rounded-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Sprint Details</h2>
            <p>
              <span className="font-bold">Product Owner:</span>{" "}
              {getTeamMemberName(sprint.PO)}
            </p>
            <p>
              <span className="font-bold">Scrum Master:</span>{" "}
              {getTeamMemberName(sprint.scrumMaster)}
            </p>
            <p>
              <span className="font-bold">Total Story Points:</span>{" "}
              {tasks.reduce((total, task) => total + task.weight, 0)}
            </p>
            <p>
              <span className="font-bold">Start Date:</span>{" "}
              {new Date(sprint.startDate).toLocaleDateString()}
            </p>
            <p>
              <span className="font-bold">End Date:</span>{" "}
              {sprint.endDate
                ? new Date(sprint.endDate).toLocaleDateString()
                : "Not set"}
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Team Members</h2>
            <ul className="list-disc pl-5">
              {sprint.team.map((memberId) => (
                <li key={memberId}>{getTeamMemberName(memberId)}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Tasks</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Status</th>
                  <th className="py-2 px-4 text-left">Priority</th>
                  <th className="py-2 px-4 text-left">Story Points</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id} className="border-b">
                    <td className="py-2 px-4">
                      <Link to={`/tasks/${task._id}`}>{task.name}</Link>
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          task.status === "completed"
                            ? "bg-green-200 text-green-800"
                            : task.status === "in_progress"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          task.priority === "critical"
                            ? "bg-red-500 text-gray-800"
                            : task.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : task.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-2 px-4">{task.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="p-4 border rounded-md space-y-4">
        <h2 className="text-xl font-semibold">Burndown Chart</h2>
        <div className="min-h-[65vh] border border-gray-200 rounded-md">
          <div className="col-span-1 lg:col-span-3 h-[55vh]">
            <br />
            {
              <BurndownChart
                sprintData={{
                  title: sprint.name,
                  startDate: new Date(sprint.startDate),
                  endDate: new Date(sprint.endDate),
                  items: tasks.map((task) => ({
                    status: task.status,
                    storyPoints: task.weight,
                    completedAt:
                      task.history.find(
                        (h) => h.changes?.status?.to === "completed"
                      )?.createdAt || null,
                  })),
                }}
              />
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprintPage;
