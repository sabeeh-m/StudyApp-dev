var express= require ("express");
var app= express();
var passport   = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var bodyParser= require("body-parser");
app.use(bodyParser.urlencoded({extended:true }));
app.use(bodyParser.json())
app.use(express.static('public'));
var session = require("express-session");
const FileStore = require('session-file-store')(session);
var cookieParser=require("cookie-parser")
var flash = require("connect-flash");
var crypto    = require('crypto');
app.use(session({
  store: new FileStore(),    
  secret: 'keyboard cat',
  saveUninitialized:false,
  resave:false
}))
app.use(cookieParser('keyboard cat'));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

var mysql = require("mysql");
var connection= mysql.createConnection({
    
    host:"localhost",
    user:"sabeeh411",
    database:"drafthome"
    })
    
var nodemailer= require("nodemailer")    

// passport configuration
passport.use(new LocalStrategy(
  { usernameField: 'email' ,
      passwordField: "password",
      passReqToCallback:true
  },
  function(req,username, password, done) {
    if(!username || !password){return done(null,false,req.flash("error","Username or password can not be empty")) }
    else{
    connection.query("select * from users where email =?",[username],function(err,rows){
        
        if(err){
            req.flash("error","Unexpected Database Error")
                   }else {
            if(!rows.length){
                
                return done(null,false,req.flash("error","The typed email does not exist") )
                
            } else {
                var dbpass=rows[0].password;
                if(!(dbpass===password)){
                    
                    return done(null,false,req.flash("error","Wrong Password"))
                    
                }  else{
                    return done(null,rows[0],req.flash("success","welcome back "+rows[0].first_name+" "));
                                   }
            }
        }
        
    } )
    }
  }
));


passport.serializeUser(function(user,done){
    done(null,user.id)
    })

passport.deserializeUser(function(id, done){
    connection.query("select * from users where id = "+ id, function (err, rows){
        done(err, rows[0]);
    });
});


app.use(function(req,res,next){
    res.locals.currentUser= req.user;
    res.locals.error=req.flash("error");
    res.locals.success=req.flash("success");
    
       
    next();
    })


var transporter= nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    service:'gmail',
    auth:{
        user: 'sabeehnawab@gmail.com',
        pass: '--------'
    }
    
    
})


app.get("/",function(req,res){
                res.render("home.ejs");    
            })

app.get("/addcourse",function(req,res){
    var query="select id,name   from drafts where user = '" +req.user.id+"'"
       connection.query(query,function(err,results){
              if(err){
            res.redirect("/profile")
            console.log(err)
            
        }else if(!results.length>0){
            
            req.flash("error","Please Create a Draft First");
            res.redirect("/profile")
            
        } else {
            
                res.render("addcourse.ejs",{drafts:results})        
                    }
            })
    })

app.post("/course",function(req,res){
    var draftid= req.body.draftname;
    var course= {
        
        user_id: req.user.id,
        course_name: req.body.coursename,
        course_department: req.body.coursedepartment,
        university_name: req.body.universityname,
        course_language: req.body.courselanguage,
        course_intake:  req.body.courseintake,
        course_city:    req.body.coursecity,
        course_country: req.body.coursecountry,
        course_deadline: req.body.coursedeadline,
        ielts_toefl: req.body.languagetest,
        gre_score: req.body.grescore,
        course_cgpa: req.body.cgpa,
        course_percentage: req.body.percentage,
        additional_notes:  req.body.additionalnotes,
        language_score : req.body.languagescore,
        setPublic: req.body.privacy
    };
    
    var query="insert into courses SET ? ";
    connection.query(query,course,function(err,results){
        
        if(err){
            
            console.log(err);
            req.flash("error","You have encountered an unexpected error, please try again")
            res.redirect("/profile")
        }
            else {
               console.log(results.insertId)
                var draftcourse={
                    draft_id:draftid,
                    course_id: results.insertId,
                    created_by: req.user.id
                                   }
                
                var query= "insert into draftCourse set ?";
                connection.query(query,draftcourse,function(err, results) {
                    if(err){
                        
                        console.log(err)
                        req.flash("error","You have encountered an unexpected error, please try again")
                        res.redirect("/profile")
                        
                    } else if(results){
                        
                        req.flash("success","you have successfully added the course ");
                        res.redirect("/profile")
                        console.log(results);
                    }
                    
                })
            }
    })
})
app.get("/signup",function(req,res){
        res.render("adduser.ejs")
    
    })

