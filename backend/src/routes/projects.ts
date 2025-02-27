import express from "express";
import {
  getProject,
  getSprint,
  getTask,
  getTags,
  getTeam,
  saveTask,
  saveSprint,
  patchTask,
  postComment,
  postWorklog,
  getSprintTasks,
  patchSprint,
  deleteTask,
  deleteSprint,
} from "../controllers/projects.js";

const router = express.Router();

// Project info
router.route("/:id?").get(getProject);
router.route("/:proj_id/tags").get(getTags);
router.route("/:proj_id/team").get(getTeam);

// Tasks
router.route("/:proj_id/tasks/:task_id?").get(getTask);
router.route("/:proj_id/tasks").post(saveTask);
router.route("/:proj_id/tasks/:task_id").patch(patchTask).delete(deleteTask);
router.route("/:proj_id/tasks/:task_id/comment").post(postComment);
router.route("/:proj_id/tasks/:task_id/worklog").post(postWorklog);

// Sprints
router.route("/:proj_id/sprints").post(saveSprint);
router.route("/:proj_id/sprints/:sprint_id?").get(getSprint);
router.route("/:proj_id/sprints/:sprint_id/tasks").get(getSprintTasks);
router.route("/:proj_id/sprints/:sprint_id").patch(patchSprint).delete(deleteSprint);

export default router;
