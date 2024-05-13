const http = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const cors = require("cors");
const mongoose = require("mongoose");
const Agenda = require("agenda");
const router = require("./src/router/entireRoutes");

require("dotenv").config();

const app = express();

app.use(
  cors({
    credentials: true,
  })
);

app.use(cors());

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

//  Just incase it complains.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.statusCode(200).json({});
  }
  next();
});

app.use("/app", router);

app.get("/", (req, res) => {
  res.send("Welcome to the root of the RemediCue App!");
});

const MONGO_URL = `mongodb+srv://jordannwabuike:${process.env.REMEDICUE_DB_PW}@cluster0.jz5vxdm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.Promise = Promise;
mongoose.connect(MONGO_URL);
mongoose.connection.on("error", (error) => console.log(error));

const PORT = process.env.PORT || 7080;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log("RemediCue Server Listening on port " + PORT);
});