app.get("/login",function(req,res){
        res.render("login.ejs")
    })
    
app.get("/profile",isAuthenticated,function(req,res){
 
                    
 
        var user=req.user.id
        var query="select * from drafts where user = ? limit 5 ";
        connection.query(query,user,function(err,results){
            
            if(err){
                console.log(err)
                req.flash("error","please sign in to continue")
                res.redirect("/login")
            }
            
                else if(results.length>0) {
                    
                
 
 
                res.render("profile.ejs",{id:req.user.id, drafts:results})

                    
                    
                    
                                
                    } else{
                    res.render("profile.ejs",{id:req.user.id,drafts:null })
                                    }
        })
    })




app.post("/login",isActivated,passport.authenticate("local",{
    successRedirect: "/profile",
    failureRedirect: "/login",
    
}),

function(req,res){
    console.log(req.user.id)
    res.send("authenticated Request")
    })

app.get("/",function(req,res){
    
    res.render("adduser.ejs")
    })

app.get("/user/:id/activate",function(req,res){
    
    var query = "select user_id as activatingid from user_att_table where hashvalue = ?"
    var hashvalue=req.params.id;
    connection.query(query,hashvalue,function(err,results){
        
        if(err){
            console.log(err)
            req.flash("error","please register first")
            res.redirect("/signup")
            
        }
        else{
            var activatingid= results[0].activatingid
            var query="update user_att_table set isActivated = ? where user_id = ?"
            var params= [];
            params.push(1)
            params.push(activatingid)
            
            
            connection.query(query,params,function(err,results){
                
                if(err){
                    console.log(err)
                }else {
                    req.flash("success","Account avtivated successfully. Please login")
                    res.redirect("/")
                    
                }
                
            })
            
            
            
        }
        
        
    })
    
    
    
})


app.post("/signup",function(req,res){
    
    var userEmail= req.body.email;
    var user = {
     first_name : req.body.first_name,
     last_name: req.body.last_name,
     email : req.body.email,
     password: req.body.password    
        };
    
    connection.query("Select * from users where email = '" +user.email+ "'",function(err,rows){
        
        if(err){
            console.log(err)
            res.redirect("/signup")
            
        } else if(rows.length>0){
                
                req.flash("error","email is already registered")
                res.redirect("/signup")
                }  else {
                    var useremail
    var query= "insert into users SET ? ";
    connection.query(query,user,function(err,results){
        if (err){
            res.redirect("/signup")        
            console.log(err)
        } else{
            
            var hashvalue=generateRandomserial();
            var refid= results.insertId;
            console.log(results)
            
            var userAtt={
                
                user_id:refid,
                hashvalue:hashvalue
                            }
            
            query= "insert into user_att_table SET ?"
            
            connection.query(query,userAtt,function(err,results){
                
                if(err){
                    
                    console.log(err)
                    
                }else {
                    sendRegMail(userEmail,hashvalue);
                    
                        req.flash("success","Registration successfull, please activate your account to continue") 
            console.log(results);
            res.redirect("/")   
                    
                    
                    
                }
                
                
                
                
            })
            
            
                    }
    })
            }
    })
})




app.get("/drafts/new",function(req,res){
        res.render("adddraft.ejs");
    })

app.post("/drafts",function(req,res){
    var d= new Date();    
    var draft={
        name: req.body.name,
        user : req.user.id,
        created_at: d
    }
    
    var query= "insert into drafts SET ?";
    
    connection.query(query,draft,function(err,results,fields){
        
        if(err){
            console.log(err)
            res.redirect("/profile")
        } else  {
            console.log(results[0]);
            req.flash("success","Draft created successfully")
            res.redirect("/profile")
        }
    })
})



