var express = require("express");
var mongoose = require("mongoose");
//var MongoClient = require('mongodb').MongoClient;
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var path = require("path");
var crypto = require("crypto");
var multer = require('multer');
var fs = require("fs");
var fileUpload = require("express-fileupload");
//var GridFsStorage = require('multer-gridfs-storage');
//var gridfs = require('gridfs-stream');

var app = express();
app.use(fileUpload());
var upload = multer({ dest : '/uploads/'});

////
/*const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '_' + Date.now());
  }
});
const upload = multer({ storage : storage}).single('uploadfile');*/
/////
var urlencodedParser = bodyParser.urlencoded({extended: false});

app.set('view engine','ejs');

app.use(express.static('assets'));
app.use(cookieParser());
app.use(session({
    secret: 'symposium_session',
    resave: false,
    saveUninitialized: true
}));

mongoose.connect('mongodb://localhost:27017/symposium_project',{useNewUrlParser:true});
var db = mongoose.connection;
mongoose.connection.on("open",function(){
    console.log("mongodb connected");
});

var userschema = new mongoose.Schema({
        DisplayName : String,
        EmailId : String,
        Salt : String,
        HashPassword : String
});

var selectcategoryschema = new mongoose.Schema({
        EmailId : String,
        Category : [{type : String}]
});

var questionschema = new mongoose.Schema({
        EmailId : String,
        Question : String
});

var answerschema = new mongoose.Schema({
        EmailId : String,
        QuestionTag : String,
        FileName : String
});

var user = mongoose.model('user', userschema);
var selectcat = mongoose.model('category',selectcategoryschema);
var addquestion = mongoose.model('question',questionschema);
var addanswer = mongoose.model('answer',answerschema);


var genRandomString = function(length){
    return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */
};

var sha512 = function(password, salt){
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt:salt,
        passwordHash:value
    };
};

function saltHashPassword(userpassword) {
    var salt = genRandomString(16); /** Gives us salt of length 16 */
    var passwordData = sha512(userpassword, salt);
    return(passwordData);
    //console.log('UserPassword = '+userpassword);
    //console.log('Passwordhash = '+passwordData.passwordHash);
    //console.log('nSalt = '+passwordData.salt);
}


var usermsg = null;
var passwdmsg = null;
var signupmsg = null;

app.get('/',function(req,res){
    usermsg = null;
    passwdmsg = null;
    signupmsg = null;
    res.render("home",{usermsg : usermsg , passwdmsg : passwdmsg , signupmsg : signupmsg});
});

app.get('/home',function(req,res){
    usermsg = null;
    passwdmsg = null;
    signupmsg = null;
    res.render("home",{usermsg : usermsg , passwdmsg : passwdmsg , signupmsg : signupmsg});
});

app.get('/profile',function(req,res){
    var ms = req.session.email;
   res.render("profile",{ms : ms}); 
});

app.get('/homepage',function(req,res){
        usermsg = null;
        passwdmsg = null;
        signupmsg = null;
    console.log(req.session.email);
    if(req.session.email == null)
    {
        res.render("mainpage",{usermsg : usermsg , passwdmsg : passwdmsg , signupmsg : signupmsg , uname : req.session.email});
    }
    var usermsg = req.session.email;
    questions_arr = ["what is use of jquery ?","which is better django or node.js ?","how to upload file in mvc ?"];
                answers_arr = ["tech.mp4","No Copyright, Copyright Free Videos, Motion Graphics, Movies, Background, Animation, Clips, Download.mp4","tech.mp4"];
    res.render("mainpage",{usermsg : usermsg , ques : questions_arr , ans : answers_arr, uname : req.session.email});
    
})
app.get('/select_categories',function(req,res){
    if(req.session.email == null)
    {
        usermsg = null;
        passwdmsg = null;
        signupmsg = null;
        res.render("home",{usermsg : usermsg , passwdmsg : passwdmsg , signupmsg : signupmsg});
    }
    else
    {
        res.render("select_categories");
    }
});

app.post('/login',urlencodedParser,function(req,res){
    var displayname = req.body.dname;
    var email = req.body.emailid;
    var passwd = saltHashPassword(req.body.passwd);
    db.collection('users').findOne({EmailId : email},function(err,data){
        if(data != null)
        {
            signupmsg = "User already exist";
            usermsg = null;
            passwdmsg = null;
            res.render("home",{signupmsg : signupmsg , usermsg : usermsg , passwdmsg : passwdmsg});
        }
        else
        {
            signupmsg = null;
            usermsg = null;
            passwdmsg = null;
            var userdata = new user();
            userdata.DisplayName = displayname;
            userdata.EmailId = email;
            userdata.Salt = passwd.salt;
            userdata.HashPassword = passwd.passwordHash;
            userdata.save();
            res.render("home" , {signupmsg : signupmsg , usermsg : usermsg , passwdmsg : passwdmsg});
        }
    }); 
});

