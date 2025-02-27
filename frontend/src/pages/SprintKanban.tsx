import React, { useEffect, useState } from "react";
import { Navbar } from "../Navbar";
import useAxios from "../hooks/useAxios";
import useAuth from "../hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";

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
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

function BacklogCard({
  item,
  onDragStart,
}: {
  item: TransformedTask;
  onDragStart: (e: React.DragEvent, item: TransformedTask) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const handleMouseDown = () => {
    setIsDragging(true);
    document.body.style.cursor = "grabbing";
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = "default";
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-3 ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={() => navigate(`/tasks/${item._id}`)}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">{item.name}</h3>
        <h4 className="text-xs text-gray-400 font-medium">{item.weight}</h4>
      </div>
      <p className="text-xs text-gray-500 mb-2">{item.description}</p>
      <div className="flex justify-between items-center">
        <span
          className={`text-xs px-2 py-1 rounded-full ${
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
        <span className="text-xs text-gray-500">
          {item.assignees?.join(", ")}
        </span>
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const Axios = useAxios();
  const session = useAuth().session;
  const [currentSprints, setCurrentSprints] = useState<Sprint[] | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [ShowNav, setShowNav] = useState(false);

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [idMap, setIdMap] = useState<Record<number, User>>({});

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

        setIdMap(id_map);

        const currentDev =
          developers.find((dev) => dev.username == session?.username) || null;

        if (isMounted && currentDev != null) {
          const currSprints = (sprintsReq.data as Array<Sprint>).filter(
            (sprint) => sprint.team.includes(currentDev._id)
          );
          setCurrentSprints(currSprints.length > 0 ? currSprints : null);
          setAllTasks(tasksReq.data as Task[]);
          if (currSprints.length > 0) {
            const currSprint: Sprint = selectedSprint
              ? selectedSprint
              : currSprints[0];

            setSelectedSprint(currSprint);
            updateColumns(currSprint, tasksReq.data as Task[], id_map);
          }
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
  }, [Axios, selectedSprint]);

  const updateColumns = (
    sprint: Sprint,
    tasks: Task[],
    id_map: Record<number, User>
  ) => {
    const filteredTasks = tasks
      .filter((task) => task.sprint === sprint._id)
      .map((task) => ({
        ...task,
        assignees: task.assignees?.map((id) => id_map[id]?.name),
      }));

    setColumns([
      {
        id: "not_started",
        title: "Not started",
        items: filteredTasks.filter((Task) => Task.status == "not_started"),
      },
      {
        id: "in_progress",
        title: "In progress",
        items: filteredTasks.filter((Task) => Task.status == "in_progress"),
      },
      {
        id: "completed",
        title: "Done",
        items: filteredTasks.filter((Task) => Task.status == "completed"),
      },
    ]);
  };

  const handleSprintChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const sprint = currentSprints?.find(
      (s) => s._id.toString() === event.target.value
    );
    if (sprint) {
      setSelectedSprint(sprint);
      updateColumns(sprint, allTasks, idMap);
    }
  };

  const displayNav = () => {
    setShowNav(true);
  };

  const hideNav = () => {
    setShowNav(false);
  };

  const onDragStart = (e: React.DragEvent, item: TransformedTask) => {
    e.dataTransfer.setData("text/plain", JSON.stringify(item));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();

    const droppedItem: TransformedTask = JSON.parse(
      e.dataTransfer.getData("text/plain")
    );

    const newStatus = targetColumnId as TaskStatus;

    setColumns((prevColumns) => {
      const updatedColumns = prevColumns.map((column) => ({
        ...column,
        items: column.items.filter((item) => item._id !== droppedItem._id),
      }));

      const targetColumnIndex = updatedColumns.findIndex(
        (column) => column.id === targetColumnId
      );

      updatedColumns[targetColumnIndex].items.push({
        ...droppedItem,
        status: newStatus,
      });

      return updatedColumns;
    });

    Axios.patch(`/api/projects/1/tasks/${droppedItem._id}/`, {
      status: targetColumnId,
    });
  };

  const getColumnClass = () => {
    switch (columns.length) {
      case 1:
        return "w-full";
      case 2:
        return "w-1/2";
      case 3:
        return "w-1/4";
      default:
        return "w-80";
    }
  };

  const getCardContainerClass = () => {
    if (columns.length === 1) {
      return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4";
    }
    if (columns.length === 2) {
      return "grid grid-cols-2 gap-4";
    }
    return "grid gap-4";
  };

  if (session?.role !== "developer") {
    return <Navigate to="/admin" />;
  }

  return (
    <div className="p-4">
      <div>
        <div className="relative z-10">
          {ShowNav ? <Navbar ShowNav={ShowNav} hideNav={hideNav} /> : null}
        </div>
        <div className="flex items-center justify-between">
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
            Sprint Backlog
          </h1>

          {currentSprints && currentSprints.length > 0 && (
            <div className="mb-4 flex items-center">
              <div className="mr-4">
                <h2 className="text-md font-semibold mb-2 pt-2">Select Sprint</h2>
              </div>
              <select
              className={`flex items-center justify-center rounded-md md:justify-start md:items-start w-[${currentSprints.sort(
                function (a, b) {
                return b.name.length - a.name.length;
                }
              )[0].name.length}px]`}
              onChange={handleSprintChange}
              value={selectedSprint?._id || ""}
              >
              {currentSprints.map((sprint) => (
                <option key={sprint._id} value={sprint._id}>
                {sprint.name}
                </option>
              ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
        <div
          className={
            currentSprints === null
              ? "col-span-1 lg:col-span-8"
              : "col-span-1 lg:col-span-5"
          }
        >
          {currentSprints == null ? (
            <div>
              <h1 className="text-2xl font-bold flex items-center justify-center mt-24 mx-12 text-center align-middle border border-transparent rounded-md bg-purple-200 py-3 px-2">
                You are currently not assigned to any sprints
              </h1>
            </div>
          ) : (
            <div
              className={`flex ${
                columns.length >= 4 ? "overflow-x-visible" : "flex-wrap"
              } min-w-[calc(95vw-2rem)]`}
            >
              {columns.map((column) => (
                <div
                  key={column.id}
                  className={`${getColumnClass()} p-2 min-w-[300px]`}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, column.id)}
                >
                  <h2 className="font-semibold mb-3">{column.title}</h2>
                  <div
                    className={`bg-gray-200 rounded-md p-4 ${
                      columns.length >= 3
                        ? "h-[calc(95vh-8rem)]"
                        : "min-h-[calc(95vh-8rem)]"
                    } overflow-y-auto`}
                  >
                    <div className={getCardContainerClass()}>
                      {column.items.map((item) => (
                        <BacklogCard
                          key={item._id}
                          item={item}
                          onDragStart={onDragStart}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
