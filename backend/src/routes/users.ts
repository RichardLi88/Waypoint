import { Router } from "express";
import {
  getUserByID,
  deleteUser,
  getUsername,
  newUser,
  patchPassword,
  getWorklogs
} from "../controllers/users.js";

const router = Router();

router.route("/").get(getUserByID).post(newUser);
router.route("/:username").get(getUsername).delete(deleteUser);
router.route("/:username/password").patch(patchPassword);
router.route("/:username/worklogs").get(getWorklogs);

export default router;
