import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

const allowedOrigins = [
  "http://localhost:5173", // dev
  "https://video-tube-frontend-gamma.vercel.app", // production frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

app.use(cookieParser());

// Routing
import userRouter from "./routes/user.route.js";
import videoRouter from "./routes/video.route.js";
import subscribeRouter from "./routes/subscription.route.js";
import playlistRouter from "./routes/playlist.route.js";
import commentsRouter from "./routes/comments.route.js";
import likeRouter from "./routes/like.route.js";
import tweetRouter from "./routes/tweet.route.js";
import healthcheckRouter from "./routes/healthcheck.route.js";

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Router Declartion
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscriptions", subscribeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/comments", commentsRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/health", healthcheckRouter);

export { app };
