import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteAComment,
  getComments,
  updateAComment,
} from "../controllers/comments.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/add-comments/c/:videoId").post(addComment);

router.route("/update-comments/c/:commentId").patch(updateAComment);

router.route("/delete-comments/c/:commentId").delete(deleteAComment);

router.route("/c/:videoId").get(getComments);

export default router;
