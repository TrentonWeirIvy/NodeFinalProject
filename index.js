const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const port = 3000;
const dbURI = `mongodb+srv://jeaNode:FTHw8b7Mk44CTNLY@cluster0.kbx9mxa.mongodb.net/tutorial?retryWrites=true&w=majority`;

const app = express();

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(res => app.listen(port,() => console.log(`app running on http://localhost:${port}`)))
  .catch(err => console.log(err));

// Register view engine
app.set('view engine', 'ejs');

// Middleware & static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

class Teacher {
    constructor(obj){
        this.id = obj.id ?? undefined;
        this.name = obj.name ?? undefined;
    }
}
class Course {
    constructor(obj){
        this.id = obj.id ?? undefined;
        this.name = obj.name ?? undefined;
        this.teacher = obj.teacher ?? new Teacher({});
    }
}
 

//data 


var teachers = Array.from({length:10}, (_,index)=>{
    return new Teacher({
        id: index,
        name: `Teacher Name ${index}`
    })
});
var courses = Array.from({length:10}, (_,index) =>{
    console.log(teachers[index])
    return new Course({
        id: index,
        name: `Course ${index}`,
        teacher: teachers[index]
    });
} );


///- api
app.get('/api/teachers', (req,res)=>{
    res.json(teachers);
});
app.get('/api/teachers/:id', (req,res)=>{
    const id = req.params.id;
    res.json(teachers.at(id));
});
app.post('/api/teacher/:name', (req,res)=>{
    const teach = JSON.parse(req.params.name);
    const name = teach.name;
    console.log(teach);
    if(!teachers.includes(name)){
        let id = teachers.length;
        teachers.push(new Teacher({
            id,name
        }));
        res.json(teachers.at(id));
    }
});
app.put('/api/teacher/:id', (req,res)=>{
    const id = req.params.id;
});
app.delete('/api/teacher/:id', (req,res)=>{
    const id = req.params.id;
});


app.get('/api/courses',(req,res)=>{
    res.json(courses);
});
app.get('/api/course/:id',(req,res)=>{
    res.json(courses.at(req.params.id));
});
app.post('/api/course/:course',(req,res)=>{
    const course = JSON.parse(req.params.course);
    console.log(course);
    let id = courses.push(course);
    res.json(id);
});
app.put('/api/course/:course/:id',(req,res)=>{
    const id = req.params.id;
    const course = req.params.course;
    course.at(id) = JSON.parse(course);
    res.json(courses);
});
app.delete('/api/course/:id',(req,res)=>{
    courses = courses.filter((course,index) => index !== req.params.id);
    res.json(courses);
});
///- end api



// Routes
app.get('/', (req, res) => {
    res.redirect('/index');
});

app.get('/index', (req, res) => {
    res.render('index', { title: 'Index',teachers:teachers, courses:courses });
});

app.get('/teacherForm', (req, res) => {
    const teacher = new Teacher({});
    res.render('teacherForm', 
    {
        pageTitle: 'Create Teacher',
        title:'Teachers',
        formAction:'/teachers', 
        teachers: teachers, 
        teacher: teacher,
        buttonLabel: 'Create New Teacher'
    });
})

app.get('/teachers', (req, res) => {
    // Assuming teachersData is an array of teachers retrieved from your database


    res.render('teachers', { title: 'Teachers',  teachers: teachers });
});

// ...

app.get('/courses', (req,res) => {
    res.render('courses', { title: 'Index', courses:courses });
});

app.get('/courseForm', (req, res) => {
    // Assuming you have a way to retrieve a course, replace this with your actual logic
    const course = {
        name: '',  // Initialize with default values or retrieve from database
        teacher: '' // Initialize with default values or retrieve from database
    };

    // Pass the course variable to the view
    res.render('courseForm', {
        title: 'Course Form',
        pageTitle: 'Course Form',
        formAction: '/courses',
        teachers,
        courses,
        course,
        buttonLabel: 'Submit'
    });
});

app.get('/courseForm/:id', (req,res) => {
    const course = courses.find(c => c.id == req.params.id) ?? new Course({});

    res.render('courseForm', {
        title: 'Course Form',
        pageTitle: 'Course Form',
        formAction: '/courses',
        teachers,
        courses,
        course,
        buttonLabel: 'Submit'
    });
    
});

// ...








// Add more routes as needed

// 404 Page
app.use((req, res) => {
    res.status(404).render('404', { title: '404 Page Not Found' });
});