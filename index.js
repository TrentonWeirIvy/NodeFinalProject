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
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

const port = process.env.PORT;
const dbURI = process.env.MONGO_CONECTION;
const serial = process.env.JWT_SECTRET;

const l = (str) => console.log(str);
const checkAuth = async (req) => {
  return true;
  const token = req.headers["Authorization"];
  const obj = jwt.decode(token, serial);
  if(obj == undefined) return false;
  const time = new Date(obj?.date);
  const isValid = (await User.exists({ _id: obj?.userId })) != null && time > new Date();
  return isValid;
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
    courses: [String],
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
    
    // Validate username and password
    if (userData.username.trim() === '' || userData.password.trim() === '') {
      res.status(400).json({ error: "Username and Password cannot be empty" });
      return;
    }
    if (userData.username.trim().length < 4) {
      res.status(400).json({ error: "Username must be at least 4 characters." });
      return;
    }
    if (userData.password.trim().length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: userData.username });

    if (existingUser) {
      res.status(400).json({ error: "Username is already taken" });
      return;
    }

    // If username is unique, create a new user
    const user = new User(userData);
    const newUser = await user.save();

    // Create a JWT token for the new user
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post("/api/signin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username, password });
    if (existingUser) {
      var date = new Date();
      date.setMinutes(date.getMinutes() + 10);
      const token = jwt.sign(
        {userId:existingUser._id},
        process.env.JWT_SECRET,
      );
      l(token);
      res.json({ token });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error });
  }
});

app.get("/api/users", async (req, res) => {
  if (!await checkAuth(req)) {
    res.redirect("/signin");
    return;
  }
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/api/getUserById", async (req, res) => {
  try {
    const body = req.query.user // Extract user ID from query parameters
    const data = jwt.decode(body, process.env.JWT_SECRET)
    const userId = data.userId;

    const userData = await User.findById(userId);
    const user = {
      _id: userData._id,
      username: userData.username,
      courses: userData.courses ?? []
    }

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/api/userCourseInfo", async (req, res) => {
  if (!await checkAuth(req)) {
    res.redirect("/signin");
    return;
  }

  try {
    console.log(req.query);
    const token = req.query.token; // Use req.query for query parameters
    const userId = jwt.decode(token, serial).userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Use Promise.all for parallelizing asynchronous operations
    const coursesPromises = user.courses.map(async (id) => {
      const course = await Course.findById(id);
      course.teacher = await Teacher.findById(course.teacher)
      return course;
    });

    const courses = await Promise.all(coursesPromises);

    const displayUser = {
      username: user.username,
      courses: courses,
    };

    res.json(displayUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.put("/api/signUpForCourse", async (req, res) => {
  console.log("HIT")
  try {
    const signUp = req.body
    const userId = jwt.decode(signUp.userId, serial).userId;
    const courseId = signUp.courseId;
    console.log(signUp);
    const user = await User.findById(userId)
    console.log(user);
    user.courses.push(courseId);
    user.courses = Array.from(new Set(user.courses));
    const userData = user.save();
    

    if (userData) {
      res.json(userData);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/RemoveCourseFromUser", async (req, res) => {
  console.log("HIT")
  try {
    const signUp = req.body
    const userId = jwt.decode(signUp.token, serial).userId;
    console.log(userId)
    const courseId = signUp.courseId;
    const user = await User.findById(userId)
    const courseIndex = user.courses.indexOf(courseId);

    if (courseIndex !== -1) {
      // Remove the courseId from the user's courses
      user.courses.splice(courseIndex, 1);
    }
    const userData = user.save();
    

    if (userData) {
      res.json(userData);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});





app.post("/api/createCourse", async (req, res) => {
  if (!await checkAuth(req)) {
    res.redirect("/signin");
    return;
  }
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
  if (!await checkAuth(req)) {
    res.redirect("/signin");
    return;
  }
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/api/teachers/:id", async (req, res) => {
  if (!await checkAuth(req)) {
    res.redirect("/signin");
    return;
  }
  try {
    const teacherId = JSON.parse(req.params.id);
    const teacher = await Teacher.findById(teacherId);

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
  if (!await checkAuth(req)) {
    res.redirect("/signin");
    return;
  }
  try {
    const teacherData = req.body; // Access the request body directly
    const teacher = new Teacher(teacherData);
    const savedTeacher = await teacher.save();
    res.json(savedTeacher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/teacher", async (req, res) => {
  if (!await checkAuth(req)) {
    res.redirect("/signin");
    return;
  }
  try {
    const updatedTeacherData = req.body;
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
  if (!await checkAuth(req)) {
    res.redirect("/signin");
    return;
  }
  try {
    const teacherId = JSON.parse(req.params.id); // Use req.params.id for route parameters

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
  if (!await checkAuth(req)) {
    res.redirect("/signin");
    return;
  }
  try {
    const courses = await Course.find();

    const coursesPromises = courses.map(async (course) => {
      course.teacher = await Teacher.findById(course.teacher)
      return course;
    });

    await Promise.all(coursesPromises);

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/course/:id", async (req, res) => {
  if (!await checkAuth(req)) {
    res.redirect("/signin");
    return;
  }
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
  if (!await checkAuth(req)) {
    res.redirect("/signin");
    return;
  }
  try {
    const courseData = req.body;
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
  if (!await checkAuth(req)) {
    res.redirect("/signin");
    return;
  }
  try {
    const course = req.body;
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
  if (!await checkAuth(req)) {
    res.redirect("/signin");
    return;
  }
  try {
    const courseId = JSON.parse(req.params.id); // Use req.params.id for route parameters

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
  const courses = await Course.find();
  const teachers = await Teacher.find();
  res.render("index", { title: "Index", teachers: teachers, courses: courses });
});

///////**** END INDEX */

///////**** FORMS */
///////**** SIGNIN Form */
app.get("/signin", async (req, res) => {
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
  if (!await checkAuth(req)) {
    res.redirect("/signin");
    return;
  }
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
  if (!await checkAuth(req)) {
    res.redirect("/signin");
    return;
  };
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
  if (!await checkAuth(req)) {
    res.redirect("/signin");
    return;
  };
  res.render("teachers", { title: "Teachers" });
});

app.get("/courses", async (req, res) => {
  if (!await checkAuth(req)) {
    res.redirect("/signin");
    return;
  };
  res.render("courses", { title: "Courses" });
});

///////**** END TABLES */

app.listen(port, () => console.log(`app running on http://localhost:${port}`));

///////**** 404 Page */
app.use((req, res) => {
  res.status(404).render("404", { title: "404 Page Not Found" });
});

///////**** END 404 Page */
