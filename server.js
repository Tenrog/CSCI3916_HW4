/*
CSC3916 HW2
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var rp = require('request');
var User = require('./Users');
var Review = require('./Reviews')
var Movie = require('./Movies');
var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});
router.route('/movies')
    .get(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            Movie.find({}, function (err, movies) {
                if (err) {
                    res = res.status(400);
                    return res.json(err);
                }
                console.log(movies);
                res = res.status(200);
                if (req.get('Content-Type')) {
                    res = res.type(req.get('Content-Type'));
                }
                res.json(movies);
            })
        }
    )
    .delete(authJwtController.isAuthenticated, function(req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                res = res.type(req.get('Content-Type'));
            }
            Movie.findOneAndDelete({title: req.body.title}, function (err){
                if (err) {
                    res = res.status(400);
                    return res.json(err);
                }

                res.json({success: true, msg: 'Successfully Deleted A Movie.'})
            })
        }
    )

    .put(authJwtController.isAuthenticated, function(req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                res = res.type(req.get('Content-Type'));
            }
            Movie.findOneAndUpdate({title: req.body.title}, {genre: req.body.genre}, function (err){
                if (err) {
                    res = res.status(400);
                    return res.json(err);
                }
                res.json({success: true, msg: 'Successfully Changed The Genre.'})
            })
        }
    )

    .post(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        res = res.status(200);
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }

        let movie = new Movie();
        movie.title = req.body.title;
        movie.year = req.body.year;
        movie.genre = req.body.genre;
        movie.actors = req.body.actors;



        movie.save(function (err) {
                if (err) {
                    res = res.status(400);
                    return res.json(err);
                }
                res.json({success: true, msg: 'Successfully Added A Movie.'})
            }
        )
    })

router.route('/movies/:title')
    .get(function(req, res) {
        let reviews_param = req.query.reviews;
        Movie.findOne({title: req.params.title}, function(err, movie){

            if(err){
                res.status(400);
                console.log('Error in function')
                return res.json(err);
            }
            console.log(movie);
            res.status(200);

            if(movie === null){
                res.status(400);
                return res.json("Movie with title " + req.params.title + " does not exist.");
            }

            if (req.get('Content-Type')) {
                res.type(req.get('Content-Type'));
            }

            if (reviews_param==="true"){
                Movie.aggregate([
                    {
                        $match: {  title: req.params.title }
                    },
                    {
                        "$lookup": {
                            "from": "reviews",
                            "localField": "title",
                            "foreignField": "movie",
                            "as": "Reviews"
                        }
                    }
                ]).exec(function(err, results){
                    res.json(results);
                })
                console.log("show reviews true");
            }

            else {
                res.json(movie);
            }
        })
    })

router.route('/movies/:title/reviews')
    .get(function (req, res) {
        let reviews_param = req.query.reviews;
        Movie.findOne({title: req.params.title}, function(err, movie){

            if(err){
                res.status(400);
                console.log('Error in function')
                return res.json(err);
            }
            console.log(movie);
            res.status(200);

            if(movie === null){
                res.status(400);
                return res.json("Movie with title " + req.params.title + " does not exist.");
            }

            if (req.get('Content-Type')) {
                res.type(req.get('Content-Type'));
            }

            if (reviews_param==="true"){
                Movie.aggregate([
                    {
                        $match: {  title: req.params.title }
                    },
                    {
                        "$lookup": {
                            "from": "reviews",
                            "localField": "title",
                            "foreignField": "movie",
                            "as": "Reviews"
                        }
                    }
                ]).exec(function(err, results){
                    res.json(results);
                })
                console.log("show reviews true");
            }

            else {
                res.json(movie);
            }
        })
    })
    .post(authJwtController.isAuthenticated, function (req, res) {
        let reviews_param = req.query.reviews;
        Movie.findOne({title: req.params.title}, function (err, movie) {


            let review = new Review();
            review.reviewer = req.body.reviewer;
            review.movie = req.body.movie;
            review.comment = req.body.comment;
            review.rating = req.body.rating;
            Movie.exists({title: review.movie}).then(movieExists => {
                    console.log("movie exists?:")
                    console.log(movieExists)
                    if (movieExists) {

                        review.save(function (err) {
                            if (err) {
                                res = res.status(400);
                                return res.json({success: false, msg: 'Hit save error'});
                                return res.json(err);
                            }
                            res.json({success: true, msg: 'Successfully added review.'});
                        })
                    } else {
                        res = res.status(400);
                        res.json({success: false, msg: "Didn't find movie with title " + review.movie});

                    }
                }
            )
        })
    })




app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


