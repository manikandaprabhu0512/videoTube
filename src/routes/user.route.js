import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAcessToken,
  changeUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  removeAvatar,
  updateUserCoverImage,
  removeCoverImage,
  getChannelProfileDetails,
  watchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refreshToken").post(refreshAcessToken);

router.route("/changePassword").post(verifyJWT, changeUserPassword);

router.route("/getCurrentUser").get(verifyJWT, getCurrentUser);

router.route("/updateAccountDetails").patch(verifyJWT, updateAccountDetails);

router
  .route("/updateUserAvatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router
  .route("/updateUserCoverImage")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/removeavatar").post(verifyJWT, removeAvatar);

router.route("/removecoverimage").post(verifyJWT, removeCoverImage);

// Params Data
router.route("/c/:username").get(verifyJWT, getChannelProfileDetails);

router.route("/watchHistory").get(verifyJWT, watchHistory);

export default router;
