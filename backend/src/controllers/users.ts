import { ObjectId, PullOperator, PushOperator } from "mongodb";
import bcrypt from "bcrypt";
import { Project, User } from "../types/dbTypes.js";
import { Request, Response } from "express";
import db from "../db.js";

export const getUserByID = async (req: Request, res: Response) => { 
  if (!req.query.id) {
    return res.status(400).json({ message: "Missing user ID" });
  }

  try {
    const user = await db.collection("users").findOne({ _id: new ObjectId(req.query.id as string) });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      _id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching users", error });
  }
}

export const getUsername = async (req: Request, res: Response) => {
  try {
    const username = req.params.username;
    const user = await db.collection("users").findOne({ username });
    if (user) {
      return res.json({
        _id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
      });
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error fetching user", error });
  }
};

export const patchPassword = async (req: Request, res: Response) => {
  if (req.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    const username = req.params.username
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db
      .collection("users")
      .updateOne({ username }, { $set: { password: hashedPassword } });
    if (result.modifiedCount === 1) {
      return res.status(200).json({ message: "Password updated" });
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error updating password", error });
  }
};

export const newUser = async (req: Request, res: Response) => {
  if (req.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    const { name, username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: Omit<User, "_id"> = {
      username,
      password: hashedPassword,
      role,
      name,
      updatedAt: new Date(),
      createdAt: new Date(),
    };
    const result = await db
      .collection("users")
      .insertOne(newUser as unknown as Document);

    await db.collection("projects").updateMany({}, { $push: { team: result.insertedId } as PushOperator<Project> });
    return res.status(201).json({ message: "User created" });
  } catch (error) {
    return res.status(500).json({ message: "Error creating user", error });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  if (req.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    const username = req.params.username;
    const user = await db.collection("users").findOne({ username });

    if (user) {
      await db.collection("users").deleteOne({ username });
      await db
        .collection("sprints")
        .updateMany(
          { team: user._id },
          { $pull: { team: user._id } as PullOperator<Document> }
        );
      await db.collection("sprints").updateMany( { PO: user._id }, { $unset: { PO: "" } });
      await db.collection("sprints").updateMany( { scrumMaster: user._id }, { $unset: { scrumMaster: "" } });

      await db.collection("projects").updateMany( { team: user._id }, { $pull: { team: user._id } as PullOperator<Document> });
      await db.collection("tasks").updateMany( { assignees: user._id }, { $pull: { assignees: user._id } as PullOperator<Document> });
      await db.collection("sessions").deleteMany({ _id: user._id });
      await db.collection("tasks").updateMany({}, { $pull: { history : { userRef: user._id } } as PullOperator<Document> });

      return res.status(200).json({ message: "User deleted" });
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error deleting user" });
  }
};

export const getWorklogs = async (req: Request, res: Response) => {
  if (req.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized" });
  }
  
  try {
    const { username } = req.params;
    const { startDate, endDate } = req.query;

    const user = await db.collection("users").findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const query: any = { "history.userRef": user._id };
    if (startDate) {
      query["history.createdAt"] = { ...query["history.createdAt"], $gte: new Date(startDate as string) };
    }
    if (endDate) {
      query["history.createdAt"] = { ...query["history.createdAt"], $lte: new Date(endDate as string) };
    }

    const tasks = await db.collection("tasks").find(query).toArray();

    const worklogs = tasks.reduce((acc: any[], task: any) => {
      const taskWorklogs = task.history.filter((item: any) => 
        item.type === "work_log"
      );
      return [...acc, ...taskWorklogs];
    }, []);

    return res.json(worklogs);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching worklogs", error });
  }
};