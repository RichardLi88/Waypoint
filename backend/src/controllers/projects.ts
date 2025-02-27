import { Db, MongoClient, ObjectId, PullOperator, PushOperator } from "mongodb";
import bcrypt from "bcrypt";
import jwt, { VerifyCallback, VerifyErrors } from "jsonwebtoken";
import { User, Session, Task, Sprint } from "../types/dbTypes.js";
import { Request, Response } from "express";
import db from "../db.js";
import { parse } from "path";

export const getProject = async (req: Request, res: Response) => {
  try {
    const project = await db
      .collection("projects")
      .find()
      .sort({ _id: 1 })
      .toArray();
    if (req.params.id) {
      const projectId = parseInt(req.params.id);
      const selectedProject = project[projectId - 1];
      if (selectedProject) {
        return res.json(selectedProject);
      } else {
        return res.status(404).json({ message: "Project not found" });
      }
    } else {
      return res.json(project);
    }
  } catch (error) {
    return res.status(500).json({ message: "Error fetching project", error });
  }
};

export const getTask = async (req: Request, res: Response) => {
  try {
    const { proj_id, task_id } = req.params;
    const projectId = parseInt(proj_id);

    const project = await db
      .collection("projects")
      .find()
      .sort({ _id: 1 })
      .toArray();
    const selectedProject = project[projectId - 1];

    const tasks = await db
      .collection("tasks")
      .find({ proj_id: selectedProject._id })
      .toArray();

    if (task_id) {
      const task = tasks.filter((task) =>
        task._id.equals(new ObjectId(task_id))
      )[0];
      if (task) {
        return res.json(task);
      } else {
        return res.status(404).json({ message: "Task not found" });
      }
    } else {
      return res.json(tasks);
    }
  } catch (error) {
    return res.status(500).json({ message: "Error fetching tasks", error });
  }
};

export const getSprint = async (req: Request, res: Response) => {
  try {
    const { proj_id, sprint_id } = req.params;
    const projectId = parseInt(proj_id);

    const project = await db
      .collection("projects")
      .find()
      .sort({ _id: 1 })
      .toArray();
    const selectedProject = project[projectId - 1];

    const sprints = await db
      .collection("sprints")
      .find({ proj_id: selectedProject._id })
      .toArray();

    if (sprint_id) {
      const sprint = sprints.filter((sprint) =>
        sprint._id.equals(new ObjectId(sprint_id))
      )[0];
      if (sprint) {
        return res.json(sprint);
      } else {
        return res.status(404).json({ message: "Sprint not found" });
      }
    } else {
      return res.json(sprints);
    }
  } catch (error) {
    return res.status(500).json({ message: "Error fetching sprints", error });
  }
};

