//@ts-check
"use strict";
require("dotenv").config();
const express = require("express")
    , mongo = require("mongodb")
    , path = require("path")
    , hbs = require("hbs")
    , morgan = require("morgan")
    , flash    = require("connect-flash")
    , session = require("express-session")
    , MongoStore = require("connect-mongo")(session)
    , passport = require("passport")
    , LocalStrategy = require("passport-local").Strategy
    , bodyParser = require("body-parser")
    , bcrypt = require("bcrypt-nodejs")
    , pollarbear = require("./app/pollarbear");

const url = "mongodb://" + process.env.DBUSR + ":" + process.env.DBPW + "@" + process.env.DB_URI;
const client = mongo.MongoClient;

client.connect(url, function(err, db) {
    if (err) {
        throw err;
    }
    
    let app = express();
    app.use(express.static(path.join(__dirname, "static")));
    app.use(morgan("tiny"));
    app.set("port", (process.env.PORT || 5000));
    app.set("view engine", "html");
    app.set("views", path.join(__dirname, "views"));
    hbs.registerPartials(path.join(__dirname, "views/partials"));
    app.engine("html", hbs.__express);

    app.use(bodyParser.urlencoded({extended: true}));
    app.use(flash());
    app.use(session({
        secret: "myDirtyLittleSecret"
        , resave: false
        , saveUninitialized: false
        , store: new MongoStore(
                    {
                        db: db
                        , collection: "pollSessions"
                    }
                )
        , cookie: { maxAge: 60 * 60 * 1000 }
    }));

    passport.use("local-login", new LocalStrategy(
        {passReqToCallback: true},
        function(req, username, password, done) {
            db.collection("pollUsers").findOne({user: username}, function(err, user) {
                if (err) {console.log(err); return done(err);}
                if (!user) {
                    return done(null, false, req.flash("loginMessage", "User " + username + " could not be found!" ))
                }
                if (!bcrypt.compareSync(password, user.password)) {
                    return done(null, false, req.flash("loginMessage", "Invalid username or password.")); 
                }
                return done(null, user);
            })
        }));

    passport.use("local-signup", new LocalStrategy(
        {passReqToCallback: true},
        function(req, username, password, done) {
            db.collection("pollUsers").findOne({user: username}, function(err, user) {
                if (err) {
                    console.log(err);
                    return done(err);
                }
                if (user) {
                    return done(null, false, req.flash("loginMessage", "Username already exists. Please choose another one."));
                }
                const newUser = {user: username, password: bcrypt.hashSync(password, bcrypt.genSaltSync(8))};
                db.collection("pollUsers").insertOne(newUser);
                return done(null, newUser, req.flash("loginMessage", newUser.username + " is now a member!"))
            })
        }
    ))
        
    passport.serializeUser(function(user, done) {
        done(null, user.user)
    })

    passport.deserializeUser(function(user, done) {
        db.collection("pollUsers").findOne({user: user}, function (err, user) {
            if (err) { return done(err); }
            done(null, user);
        });
    });

    app.use(passport.initialize());
    app.use(passport.session());
    
    app.listen(app.get("port"), function() {
        console.log("Node app is running on port", app.get("port"));
    });

    pollarbear(app, db, passport);
})
