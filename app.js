const express = require('express')
const app = express()
const userModel = require('./models/user')
const postModel=require('./models/post')
const path = require('path')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const user = require('./models/user')
const upload=require('./utils/multerconfig')

app.set('view engine', "ejs")
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.get('/', (req, res) => {
    res.render('index')
})

app.post('/create', async (req, res) => {
    let { name, username, email, password } = req.body
    let user = await userModel.findOne({ email })
    if (user) { res.redirect('/login') }
    else {
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(password, salt, async function (err, hash) {
                let createdUser = await userModel.create({
                    name,
                    username,
                    email,
                    password: hash
                })
            });
        });
        let token = jwt.sign({ email: email }, "secret")
            res.cookie('token', token)
            res.redirect('/login')
    }
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', async (req, res) => {
    let { email, password } = req.body;
    let user = await userModel.findOne({ email })
    if (!user) { return res.status(500).send('Email or Password is wrong') }
    bcrypt.compare(password, user.password, function (err, result) {
        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, "secret")
            res.cookie('token', token)
            res.redirect('/profile')
        }
        else { res.redirect('/login') }
    });
})

app.get('/logout', (req, res) => {
    res.cookie('token', '')
    res.redirect('/login')
})

const ifLoggedIn = (req, res, next) => {
    if (!req.cookies.token) {
        return res.redirect('/login');
    }
    let userData = jwt.verify(req.cookies.token, "secret");
    req.userData = userData; //can send something through your request from fn
    next();
};

app.get('/profile', ifLoggedIn, async (req, res) => {
    let founduser = await userModel.findOne({email:req.userData.email}).populate('posts')
    res.render('profile', { founduser })
})

app.post('/post',ifLoggedIn,async(req,res)=>{
     let logeduser = await userModel.findOne({email:req.userData.email});
    let post= await postModel.create({
        user:logeduser._id,
        content:req.body.content
    }) 
    //****// 
    logeduser.posts.push(post._id);
    await logeduser.save();
    res.redirect('/profile')
})

app.get('/like/:id', ifLoggedIn, async (req, res) => {
    let post = await postModel.findOne({_id:req.params.id}).populate('user')
    if((post.likes.indexOf(req.userData.userid))===-1){
        post.likes.push(req.userData.userid)
    } else {
        post.likes.splice(post.likes.indexOf(req.userData.userid),1) // to remove an element from array
    }
   
   await post.save();
   res.redirect('/profile')
})

app.get('/edit/:id', ifLoggedIn, async (req, res) => {
    let post = await postModel.findOne({_id:req.params.id}).populate('user')
    res.render('edit',{post})
})

app.post('/update/:id', ifLoggedIn, async (req, res) => {
    let post = await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content})
    res.redirect('/profile')
})

app.get('/upload',ifLoggedIn,(req,res)=>{
    res.render('upload')
})

app.post('/upload',ifLoggedIn, upload.single('image'),async(req,res)=>{
   let user=await userModel.findOne({email:req.userData.email})
   user.profilepic=req.file.filename
    await user.save()
    res.redirect('/profile')
})



app.listen(3000); 