export const getTeam = async (req: Request, res: Response) => {
  try {
    const { proj_id, task_id } = req.params;
    const projectId = parseInt(proj_id);

    const project = await db
      .collection("projects")
      .find()
      .sort({ _id: 1 })
      .toArray();
    const selectedProject = project[projectId - 1];
    const team = selectedProject.team;

    const users = (await db
      .collection("users")
      .find({ _id: { $in: team } })
      .toArray()) as unknown as Array<User>;

    return res.json(
      users.map((user) => ({
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: "Error fetching users", error });
  }
};

export const getTags = async (req: Request, res: Response) => {
  try {
    const { proj_id, task_id } = req.params;
    const projectId = parseInt(proj_id);

    const project = await db
      .collection("projects")
      .find()
      .sort({ _id: 1 })
      .toArray();
    const selectedProject = project[projectId - 1];

    const tasks = (await db
      .collection("tasks")
      .find({ proj_id: selectedProject._id })
      .toArray()) as unknown as Array<Task>;

    let tags = new Set<String>();
    tasks.forEach((task: Task) => task.tags.forEach((tag) => tags.add(tag)));

    return res.json(Array.from(tags.values()));
  } catch (error) {
    return res.status(500).json({ message: "Error fetching tags", error });
  }
};

export const saveTask = async (req: Request, res: Response) => {
  if (req.role != "developer") {
    return res.sendStatus(401);
  }

  try {
    const { proj_id } = req.params;
    const projectId = parseInt(proj_id);

    const project = await db
      .collection("projects")
      .find()
      .sort({ _id: 1 })
      .toArray();
    const selectedProject = project[projectId - 1];
    const creator = await db
      .collection("users")
      .findOne({ username: req.user });

    db.collection("tasks").insertOne({
      proj_id: selectedProject._id,
      name: req.body.name,
      description: req.body.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      history: [
        {
          _id: new ObjectId(),
          type: "creation",
          createdAt: new Date(),
          userRef: creator?._id,
        },
      ],
      status: "not_started",
      priority: req.body.priority,
      weight: parseInt(req.body.weight),
      tags: req.body.tags,
    });

    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching tasks", error });
  }
};

export const saveSprint = async (req: Request, res: Response) => {
  if (req.role != "developer") {
    return res.sendStatus(401);
  }

  try {
    const { proj_id } = req.params;
    const projectId = parseInt(proj_id);

    const project = await db
      .collection("projects")
      .find()
      .sort({ _id: 1 })
      .toArray();
    const selectedProject = project[projectId - 1];

    const sprint = await db.collection("sprints").insertOne({
      proj_id: selectedProject._id,
      name: req.body.name,
      team: (req.body.team as string[]).map((id) =>
        ObjectId.createFromHexString(id)
      ),
      PO: ObjectId.createFromHexString(req.body.PO),
      scrumMaster: ObjectId.createFromHexString(req.body.scrumMaster),
      tasks: (req.body.tasks as string[]).map((id) =>
        ObjectId.createFromHexString(id)
      ),
      startDate: new Date(Date.parse(req.body.startDate)),
      endDate: new Date(Date.parse(req.body.endDate)),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    db.collection("tasks").updateMany(
      {
        _id: {
          $in: (req.body.tasks as string[]).map((id) =>
            ObjectId.createFromHexString(id)
          ),
        },
      },
      { $set: { sprint: sprint.insertedId } }
    );

    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching tasks", error });
  }
};

const arraysEqual = (arr1: any[], arr2: any[]): boolean => {
  if (arr1.length !== arr2.length) return false;
  arr1.sort();
  arr2.sort();
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
};

export const patchTask = async (req: Request, res: Response) => {
  if (req.role != "developer") {
    return res.sendStatus(401);
  }

  try {
    const { task_id } = req.params;
    const taskId = new ObjectId(task_id);

    const task = await db.collection("tasks").findOne({ _id: taskId });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const changes: Partial<Task> = {};

    if (req.body.name && req.body.name !== task.name) {
      changes.name = req.body.name;
    }

    if (req.body.description && req.body.description !== task.description) {
      changes.description = req.body.description;
    }

    if (req.body.priority && req.body.priority !== task.priority) {
      changes.priority = req.body.priority;
    }

    if (req.body.weight && parseInt(req.body.weight) !== task.weight) {
      changes.weight = parseInt(req.body.weight);
    }

    if (
      req.body.tags &&
      !arraysEqual(req.body.tags as string[], task.tags as string[])
    ) {
      changes.tags = req.body.tags;
    }

    if (req.body.status && req.body.status !== task.status) {
      changes.status = req.body.status;
    }

    if (
      req.body.assignees &&
      !arraysEqual(
        req.body.assignees as string[],
        (task.assignees ?? []).map((obj: ObjectId) =>
          obj.toHexString()
        ) as string[]
      )
    ) {
      changes.assignees = req.body.assignees.map((id: string) =>
        ObjectId.createFromHexString(id)
      );
    }

    if (Object.keys(changes).length === 0) {
      return res.sendStatus(200);
    }

    await db
      .collection("tasks")
      .updateOne(
        { _id: taskId },
        { $set: { ...changes, updatedAt: new Date() } }
      );

    const historyChanges = Object.keys(changes).reduce((acc, key) => {
      acc[key] = {
        from: task[key as keyof Task],
        to: changes[key as keyof Task],
      };
      return acc;
    }, {} as Record<string, { from: any; to: any }>);

    await db.collection("tasks").updateOne(
      { _id: taskId },
      {
        $push: {
          history: {
            _id: new ObjectId(),
            type: "update",
            createdAt: new Date(),
            userRef: (
              await db.collection("users").findOne({ username: req.user })
            )?._id,
            changes: historyChanges,
          },
        } as PushOperator<Task>,
      }
    );

    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching tasks", error });
  }
};

export const postWorklog = async (req: Request, res: Response) => {
  if (req.role != "developer") {
    return res.sendStatus(401);
  }

  try {
    const { task_id } = req.params;
    const { workTime } = req.body;
    const taskId = new ObjectId(task_id);

    const task = await db.collection("tasks").findOne({ _id: taskId });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await db.collection("tasks").updateOne(
      { _id: taskId },
      {
        $push: {
          history: {
            _id: new ObjectId(),
            type: "work_log",
            createdAt: new Date(),
            userRef: (
              await db.collection("users").findOne({ username: req.user })
            )?._id,
            workTime: parseInt(workTime),
          },
        } as PushOperator<Task>,
      }
    );

    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching tasks", error });
  }
};

export const postComment = async (req: Request, res: Response) => {
  if (req.role != "developer") {
    return res.sendStatus(401);
  }

  try {
    const { task_id } = req.params;
    const taskId = new ObjectId(task_id);

    const task = await db.collection("tasks").findOne({ _id: taskId });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    db.collection("tasks").updateOne(
      { _id: taskId },
      {
        $push: {
          history: {
            _id: new ObjectId(),
            type: "comment",
            createdAt: new Date(),
            userRef: (
              await db.collection("users").findOne({ username: req.user })
            )?._id,
            comment: req.body.comment,
          },
        } as PushOperator<Task>,
      }
    );

    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(500).json({ message: "Error fetching tasks", error });
  }
};

export const getSprintTasks = async (req: Request, res: Response) => {
  if (req.role != "developer") {
    return res.sendStatus(401);
  }

  try {
    const { sprint_id } = req.params;
    const sprintId = new ObjectId(sprint_id);

    const tasks = await db
      .collection("tasks")
      .find({ sprint: sprintId })
      .toArray();

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching tasks", error });
  }
};

export const patchSprint = async (req: Request, res: Response) => {
  if (req.role != "developer") {
    return res.sendStatus(401);
  }

  try {
    const { sprint_id } = req.params;
    const sprintId = new ObjectId(sprint_id);

    const sprint = await db.collection("sprints").findOne({ _id: sprintId });

    if (!sprint) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    const changes: Partial<Sprint> = {};

    if (req.body.name) {
      changes.name = req.body.name;
    }

    if (req.body.team) {
      changes.team = req.body.team.map((id: string) =>
        ObjectId.createFromHexString(id)
      );
    }

    if (req.body.PO) {
      changes.PO = ObjectId.createFromHexString(req.body.PO);

      if (
        changes.team &&
        !changes.team
          .map((id) => id.toHexString())
          .includes(changes.PO.toHexString())
      ) {
        changes.team.push(changes.PO);
      }
    }

    if (req.body.scrumMaster) {
      changes.scrumMaster = ObjectId.createFromHexString(req.body.scrumMaster);

      if (
        changes.team &&
        !changes.team
          .map((id) => id.toHexString())
          .includes(changes.scrumMaster.toHexString())
      ) {
        changes.team.push(changes.scrumMaster);
      }
    }

    if (req.body.tasks) {
      changes.tasks = req.body.tasks.map((id: string) =>
        ObjectId.createFromHexString(id)
      );
    }

    if (req.body.startDate) {
      changes.startDate = new Date(Date.parse(req.body.startDate));
    }

    if (req.body.endDate) {
      changes.endDate = new Date(Date.parse(req.body.endDate));
    }

    await db
      .collection("sprints")
      .updateOne(
        { _id: sprintId },
        { $set: { ...changes, updatedAt: new Date() } }
      );

    if (changes.tasks) {
      await db
        .collection("tasks")
        .updateMany(
          { _id: { $in: changes.tasks } },
          { $set: { sprint: sprintId } }
        );

      await db
        .collection("tasks")
        .updateMany(
          { sprint: sprintId, _id: { $nin: changes.tasks } },
          { $unset: { sprint: "" } }
        );
    }

    if (changes.team || changes.PO || changes.scrumMaster) {
      const ids = [...(changes.team ?? []), changes.PO, changes.scrumMaster]
        .filter((id) => id !== undefined)
        .map((id) => id.toHexString());

      const removedUsers = sprint.team.filter(
        (id: ObjectId) => !ids.includes(id.toHexString())
      );

      await db
        .collection("tasks")
        .updateMany(
          { assignees: { $in: removedUsers } },
          { $pull: { assignees: { $in: removedUsers } } as PullOperator<Task> }
        );
    }

    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching tasks", error });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  if (req.role != "developer") {
    return res.sendStatus(401);
  }

  try {
    const { task_id } = req.params;
    const taskId = new ObjectId(task_id);

    const task = await db.collection("tasks").findOne({ _id: taskId });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await db.collection("tasks").deleteOne({ _id: taskId });

    await db
      .collection("sprints")
      .updateMany(
        { tasks: taskId },
        { $pull: { tasks: taskId } as PullOperator<Sprint> }
      );

    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching tasks", error });
  }
};

export const deleteSprint = async (req: Request, res: Response) => {
  if (req.role != "developer") {
    return res.sendStatus(401);
  }

  try {
    const { sprint_id } = req.params;
    const sprintId = new ObjectId(sprint_id);

    const sprint = await db.collection("sprints").findOne({ _id: sprintId });

    if (!sprint) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    await db.collection("sprints").deleteOne({ _id: sprintId });

    await db
      .collection("tasks")
      .updateMany({ sprint: sprintId }, { $unset: { sprint: "" } });

    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching tasks", error });
  }
};
