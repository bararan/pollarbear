//@ts-check 
"use strict";
const slug = require("slug");

const isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

module.exports = function(app, db, passport) {

    app.get("/", function(req, res) {
        const user = req.isAuthenticated() ? req.user.user : false;
        db.collection("polls").find({}, {_id: 0, pollQuestion: 1, slug: 1}).toArray(function(err, polls) {
            if(err) return console.error(err);
            res.render("index", {user: user, polls: polls});
        })
    });

    app.get("/login", function(req, res) {
        res.render("index");
    })

    app.get("/polls/:pollSlug", function(req, res) {
        const user = req.isAuthenticated() ? req.user.user : false;
        let message = req.flash("message");
        if (message.length === 0) message = false;
        db.collection("polls").findOne({slug: req.params.pollSlug},
            function(err, poll) {
                if (err) {
                    return res.render("error", {message: "ERROR: " + err});
                }
                return res.render("poll", {poll: poll, user: user, isOwner: poll.owner === user, message: message});
            })
    })

    app.get("/user", isLoggedIn, function(req, res){
        let welcomeMessage = req.flash("welcomeMessage")
        if (welcomeMessage.length === 0) welcomeMessage = false;
        const userName = req.user.user;
        db.collection("pollUsers").findOne({user: userName}, {_id: 0, pollQuestion: 1, slug: 1}, function(err, user) {
            if (err) {
                return res.render("error", {message: "ERROR: " + err});
            }
            if (user) {
                let userPolls = [];
                db.collection("polls").find({owner: userName})
                    .toArray(function(err, polls) {
                        if (err) {
                            console.error(err);
                            return res.render("error", {message: err});
                        }
                        userPolls = polls;
                        res.render("user", {user: userName, polls: polls, welcomeMessage: welcomeMessage})
                    })
            } else {
                console.warn("No user found with id " + user);
                res.redirect("/")
            }
        })
    })

    app.get("/logout", function(req, res) {
        req.logout();
        res.redirect("/");
    })

    app.post("/login", function(req, res) {
        passport.authenticate("local-login", function(err, user, info){
            if (err) {
                return res.render("index", {loginMessage: err});
            }
            if (!user) {
                return res.render("index", {loginMessage: req.flash("loginMessage")});
            }
            req.login(user, function(err){
                if (err) {
                    return res.render("index", {loginMessage: err});
                }
                return res.redirect("user");
            })
        })(req, res)
    });

    app.post("/signup", function(req, res) {
        passport.authenticate("local-signup", function(err, user, info) {
            if (err) {
                return res.render("index", {loginMessage: err});
            }
            if (!user) {
                return res.render("index", {loginMessage: req.flash("loginMessage")});
            }
            req.login(user, function(err) {
                if(err) {
                    return res.render("index", {loginMessage: err});
                }
                return res.redirect("user");
            })
        })(req, res)
    });

    app.post("/createpoll", function(req, res) {
        const user = req.user.user;
        let i = 0;
        let answers = [];
        const pollSlug = slug(req.body["poll-question"], {lower: true});
        db.collection("polls").findOne({slug: pollSlug}, function(err, poll) {
            if (poll) {
                return res.render("index", {loginMessage: "This Poll has already been created. Try a different question", user: user});
            } else {
                while (req.body["answer" + i]) {
                    let newAnswer = {"answer": req.body["answer" + i], "count": 0};
                    answers.push(newAnswer);
                    i ++;
                }
                const newPoll = {
                    owner: user,
                    pollQuestion: req.body["poll-question"],
                    slug: pollSlug,
                    answers: answers,
                };
                db.collection("polls").insertOne(newPoll);
                req.flash("welcomeMessage", "Poll '" + newPoll.pollQuestion + "' created!");
                res.redirect("user");
            }
        })
    })

    app.post("/vote/:pollSlug", function(req, res) {
        db.collection("polls").findOneAndUpdate(
            {
                slug: req.params.pollSlug,
                "answers.answer": req.body.answer
            },
            {
                $inc: {"answers.$.count": 1}
            },
            {returnOriginal: false},
            function(err, poll) {
                if (err) return res.render("error", {message: JSON.stringify(err)});
                req.flash("message", "Thanks for voting.")
                res.redirect("/polls/" + poll.value.slug);
        })
    })

    app.post("/edit/:pollSlug", function(req, res) {
        let answers = [];
        let i = 0;
        while (req.body["answer" + i]) {
            answers.push(
                {
                    answer: req.body["answer" + i],
                    count: parseInt(req.body["count" + i])
                }
            );
            i++;
        }
        db.collection("polls").findOneAndUpdate(
            {slug: req.params.pollSlug},
            {$set: 
                {
                    pollQuestion: req.body["poll-question"],
                    slug: slug(req.body["poll-question"], {lower: true}),
                    answers: answers
                }
            },
            {returnOriginal: false},
            function(err, poll) {
                if (err) return res.render("error", {message: err});
                req.flash("message", "Changes have been successfully saved.");
                res.redirect("/polls/" + poll.value.slug)
            }
        )
    })

    app.post("/delete/:pollSlug", function(req, res) {
        db.collection("polls").findOneAndDelete(
            {slug: req.params.pollSlug},
            function(err, poll) {
                if (err) {return res.render("error", {message: err});}
                if (poll.value.owner != req.user.user) {
                    return res.render("error", {message: "You are not authorized to delete this poll"});
                }
                req.flash("welcomeMessage", "Poll '" + poll.value.pollQuestion + "' successfully deleted.");
                res.redirect("/user");
            }
        )
    })
}