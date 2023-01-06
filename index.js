const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

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

http.listen(port, () => {
  console.log(`listening on *:${port}`);
});
