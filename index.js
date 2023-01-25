require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const Note = require("./NoteSchema");
const port = process.env.PORT || 3000;
const fs = require("fs");

try {
  mongoose.set("strictQuery", false);
  mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to database");
} catch (error) {
  console.log(error);
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", async (req, res) => {
  let newNote = await Note.findOne({
    room: "xyz",
  });
  if (newNote === null) {
    newNote = await Note.create({
      room: "xyz",
    });
  }
  res.sendFile(__dirname + "/index.html");
});

const UpdateMessage = async (room) => {
  try {
    const message = await JSON.parse(fs.readFileSync("./isMessage.json"));
    await Note.findOneAndUpdate(
      {
        room: room,
      },
      {
        text: message[room],
      }
    );
    console.log("room text updated");
  } catch (error) {
    console.log(error);
  }
};

io.on("connection", (socket) => {
  socket.on("new-room", async (room, user) => {
    socket.join(room);
    const newNote = await Note.findOne({
      room: "xyz",
    });
    const rooms = await JSON.parse(fs.readFileSync("./isActive.json"));
    rooms[room] = rooms[room] || { users: {} };
    rooms[room].users[socket.id] = user;
    fs.writeFileSync("./isActive.json", JSON.stringify(rooms, null, 2));
    const message = await JSON.parse(fs.readFileSync("./isMessage.json"));
    if (!message[room]) {
      message[room] = newNote.text || "";
    }
    io.to(room).emit("room", message[room]);
  });
  socket.on("send", async (room, text) => {
    const message = await JSON.parse(fs.readFileSync("./isMessage.json"));
    message[room] = text;
    fs.writeFileSync("./isMessage.json", JSON.stringify(message, null, 2));
    socket.to(room).emit("receive", text);
  });
  socket.on("disconnecting", async () => {
    const client = [...socket.rooms]
    let room = client.pop();
    if (room === socket.id) {
      room = client.pop();
    }
    const rooms = await JSON.parse(fs.readFileSync("./isActive.json"));
    await UpdateMessage(room);
    delete rooms[room].users[socket.id];
    if (Object.keys(rooms[room].users).length === 0) {
      const message = await JSON.parse(fs.readFileSync("./isMessage.json"));
      delete rooms[room];
      delete message[room];
      fs.writeFileSync("./isMessage.json", JSON.stringify(message, null, 2));
    }
    fs.writeFileSync("./isActive.json", JSON.stringify(rooms, null, 2));
  });
//   socket.on("disconnect", async () => {
//     console.log("disconnected");
//     // const rooms = await JSON.parse(fs.readFileSync("./isActive.json"));
//     // for (let room in rooms) {
//     //   if (rooms[room].users[socket.id]) {
//     //     await UpdateMessage(room);
//     //     delete rooms[room].users[socket.id];
//     //     if (Object.keys(rooms[room].users).length === 0) {
//     //       const message = await JSON.parse(fs.readFileSync("./isMessage.json"));
//     //       delete rooms[room];
//     //       delete message[room];
//     //       fs.writeFileSync(
//     //         "./isMessage.json",
//     //         JSON.stringify(message, null, 2)
//     //       );
//     //     }
//     //     fs.writeFileSync("./isActive.json", JSON.stringify(rooms, null, 2));
//     //   }
//     // }
//   });
});

http.listen(port, () => {
  console.log(`listening on *:${port}`);
});

//Boiler plate for json Caching

// update, when the same user is viewing the same note from different device
//data["isActive"]["useridof12"][socketid].push(userid)
