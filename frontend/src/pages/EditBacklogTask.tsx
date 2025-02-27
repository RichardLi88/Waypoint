import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import useAxios from "../hooks/useAxios";
import { Navbar } from "../Navbar";

type Change<T> = {
  from?: T;
  to?: T;
};

type User = {
  _id: string;
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
  assignees?: string[]; // User[]
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

export default function EditBacklogTask() {
  const Axios = useAxios();
  const navigate = useNavigate();
  const location = useLocation();
  const existingTask = location.state?.task as Task | undefined;

  const [taskTitle, setTaskTitle] = useState(existingTask?.name || "");
  const [taskDescription, setTaskDescription] = useState(existingTask?.description || "");
  const [priority, setPriority] = useState(existingTask?.priority || "");
  const [weight, setWeight] = useState(existingTask?.weight || "");
  const [tags, setTags] = useState<string[]>(existingTask?.tags || []);
  const [predefinedTags, setPredefinedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isAddingNewTag, setIsAddingNewTag] = useState(false);
  const [assignee, setAssignee] = useState<string | null>(existingTask?.assignees?.[0] || null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [invalidFields, setInvalidFields] = useState<string>("");

  const [ShowNav, setShowNav] = useState(false);

  const displayNav = () => {
    setShowNav(true);
  };

  const hideNav = () => {
    setShowNav(false);
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const tagsResponse = await Axios.get("/api/projects/1/tags", { signal: controller.signal });
        let team;

        if (existingTask?.sprint) {
          const sprintResponse = await Axios.get(`/api/projects/1/sprints/${existingTask.sprint}/`, { signal: controller.signal });
          team = await Promise.all((sprintResponse.data as Sprint).team.map(async (userId: number) => {
              const userResponse = await Axios.get(`/api/users/${userId}`, { signal: controller.signal });
              return userResponse.data as User;
            }
          ));
        } else {
          const teamResponse = await Axios.get("/api/projects/1/team", { signal: controller.signal });
          team = teamResponse.data as User[];
        }

        if (isMounted) {
          setPredefinedTags(tagsResponse.data);
          setTeamMembers(team.filter((member) => member.role === "developer"));
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [Axios]);

  const allTags = [...new Set([...predefinedTags, ...tags])];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!taskTitle.trim()) {
      setInvalidFields("Task title is required");
      return;
    }

    if (!taskDescription.trim()) {
      setInvalidFields("Task description is required");
      return;
    }

    if (!priority) {
      setInvalidFields("Priority is required");
      return;
    }

    if (!weight) {
      setInvalidFields("Weight is required");
      return;
    }

    try {
      const taskData = {
        name: taskTitle,
        description: taskDescription,
        priority: priority,
        weight: weight,
        tags: tags,
        assignees: assignee != null ? [assignee] : [],
      };

      if (existingTask) {
        await Axios.patch(`/api/projects/1/tasks/${existingTask._id}`, taskData);
      } else {
        await Axios.post("/api/projects/1/tasks", taskData);
      }

      setInvalidFields("");

      if (existingTask) {
        navigate(`/tasks/${existingTask._id}`);
      } else {
        navigate("/backlog");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTag = e.target.value;
    if (selectedTag === "new") {
      setIsAddingNewTag(true);
    } else if (selectedTag && !tags.includes(selectedTag)) {
      setTags([...tags, selectedTag]);
    }
  };

  const handleAddNewTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
      setIsAddingNewTag(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (selectedId !== "unassigned") {
      setAssignee(selectedId);
    } else {
      setAssignee(null);
    }
  };


  return (
    <>
      <div>
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
          <h1 className="text-4xl font-bold flex items-center justify-start md:justify-start md:items-start w-[80vw]">
            {existingTask ? "Edit Backlog Task" : "Create New Backlog Task"}
          </h1>
        </div>

        <br />
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <label htmlFor="title" className="font-light centre sm:text-2xl">
              Task Title
            </label>
            <input
              id="TaskTitle"
              name="TaskTitle"
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task Title"
              className="p-3 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              required
            />
          </div>

          <div className="space-y-6">
            <label
              htmlFor="TaskDescription"
              className="font-light centre sm:text-2xl"
            >
              Task Description
            </label>
            <textarea
              id="TaskDescription"
              name="TaskDescription"
              rows={4}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Write the description of the task."
              className="w-full p-3 rounded-md border border-gray-300 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:border-transparent centre sm:text-sm"
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-6 gap-2">
            <div className="col-span-2 space-y-6">
              <label
                htmlFor="priority"
                className="font-light centre sm:text-2xl"
              >
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full font-light centre p-3 rounded-md border py-1.5 border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="" disabled hidden>
                  Priority
                </option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="col-span-2 space-y-6">
              <label htmlFor="weight" className="font-light centre sm:text-2xl">
                Weight
              </label>
              <select
                id="Weight"
                name="Weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full font-light centre p-3 rounded-md border py-1.5 border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="" disabled hidden>
                  Weight
                </option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>

            <div className="col-span-2 space-y-6">
              <label htmlFor="tags" className="font-light centre sm:text-2xl">
                Tag
              </label>
              {isAddingNewTag ? (
                <div className="flex">
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Enter new tag"
                    className="flex-grow border border-gray-300 rounded-md w-2/3 mr-1"
                  />
                  <button
                    onClick={handleAddNewTag}
                    type="button"
                    className="border border-gray-300 rounded-md w-1/4"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  id="tags"
                  value=""
                  onChange={handleTagChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>
                    Select tags
                  </option>
                  {allTags.filter((tag) => !(tags.includes(tag))).map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                  <option value="new">Add new tag...</option>
                </select>
              )}
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary text-primary-foreground rounded-md text-sm flex items-center border border-gray-300"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-xs font-bold"
                        aria-label={`Remove ${tag} tag`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
              <label htmlFor="assignee" className="font-light centre sm:text-2xl">
                Assignee
              </label>
              <select
                id="assignee"
                name="Weight"
                value={assignee ?? "unassigned"}
                onChange={handleAssigneeChange}
                className="w-full font-light centre p-3 rounded-md border py-1.5 border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="unassigned">
                  unassigned
                </option>
                {teamMembers
                  .map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

          <div className="mt-6 flex items-center gap-x-6 justify-between">
            <Link
              to="/"
              className="text-sm font-semibold text-gray-900 hover:underline space-y-6 border border-gray-500 rounded-md px-3 py-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 space-y-6"
            >
              {existingTask ? "Update Task" : "Create Task"}
            </button>
          </div>
          {invalidFields && (
            <p className="text-red-700 font-semibold">{invalidFields}</p>
          )}
        </form>
      </div>
    </>
  );
}