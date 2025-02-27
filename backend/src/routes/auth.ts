import express from "express";
import {
  handleLogin,
  handleLogout,
  handleRefresh,
} from "../controllers/auth.js";

const router = express.Router();

router.route("/").post(handleLogin);
router.route("/refresh").get(handleRefresh);
router.route("/logout").get(handleLogout);

export default router;