app.post('/select_categories',urlencodedParser,function(req,res){
    signupmsg = null;
            usermsg = null;
            passwdmsg = null;
   db.collection('users').findOne({EmailId : req.body.emailid},function(err,data){
        if(data != null)
        {
            var hashpass = sha512(req.body.passwd,data.Salt);
            if(data.HashPassword == hashpass.passwordHash)
            {
                questions_arr = ["what is c++ ?","what is reactjs ?"];
                answers_arr = ["tech.mp4","No Copyright, Copyright Free Videos, Motion Graphics, Movies, Background, Animation, Clips, Download.mp4","tech.mp4"];
                //questions_arr = [];
                //answers_arr = [];
                var q = " ";
                var a = " ";
                req.session.email = req.body.emailid;
                //console.log(req.session.email);
                db.collection('categories').findOne({EmailId : req.body.emailid},function(err,data1){
                    if(data1 != null)
                    {  
                        var cat_arr = data1.Category;
                     db.collection('questions').find({}).forEach(function(doc){
                            
                                for(var i=0 ; i<cat_arr.length ; i++)
                                {
                                   var question = doc.Question;
                                    if(question.indexOf(cat_arr[i]) > -1)
                                    {

                                        /*db.collection('answers').findOne({QuestionTag : question},function(err,data2){
                                            if(data2 != null)
                                            {
                                                var answer = data2.FileName; 
                                                questions_arr.push(question);
                                                answers_arr.push(answer);
                                                console.log(questions_arr);
                                            }
                                        });*/
                                        
                                                console.log(answers_arr);
                                    }
                                }
                        });
                        //res.render("home" , {signupmsg : signupmsg , usermsg : usermsg , passwdmsg : passwdmsg});
                        res.render("mainpage", {uname : data.DisplayName, ans : answers_arr, ques  : questions_arr});
                    }
                    else
                    {
                        res.render("select_categories");
                    }
                });
            }
            else
            {
                passwdmsg = "Invalid Password";
                usermsg = null;
                signupmsg = null;
                console.log("invalid password");
                res.render("home",{passwdmsg : passwdmsg, usermsg : usermsg , signupmsg : signupmsg});
            }
        }
        else
        {
            usermsg = "Invalid EmailId";
            passwdmsg = null;
            signupmsg = null;
            console.log("invalid email");
            res.render("home",{usermsg : usermsg , passwdmsg : passwdmsg , signupmsg : signupmsg});
        }
   }); 
});

app.post("/logout",urlencodedParser,function(req,res){
        req.session.destroy();
    usermsg = null;
    signupmsg = null;
    passwdmsg = null;
    res.render("home",{usermsg : usermsg , passwdmsg : passwdmsg , signupmsg : signupmsg});
});

app.post("/mainpage",urlencodedParser,function(req,res){
    questions_arr = ["what is use of jquery ?","which is better django or node.js ?","how to upload file in mvc ?"];
    answers_arr = ["tech.mp4","No Copyright, Copyright Free Videos, Motion Graphics, Movies, Background, Animation, Clips, Download.mp4","tech.mp4"];
        var uname = "";
    db.collection("users").findOne({EmailId : req.session.email},function(err,data){
            if(data != null)
            {
                uname = data.DisplayName;
            }
    });
    var arr = req.body.category_select;
    var result = [];
    var count = 0;
    for(var i=0 ; i<arr.length ; i++)
    {
        result.push(arr[i]);
    }
    //console.log(result);
    //console.log("all items added");
    var category = new selectcat();
    category.EmailId = req.session.email;
    category.Category = result;
    category.save();

    res.render("mainpage", {uname : uname , ques : questions_arr , ans : answers_arr});
});

app.post("/question_added",urlencodedParser,function(req,res){
    questions_arr = ["what is use of jquery ?","which is better django or node.js ?","how to upload file in mvc ?"];
    answers_arr = ["tech.mp4","No Copyright, Copyright Free Videos, Motion Graphics, Movies, Background, Animation, Clips, Download.mp4","tech.mp4"];
    var uname = "";
    db.collection("users").findOne({EmailId : req.session.email},function(err,data){
            if(data != null)
            {
                uname = data.DisplayName;
            }
    });
    var qdata = req.body.ask_question;
    //console.log(qdata);
    var addquestiontodb = new addquestion();
    addquestiontodb.EmailId = req.session.email;
    addquestiontodb.Question = qdata;
    addquestiontodb.save();
    res.render("mainpage", {uname : uname , ques : questions_arr, ans : answers_arr});
});

app.post("/upload_file",urlencodedParser,function(req,res){
    questions_arr = ["what is use of jquery ?","which is better django or node.js ?","how to upload file in mvc ?"];
    answers_arr = ["tech.mp4","No Copyright, Copyright Free Videos, Motion Graphics, Movies, Background, Animation, Clips, Download.mp4","tech.mp4"];
    var uname = "";
    console.log(req.session.email);
    var que = req.body.question;
    db.collection("users").findOne({EmailId : req.session.email},function(err,data){
            if(data != null)
            {
                uname = data.DisplayName;
            }
    });
    var file = __dirname + "/uploads/" + req.files.uploadfile.name;
    fs.readFile(toString(req.files.uploadfile.path), function(err, data){
          
        fs.writeFile(file, data,function(err){
            if(err){
                console.log(err);
            }else{
                console.log("file uploaded successfully");
            }
        });
    });
    let fname = req.files.uploadfile;
    console.log(fname.name);
    
    var addans = new addanswer();
    addans.EmailId = req.session.email;
    addans.QuestionTag = que;
    addans.FileName = req.files.uploadfile.name;
    addans.save();
    res.render("mainpage",{uname : uname,ques : questions_arr, ans : answers_arr});
});

app.listen(3000);