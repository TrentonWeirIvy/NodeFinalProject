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


////// ENUMS
const EPasswordRequirment = {
    MinLenth:10,
}
//// END ENUMS

////***CLASSES  */
class Name{
    constructor(first,last){
        this.firstName = first;
        this.lastName = last;
    }
}
 class UserObject{
    constructor(obj){
        this.name = obj.name;
        this.userName = obj.userName;
        this.password = obj.password;
    }
}
  class User{
    constructor(obj){
        this.name = obj.name && obj.name.firstName && obj.name.lastName ? new Name(obj.name.firstName, obj.name.lastName) : obj.name ?? null;
        this.userName = obj.userName ?? null;
        this.password = obj.password ?? null;
    }
    async isGoodPassword(){
        return (this.password.length >= EPasswordRequirment.MinLenth) ;
    }
    async isValid() {
        return (this.userName && this.password && await this.isGoodPassword())
    }
    async getName(){
        return new Name(this.name.firstName,this.name.lastName);
    }
    async getUserName(){
        return this.userName;
    }
    async setPassword(password){
        this.password = password;
    }
    async setUserName(userName){
        this.userName = userName;
    }
    async setName(first,last){
        this.name = new Name(first,last);
    }
    async setUserByObj(obj){
        if(obj.name && obj.name.firstName && obj.name.lastName){
            this.name = new Name(obj.name.firstName, obj.name.lastName);
        }
        else if(obj.name && obj.name.first && obj.name.last){
            this.name = new Name(obj.name.first, obj.name.last);
        }
        else{
            this.name = new Name(obj.name,null);
        }
        this.userName = obj.userName ?? null;
        this.password = obj.password ?? null;
    }
    getUserObject(){
        return new UserObject(this);
    }
}
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
        this.teacher = obj.teacher ?? 0;
    }
}
class CourseObj{
    constructor(obj){
        this.id = obj.id ?? undefined;
        this.name = obj.name ?? undefined;
        this.teacher = teachers.find(t => t.id == obj.teacher) ?? new Teacher({});
    }
}

const EResult = {
        OK: true,
        ERROR: false,
        Messages: {
            PASSWORD_NOT_LONG_ENOUGH: "PASSWORD DID NOT MEET THE MINIMUM LENGTH",
            USER_INCOMPLETE: "THE USER INFO WAS NOT COMPLETELY FILLED OUT",
        }
}

class Result{
    constructor(obj){
        this.Successful = obj.ok ?? EResult.OK;
        this.errorMessage = obj.errorMessage ?? obj.error ?? null;
        this.result = obj.result ?? {}
    }
}
////***END CLASSES  */

 
 

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
        teacher: teachers[index].id
    });
} );

var users = Array.from({length:1}, (_,index) => {
    return new UserObject({
        name: new Name('Trenton', 'Weir'),
        userName:'admin',
        password: 'admin'
    });
});


///- api
app.post('/api/createUser/:user', (req,res) => {
    const user = new User(JSON.parse(req.params.user));
    if(!user.isValid() && !user.isGoodPassword()){
        res.json(new Result({
            Successful: EResult.ERROR, 
            errorMessage: EResult.Messages.PASSWORD_NOT_LONG_ENOUGH,
            result:{status:"PASSWORD NOT LONG ENOUGH"}
        }));
    } 
    if(!user.isValid()) res.json(new Result({
        Successful: EResult.ERROR,
        errorMessage: EResult.Messages.USER_INCOMPLETE,
        result: {status: "OBJECT INCOMPLETE"}
    }));
    const newUser = user.getUserObject();
    users.push(newUser);
    const userIndex = users.findIndex(u => u.userName == newUser.userName && u.password == newUser.password);
    res.json({id:userIndex})
    console.log(users);

});
app.get('/api/sign-in', (req,res) => {
    const user = new User(JSON.parse(req.params.user));
    const newUser = user.getUserObject();
    const userIndex = users.findIndex(u => u.userName == newUser.userName && u.password == newUser.password);
    if(userIndex){
        res.json(users.at(userIndex));
    }
    else{
        res.json({error: 'USER NOT FOUND'})
    }
    console.log(users);
});

