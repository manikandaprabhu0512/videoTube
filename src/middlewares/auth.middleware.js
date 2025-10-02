import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) throw new ApiError(401, "Token Expired");

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id);

    if (!user) throw new ApiError(401, "User does Not Exist. Invalid Action");

    req.user = user;
    next();
  } catch (error) {
    // if (error.name === "TokenExpiredError") {
    //   throw new ApiError(401, "Token expired");
    // }

    // if (error.name === "JsonWebTokenError") {
    //   throw new ApiError(403, "Invalid token Id");
    // }

    console.log("Error in Middleware", error);

    throw new ApiError(500, "Internal server error");
  }
});
