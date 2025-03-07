//This file defines the types for typeScript. 
type Priority = "low" | "medium" | "high" | "critical";
type UserRole = "admin" | "developer";
type TaskStatus = "completed" | "in_progress" | "not_started";

type Change<T> = {
  oldValue?: T;
  newValue?: T;
};

type User = {
  _id: number;
  name: string;
  // email: string;
  username: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

type Project = {
  _id: number;
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  // ownerId: number;
  team: number[]; // User[];
  status: "active" | "completed" | "archived";
  createdAt: Date;
  updatedAt: Date;
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

type Session = {
  _id: number;
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
