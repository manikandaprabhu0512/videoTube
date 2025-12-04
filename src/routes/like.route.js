import { Router } from "express";
import {
  getAllCommetLikes,
  getAllTweetLikes,
  getAllVideoLikes,
  getVideosLikes,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/video/c/:videoId").post(toggleVideoLike);

router.route("/comment/c/:commentId").post(toggleCommentLike);

router.route("/tweet/c/:tweetId").post(toggleTweetLike);

router.route("/videos/c/:videoId").get(getAllVideoLikes);

router.route("/videos/likes/c/:videoId").get(getVideosLikes);

router.route("/comments/c/:tweetId").get(getAllTweetLikes);

export default router;
