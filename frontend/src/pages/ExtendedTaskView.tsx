import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAxios from "../hooks/useAxios";
import { Navbar } from "../Navbar";
import useAuth from "../hooks/useAuth";

type Change<T> = {
  from?: T;
  to?: T;
};

type User = {
  _id: number;
  name: string;
  username: string;
  role: UserRole;
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
  workTime?: number;
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
  _id: number | string;
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

const TaskPage = () => {
  const { id } = useParams();
  const Axios = useAxios();
  const { session } = useAuth();
  const [ShowNav, setShowNav] = useState(false);
  const [team, setTeam] = useState<User[]>();
  const [task, setTask] = useState<Task>();
  const [sprint, setSprint] = useState<Sprint>();
  const [showHistory, setShowHistory] = useState(false);
  const [workHours, setWorkHours] = useState(0);
  const [workMinutes, setWorkMinutes] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const displayNav = () => {
    setShowNav(true);
  };

  const hideNav = () => {
    setShowNav(false);
  };

  useEffect(() => {
    const controller = new AbortController();

    const getTasks = async () => {
      try {
        const task_info = (
          await Axios.get(`/api/projects/1/tasks/${id}`, {
            signal: controller.signal,
          })
        ).data as Task;

        const members = await Axios.get("/api/projects/1/team", {
          signal: controller.signal,
        });

        if (task_info.sprint) {
          const sprint_info = await Axios.get(
            `/api/projects/1/sprints/${task_info.sprint}`,
            {
              signal: controller.signal,
            }
          );
          setSprint(sprint_info.data as Sprint);
        }

        setTeam(members.data);
        setTask(task_info);
      } catch (err) {
        console.error(err);
      }
    };

    getTasks();
    return () => {
      controller.abort();
    };
  }, [Axios, id]);

  if (!id) {
    return <div>Invalid Task ID</div>;
  }

  type HistoryDetail = {
    type: TaskHistoryItem["type"];
    field?: string;
    from?: string;
    to?: string;
    workTime?: number;
    comment?: string;
  };

  function historyDetail(taskHistory: TaskHistoryItem): HistoryDetail[] | null {
    const fields = [];

    switch (taskHistory.type) {
      case "work_log": {
        const workLog = {
          type: taskHistory.type,
          workTime: taskHistory.workTime,
        };
        fields.push(workLog);
        break;
      }
      case "comment": {
        const comment = {
          type: taskHistory.type,
          comment: taskHistory.comment,
        };
        fields.push(comment);
        break;
      }
      case "creation": {
        const creation = {
          type: taskHistory.type,
        };
        fields.push(creation);
        break;
      }
      case "update":
        for (const key in taskHistory.changes) {
          const change =
            taskHistory.changes[key as keyof typeof taskHistory.changes];
          if (change && change.from !== change.to) {
            const changed = {
              type: taskHistory.type,
              field: key,
              from: change.from as string,
              to: change.to as string,
            };
            fields.push(changed);
          }
        }
        break;
      default:
        return null;
    }

    fields.map((field) => {
      if (field.type === "update" && field.field === "status") {
        if (field.from === "in_progress") field.from = "'In Progress'";
        if (field.from === "not_started") field.from = "'Not Started'";
        if (field.from === "completed") field.from = "'Done'";
        if (field.to === "in_progress") field.to = "'In Progress'";
        if (field.to === "not_started") field.to = "'Not Started'";
        if (field.to === "completed") field.to = "'Done'";
      }
    });

    return fields.length > 0 ? fields : null;
  }

  const handleLogWork = async () => {
    const totalMilliseconds = (workHours * 60 + workMinutes) * 60 * 1000;
    if (totalMilliseconds <= 0 || totalMilliseconds > 24 * 60 * 60 * 1000) {
      setError("Work time must be between 0 and 24 hours");
      return;
    }

    try {
      await Axios.post(`/api/projects/1/tasks/${id}/worklog`, {
        workTime: totalMilliseconds,
      });

      const updatedTask = await Axios.get(`/api/projects/1/tasks/${id}`);
      setTask(updatedTask.data);
      setWorkHours(0);
      setWorkMinutes(0);
      setError(null);
    } catch {
      setError("Failed to log work time. Please try again.");
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    try {
      await Axios.post(`/api/projects/1/tasks/${id}/comment`, {
        comment: comment.trim(),
      });

      const updatedTask = await Axios.get(`/api/projects/1/tasks/${id}`);
      setTask(updatedTask.data);
      setComment("");
      setError(null);
    } catch {
      setError("Failed to add comment. Please try again.");
    }
  };

  async function deleteThis(): Promise<void> {
    await Axios.delete(`/api/projects/1/tasks/${id}`);
    navigate("/backlog");
  }

  function gotoEditTask(): void {
    navigate(`/backlog/edit`, { state: { task } });
  }

  function updateNode(update: TaskHistoryItem) {
    return historyDetail(update)?.map((changed, index) => {
       return (
        <li key={index} className="ml-6 mb-1 flex justify-between">
          <span className="text-gray-800">
            {getHistoryText(changed, update)}
          </span>
          <span className="text-gray-500">
            {new Date(update.createdAt).toLocaleString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </li>
      );
    });
  }

  function getHistoryText(changed: HistoryDetail, update: TaskHistoryItem) {
    switch (changed.type) {
      case "work_log":
        return `${
          team?.find((member) => member._id === update.userRef)?.name
        } logged ${((changed.workTime ?? 0) / (60 * 60 * 1000)).toFixed(2)} hours.`;
      case "comment":
        return `${
          team?.find((member) => member._id === update.userRef)?.name
        } commented: "${changed.comment}".`;
      case "creation":
        return `${
          team?.find((member) => member._id === update.userRef)?.name
        } created the task.`;
      case "update":
        switch (changed.field) {
          case "name":
            return `${
              team?.find((member) => member._id === update.userRef)?.name
            } changed the task name from "${changed.from}" to "${changed.to}".`;
          case "description":
            return `${
              team?.find((member) => member._id === update.userRef)?.name
            } changed the description.`;
          case "assignees":
            return `${
              team?.find((member) => member._id === update.userRef)?.name
            } changed the assignee.`;
          case "weight":
            return `${
              team?.find((member) => member._id === update.userRef)?.name
            } changed the story points from ${changed.from} to ${changed.to}.`;
          case "priority":
            return `${
              team?.find((member) => member._id === update.userRef)?.name
            } changed the priority from ${changed.from} to ${changed.to}.`;
          case "tags":
            return `${
              team?.find((member) => member._id === update.userRef)?.name
            } changed the tags.`;
          case "status":
            return `${
              team?.find((member) => member._id === update.userRef)?.name
            } changed the status from ${changed.from} to ${changed.to}.`;
          default:
            return `${
              team?.find((member) => member._id === update.userRef)?.name
            } changed the ${changed.field ? changed.field : "unknown"} field from ${changed.from} to ${changed.to}.`;
        }
      default:
        return "Unknown history item.";
    }
  }

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
          {task?.name}
        </h1>
        <div className="flex items-center gap-2">
          {session?.role == "developer" && (task?.sprint !== null) && (
            <button
              className={
                "bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600" +
                (task?.sprint != null ? " hidden" : "")
              }
              onClick={() => gotoEditTask()}
            >
              Edit
            </button>
          )}
          {session?.role == "developer" && (task?.sprint !== null) && (
            <button
              className={
                "bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" +
                (task?.sprint != null ? " hidden" : "")
              }
              onClick={() => deleteThis()}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="p-4 border rounded-md space-y-4">
        <div className="flex items-center">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              task?.status === "not_started"
                ? "bg-slate-500"
                : task?.status === "completed"
                ? "bg-blue-500"
                : task?.status === "in_progress"
                ? "bg-green-500"
                : "bg-neutral-400"
            }`}
          ></div>
          <div>
            Status {" - "}
            {task?.status === "not_started"
              ? "Not Started"
              : task?.status === "completed"
              ? "Done"
              : task?.status === "in_progress"
              ? "In Progress"
              : "None"}
          </div>
        </div>

        <div className="flex items-center">
          <div className="font-bold mr-2">Priority:</div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              task?.priority === "critical"
                ? "bg-red-500 text-gray-800"
                : task?.priority === "high"
                ? "bg-red-100 text-red-800"
                : task?.priority === "medium"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {task?.priority}
          </span>
        </div>

        <div className="flex">
          <div className="font-bold mr-2">Description:</div>
          <div>{task?.description}</div>
        </div>

        <div className="flex items-center">
          <div className="font-bold mr-2">Sprint Name:</div>
          <div>{sprint?.name || "No sprint assigned"}</div>
        </div>

        <div>
          <div className="font-bold mr-2">Tags:</div>
          <ul className="list-disc">
            {task?.tags.map((tag, index) => (
              <li key={index} className="ml-6">
                {tag}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center">
          <div className="font-bold mr-2">Story Points:</div>
          <div>{task?.weight}</div>
        </div>

        <div className="flex items-center">
          <div className="font-bold mr-2">Total Time Logged:</div>
          <div>
            {(
              (task?.history?.reduce(
                (acc, curr) => acc + (curr.workTime ?? 0),
                0
              ) ?? 0) /
              (60 * 60 * 1000)
            ).toFixed(2)}{" "}
            hours
          </div>
        </div>

        <div>
          <div className="font-bold mr-2">Assignee:</div>
          {team && task?.assignees && task.assignees.length > 0 ? (
            <ul className="list-disc ml-4">
              {team
          .filter((member) => task.assignees?.includes(member._id))
          .map((member) => (
            <li key={member._id}>{member.name}</li>
          ))}
            </ul>
          ) : (
            <span>No assignee</span>
          )}
        </div>

        <div className="flex items-center">
          <div className="font-bold mr-2">Creation Date:</div>
          <div>
            {task?.createdAt
              ? new Date(task.createdAt).toLocaleString()
              : "None"}
          </div>
        </div>

        <div className="flex items-center">
          <div className="font-bold mr-2">Last Updated:</div>
          <div>
            {task?.updatedAt
              ? new Date(task.updatedAt).toLocaleString()
              : "None"}
          </div>
        </div>
      </div>

      {session?.role === "developer" && (
        <>
          <div className="p-4 border rounded-md space-y-4">
            <h2 className="text-xl font-bold">Log Work</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="number"
                className="border rounded px-2 py-1 w-full sm:w-24"
                placeholder="Hours"
                min="0"
                max="23"
                value={workHours == 0 ? "" : workHours}
                onChange={(e) =>
                  setWorkHours(
                    Math.max(0, Math.min(23, parseInt(e.target.value) || 0))
                  )
                }
              />
              <input
                type="number"
                className="border rounded px-2 py-1 w-full sm:w-24"
                placeholder="Minutes"
                min="0"
                max="59"
                value={workMinutes == 0 ? "" : workMinutes}
                onChange={(e) =>
                  setWorkMinutes(
                    Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                  )
                }
              />
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={handleLogWork}
              >
                Log Work
              </button>
            </div>
          </div>

          <div className="p-4 border rounded-md space-y-4">
            <h2 className="text-xl font-bold">Add Comment</h2>
            <textarea
              className="border rounded px-2 py-1 w-full h-24"
              placeholder="Enter your comment here"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              onClick={handleAddComment}
            >
              Add Comment
            </button>
          </div>
        </>
      )}

      {error && <div className="text-red-500">{error}</div>}

      <div className="p-4 border rounded-md space-y-4">
        <div className="font-bold mr-2 flex items-center justify-between">
          <span>Task History:</span>
          <button
            className="text-blue-500"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "Hide" : "Show"}
          </button>
        </div>
        {showHistory && (
          <ul className="list-disc">
            {
              task?.history
                .slice()
                .reverse()
                .map((update) => {
                  const details = historyDetail(update);
                  return details ? updateNode(update) : null;
                })
            }
          </ul>
        )}
      </div>
    </div>
  );
};

export default TaskPage;