app.get('/api/teachers', (req,res)=>{
    res.json(teachers);
});
app.get('/api/teachers/:id', (req,res)=>{
    const id = req.params.id;
    res.json(teachers.at(id));
});
app.post('/api/teacher/:teacher', (req, res) => {
    const teacher = new Teacher(JSON.parse(req.params.teacher));
    console.log(teacher);
    if([undefined,'',null].includes(teacher.id)){
        teacher.id = (teachers[teachers.length-1].id + 1);
        teachers.push(teacher);
        res.json(teacher);
    }
    else{
        teachers[teacher.id] = teacher;
        res.json(teacher);
    }
})
app.put('/api/teacher/:teacher', (req, res) => {

    const teacher = new Teacher(JSON.parse(req.params.teacher));
    teachers[teacher.id] = teacher;
    res.json(teacher);
})
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
    const courseData = JSON.parse(req.params.course);
    const teacher = teachers.at(courseData.teacher);
    const course = new Course({
        id: courseData.id == '' ? null : courseData.id,
        name: courseData.name,
        teacher: teacher.id
    });
    if ([null, '', undefined].includes(course.id)) {

        const id = courses.at(courses.length-1).id + 1;
        course.id = id;
        courses.push(course);
        res.json(id);
    }
    else {
        console.log(course.id)
        courses[course.id] = course;
        res.json(course);
    }

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



///////**** INDEX */
app.get('/', (req, res) => {
    res.render('signin', {title:"Sign In"})
    //res.redirect('/index');
});

app.get('/index', (req, res) => {
    const courseObjs = courses.map(c => new CourseObj(c));
    res.render('index', { title: 'Index',teachers:teachers, courses:courseObjs });
});

///////**** END INDEX */



///////**** FORMS */
///////**** SIGNIN Form */
app.get('/signin', (req,res) => {
    const params = {
        title: "Sign In"
    };
    res.render('signin',params);
});
app.get('/createAccount', (req,res) => {
    const params = {
        title: "Create New Account"
    };
    res.render('createAccount',params);
});
///////**** END-SIGNIN Form */


///////**** Teacher Form */

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

app.get('/teacherForm/:id', (req, res) => {
    const teacher = teachers.at(req.params.id);
    res.render('teacherForm', 
    {
        pageTitle: 'Edit Teacher',
        title:'Edit Teachers',
        formAction:'/teachers', 
        teachers: teachers, 
        teacher: teacher,
        buttonLabel: `Edit Teacher: ${teacher.id}`
    });
})
///////**** End Teacher Form */

///////**** COURSE FORM */
app.get('/courseForm', (req, res) => {
    // Assuming you have a way to retrieve a course, replace this with your actual logic
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

app.get('/courseForm/:id', (req,res) => {
    const course = courses.find(c => c.id == req.params.id) ?? new Course({});

    res.render('courseForm', {
        title: `Edit Course: ${course.id}`,
        pageTitle: `Edit Course: ${course.id}`,
        formAction: '/courses',
        teachers,
        courses:courses,
        course:course,
        buttonLabel: `Edit Course: ${course.id}`
    });
    
});

///////**** END COURSE FORM */
///////**** END FORMS */

///////**** Tables */
app.get('/teachers', (req, res) => {
    res.render('teachers', { title: 'Teachers',  teachers: teachers });
});

app.get('/courses', (req,res) => {
    const sendingCourses = courses.map(c => new CourseObj(c));
    res.render('courses', { title: 'Index', courses:sendingCourses });
});

///////**** END TABLES */








///////**** 404 Page */
app.use((req, res) => {
    res.status(404).render('404', { title: '404 Page Not Found' });
});

///////**** END 404 Page */
