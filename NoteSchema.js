const { Schema, model } = require("mongoose");

const NoteSchema = new Schema({
  room: {
    type: String,
    default: "xyz",
  },
  text: {
    type: String,
  },
});

module.exports = model("Note", NoteSchema);
