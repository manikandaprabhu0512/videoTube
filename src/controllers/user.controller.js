import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import {
  destroyOnCloudinary,
  uploadOnCloudindary,
} from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const generateAccessandRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    // console.log("AccessToken: ", accessToken);
    // console.log("RefreshToken: ", refreshToken);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error Generating Tokens: ", error);
    throw new ApiError(500, "Something Went Wrong");
  }
};

const registerUser = asyncHandler(async (req, res, next) => {
  /* User Register Steps
    1. Get info from Client / User
    2. Check if User Data is valid (Validation) or User Data is already available.
    3. IF Valid, pass the data to database.
    4. IF Password is there, Encrypt the password before saving.
    5. IF Avatar, upload to cloudinary and get the response URL. (Same for CoverImage).
    6. Generate AccessToken & RefreshToken. Send them as cookie & store RefreshToken in DB.
    7. IF All the Credentials are correct, then send a response.  
  */

  const { username, email, password, fullName } = req.body;

  // if(!username) throw new ApiError(400, "User Name Required");
  if (
    [username, email, password, fullName].some((field) => field?.trim() === "")
  )
    throw new ApiError(400, "All Fields are required");

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) throw new ApiError(409, "User already exists");

  // console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0].path;
  // console.log(avatarLocalPath);

  // const coverImageLocalPath = req.files?.coverImage[0].path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) throw new ApiError(400, "Avatar Required");

  const avatar = await uploadOnCloudindary(avatarLocalPath);
  // console.log(avatar);

  if (!avatar) throw new ApiError(500, "Avatar Upload Failed");

  const coverImage = await uploadOnCloudindary(coverImageLocalPath);

  const user = await User.create({
    username: username.toLowerCase(),
    password,
    email,
    fullName,
    avatar: { url: avatar.url, public_id: avatar.public_id },
    coverImage: {
      url: coverImage?.url || "",
      public_id: coverImage?.public_id || "",
    },
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res, next) => {
  /*
    1. Get user details
    2. Validate the data 
    3. Check if user exists
    4. Validate password
    5. Generate Tokens
    6. Reterive User data
    7. Return Data
  */

  const { username, email, password } = req.body;

  if (!(username || email)) throw new ApiError(400, "Requires Crendentials");

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) throw new ApiError(404, "User not found");

  const validatePassword = await user.isPasswordCorrect(password);
  // console.log(validatePassword);

  if (!validatePassword) throw new ApiError(401, "Invalid Password");

  const { accessToken, refreshToken } = await generateAccessandRefreshTokens(
    user._id
  );

  // console.log("AccessToken Inside: ", accessToken);
  // console.log("RefreshToken Inside: ", refreshToken);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, loggedInUser, "User Logged in Successfully"));
});

const logoutUser = asyncHandler(async (req, res, next) => {
  /*
    1. Get user access from cookie.
    2. Mark refreshToken as undefined.
    3. Return new data.
    4. Clear Cookie from the browser.
  */

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(201)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logged Out Successfully"));
});

const refreshAcessToken = asyncHandler(async (req, res, next) => {
  try {
    const presentRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!presentRefreshToken) throw new ApiError(401, "Unauthorized Request");

    const decodedToken = JsonWebTokenError.verify(
      presentRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) throw new ApiError(401, "Invalid User");

    if (presentRefreshToken != user.refreshToken)
      throw new ApiError(401, "User Doesnot exists or Invalid Action");

    const { newAccessToken, newRefreshToken } =
      user.generateAccessandRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", newAccessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(new ApiResponse(200, {}, "RefreshToken Generated Successfully"));
  } catch (error) {
    console.error("Error Generating RefreshToken", error);
    throw new ApiError(500, error.message || "Something Went wrong");
  }
});

const changeUserPassword = asyncHandler(async (req, res, next) => {
  /* 
  1. Get OldPassword and New Password from the User,
  2. Validate if User Exists.
  3. Validate if Password is correct.
  4. Update the new Password.
  5. Return the Response.
  */

  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  if (!user) throw new ApiError(400, "Invalid Action");

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) throw new ApiError(401, "Invalid Password");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res
    .status(201)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res, next) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "User Fetched SuccessFully"));
});

const updateAccountDetails = asyncHandler(async (req, res, next) => {
  const { fullName, email, username } = req.body;

  if (!(fullName || email || username))
    throw new ApiError(400, "Credential are Required");

  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken"
  );

  if (fullName && user.fullName === fullName)
    throw new ApiError(401, "Same FullName. Please change it");

  if (email && user.email === email)
    throw new ApiError(401, "Same Email. Please change it");

  if (username && user.username === username)
    throw new ApiError(401, "Same Username. Please change it");

  const dbEmail = await User.findOne({ email });
  if (dbEmail) throw new ApiError(401, "Email Already exists");

  const dbUsername = await User.findOne({ username });
  if (dbUsername) throw new ApiError(401, "Username Already exists");

  if (fullName) user.fullName = fullName;
  if (email) user.email = email;
  if (username) user.username = username;
  await user.save({ validateBeforeSave: false });

  return res
    .status(201)
    .json(new ApiResponse(200, user, "Fields Changed Successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res, next) => {
  const avatar = req.file?.path;

  if (!avatar) throw new ApiError(401, "Avatar is Missing");

  const avatarFile = await uploadOnCloudindary(avatar);

  if (!avatarFile)
    throw new ApiError(500, "File not Uploaded. Please try again!!");

  const oldAvatarId = req.user?.avatar.public_id;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: { url: avatarFile.url, public_id: avatarFile.public_id },
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  if (oldAvatarId) await destroyOnCloudinary(oldAvatarId);

  return res
    .status(201)
    .json(new ApiResponse(200, user, "Avatar Changed Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res, next) => {
  const coverImage = req.file?.path;

  if (!coverImage) throw new ApiError(401, "Cover Image is Missing");

  const coverFile = await uploadOnCloudindary(coverImage);

  if (!coverFile)
    throw new ApiError(500, "File not Uploaded. Please try again!!");

  const oldcoverImageId = req.user?.coverImage.public_id;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: { url: coverFile.url, public_id: coverFile.public_id },
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  if (oldcoverImageId) await destroyOnCloudinary(oldcoverImageId);

  return res
    .status(201)
    .json(new ApiResponse(200, user, "Cover Image Changed Successfully"));
});

const removeAvatar = asyncHandler(async (req, res, next) => {
  const avatarResponse = await destroyOnCloudinary(req.user?.avatar.public_id);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: { url: "", public_id: "" },
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(201)
    .json(new ApiResponse(200, avatarResponse, "Avatar removed Successfully"));
});

const removeCoverImage = asyncHandler(async (req, res, next) => {
  const coverImageResponse = await destroyOnCloudinary(
    req.user?.coverImage.public_id
  );
  console.log(coverImageResponse);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: { url: "", public_id: "" },
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        coverImageResponse,
        "Cover Image removed Successfully"
      )
    );
});

const getChannelProfileDetails = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) throw new ApiError(200, "Username missing");

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subcriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subcriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribers: {
          $size: "$subscribers",
        },
        subscribedTo: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        username: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        subscribers: 1,
        subscribedTo: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel) throw new ApiError(404, "User not Found");

  // console.log(channel);

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User Data Fetched Successfully"));
});

const watchHistory = asyncHandler(async (req, res) => {
  const history = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
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
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  // console.log(history);

  if (!history) throw new ApiError(500, "Fetch Watch History Failed");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        history[0].watchHistory,
        "Fetched Watch History Successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
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
};
