import mongoose from "mongoose";
import { Comment } from "../models/comments.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const addComment = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;

  const { content } = req.body;

  if (!videoId) throw new ApiError(400, "VideoId is missing");

  if (!content) throw new ApiError(400, "Comment is missing");

  const newComment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!newComment) throw new ApiError(400, "Error adding comment");

  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "Added Comment Successfully"));
});

const updateAComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;

  const { content } = req.body;

  if (!commentId) throw new ApiError(200, "Comment Id is Missing");

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      content,
    },
    {
      new: true,
    }
  );

  if (!updatedComment) throw new ApiError(400, "Comment not Found");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Added Comment Successfully"));
});

const deleteAComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;

  if (!commentId) throw new ApiError(200, "Comment Id is Missing");

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) throw new ApiError(400, "Comment not Found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Deleted Comment Successfully"));
});

const getComments = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;

  const { page = 1, limit = 10 } = req.query;

  const comments = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $project: {
        _id: "$_id",
        comment: "$content",
        username: "$owner.username",
        avatar: "$owner.avatar",
        createdAt: 1,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const commentList = await Comment.aggregatePaginate(comments, options);

  return res
    .status(200)
    .json(new ApiResponse(200, commentList, "Comments Fetched Successfully"));
});

export { addComment, updateAComment, deleteAComment, getComments };
