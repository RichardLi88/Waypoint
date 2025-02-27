import { ObjectId } from "mongodb";

type Priority = "low" | "medium" | "high" | "critical";
type UserRole = "admin" | "developer";
type TaskStatus = "completed" | "in_progress" | "not_started";

type Change<T> = {
  from?: T;
  to?: T;
};

type User = {
  _id: ObjectId;
  name: string;
  // email: string;
  username: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

type Project = {
  _id: ObjectId;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  // ownerId: number;
  team: number[]; // User[];
  status: "active" | "completed" | "archived";
  createdAt: Date;
  updatedAt: Date;
};

type Task = {
  _id: ObjectId;
  proj_id: ObjectId; // Project
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  history: TaskHistoryItem[];
  status: TaskStatus;
  priority: Priority;
  tags: string[];
  weight: number;
  assignees?: ObjectId[]; // User[]
  sprint?: ObjectId; // Sprint
};

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
    assignees?: Change<ObjectId[]>; // Change<User[]>
    weight?: Change<number>;
    priority?: Change<Priority>;
    tags?: Change<string[]>;
    status?: Change<TaskStatus>;
  };
};

type Sprint = {
  _id: ObjectId;
  proj_id: ObjectId; // Project
  name: string;
  team: ObjectId[]; // User[]
  PO?: ObjectId; // User
  scrumMaster?: ObjectId; // User
  tasks: ObjectId[]; // Task[]
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};


type Session = {
  _id: ObjectId;
  username: string;
  refreshToken: string;
};

export type {
  Priority,
  UserRole,
  TaskStatus,
  Change,
  User,
  Project,
  Task,
  TaskHistoryItem,
  Sprint,
  Session,
};
