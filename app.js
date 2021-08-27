const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const userRouter = require("./routes/userRoutes");
const errorMdw = require("./controllers/errorController");
dotenv.config({ path: `${__dirname}/configs/var.env` });

require("./configs/db")();

const app = express();

app.use(cookieParser());

app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" }));

// app.use("/", (req, res, next) => {
//   console.log("app middleware");
//   res.send("hello from the server-side");
// });

app.use("/api/v1/users", userRouter);

app.use(errorMdw);

app.listen(process.env.PORT, "localhost", () => {
  console.log("server is connected successfully");
});
