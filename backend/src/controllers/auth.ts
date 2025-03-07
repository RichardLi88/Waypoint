import { Db, MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import jwt, { VerifyCallback, VerifyErrors } from "jsonwebtoken";
import { User, Session } from "../types/dbTypes.js";
import { Request, Response } from "express";
import db from "../db.js";

  
export const handleLogin = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(401).send("Username and password required");
  }
//gets mondoDB users
  const userCollection = db.collection("users");
//checks to see if user is stored in db
  const foundUser = (await userCollection.findOne({
    username: username,
  })) as User | null;

  if (!foundUser) {
    return res.status(401).send("Invalid username or password");
  }
//use bcrypt to dehash password and authenticate
  const passCheck = await bcrypt.compare(password, foundUser.password);
//  s
  if (passCheck) {
    const accessToken = jwt.sign(
      { user: foundUser.username, role: foundUser.role },
      `${process.env.JWT_ACCESS_SECRET}`,
      { expiresIn: "60s" },
    );
    const refreshToken = jwt.sign(
      { user: foundUser.username, role: foundUser.role },
      `${process.env.JWT_REFRESH_SECRET}`,
      { expiresIn: "12h" },
    );

    db.collection("sessions").updateOne(
      { username: foundUser.username },
      { $set: { username: foundUser.username, refreshToken: refreshToken } },
      { upsert: true },
    );

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      maxAge: 43200000,
      sameSite: "strict",
      secure: true,
    }); // 12 * 60 * 60 * 1000 ms = 12h
    return res.status(200).json({
      username: foundUser.username,
      role: foundUser.role,
      name: foundUser.name,
      accessToken,
    });
  } else {
    return res.status(401).send("Invalid username or password");
  }
};

export const handleRefresh = async (req: Request, res: Response) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    return res.status(401).send("Not logged in");
  }

  const refreshToken = cookies.jwt;

  const sessions = db.collection("sessions");
  const foundSession = (await sessions.findOne({
    refreshToken: refreshToken,
  })) as Session | null;

  if (!foundSession) {
    return res.status(403).send("Invalid authentication");
  }

  jwt.verify(
    refreshToken,
    `${process.env.JWT_REFRESH_SECRET}`,
    async (err: VerifyErrors | null, decoded: any) => {
      if (err || foundSession.username != decoded?.user) {
        return res.status(403).send("Invalid authentication");
      }

      const users = db.collection("users");
      const foundUser = (await users.findOne({
        username: foundSession.username,
      })) as User | null;

      const accessToken = jwt.sign(
        { user: foundUser?.username, role: foundUser?.role },
        `${process.env.JWT_ACCESS_SECRET}`,
        { expiresIn: "60s" },
      );

      return res.status(200).json({ accessToken });
    },
  );
};

export const handleLogout = async (req: Request, res: Response) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    return res.sendStatus(204);
  }

  const refreshToken = cookies.jwt;

  const sessions = db.collection("sessions");
  sessions.deleteOne({ refreshToken: refreshToken });

  res.clearCookie("jwt", { httpOnly: true, sameSite: "strict", secure: true });
  return res.sendStatus(204);
};
