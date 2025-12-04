import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const subscribeChannel = asyncHandler(async (req, res, next) => {
  const { channelId } = req.params;

  const userId = req.user?._id;

  if (userId == channelId)
    throw new ApiError(400, "Cannot Subscribe to yourself");

  const existingUser = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (existingUser) throw new ApiError(400, "Already Subscribed");

  const subscribedUser = await Subscription.create({
    subscriber: userId,
    channel: channelId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, subscribedUser, "User Subscribed Successfully"));
});

const unsubcribeChannel = asyncHandler(async (req, res, next) => {
  const { channelId } = req.params;

  const userId = req.user?._id;

  if (channelId === userId) throw new ApiError(401, "Invalid Action");

  const unsubcribe = await Subscription.findOneAndDelete({
    subscriber: userId,
    channel: channelId,
  });

  if (!unsubcribe) throw new ApiError(400, "Channel Doesn't Exists");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Unsubscribed Successfully"));
});

const channelSubscribers = asyncHandler(async (req, res, next) => {
  const { channelId } = req.params;

  const isChannelId = await User.findById(channelId);
  if (!isChannelId) throw new ApiError(404, "Channel Not Found");

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "channelSubscribers",
      },
    },
    {
      $unwind: "$channelSubscribers",
    },
    {
      $project: {
        _id: "$channelSubscribers._id",
        username: "$channelSubscribers.username",
        fullName: "$channelSubscribers.fullName",
        avatar: "$channelSubscribers.avatar",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers Fetched Successfully")
    );
});

const channelSubscribed = asyncHandler(async (req, res, next) => {
  const { channelId } = req.params;

  const isChannelId = await User.findById(channelId);
  if (!isChannelId) throw new ApiError(404, "Channel Not Found");

  const subscribed = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelSubscribed",
      },
    },
    {
      $unwind: "$channelSubscribed",
    },
    {
      $project: {
        _id: "$channelSubscribed._id",
        username: "$channelSubscribed.username",
        fullName: "$channelSubscribed.fullName",
        avatar: "$channelSubscribed.avatar",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribed,
        "Channel Subscriber Fetched Successfully"
      )
    );
});

export {
  subscribeChannel,
  unsubcribeChannel,
  channelSubscribers,
  channelSubscribed,
};
