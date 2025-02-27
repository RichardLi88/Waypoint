"use client"

import useAxios from "../hooks/useAxios";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "../Navbar";

type Change<T> = {
  oldValue?: T;
  newValue?: T;
};

type Priority = "low" | "medium" | "high" | "critical";
type TaskStatus = "completed" | "in_progress" | "not_started";
type UserRole = "admin" | "developer";
type TaskHistoryItem = {
  _id: string;
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
  _id: string;
  name: string;
  username: string;
  role: UserRole;
};

function EditSprintDetails() {
  const Axios = useAxios();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [inputs, setInputs] = useState<{
    sprintName: string;
    productOwner: string;
    scrumMaster: string;
    startDate: Date | null;
    endDate: Date | null;
    sprintBacklogItems: Task[];
    productBacklogItems: Task[];
    developers: User[];
    teamMembers: User[];
    id_map: Record<number, User>;
  }>({
    sprintName: state ? state.sprint.name : "",
    productOwner: "unassigned",
    scrumMaster: "unassigned",
    startDate: state ? state.sprint.startDate : null,
    endDate: state ? state.sprint.endDate : null,
    sprintBacklogItems: [],
    productBacklogItems: [],
    developers: [],
    teamMembers: [],
    id_map: {},
  });

  const [ShowNav, setShowNav] = useState(false);
  const [invalidFields, setInvalidFields] = useState("");

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

        const team = await Axios.get("/api/projects/1/team", {
          signal: controller.signal,
        });

        const tasks = (tasksReq.data as Array<Task>).filter(
          (task) => task.sprint == null
        );
        const developers = (team.data as Array<User>).filter(
          (user) => user.role === "developer"
        );

        console.log("developers: ", developers);

        const id_map = developers.reduce(
          (acc: Record<string, User>, { _id, name, username, role }) => {
            acc[_id] = { _id, name, username, role };
            return acc;
          },
          {}
        );

        let newSprintName = "";
        let newStartDate = null;
        let newEndDate = null;
        let newProductOwner = "unassigned";
        let newScrumMaster = "unassigned";
        let sbis: Task[] = [];
        let newTeamMembers: User[] = [];

        if (state) {
          const productOwner = await Axios.get(
            "/api/users?id=" + state.sprint.PO,
            {
              signal: controller.signal,
            }
          );

          const scrumMaster = await Axios.get(
            "/api/users?id=" + state.sprint.scrumMaster,
            {
              signal: controller.signal,
            }
          );

          const tasks = await Axios.get(
            "/api/projects/1/sprints/" + state.sprint._id + "/tasks",
            {
              signal: controller.signal,
            }
          );

          sbis = tasks.data;

          newSprintName = state.sprint.name;
          newStartDate = state.sprint.startDate;
          newEndDate = state.sprint.endDate;
          newProductOwner = productOwner.data.name;
          newScrumMaster = scrumMaster.data.name;
          newTeamMembers = state.sprint.team.map((id: number) => id_map[id]).filter((member: User) => member.name !== newProductOwner && member.name !== newScrumMaster);
        }

        if (isMounted) {
          setInputs({
            ...inputs,
            sprintName: newSprintName,
            startDate: newStartDate,
            endDate: newEndDate,
            productOwner: newProductOwner,
            scrumMaster: newScrumMaster,
            productBacklogItems: tasks,
            sprintBacklogItems: sbis,
            developers: developers,
            teamMembers: newTeamMembers,
            id_map: id_map,
          });
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

  const handleChange = (event: React.ChangeEvent) => {
    const name: string = (event.target as HTMLInputElement).name;
    const value: string = (event.target as HTMLInputElement).value;
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const sprintName = inputs.sprintName;
    const productOwner = inputs.productOwner;
    const scrumMaster = inputs.scrumMaster;
    const startDate = inputs.startDate
      ? new Date(inputs.startDate).toUTCString()
      : "";
    const endDate = inputs.endDate
      ? new Date(inputs.endDate).toUTCString()
      : "";
    const sbis = inputs.sprintBacklogItems;
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 1);

    if (!sprintName) {
      setInvalidFields("Sprint Name Required");
      return;
    } else if (productOwner === "unassigned") {
      setInvalidFields("Product Owner required");
      return;
    } else if (scrumMaster === "unassigned") {
      setInvalidFields("Scrum Master required");
      return;
    } else if (productOwner === scrumMaster) {
      setInvalidFields("Cannot have same Scrum Master and Product Owner");
      return;
    } else if (!startDate || !endDate) {
      setInvalidFields("Start and End Date required");
      return;
    } else if (
      inputs.startDate &&
      inputs.endDate &&
      inputs.startDate >= inputs.endDate
    ) {
      setInvalidFields("End date must be after start date");
      return;
    } else if (inputs.startDate && currentDate > new Date(inputs.startDate)) {
      setInvalidFields("Start date is in the past");
      return;
    } else if (sbis.length === 0) {
      setInvalidFields("At least one Sprint Backlog Item required");
      return;
    } else {
      setInvalidFields("");

      try {
        const PO_id = inputs.developers.find(
          (dev) => dev.name === productOwner
        )?._id;

        const SM_id = inputs.developers.find(
          (dev) => dev.name === scrumMaster
        )?._id;

        const team_ids = [PO_id, SM_id, ...inputs.teamMembers.map(member => member._id)];

        // creating a new sprint
        if (!state) {
          Axios.post("/api/projects/1/sprints", {
            name: sprintName,
            team: Array.from(new Set(team_ids)),
            PO: PO_id,
            scrumMaster: SM_id,
            startDate,
            endDate,
            tasks: sbis.map((task) => task._id),
          });
        } else {
          // editing existing sprint
          Axios.patch("/api/projects/1/sprints/" + state.sprint._id, {
            name: sprintName,
            team: Array.from(new Set(team_ids)),
            PO: PO_id,
            scrumMaster: SM_id,
            startDate,
            endDate,
            tasks: sbis.map((task) => task._id),
          });
        }

        navigate("/sprints/all");
      } catch (err) {
        console.log(err);
      }
    }
    setInvalidFields("");
  };

  const handleTeamMemberChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value;

    const selectedUser = inputs.developers.find(dev => dev._id as string === selectedId);
    
    if (selectedUser) {
      if (selectedUser.name === inputs.productOwner || selectedUser.name === inputs.scrumMaster) {
        setInvalidFields("Product Owner and Scrum Master cannot be added as team members");
        return;
      }

      setInputs(prevInputs => ({
        ...prevInputs,
        teamMembers: [...prevInputs.teamMembers, selectedUser]
      }));
    }
  };

  const removeTeamMember = (userId: string) => {
    setInputs(prevInputs => ({
      ...prevInputs,
      teamMembers: prevInputs.teamMembers.filter(member => member._id !== userId)
    }));
  };

  const onDragStart = (
    e: React.DragEvent,
    item: string,
    isProductBacklog: boolean
  ) => {
    e.dataTransfer.setData("text/plain", item);
    e.dataTransfer.setData(
      "backlog-type",
      isProductBacklog ? "product" : "sprint"
    );
    document.body.style.cursor = "grabbing";
  };

  const onDrop = (e: React.DragEvent, targetType: string) => {
    e.preventDefault();
    const item = e.dataTransfer.getData("text/plain");
    const sourceType = e.dataTransfer.getData("backlog-type");

    if (sourceType === targetType) return;

    setInputs((inputs) => {
      const sourceItems =
        sourceType === "product"
          ? inputs.productBacklogItems
          : inputs.sprintBacklogItems;
      const targetItems =
        targetType === "product"
          ? inputs.productBacklogItems
          : inputs.sprintBacklogItems;

      const movedItem = sourceItems.find((i) => i.name === item);

      if (!movedItem) return inputs;

      return {
        ...inputs,
        productBacklogItems:
          targetType === "product"
            ? [...targetItems, movedItem]
            : sourceItems.filter((i) => i !== movedItem),
        sprintBacklogItems:
          targetType === "sprint"
            ? [...targetItems, movedItem]
            : sourceItems.filter((i) => i !== movedItem),
      };
    });

    document.body.style.cursor = "default";
  };

  const onDragEnd = () => {
    document.body.style.cursor = "default";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const createItems = (items: Task[], isProductBacklog: boolean) => {
    return items.map((item) => (
      <div
        key={item._id}
        className={`bg-white rounded-lg shadow-md p-3`}
        draggable
        onDragStart={(e) => onDragStart(e, item.name, isProductBacklog)}
        onDragEnd={onDragEnd}
        onMouseDown={() => (document.body.style.cursor = "grabbing")}
        onMouseUp={() => (document.body.style.cursor = "default")}
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
            {item.assignees?.map((id) => inputs.id_map[id].name).join(", ")}
          </span>
        </div>
      </div>
    ));
  };

  const formInputElement = (
    id: string,
    type: string,
    label: string,
    placeholder: string,
    value?: string
  ) => (
    <>
      <label
        htmlFor={id}
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        {label}
      </label>
      <div className="mt-2">
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          className="p-3 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          onChange={handleChange}
          value={value}
        />
      </div>
    </>
  );

  const formSelectElement = (
    id: string,
    label: string,
    options: string[],
    value: string
  ) => {
    return (
      <>
        <label
          htmlFor={id}
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          {label}
        </label>
        <select
          id={id}
          name={id}
          className="mt-2 block w-full py-1.5 rounded-md border-0 shadow-sm ring-1 ring-inset ring-gray-300 text-gray-900 sm:text-sm sm:leading-6 focus:ring-indigo-600"
          onChange={handleChange}
        >
          {options.map((i) =>
            i == value ? (
              <option selected key={i} value={i}>
                {i}
              </option>
            ) : (
              <option key={i} value={i}>
                {i}
              </option>
            )
          )}
        </select>
      </>
    );
  };

  return (
    <>
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
              fillRule="evenodd"
              clipRule="evenodd"
            ></path>
          </svg>
          <h1 className="text-4xl font-bold flex items-center justify-center md:justify-start md:items-start w-[80vw]">
            {state ? "Edit" : "Create"} Sprint
          </h1>
        </div>
      </div>
      <br />
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 sm:col-span-4">
          <div>
            {formInputElement(
              "sprintName",
              "text",
              "Sprint Name",
              "Sprint Name",
              inputs.sprintName
            )}
          </div>
          <div className="space-y-4 grid sm:grid-cols-2 sm:space-y-0 gap-x-6">
            <div>
              {formSelectElement(
                "productOwner",
                "Product Owner",
                ["unassigned", ...inputs.developers.map((dev) => dev.name)],
                inputs.productOwner
              )}
            </div>
            <div>
              {formSelectElement(
                "scrumMaster",
                "Scrum Master",
                ["unassigned", ...inputs.developers.map((dev) => dev.name)],
                inputs.scrumMaster
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 pb-8 border-b grid grid-cols-2 gap-x-6">
          <div>
            {inputs.startDate !== null
              ? formInputElement(
                  "startDate",
                  "date",
                  "Start Date",
                  "",
                  new Date(inputs.startDate).toLocaleDateString("en-CA")
                )
              : formInputElement("startDate", "date", "Start Date", "")}
          </div>
          <div>
            {inputs.endDate !== null
              ? formInputElement(
                  "endDate",
                  "date",
                  "End Date",
                  "",
                  new Date(inputs.endDate).toLocaleDateString("en-CA")
                )
              : formInputElement("endDate", "date", "End Date", "")}
          </div>
        </div>

        <div className="mt-8 pb-8 border-b">
          <label htmlFor="teamMembers" className="block text-sm font-medium leading-6 text-gray-900">
            Team Members
          </label>
          <div className="mt-2 flex items-center space-x-2">
            <select
              id="teamMembers"
              className="block w-full py-1.5 rounded-md border-0 shadow-sm ring-1 ring-inset ring-gray-300 text-gray-900 sm:text-sm sm:leading-6 focus:ring-indigo-600"
              onChange={handleTeamMemberChange}
              value=""
            >
              <option value="" disabled>Select a team member</option>
              {inputs.developers
                .filter(dev => 
                  dev.name !== inputs.productOwner && 
                  dev.name !== inputs.scrumMaster && 
                  !inputs.teamMembers.some(member => member._id === dev._id)
                )
                .map(dev => (
                  <option key={dev._id} value={dev._id}>{dev.name}</option>
                ))
              }
            </select>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {inputs.teamMembers.map(member => (
              <div 
                key={member._id} 
                className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full cursor-pointer hover:bg-blue-200"
                onClick={() => removeTeamMember(member._id)}
              >
                {member.username}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pb-8 border-b grid gap-x-16 sm:grid-cols-2">
          <div
            className="sm:block flex flex-col space-y-6 "
            onDrop={(e) => onDrop(e, "product")}
            onDragOver={onDragOver}
          >
            <h1 className="font-light text-2xl">Product Backlog Items</h1>
            <div className="bg-gray-200 p-4 rounded-md space-y-4">
              {createItems(inputs.productBacklogItems, true)}
            </div>
          </div>
          <div
            className="flex flex-col space-y-6"
            onDrop={(e) => onDrop(e, "sprint")}
            onDragOver={onDragOver}
          >
            <h1 className="font-light text-xl sm:text-2xl">
              Sprint Backlog Items
            </h1>
            <div className="bg-gray-200 p-4 rounded-md space-y-4 min-h-[20%]">
              {createItems(inputs.sprintBacklogItems, false)}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-x-6">
          <Link
            className="text-sm font-semibold leading-6 text-gray-900 hover:underline"
            to="/"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {state ? "Save Changes" : "Create"}
          </button>
        </div>
        {invalidFields && (
          <p className="text-red-700 font-semibold">{invalidFields}</p>
        )}
      </form>
    </>
  );
}

export default EditSprintDetails;