const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const app = express();

app.set("view engine", "ejs"); // Register view engine
app.use(express.static("public")); // Middleware & static files
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

const port = process.env.PORT;
const dbURI = process.env.MONGO_CONECTION;
const serial = process.env.JWT_SERIALIZE;

const l = (str) => console.log(str);
const checkAuth = async (req) => {
  //return;
  const token = req.headers["authentication"];
  const obj = jwt.decode(token, serial);
  const time = new Date(obj?.date);
  const isGood = (await User.exists({ _id: obj?.userId })) && time > new Date();
  console.log(isGood);
  return isGood;
};

if (dbURI) {
  mongoose.connect(dbURI, {}).catch((err) => console.error(err));
} else {
  app.listen(port, () => l(`app running on http://localhost:${port}`));
}
const db = dbURI ? mongoose.connection : null;

//Schemas

const userSchema = mongoose.Schema(
  {
    id: mongoose.Schema.Types.ObjectId,
    username: String,
    password: String,
    courses: [String], // Assuming course IDs are stored here
  },
  { versionKey: false },
);

const teacherSchema = mongoose.Schema(
  {
    id: mongoose.Schema.Types.ObjectId,
    name: String,
  },
  { versionKey: false },
);

const courseSchema = mongoose.Schema(
  {
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  },
  { versionKey: false },
);

const User = mongoose.model("User", userSchema);
const Teacher = mongoose.model("Teacher", teacherSchema);
const Course = mongoose.model("Course", courseSchema);

///- api
// API Endpoints
app.post("/api/createUser", async (req, res) => {
  try {
    const userData = req.body;
    const user = new User(userData);
    const newUser = await user.save();
    var date = new Date();
    date.setMinutes(date.getMinutes() + 10);
    const token = jwt.sign(
      { userId: newUser._id, date: date },
      process.env.JWT_SECRET,
    );
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/signin", async (req, res) => {
  if (await checkAuth(req)) {
    res.redirect("/index");
    return;
  }

  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username, password });
    if (existingUser) {
      var date = new Date();
      date.setMinutes(date.getMinutes() + 10);
      const token = jwt.sign(
        { userId: existingUser._id, date: date },
        process.env.JWT_SECRET,
      );
      l(token);
      res.json({ token });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/createCourse", async (req, res) => {
  try {
    const courseData = req.body;
    const teacher = await Teacher.findOne({
      username: courseData.teacherUsername,
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const course = new Course({
      name: courseData.name,
      teacher: teacher._id,
    });

    const newCourse = await course.save();
    res.json({ id: newCourse._id });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/teachers", async (req, res) => {
  try {
    const teachers = await Teacher.find();
    console.log(teachers);
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/api/teachers/:id", async (req, res) => {
  try {
    const teacherId = JSON.parse(req.params.id);
    console.log(teacherId);
    const teacher = await Teacher.findById(teacherId);
    console.log(teacher);

    if (teacher) {
      res.json(teacher);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post("/api/teacher", async (req, res) => {
  try {
    const teacherData = req.body; // Access the request body directly
    const teacher = new Teacher(teacherData);
    console.log(teacher);
    const savedTeacher = await teacher.save();
    res.json(savedTeacher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/teacher", async (req, res) => {
  try {
    const updatedTeacherData = req.body;
    console.log(updatedTeacherData);
    const teacherId = updatedTeacherData.id;

    const existingTeacher = await Teacher.findById(teacherId);

    if (!existingTeacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    existingTeacher.name = updatedTeacherData.name;
    const updatedTeacher = await existingTeacher.save();

    res.json(updatedTeacher);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/teacher/:id", async (req, res) => {
  console.log("HIT");
  try {
    const teacherId = JSON.parse(req.params.id); // Use req.params.id for route parameters
    console.log(teacherId);

    const deletedTeacher = await Teacher.findByIdAndDelete(teacherId);

    if (!deletedTeacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    res.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/courses", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/course/:id", async (req, res) => {
  try {
    const courseId = JSON.parse(req.params.id);

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/course", async (req, res) => {
  l("HIT");
  l(req.body);
  try {
    const courseData = req.body;
    l(courseData);

    const teacherId = courseData.teacher;
    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const course = new Course({
      name: courseData.name,
      teacher: teacher._id,
    });

    const newCourse = await course.save();
    res.json({ id: newCourse._id });
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.put("/api/course", async (req, res) => {
  try {
    const course = req.body;
    console.log(course); // Log the received data
    const courseToUpdate = await Course.findByIdAndUpdate(
      req.body._id,
      req.body,
      { new: true },
    );

    if (!courseToUpdate) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(courseToUpdate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
});

app.delete("/api/course/:id", async (req, res) => {
  console.log("HIT");
  try {
    const courseId = JSON.parse(req.params.id); // Use req.params.id for route parameters
    console.log(courseId);

    const deletedcourse = await Course.findByIdAndDelete(courseId);

    if (!deletedcourse) {
      return res.status(404).json({ error: "course not found" });
    }

    res.json({ message: "course deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

///- end api

///////**** INDEX */
app.get("/", async (req, res) => {
  res.redirect("/signin");
});

app.get("/index", async (req, res) => {
  await checkAuth(req);
  const courses = await Course.find();
  const teachers = await Teacher.find();
  l(teachers);
  res.render("index", { title: "Index", teachers: teachers, courses: courses });
});

///////**** END INDEX */

///////**** FORMS */
///////**** SIGNIN Form */
app.get("/signin", async (req, res) => {
  l("HIT");
  if (await checkAuth(req)) {
    res.redirect("/index");
    return;
  }
  res.render("signin", {
    title: "Sign In",
  });
});
app.get("/createAccount", async (req, res) => {
  res.render("createAccount", { title: "Create New Account" });
});
///////**** END-SIGNIN Form */

///////**** Teacher Form */

app.get("/teacherForm", async (req, res) => {
  await checkAuth(req);
  res.render("teacherForm", {
    pageTitle: "Create Teacher",
    title: "Teachers",
    formAction: "/teachers",
    teacher: {},
    buttonLabel: "Create New Teacher",
  });
});

///////**** End Teacher Form */

///////**** COURSE FORM */
app.get("/courseForm", async (req, res) => {
  await checkAuth(req);
  const courses = await Course.find();
  const teachers = await Teacher.find();

  const course = {
    name: "", // Initialize with default values or retrieve from database
    teacher: "", // Initialize with default values or retrieve from database
  };

  // Pass the course variable to the view
  res.render("courseForm", {
    title: "Create New Course",
    pageTitle: "Create New Course",
    formAction: "/courses",
    teachers,
    courses,
    course,
    buttonLabel: "Create Course",
  });
});

///////**** END COURSE FORM */
///////**** END FORMS */

///////**** Tables */
app.get("/teachers", async (req, res) => {
  await checkAuth(req);
  res.render("teachers", { title: "Teachers" });
});

app.get("/courses", async (req, res) => {
  await checkAuth(req);
  res.render("courses", { title: "Courses" });
});

///////**** END TABLES */

app.listen(port, () => console.log(`app running on http://localhost:${port}`));

///////**** 404 Page */
app.use((req, res) => {
  res.status(404).render("404", { title: "404 Page Not Found" });
});

///////**** END 404 Page */
