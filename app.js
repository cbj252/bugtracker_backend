var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var compression = require("compression");
var helmet = require("helmet");
require("dotenv").config();
const { getUserInfo, getUserProjects } = require("./controllers/helper.js");
const jwt = require("jsonwebtoken");
const { instrument } = require("@socket.io/admin-ui");

var authRouter = require("./routes/auth");
var usersRouter = require("./routes/users");
var projectsRouter = require("./routes/projects");
var ticketRouter = require("./routes/tickets");

var app = express();

app.use(
  cors({
    origin: [process.env.FrontendLocation, "http://localhost:3000"],
  })
);
app.use(compression());
app.use(helmet());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.options("*", cors());
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/projects", projectsRouter);
app.use("/tickets", ticketRouter);

const server = app.listen(process.env.PORT, () =>
  console.log(`Listening on ${process.env.PORT}`)
);

global.io = require("socket.io")(server, {
  cors: {
    origin: [
      process.env.FrontendLocation,
      "http://localhost:3000",
      "https://admin.socket.io",
    ],
    methods: ["GET", "POST"],
  },
});

instrument(io, {
  auth: false,
  mode: "development",
});

io.on("connection", (socket) => {
  socket.on("credentials", (givenToken) => {
    jwt.verify(givenToken, "secretKey", (err, authData) => {
      if (err) {
        res.sendStatus(403, res.json("Incorrect authentication"));
      } else {
        const projects = async function () {
          socket.join("User" + authData.id);
          const userInfo = await getUserInfo(authData.id);
          if (userInfo.type == "manager") {
            const usersProjects = await getUserProjects(authData.id);
            usersProjects.forEach((oneProject) => {
              socket.join("Project" + oneProject.project_id);
            });
          }
        };
        projects();
      }
    });
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  req.app.get("env") === "development"
    ? res.sendStatus(500, res.locals.error)
    : res.sendStatus(500, "An error has occured.");
});

app.closeServer = async () => {
  server.closeAllConnections();
  await server.close();
  await io.close();
};

module.exports = app;
