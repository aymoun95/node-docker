const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const session = require("express-session");
const cors = require("cors");

let RedisStore = require("connect-redis")(session);

const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_IP,
  MONGO_PORT,
  REDIS_URL,
  REDIS_PORT,
  SESSION_SECRET,
} = require("./config/config");

const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");

const app = express();
const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`;
const connectWithRetry = () => {
  mongoose
    .connect(mongoURL)
    .then(() => console.log("succefully connected to DB"))
    .catch((e) => {
      console.log(e);
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

const redis = new Redis({
  host: REDIS_URL,
  port: REDIS_PORT,
});

app.enable("trust proxy");
app.use(cors());
app.use(
  session({
    store: new RedisStore({ client: redis }),
    secret: SESSION_SECRET,
    cookie: {
      secure: false,
      resave: false,
      saveUninitialized: false,
      httpOnly: true,
      maxAge: 30000,
    },
  })
);
app.use(express.json());
app.get("/api/v1", (req, res) => {
  res.send("Hello World");
  console.log("yeah it run");
});
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
