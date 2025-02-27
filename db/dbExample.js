use("waypoint");

const users = [
  { name: "Alice Johnson", username: "alice_j", password: "$2a$10$hGYiBhyzHrPyVeqHDWcMzOXSu9jVhpSDJpGZExB0x2P9CMJIEYJX2", role: "admin", createdAt: new Date("2024-09-15T12:00:00Z"), updatedAt: new Date("2024-09-15T12:00:00Z") },
  { name: "Bob Smith", username: "bob_smith", password: "$2a$10$hGYiBhyzHrPyVeqHDWcMzOXSu9jVhpSDJpGZExB0x2P9CMJIEYJX2", role: "admin", createdAt: new Date("2024-09-16T14:30:00Z"), updatedAt: new Date("2024-09-16T14:30:00Z") },
  { name: "Charlie Brown", username: "charlie_b", password: "$2a$10$fxHMiADSZ66zkzgP9120Q.ft9r4ybtjly.jmmNfL5bHOmhOMuNCCq", role: "developer", createdAt: new Date("2024-09-17T10:00:00Z"), updatedAt: new Date("2024-09-17T10:00:00Z") },
  { name: "Diana Prince", username: "diana_p", password: "$2a$10$fxHMiADSZ66zkzgP9120Q.ft9r4ybtjly.jmmNfL5bHOmhOMuNCCq", role: "developer", createdAt: new Date("2024-09-17T12:00:00Z"), updatedAt: new Date("2024-09-17T12:00:00Z") },
  { name: "Evan Wright", username: "evan_w", password: "$2a$10$fxHMiADSZ66zkzgP9120Q.ft9r4ybtjly.jmmNfL5bHOmhOMuNCCq", role: "developer", createdAt: new Date("2024-09-18T09:00:00Z"), updatedAt: new Date("2024-09-18T09:00:00Z") },
  { name: "Fiona Green", username: "fiona_g", password: "$2a$10$fxHMiADSZ66zkzgP9120Q.ft9r4ybtjly.jmmNfL5bHOmhOMuNCCq", role: "developer", createdAt: new Date("2024-09-18T09:30:00Z"), updatedAt: new Date("2024-09-18T09:30:00Z") }
];

const userInsertResult = db.users.insertMany(users);

const aliceId = userInsertResult.insertedIds[0];
const bobId = userInsertResult.insertedIds[1];
const charlieId = userInsertResult.insertedIds[2];
const dianaId = userInsertResult.insertedIds[3];
const evanId = userInsertResult.insertedIds[4];
const fionaId = userInsertResult.insertedIds[5];

const project = {
  name: "Project Apollo",
  description: "A project to develop a task management app.",
  startDate: new Date("2024-09-20T08:00:00Z"),
  endDate: new Date("2024-12-20T08:00:00Z"),
  team: [aliceId, bobId, charlieId, dianaId, evanId, fionaId],
  status: "active",
  createdAt: new Date("2024-09-18T10:00:00Z"),
  updatedAt: new Date("2024-09-18T10:00:00Z")
};

const projectInsertResult = db.projects.insertOne(project);

// Extract project ID
const projectId = projectInsertResult.insertedId;

// Insert tasks
const tasks = [
  {
    proj_id: projectId,
    name: "Design Database Schema",
    description: "Create the database schema for the task management app.",
    createdAt: new Date("2024-09-21T09:00:00Z"),
    updatedAt: new Date("2024-10-14T10:30:00Z"),
    history: [
      { _id: new ObjectId(), type: "creation", createdAt: new Date("2024-09-21T09:00:00Z"), userRef: charlieId },
      { _id: new ObjectId(), type: "work_log", createdAt: new Date("2024-10-01T08:00:00Z"), userRef: charlieId, workTime: 7200000 },
      { _id: new ObjectId(), type: "work_log", createdAt: new Date("2024-10-05T09:00:00Z"), userRef: charlieId, workTime: 14400000 },
      { _id: new ObjectId(), type: "work_log", createdAt: new Date("2024-10-12T14:00:00Z"), userRef: charlieId, workTime: 3600000 }
    ],
    status: "in_progress",
    priority: "high",
    tags: ["schema", "design"],
    weight: 5,
    assignees: [charlieId]
  },
  {
    proj_id: projectId,
    name: "Implement User Authentication",
    description: "Implement the login and registration functionalities.",
    createdAt: new Date("2024-09-25T11:00:00Z"),
    updatedAt: new Date("2024-10-14T12:30:00Z"),
    history: [
      { _id: new ObjectId(), type: "creation", createdAt: new Date("2024-09-25T11:00:00Z"), userRef: dianaId },
      { _id: new ObjectId(), type: "work_log", createdAt: new Date("2024-10-02T10:00:00Z"), userRef: dianaId, workTime: 10800000 },
      { _id: new ObjectId(), type: "work_log", createdAt: new Date("2024-10-07T12:00:00Z"), userRef: dianaId, workTime: 18000000 },
      { _id: new ObjectId(), type: "work_log", createdAt: new Date("2024-10-13T14:00:00Z"), userRef: dianaId, workTime: 5400000 }
    ],
    status: "in_progress",
    priority: "medium",
    tags: ["authentication", "backend"],
    weight: 8,
    assignees: [dianaId]
  },
  {
    proj_id: projectId,
    name: "Develop Task API",
    description: "Create the API for managing tasks.",
    createdAt: new Date("2024-09-27T13:00:00Z"),
    updatedAt: new Date("2024-10-14T14:30:00Z"),
    history: [
      { _id: new ObjectId(), type: "creation", createdAt: new Date("2024-09-27T13:00:00Z"), userRef: evanId },
      { _id: new ObjectId(), type: "work_log", createdAt: new Date("2024-10-03T09:00:00Z"), userRef: evanId, workTime: 5400000 },
      { _id: new ObjectId(), type: "work_log", createdAt: new Date("2024-10-09T15:00:00Z"), userRef: evanId, workTime: 21600000 }
    ],
    status: "in_progress",
    priority: "low",
    tags: ["api", "backend"],
    weight: 10,
    assignees: [evanId]
  }
];

const taskInsertResult = db.tasks.insertMany(tasks);

// Extract task IDs for later use
const task1Id = taskInsertResult.insertedIds["0"];
const task2Id = taskInsertResult.insertedIds["1"];
const task3Id = taskInsertResult.insertedIds["2"];

// Insert sprints
const sprints = [
  {
    proj_id: projectId,
    name: "Sprint 1",
    team: [charlieId, dianaId],
    PO: charlieId,
    scrumMaster: dianaId,
    tasks: [task1Id, task2Id],
    startDate: new Date("2024-10-01T08:00:00Z"),
    endDate: new Date("2024-10-14T08:00:00Z"),
    createdAt: new Date("2024-09-30T08:00:00Z"),
    updatedAt: new Date("2024-10-14T12:00:00Z")
  },
  {
    proj_id: projectId,
    name: "Sprint 2",
    team: [evanId, fionaId],
    PO: evanId,
    scrumMaster: fionaId,
    tasks: [task3Id],
    startDate: new Date("2024-10-03T08:00:00Z"),
    endDate: new Date("2024-10-14T08:00:00Z"),
    createdAt: new Date("2024-10-02T08:00:00Z"),
    updatedAt: new Date("2024-10-14T12:00:00Z")
  }
];

db.sprints.insertMany(sprints);