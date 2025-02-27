import express from "express";
import { Db, MongoClient } from "mongodb";
import authRouter from "./routes/auth.js";
import projectRouter from "./routes/projects.js";
import userRouter from "./routes/users.js";
import verifyJWT from "./middleware/verifyJWT.js";
import cookieParser from "cookie-parser";

const app = express();
const port = 3001;

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);

app.use(verifyJWT);

app.use("/api/users", userRouter);
app.use("/api/projects", projectRouter);

app.get("/api", (req, res) => {
  res.send("Hello, TypeScript Express API!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
