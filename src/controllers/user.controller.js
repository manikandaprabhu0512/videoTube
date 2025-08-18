import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudindary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

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
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

export { registerUser };
