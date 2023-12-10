const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const app = express();

app.set('view engine', 'ejs');// Register view engine
app.use(express.static('public'));// Middleware & static files
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use((req, res, next) => {
    res.locals.path = req.path;
    next();
});

const port = process.env.PORT ?? 3000;
const dbURI = process.env.MONGO_CONECTION ?? null;



const l = str => console.log(str);



if (dbURI) {
    mongoose.connect(dbURI, {  })
        .catch(err => console.log(err));
}
else {
    app.listen(port, () => l(`app running on http://localhost:${port}`))
}
const db = dbURI ? mongoose.connection : null;

// Check MongoDB connection
// db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// db.once('open', () => {
//   l('Connected to MongoDB');
// });


//Schemas 

const userSchema = mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    username: String,
    password: String,
    courses: [String], // Assuming course IDs are stored here
  });
  
  const teacherSchema = mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    username: String,
  });
  
  const courseSchema = mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  });

const User = mongoose.model('User', userSchema);
const Teacher = mongoose.model('Teacher', teacherSchema);
const Course = mongoose.model('Course', courseSchema);





    ///- api
    // API Endpoints
    app.post('/api/createUser', async (req, res) => {
        l(req.body);
        try {
            const userData = req.body;
            const user = new User(userData);
            const newUser = await user.save();
            res.json({ id: newUser._id });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    

app.post('/api/sign-in', async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username, password });

        if (existingUser) {
            const token = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET);
            res.json({ token });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/createCourse', async (req, res) => {
    try {
        const courseData = req.body;
        const teacher = await Teacher.findOne({ username: courseData.teacherUsername });

        if (!teacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        const course = new Course({
            name: courseData.name,
            teacher: teacher._id,
        });

        const newCourse = await course.save();
        res.json({ id: newCourse._id });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

    app.get('/api/teachers', async (req, res) => {
        try {
            const teachers = await Teacher.find();
            res.json(teachers);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
app.get('/api/teachers/:id', async (req, res) => {
    try {
        const teacherId = req.params.id;
        const teacher = await Teacher.findById(teacherId);

        if (teacher) {
            res.json(teacher);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/api/teacher', async (req, res) => {
    try {

        console.log(req.body);
        const teacherData = req.body;
        const teacher = new Teacher(teacherData);
        
        if (!teacher._id) {
            // Assuming that _id is an automatically generated MongoDB ObjectId
            teacher._id = new mongoose.Types.ObjectId();
        }

        const savedTeacher = await teacher.save();
        res.json(savedTeacher);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.put('/api/teacher/:id', async (req, res) => {
    try {
        const updatedTeacherData = req.body;
        const teacherId = req.params.id;

        // Assuming Teacher.findById() is the Mongoose function to find a teacher by ID
        const existingTeacher = await Teacher.findById(teacherId);

        if (!existingTeacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        // Update existing teacher properties
        existingTeacher.username = updatedTeacherData.username;

        // Save the updated teacher
        const updatedTeacher = await existingTeacher.save();

        res.json(updatedTeacher);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/api/teacher/:id', async (req, res) => {
    try {
        const teacherId = req.params.id;

        // Assuming Teacher.findByIdAndDelete() is the Mongoose function to delete a teacher by ID
        const deletedTeacher = await Teacher.findByIdAndDelete(teacherId);

        if (!deletedTeacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        res.json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.get('/api/courses', async (req, res) => {
    try {
        // Assuming Course.find() is the Mongoose function to retrieve all courses
        const courses = await Course.find();
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/course/:id', async (req, res) => {
    try {
        const courseId = req.params.id;

        // Assuming Course.findById() is the Mongoose function to find a course by ID
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json(course);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/course', async (req, res) => {
    try {
        const courseData = req.body;
        const teacherId = courseData.teacher;

        // Assuming Teacher.findById() is the Mongoose function to find a teacher by ID
        const teacher = await Teacher.findById(teacherId);

        if (!teacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        const course = new Course({
            name: courseData.name,
            teacher: teacher._id,
        });

        const newCourse = await course.save();
        res.json({ id: newCourse._id });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/api/course/:id', async (req, res) => {
    try {
        const courseId = req.params.id;
        const updatedCourseData = req.body;

        // Assuming Course.findByIdAndUpdate() is the Mongoose function to update a course by ID
        const updatedCourse = await Course.findByIdAndUpdate(courseId, updatedCourseData, { new: true });

        if (!updatedCourse) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json(updatedCourse);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/api/course/:id', async (req, res) => {
    try {
        const courseId = req.params.id;

        // Assuming Course.findByIdAndDelete() is the Mongoose function to delete a course by ID
        const deletedCourse = await Course.findByIdAndDelete(courseId);

        if (!deletedCourse) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

    ///- end api






///////**** INDEX */
app.get('/', (req, res) => {
    res.render('signin', { title: "Sign In" })
    //res.redirect('/index');
});

app.get('/index', async (req, res) => {
    const courses = await Course.find();
    const teachers = await Teacher.find();
    l(teachers);
    res.render('index', { title: 'Index', teachers: teachers, courses: courses });
});

///////**** END INDEX */



///////**** FORMS */
///////**** SIGNIN Form */
app.get('/signin', (req, res) => {
    const params = {
        title: "Sign In"
    };
    res.render('signin', params);
});
app.get('/createAccount', (req, res) => {
    const params = {
        title: "Create New Account"
    };
    res.render('createAccount', params);
});
///////**** END-SIGNIN Form */


///////**** Teacher Form */

app.get('/teacherForm', async (req, res) => {
    const teacher = new Teacher();
    const teachers = await Teacher.find();
    res.render('teacherForm',
        {
            pageTitle: 'Create Teacher',
            title: 'Teachers',
            formAction: '/teachers',
            teachers: teachers,
            teacher: teacher,
            buttonLabel: 'Create New Teacher'
        });
})

app.get('/teacherForm/:id', async (req, res) => {
    const teacher = await Teacher.findById(req.params.id);
    const teachers = await Teacher.find();
    res.render('teacherForm',
        {
            pageTitle: 'Edit Teacher',
            title: 'Edit Teachers',
            formAction: '/teachers',
            teachers: teachers,
            teacher: teacher,
            buttonLabel: `Edit Teacher: ${teacher.id}`
        });
})
///////**** End Teacher Form */

///////**** COURSE FORM */
app.get('/courseForm', async (req, res) => {
    const courses = await Course.find();
    const teachers = await Teacher.find();

    const course = {
        name: '',  // Initialize with default values or retrieve from database
        teacher: '' // Initialize with default values or retrieve from database
    };

    // Pass the course variable to the view
    res.render('courseForm', {
        title: 'Create New Course',
        pageTitle: 'Create New Course',
        formAction: '/courses',
        teachers,
        courses,
        course,
        buttonLabel: 'Create Course'
    });
});

app.get('/courseForm/:id', async (req, res) => {
    const course = await Course.findById(req.params.id);
    const courses = await Course.find();
    const teachers = await Teacher.find();

    res.render('courseForm', {
        title: `Edit Course: ${course.id}`,
        pageTitle: `Edit Course: ${course.id}`,
        formAction: '/courses',
        teachers,
        courses: courses,
        course: course,
        buttonLabel: `Edit Course: ${course.id}`
    });

});

///////**** END COURSE FORM */
///////**** END FORMS */

///////**** Tables */
app.get('/teachers', async (req, res) => {
    const teachers = await Teacher.find();
    res.render('teachers', { title: 'Teachers', teachers: teachers });
});

app.get('/courses', async (req, res) => {
    const courses = await Course.find();
    res.render('courses', { title: 'Index', courses: courses });
});

///////**** END TABLES */



app.listen(port, () => console.log(`app running on http://localhost:${port}`))




///////**** 404 Page */
app.use((req, res) => {
    res.status(404).render('404', { title: '404 Page Not Found' });
});

///////**** END 404 Page */
