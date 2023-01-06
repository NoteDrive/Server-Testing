const cors = require("cors");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
// (http, {
//   cors: {
//     origin: "*",
//   },
// });
const app = express();
const http = createServer(app);
const io = new Server(http, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());
app.use(cors());
app.use(require("./router"));

let rooms = {};
let messages = {};

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

http.listen(process.env.PORT || 5000);