app.get("/drafts/view/",function(req,res){
    
        var totalrecords= 0;
        var limitperpage=5
        var pagenumbers=0;
        
        var currentpage=1;
        var offset=0;
        connection.query("select count(*) as  totalpages from drafts",function(err,results){
        
        if(err){
            console.log(err)
        } else {
            totalrecords= parseInt(results[0].totalpages)
             limitperpage=5
             pagenumbers=Math.ceil(totalrecords/limitperpage);
            if(typeof req.query.page!== "undefined"){
                currentpage=req.query.page
            }        
            if(currentpage>1){
                offset=((currentpage-1)*limitperpage)
            }
        
        var query="select * from drafts  limit  ?  offset  ? ";
        connection.query(query,[limitperpage,offset],function(err, results) {
        if(err){
            console.log(err);
            res.redirect("/")
        }   else if(results){
            console.log(results)
            res.render("drafts.ejs",{drafts:results,limitperpage:limitperpage,pagenumbers:pagenumbers,currentpage:currentpage})
                    }
            })
                    }
    })
})

app.get("/drafts/user/",function(req,res){
      var totalrecords= 0;
        var limitperpage=5
        var pagenumbers=0;
        var currentpage=1;
        var offset=0;
    connection.query("select count(*) as  totalpages from drafts  where user = ? ",req.user.id,function(err,results){
        if(err){
            console.log(err)
        } else {
            totalrecords= parseInt(results[0].totalpages)
             limitperpage=5
             pagenumbers=Math.ceil(totalrecords/limitperpage);
            if(typeof req.query.page!== "undefined"){
                currentpage=req.query.page
            }        
            if(currentpage>1){
                offset=((currentpage-1)*limitperpage)
            }
        var query="select * from drafts where user = ?  limit  ?  offset  ? ";
        connection.query(query,[req.user.id,limitperpage,offset],function(err, results) {
        if(err){
            console.log(err);
            res.redirect("/")
        }   else if(results){
            console.log(results)
            res.render("userdrafts.ejs",{drafts:results,limitperpage:limitperpage,pagenumbers:pagenumbers,currentpage:currentpage})
        }
            })
        }
    })
})
app.get("/drafts/view/:id",function(req,res){
    var query= "select * from drafts where id ='"+req.params.id+"'"
    connection.query(query,function(err,draft){
        if(err){
            console.log(err)
        } else {
            var query="select course_name,course_department,university_name,course_language,course_intake from draftCourse inner join courses on draftCourse.course_id=courses.id where draft_id= '"+req.params.id+"'";                                                       
            connection.query(query,function(err,results){
                if(err){
                    console.log(err)
                } else {res.render("viewdraft.ejs",{draftcontent:results, draft:draft})
                }
                            })
        }
    })
})

