// models/student.js
const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/attendanceAppDatabase");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  lastName: {
    type: String,
  },
  course: {
    type: String,
  },
  email: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  password: {
    type: String,
  },
  id: {
    type: String,
  },
  role: {
    type: String,
    default: "student",
  },
  file: {
    type: String,
  },
  attendance: {
    type: Array,
    default: null,
  },
});

userSchema.plugin(plm);
module.exports = mongoose.model("users", userSchema);
