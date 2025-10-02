import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const addTweet = asyncHandler(async (req, res, next) => {
  const { content } = req.body;

  if (!content) throw new ApiError(400, "Content is Required");

  const createTweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });

  if (!createTweet) throw new ApiError(400, "Something Went Wrong!!");

  return res
    .status(200)
    .json(new ApiResponse(200, createTweet, "Tweet added Successfully"));
});

const updateTweet = asyncHandler(async (req, res, next) => {
  const { tweetId } = req.params;

  const { content } = req.body;

  if (!tweetId) throw new ApiError(400, "Tweeet Id is Missing");

  if (!content) throw new ApiError(400, "Comment is missing");

  const findTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      content,
    },
    {
      new: true,
    }
  );

  if (!findTweet) throw new ApiError(404, "Comment not found");

  return res
    .status(200)
    .json(new ApiResponse(200, findTweet, "Tweet Updated Successfully"));
});

const deleteTweet = asyncHandler(async (req, res, next) => {
  const { tweetId } = req.params;

  if (!tweetId) throw new ApiError(400, "Tweeet Id is Missing");

  const removeTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!removeTweet) throw new ApiError(404, "Tweet not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet Deleted Successfully"));
});

const getUserTweet = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;

  const { page = 1, limit = 10, query, sortType } = req.query;

  if (!userId) throw new ApiError(400, "UserId is not found");

  let match = {};

  if (userId) match.owner = new mongoose.Types.ObjectId(userId);
  if (query) match.content = { $regex: query, $options: "i" };

  const pipeline = [
    {
      $match: match,
    },
    {
      $sort: {
        createdAt: sortType === "asc" ? 1 : -1,
      },
    },
  ];

  const userTweet = Tweet.aggregate(pipeline);

  if (!userTweet) throw new ApiError(400, "No Tweets");

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const userTweetAggregate = await Tweet.aggregatePaginate(userTweet, options);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userTweetAggregate.docs,
        "Tweets Fetched Successfully"
      )
    );
});

const getAllTweet = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, query, sortType } = req.query;

  let match = {};

  if (query) match.content = { $regex: query, $options: "i" };

  const pipeline = [
    {
      $match: match,
    },
    {
      $sort: {
        createdAt: sortType === "asc" ? 1 : -1,
      },
    },
  ];

  const allUserTweet = Tweet.aggregate(pipeline);

  if (!allUserTweet) throw new ApiError(400, "No Tweets");

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const allUserTweetAggregate = await Tweet.aggregatePaginate(
    allUserTweet,
    options
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, allUserTweetAggregate, "Tweets Fetched Successfully")
    );
});

export { addTweet, updateTweet, deleteTweet, getUserTweet, getAllTweet };
