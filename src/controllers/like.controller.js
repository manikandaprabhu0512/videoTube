import mongoose from "mongoose";
import { Like } from "../models/likes.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Comment } from "../models/comments.model.js";
import { Video } from "../models/video.model.js";

const toggleVideoLike = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;

  if (!videoId) throw new ApiError(400, "Video Id is not found");

  const findVideo = await Video.findById(videoId);

  if (!findVideo) throw new ApiError(404, "Video Not Found");

  const userId = req.user?._id;

  const exisiting = await Like.findOne({
    likedVideo: new mongoose.Types.ObjectId(videoId),
    owner: userId,
  });

  if (exisiting) {
    await Like.findByIdAndDelete(exisiting._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Unliked Successfully"));
  }

  const likeAVideo = await Like.create({
    likedVideo: videoId,
    owner: userId,
  });

  if (!likeAVideo) throw new ApiError(400, "Something went wrong!!");

  return res
    .status(200)
    .json(new ApiResponse(200, likeAVideo, "Liked Video Successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;

  if (!commentId) throw new ApiError(400, "Video Id is not found");

  const findComment = await Comment.findById(commentId);

  if (!findComment) throw new ApiError(404, "Comment Not Found");

  const userId = req.user?._id;

  const exisiting = await Like.findOne({
    likedComment: new mongoose.Types.ObjectId(commentId),
    owner: userId,
  });

  if (exisiting) {
    await Like.findByIdAndDelete(exisiting._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Unliked Successfully"));
  }

  const likeAComment = await Like.create({
    likedComment: commentId,
    owner: userId,
  });

  if (!likeAComment) throw new ApiError(400, "Something went wrong!!");

  return res
    .status(200)
    .json(new ApiResponse(200, likeAComment, "Liked Video Successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res, next) => {
  const { tweetId } = req.params;

  if (!tweetId) throw new ApiError(400, "Video Id is not found");

  const userId = req.user?._id;

  const exisiting = await Like.findOne({
    likedTweet: new mongoose.Types.ObjectId(tweetId),
    owner: userId,
  });

  if (exisiting) {
    await Like.findByIdAndDelete(exisiting._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Unliked Successfully"));
  }

  const likeATweet = await Like.create({
    likedTweet: tweetId,
    owner: userId,
  });

  if (!likeATweet) throw new ApiError(400, "Something went wrong!!");

  return res
    .status(200)
    .json(new ApiResponse(200, likeATweet, "Liked Video Successfully"));
});

const getAllVideoLikes = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const { videoId } = req.params;

  if (!videoId) throw new ApiError(400, "VideoId is missing");

  const likedVideosAggregate = Like.aggregate([
    {
      $match: {
        likedVideo: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $sort: {
        createdBy: -1,
      },
    },
  ]);

  const options = {
    page: parseInt(page, 1),
    limit: parseInt(limit, 10),
  };

  const likedVideosAggregatePaginate = await Like.aggregatePaginate(
    likedVideosAggregate,
    options
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideosAggregatePaginate, "Liked Videos List")
    );
});

const getAllCommetLikes = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const { commentId } = req.params;

  if (!commentId) throw new ApiError(400, "CommentId is missing");

  const likedCommentsAggregate = Like.aggregate([
    {
      $match: {
        likedComment: new mongoose.Types.ObjectId(commentId),
      },
    },
    {
      $sort: {
        createdBy: -1,
      },
    },
  ]);

  const options = {
    page: parseInt(page, 1),
    limit: parseInt(limit, 10),
  };

  const likedCommentsAggregatePaginate = await Like.aggregatePaginate(
    likedCommentsAggregate,
    options
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedCommentsAggregatePaginate, "Liked Videos List")
    );
});

const getAllTweetLikes = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const { tweetId } = req.params;

  if (!tweetId) throw new ApiError(400, "VideoId is missing");

  const likedTweetsAggregate = Like.aggregate([
    {
      $match: {
        likedVideo: new mongoose.Types.ObjectId(tweetId),
      },
    },
    {
      $sort: {
        createdBy: -1,
      },
    },
  ]);

  const options = {
    page: parseInt(page, 1),
    limit: parseInt(limit, 10),
  };

  const likedTweetsAggregatePaginate = await Like.aggregatePaginate(
    likedTweetsAggregate,
    options
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedTweetsAggregatePaginate, "Liked Videos List")
    );
});

const getVideosLikes = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) throw new ApiError(400, "Video Id is missing");

  const videoLikes = await Like.find({
    likedVideo: new mongoose.Types.ObjectId(videoId),
  });

  if (!videoLikes) throw new ApiError(404, "Video Not Found");

  return res
    .status(200)
    .json(new ApiResponse(200, videoLikes, "Video Likes Fetched Successfully"));
});

export {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getAllVideoLikes,
  getAllCommetLikes,
  getAllTweetLikes,
  getVideosLikes,
};
