import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addTweet,
  deleteTweet,
  getAllTweet,
  getUserTweet,
  updateTweet,
} from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/add-tweet").post(addTweet);

router.route("/update-tweet/c/:tweetId").post(updateTweet);

router.route("/delete-tweet/c/:tweetId").post(deleteTweet);

router.route("/").get(getUserTweet);

router.route("/all").get(getAllTweet);

export default router;