app.get("/logout",function(req,res){
    req.logout();
    req.flash("success","you have been logged out!");
    res.redirect("/")
})
app.get("/courses",function(req,res){
        var totalrecords= 0;
        var limitperpage=5
        var pagenumbers=0;
        var currentpage=1;
        var offset=0;
    var query="select count(*) as totalcourses from courses" 
    connection.query(query,function(err,results){
        if(err){
            console.log(err)
        } else{
            var query = "select * from courses limit ? offset ?"
            totalrecords=parseInt(results[0].totalcourses);
            pagenumbers=Math.ceil(totalrecords/limitperpage);
            if(typeof req.query.page!= "undefined"){
                currentpage=req.query.page
            }
            if(currentpage>1){
                offset=((currentpage-1)*limitperpage)
            } 
            if(typeof req.query.search != "undefined"){
                query="select * from courses where "     
                 Object.keys(req.query.search).forEach(function(key){
                 query+= key + " = "+ parseInt(req.query.search[key]);
                 })
                 query += " limit ? offset ?";
            } 
            connection.query(query,[limitperpage,offset],function(err,courses){
                console.log(query)
                if(err){
                    console.log(err)
                    req.flash("error","invalid search")
                    res.redirect("/courses" )
                } else {
                  console.log(req.query.search)
                    res.render("courses.ejs",{query:req.query,courses:courses,limitperpage:limitperpage,pagenumbers:pagenumbers,currentpage:currentpage})
                }
                            })
        }
    })
})
app.get("/courses/results/",function(req,res){
        var totalrecords= 0;
        var limitperpage=5
        var pagenumbers=0;
        var currentpage=1;
        var offset=0;
        var url=req.path;
        req.params.cgpa= req.query.course_cgpa;
        var cgpa=req.params.cgpa;
            var country;
            var department;
            console.log(req.query.body)
    var  query ="select  count(*) as totalcourses from courses where setPublic = ?  "
    var searchFilters= ["true"];
                if(typeof req.query.course_cgpa!="undefined"){
                    query+= " And course_cgpa = ?"
                    searchFilters.push(req.query.course_cgpa)
                }
                if(typeof req.query.course_country!="undefined"){
                    query+= " And course_country = ?"
                    searchFilters.push(req.query.course_country)
                }
                if(typeof req.query.course_department!="undefined"){
                    query+= " And course_department = ?"
                    searchFilters.push(req.query.course_department)
                }
            connection.query(query,searchFilters,function(err,results){
                console.log("1st q== " +query)
                if(err)
                {console.log(err)} else if(results) {
                    
            totalrecords=parseInt(results[0].totalcourses);
            pagenumbers=Math.ceil(totalrecords/limitperpage);
            console.log(totalrecords)
            console.log(req.query.page)
            if(typeof req.query.page!= "undefined"){
                currentpage=req.query.page
            }
            if(currentpage>1){
                offset=((currentpage-1)*limitperpage)
            } console.log("page query== "+req.query.page)
                var searchFilters= ["true"];
                var query ="select  *  from courses where setPublic = ?   "
                if(typeof req.query.course_cgpa!="undefined"){
                    query+= " And course_cgpa = ?"
                    searchFilters.push(req.query.course_cgpa)
                }
                if(typeof req.query.course_country!="undefined"){
                    query+= " And course_country = ?"
                    searchFilters.push(req.query.course_country)
                }
                
                if(typeof req.query.course_department!="undefined"){
                    query+= " And course_department = ?"
                    searchFilters.push(req.query.course_department)
                }
                searchFilters.push(limitperpage);
                searchFilters.push(offset);
                query+=" limit ? offset ?"
                var url =req.originalUrl;    
                var end;
                if(typeof req.query.page!= "undefined"){
                    end= url.indexOf("&p")
                    console.log("index of &p"+  url.indexOf("&page"))
                } else {
                    end= url.length;
                    
                }
                console.log("end: "+end)
              var blob=req.path+ url.substring(17,end);
              console.log("substring test: "+url.substring(17,end))
                console.log("here is the blob "+blob)
                connection.query(query,searchFilters,function(err,results){
                    console.log("final query "+query)
                    if(err ){console.log(err)} else{
                     res.render("result.ejs",{blob:blob, courses:results,limitperpage:limitperpage,pagenumbers:pagenumbers,currentpage:currentpage })     
                                    }
                                })
                            }
                       })
             })
 app.get("/search/courses",function(req,res){
        var passingdata=""
     var searchword=req.query.q + "%"
     console.log("req.query: "+req.query)
     console.log("final : " +req.query.q+"%")
     var query = "select id, course_name from courses where course_name like ? limit 5"
    var url= req.originalUrl;
     connection.query(query,searchword,function(err,results){
         if(err){
             console.log(err)
         }
           else if(req.xhr){
            console.log(JSON.stringify(results))
               res.json(results)
           }
     })
 })   

app.get("/courses/user",function(req,res){
      var totalrecords= 0;
        var limitperpage=5
        var pagenumbers=0;
        var currentpage=1;
        var offset=0;
    var query="select count(*) as totalcourses from courses where user_id = ?" 
    connection.query(query,req.user.id,function(err,results){
        if(err){
            console.log(err)
        } else{
            totalrecords=parseInt(results[0].totalcourses);
            pagenumbers=Math.ceil(totalrecords/limitperpage);
            if(typeof req.query.page!= "undefined"){
                currentpage=req.query.page
            }
            if(currentpage>1){
                offset=((currentpage-1)*limitperpage)
            } 
                query="select * from courses where user_id = ? limit ? offset ?"                              
                connection.query(query,[req.user.id,limitperpage,offset],function(err,courses){
                console.log(query)
                if(err){
                    console.log(err)
                    res.redirect("/courses" )
                } else {
                    res.render("usercourses.ejs",{courses:courses,limitperpage:limitperpage,pagenumbers:pagenumbers,currentpage:currentpage})
                }
                            })
        }
    })
})


