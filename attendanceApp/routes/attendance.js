const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  id: {
    type: String,
  },
  history: [
    {
      timestamp: {
        type: Date,
        required: true,
        default: Date.now, // Use Date.now as the default value
      },
      eventType: {
        type: String, // 'checkIn' or 'checkOut'
      },
      attendanceStatus: {
        type: String, // 'present' or 'absent'
        default: "absent",
      },
    },
  ],
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
