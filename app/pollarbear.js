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
        let i = 0;
        let answers = [];
        console.log(req.body)
        while (req.body["answer" + i]) {
            let newAnswer = {"answer": req.body["answer" + i], "count": 0};
            answers.push(newAnswer);
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
                let user = req.session.passport.user || false;
                if (err) return res.render("error", {message: err});
                res.render("poll", {poll: poll.value, user: user, isOwner: poll.value.owner === user})
                // res.redirect("/polls/" + poll.value.slug);
        })
    })

    app.post("/edit/:pollSlug", function(req, res) {
        let answers = [];
        let i = 0;
        while (req.body["answer" + i]) {
            answers.push(
                {
                    answer: req.body["answer" + i],
                    count: req.body["count" + i]
                }
            );
            i++;
        }
        db.collection("polls").findOneAndUpdate(
            {slug: req.params.pollSlug},
            {$set: 
                {
                    pollQuestion: req.body["poll-question"],
                    slug: slug(req.body["poll-question"]),
                    answers: answers
                }
            },
            {returnOriginal: false},
            function(err, poll) {
                if (err) return res.render("error", {message: err});
                res.render("poll", {poll: poll.value})
            }
        )
    })

    // app.post("/update/:pollSlug", function(req, res) {
    //     db.collection("polls").findOne(
    //         {slug: req.params.pollSlug},
    //         {_id: 0, owner: 0, slug: 0, pollQuestion: 0},
    //         function(err, answers) {
    //             if (err) return res.render("err", {message: err});
    //             let newAnswers = [];
    //             let i = 1;
    //             while (req.body["answer" + i]) {
    //                 if (i > answers.length) {
    //                     newAnswers.push(
    //                         {
    //                             answer: req.body["answer" + i],
    //                             count: 0
    //                         }
    //                     )
    //                 } else if (answers.find(function(ans) {return ans.answer === req.body["answer" + i]}) === undefined) {
    //                     newAnswers.push(
    //                         {
    //                             answer: req.body["answer" + i],
    //                             count: answers[i-1].count
    //                         }
    //                     )
    //                 }
    //                 i++;
    //             }
    //             db.collection("polls").findOneAndUpdate(
    //                 {slug: req.params.pollSlug},
    //                 {
    //                     $set: {answers: newAnswers}
    //                 },
    //                 {returnOriginal: false},
    //                 function(err, poll) {
    //                     if (err) return res.render("error", {message: err})
    //                     res.render("poll", {poll: poll.value})
    //                 }
    //             )
    //         }
    //     )       
    // })

    app.get("/polls/:pollSlug", function(req, res) {
        console.log(req.session)
        let user = false;
        if (req.session.passport) { user = req.session.passport.user };
        db.collection("polls").findOne({slug: req.params.pollSlug},
            function(err, poll) {
                if (err) {
                    return res.render("error", {message: "ERROR: " + err});
                }
                return res.render("poll", {poll: poll, user: user, isOwner: poll.owner === user});
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