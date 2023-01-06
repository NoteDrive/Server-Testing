const cors = require("cors");
const express = require("express");
const { createServer } = require("http");
const socketIo = require("socket.io");

const app = express();

app.use(express.json());
app.use(cors());
app.use(require("./router"));

const http = createServer(app);
const io = socketIo(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Access-Control-Allow-Origin"],
    credentials: false,
  },
});

let rooms = {};
let messages = {};

io.set("transports", ["websocket", "polling"]);

io.on("connection", (socket) => {
  socket.on("new-room", (room, user) => {
    socket.join(room);
    rooms[room] = rooms[room] || { users: {} };
    rooms[room].users[socket.id] = user;
    io.to(room).emit("room", messages[room] || "");
  });
  socket.on("send", (room, message) => {
    messages[room] = message;
    socket.to(room).emit("receive", message);
  });
});

http.listen(5000);