app.get("/courses/:id",function(req,res){
    var query= "select * from courses where id = ?"
    connection.query(query,req.params.id,function(err,results){
        if(err){
            console.log(err)
        } else {
            res.render("courseview.ejs",{courses:results})
        }
    })
})
app.get("/courses/:id/addtodraft",function(req,res){
    connection.query("select * from drafts where id = ?",req.user.id,function(err,draft){
            if(err){
            console.log(err)
        }
        else{
                res.render("addtodraft.ejs",{courseid:req.params.id,drafts:draft});        
                    }
    } )
})
app.post("/courses/:id/",function(req,res){
    connection.query("select user_id as courseuser from courses where id = ? ",req.params.id,function(err,result){
        console.log("draft id: " +req.body.draftname);
        if(err){
            console.log(err)
        } else{
                                var course_id= req.params.id;
                                var draft_id= parseInt(req.body.draftname);
                                var created_by = result[0].courseuser;
                                var dataitem={draft_id: draft_id,course_id:course_id,created_by:created_by}  
                                connection.query("insert into draftCourse SET ?",dataitem,function(err,data){
                                    if(err){console.log(err)} else{
                                        res.redirect("/profile");
                                    }
                                } )
        }
    })
})

function generateRandomserial(){
    
    var characters= ["A","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9","@","$","-","_"];
    
    var randomSerial= "";
    for (var i=0; i<12; i++){
    var number = Math.floor(Math.random() * Math.floor(characters.length-1));     
        randomSerial+=characters[number]
        
    }
    
    return randomSerial;
    
    
    
}

function sendRegMail(email,hash){
    var activationLink= "https://project-study-anywhere-sabeeh411.c9users.io/user/" +hash +"/activate" 
    var mailOptions = {
  from: 'sabeehnawab@gmail.com',
  to: email,
  subject: 'Activation Link',
  text: 'Dear User, You have successfully registered. Please activate your account to continue with access. Click the following link to activate ' + activationLink
};
 
                    transporter.sendMail(mailOptions,function(error,info){
                        
                        if(error){console.log(error) } else { console.log("email sent "+ info)
                            
                        }
                        
                        
                    })
    
    
    
    
}

function isAuthenticated(req,res,next){
    
    
    
    
    if(req.isAuthenticated()){
        return next();
    } 
        res.redirect("/login")
        }

function isActivated(req,res,next){
 currentUser=req.User
 var query=""   
 var qParam= []
    if(typeof currentUser!="undefined"){
       query = "select id, isActivated from users join user_att_table on users.id=user_att_table.user_id where users.id = ?"
        qParam.push(currentUser.id)
        console.log(query)
    }else if(typeof currentUser =="undefined"){
       query = "select isActivated from users inner join user_att_table on users.id=user_att_table.user_id where users.email = ?"
        qParam.push(req.body.email)
        console.log(query)
        
        
    }
    
    
    connection.query(query,qParam,function(err,results){
        
        if(err){
            console.log(err)
            res.redirect("back")
            
        }else {
            console.log(results[0])
            if(results[0].isActivated ==1){
                console.log(results)
                next();
                
            } else {
                req.flash("error","please activate your account to continue")
                res.redirect("back")
                
                
            }
            
            
        }
        
        
        
    })
    
    
}

function retrieveEmail(req,res,id){
    var email =""
    var query= "select email  from users where id = ?"
    connection.query(query,id,function(err,results){
        if(err){
            res.redirect("/signup")
            
        } else {
            
            console.log(results[0].email)
            email=results[0].email
            
            
        }
        
        return email;
        
    })
    
    
    
    
    
}
app.listen(process.env.PORT,process.env.IP,function(){
    console.log("Study App is Running")
})