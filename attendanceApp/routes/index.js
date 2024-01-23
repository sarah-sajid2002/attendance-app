var express = require("express");
const mongoose = require("mongoose");
var router = express.Router();
const userModel = require("./users");
const attendanceModel = require("./attendance");
const passport = require("passport");
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));
const upload = require("./multer");

// index router
router.get("/", function (req, res, next) {
  res.render("index", { error: req.flash("error") });
});

// signup route
router.get("/register", (req, res) => {
  res.render("register");
});

//adminDashboard route
router.get("/adminDashboard", isLoggedIn, async (req, res) => {
  const user = await userModel.find();
  res.render("adminDashboard", { user });
});

// decision route
router.get("/decision", isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({
    username: req.session.passport.user,
  });
  if (user.role === "admin") {
    res.redirect("/adminDashboard");
  } else {
    res.redirect("/studentDashboard");
  }
});

//studentDashboard route
router.get("/studentDashboard", isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({
    username: req.session.passport.user,
  });
  res.render("studentDashboard", { user });
});

//createStudent route
router.get("/createStudent", isLoggedIn, (req, res) => {
  res.render("createStudent");
});

// Edit student get route
router.get("/editStudent/:studentId", isLoggedIn, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const student = await userModel.findById(studentId);
    // console.log("studentId: ", studentId);
    // console.log("student: ", student);
    res.render("editStudent", { student });
  } catch (error) {
    console.error("Error fetching student for edit:", error);
    req.flash("error", "Something went wrong. Please try again.");
    res.redirect("/adminDashboard");
  }
});

router.get("/checkIn", isLoggedIn, (req, res) => {
  res.render("checkIn");
});
// studentDashboard route
router.get("/studentDashboard", isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({
    username: req.session.passport.user,
  });
  res.render("studentDashboard", { user });
});

// attendance show route
router.get("/attendance", isLoggedIn, async (req, res) => {
  const user = await userModel.find();
  res.render("attendance", { user });
});
// update student
// Update student post route
router.post("/editStudent/:studentId", isLoggedIn, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const student = await userModel.findById(studentId);

    // Update the student based on the form data
    const { username, lastName, course, phoneNumber } = req.body;
    const updateStudent = await userModel.findOneAndUpdate(
      { _id: studentId },
      {
        $set: { username, lastName, course, phoneNumber },
      },
      { new: true }
    );

    if (!updateStudent) {
      return res.status(404).json({ error: "User not found" });
    }

    // Redirect to the admin dashboard or wherever you'd like
    res.redirect("/adminDashboard");
  } catch (error) {
    console.error("Error updating student:", error);
    req.flash("error", "Something went wrong. Please try again.");
    res.redirect("/editStudent/" + req.params.studentId);
  }
});

//check in get route

// Check-in post route
router.post("/checkIn", isLoggedIn, async (req, res) => {
  try {
    // Find the current user
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });

    // Get today's date and timestamp
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const formattedTime = today.toLocaleTimeString(); // Format: hh:mm:ss

    // Check if the user has already checked in today
    const todayCheckIn = user.attendance.find(
      (entry) => entry.date === formattedDate
    );

    if (todayCheckIn) {
      // User has already checked in today
      res.render("checkIn", {
        error: "You have already checked in today.",
      });
    }
    if (user.id === req.body.id) {
      // Add today's date and timestamp to the user's attendance array
      user.attendance.push({
        date: formattedDate,
        timestamp: formattedTime,
        eventType: "checkIn",
        attendanceStatus: "present",
      });

      // Save the updated user document
      await user.save();

      res.redirect("/studentDashboard");
    } else {
      res.render("checkIn", {
        error: "id is wrong! ",
      });
    }
  } catch (error) {
    // Handle any errors, possibly flash a generic message
    console.error("Error saving attendance record:", error);
    "error", "Something went wrong. Please try again.";
    res.render("checkIn", {
      error: "Something went wrong. Please try again.",
    }); // Redirect to the student dashboard with an error message
  }
});

// create student route
router.post(
  "/createStudent",
  isLoggedIn,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      res.render("createStudent", { error: "Select File" });
    } else {
      const { username, lastName, course, email, phoneNumber, id } = req.body;
      const file = req.file.filename;
      try {
        // Check if the username or email already exists in the database
        const existingUser = await userModel.findOne({
          $or: [{ username }, { email }],
        });

        if (existingUser) {
          // User with the same username or email already exists
          req.flash(
            "error",
            "Username or email already in use. Please choose another."
          );
          return res.redirect("/adminDashboard");
        }
        const studentCreated = new userModel({
          username,
          lastName,
          course,
          email,
          phoneNumber,
          id,
          file,
        });
        userModel.register(studentCreated, req.body.password).then(function () {
          passport.authenticate("local")(req, res, function () {
            res.redirect("/adminDashboard"); // Redirect or send a response as needed
          });
        });
      } catch (error) {
        // Handle any errors, possibly flash a generic message
        req.flash("error", "Something went wrong. Please try again.");
        res.redirect("/login");
      }
    }
  }
);

// register route
router.post("/register", async (req, res) => {
  const { username, email, lastName, is_id } = req.body;

  const userData = new userModel({ username, email, lastName, is_id });
  userModel.register(userData, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      console.log("done");
      res.redirect("/adminDashboard");
    });
  });
});

// login route

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/decision",
    failureRedirect: "/",
    failureFlash: true,
  }),
  async function (req, res) {
    // Additional logic if needed
  }
);

// logout route
router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// isLoggedIn middleware
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

module.exports = router;
