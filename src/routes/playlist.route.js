import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createAPlayList,
  deleteAPlayListById,
  getPlayListById,
  getUserPlaylists,
  removeVideoFromPlayList,
  updateAPlayList,
  updateThumbnail,
} from "../controllers/playlist.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/createplaylist")
  .post(upload.single("thumbnail"), createAPlayList);

router.route("/c/:userId").get(getUserPlaylists);

router.route("/:playListId/addVideo/c/:videoId").post(addVideoToPlaylist);

router.route("/user/c/:playListId").get(getPlayListById);

router
  .route("/:playListId/removeVideo/c/:videoId")
  .post(removeVideoFromPlayList);

router.route("/delete/c/:playListId").delete(deleteAPlayListById);

router.route("/update/c/:playListId").patch(updateAPlayList);

router
  .route("/update-thumbnail/c/:playListId")
  .patch(upload.single("thumbnail"), updateThumbnail);

export default router;
