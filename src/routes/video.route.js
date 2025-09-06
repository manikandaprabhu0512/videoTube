import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  deleteAVideo,
  getAllVideo,
  getAVideo,
  pulishAVideo,
  togglePublishVideo,
  updateThumbnail,
  updateVideoDetails,
} from "../controllers/video.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/publishVideo").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  pulishAVideo
);

router.route("/c/:videoId").get(getAVideo);

router.route("/c/:videoId").patch(updateVideoDetails);

router
  .route("/c/thumbnail/:videoId")
  .patch(upload.single("thumbnail"), updateThumbnail);

router.route("/c/:videoId").delete(deleteAVideo);

router.route("/c/toggle/:videoId").patch(togglePublishVideo);

router.route("/").get(getAllVideo);

export default router;
