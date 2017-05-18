//@ts-check 
"use strict";
const slug = require("slug");

module.exports = function(app, db, passport) {

    app.get("/", function(req, res) {
        let user = false;
        if (req.session.passport) {
            user = req.session.passport.user;
        }
        db.collection("polls").find({}, {_id: 0, pollQuestion: 1, slug: 1}).toArray(function(err, polls) {
            if(err) return console.error(err);
            res.render("index", {user: user, polls: polls});
        })
    });

    app.get("/login", function(req, res) {
        res.render("index");
    })

    app.post("/login", function(req, res, next) {
        passport.authenticate("local-login", function(err, user, info){
            if (err) {
                return res.render("index", {loginMessage: err});
            }
            if (!user) {
                return res.render("index", {loginMessage: req.flash("loginMessage")});
            }
            req.logIn(user, function(err){
                if (err) {
                    return res.render("index", {loginMessage: err});
                }
                return res.redirect("user");
            })
        })(req, res, next)
    });

    app.post("/signup", function(req, res) {
        passport.authenticate("local-signup", function(err, user, info) {
            if (err) {
                return res.render("index", {loginMessage: err});
            }
            if (!user) {
                return res.render("index", {loginMessage: req.flash("loginMessage")});
            }
            req.logIn(user, function(err) {
                if(err) {
                    return res.render("index", {loginMessage: err});
                }
                return res.redirect("user");
            })
        })(req, res)
    });

    app.post("/createpoll", function(req, res) {
        const user = req.session.passport.user;
        let i = 1;
        let answers = [];
        while (req.body["option" + i]) {
            answers.push(req.body["option" + i]);
            i ++;
        }
        const newPoll = {
            owner: user,
            pollQuestion: req.body["poll-question"],
            slug: slug(req.body["poll-question"]),
            answers: answers,
        };
        db.collection("polls").insertOne(newPoll);
        res.redirect("user");
    })

    app.get("/polls/:pollQuestion", function(req, res) {
        db.collection("polls").findOne({slug: req.params.pollQuestion}, {_id: 0},
            function(err, poll) {
                if (err) {
                    return res.render("error", {message: "ERROR: " + err});
                }
                return res.render("poll", {poll: poll});
            })
    })

    app.get("/user", function(req, res){
        if (!req.session.passport) {
            return res.redirect("/");
        }
        const uid = req.session.passport.user || null;
        db.collection("pollUsers").findOne({user: uid}, {_id: 0, pollQuestion: 1, slug: 1}, function(err, user) {
            if (err) {
                return res.render("error", {message: "ERROR: " + err});
            }
            if (user) {
                let userPolls = [];
                db.collection("polls").find({owner: uid})
                    .toArray(function(err, polls) {
                        if (err) {
                            console.error(err);
                            return res.render("error", {message: err});
                        }
                        userPolls = polls;
                        res.render("user", {user: uid, polls: polls})
                    })
            } else {
                console.warn("No user found with id " + user);
                res.redirect("/")
            }
        })
    })
}