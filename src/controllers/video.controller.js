import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  destroyOnCloudinary,
  destroyVideoOnCloudinary,
  uploadOnCloudindary,
} from "../utils/cloudinary.js";

const pulishAVideo = asyncHandler(async (req, res, next) => {
  const { title, description } = req.body;

  if (!(title || description))
    throw new ApiError(400, "Requires All Credentials");

  const videoLocalPath = req.files?.videoFile[0]?.path;

  if (!videoLocalPath) throw new ApiError(400, "Video Required");

  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail Required");

  const videoFile = await uploadOnCloudindary(videoLocalPath);

  const thumbnail = await uploadOnCloudindary(thumbnailLocalPath);

  const videoDetails = await Video.create({
    videoFile: { url: videoFile.url, public_id: videoFile.public_id },
    thumbnail: { url: thumbnail.url, public_id: thumbnail.public_id },
    title,
    description,
    duration: videoFile.duration.toFixed(2),
    owner: req.user?._id,
  });

  if (!videoDetails) throw new ApiError(400, "Video Upload Failed");

  return res
    .status(201)
    .json(new ApiResponse(200, videoDetails, "Video Uploaded Sucessfully"));
});

const getAVideo = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;

  const video = await Video.findByIdAndUpdate(videoId, {
    $inc: { views: 1 },
  });
  if (!video) throw new ApiError(404, "Video not found");

  const videoDetails = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$owner" },
  ]);

  if (!videoDetails) throw new ApiError(404, "Video not found");

  return res
    .status(200)
    .json(new ApiResponse(200, videoDetails, "Video Fetched Successfully"));
});

const getVideosByUsername = asyncHandler(async (req, res, next) => {
  const { username } = req.params;
  if (!username) throw new ApiError(400, "Username Id is missing");

  const videos = await Video.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $match: {
        "owner.username": username.toLowerCase(),
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  if (!videos) throw new ApiError(404, "User not found");

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos Fetched Successfully"));
});

const updateVideoDetails = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;

  const { title, description } = req.body;

  if (!(title || description))
    throw new ApiError(400, "Requires Fields to Update");

  const videoDetails = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
      },
    },
    { new: true }
  );

  if (!videoDetails) throw new ApiError(404, "Video Not Found");

  return res
    .status(200)
    .json(
      new ApiResponse(200, videoDetails, "Video Details Updated Successfully")
    );
});

const updateThumbnail = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;

  const newThumnailPath = req.file?.path;

  if (!newThumnailPath) throw new ApiError(400, "Thumbnail is missing");

  const Thumbnail = await Video.findById(videoId);

  if (!Thumbnail) throw new ApiError(404, "Video Not Found");

  const newThumbnail = await uploadOnCloudindary(newThumnailPath);

  const oldThumbnailId = Thumbnail.thumbnail.public_id;

  Thumbnail.thumbnail.url = newThumbnail.url;
  Thumbnail.thumbnail.public_id = newThumbnail.public_id;
  await Thumbnail.save({ validateBeforeSave: false });

  if (oldThumbnailId) await destroyOnCloudinary(oldThumbnailId);

  return res
    .status(200)
    .json(new ApiResponse(200, Thumbnail, "Thumbnail Changed Successfully"));
});

const deleteAVideo = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;

  const response = await Video.findByIdAndDelete(videoId);

  if (!response) throw new ApiError(404, "Video Not Found");

  if (response.videoFile.public_id) {
    await destroyVideoOnCloudinary(response.videoFile.public_id);
  }
  if (response.thumbnail.public_id) {
    await destroyOnCloudinary(response.thumbnail.public_id);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video Deleted Successfully"));
});

const togglePublishVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) throw new ApiError(400, "Video is Missing");

  const videoDetails = await Video.findById(videoId);

  if (!videoDetails) throw new ApiError(404, "Video Not Found");

  videoDetails.isPublished = !videoDetails.isPublished;
  videoDetails.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videoDetails.isPublished,
        "Videoe Archived Successfully"
      )
    );
});

const getAllVideo = asyncHandler(async (req, res, next) => {
  const { userId, page = 1, limit = 10, query, sortBy, sortType } = req.query;

  let match = {};
  if (query) match.title = { $regex: query, $options: "i" };
  if (userId) match.owner = new mongoose.Types.ObjectId(userId);

  const pipeline = [
    {
      $match: {
        ...match,
        isPublished: true,
      },
    },
    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              fullName: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
  ];

  const videos = Video.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const videosList = await Video.aggregatePaginate(videos, options);

  return res
    .status(200)
    .json(new ApiResponse(200, videosList, "Videos Fetched Successfully"));
});

const addVideoToWatchHistory = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;

  if (!videoId) throw new ApiError(400, "Video is Missing");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $addToSet: { watchHistory: videoId },
    },
    { new: true }
  );

  if (!user) throw new ApiError(404, "User Not Found");

  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "Video Added to Watch History Successfully")
    );
});

export {
  pulishAVideo,
  getAVideo,
  updateVideoDetails,
  updateThumbnail,
  deleteAVideo,
  togglePublishVideo,
  getAllVideo,
  getVideosByUsername,
  addVideoToWatchHistory,
};
