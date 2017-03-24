/**
 * Author: Jeroen
 * Date created: 03-10-16
 */
// use express
var express = require("express");
var support = require("../support");
var router = express.Router();

var movieSchema = require("../model/movie");

/************************************ RATINGS ***********************************/

/**
 * /api/movies/ratings/all
 * Get request to get a list of all movie tt_ids with their average rating
 * Required:
 *  Header:
 *      AuthToken: <authToken>
 */
router.get("/ratings/all", function (req, res) {
    movieSchema.find({average_rating: {$gt: 0}}, {_id: 0, ratings: 0}, support.limit(req), function (err, result) {
        if (err) {
            support.log(err);
            res.status(500).send({error: err.message});
            return;
        }

        support.log("Sending all rated movies.");
        res.status(200).send(result);
    });
});

/**
 * /api/movies/:tt_id/ratings/all
 * Get request to get the average rating of a certain movie
 * Required:
 *  Header:
 *      AuthToken: <authToken>
 */
router.get("/:tt_id/ratings/all", function (req, res) {
    var tt_id = req.params.tt_id;
    movieSchema.find(
        {tt_id: tt_id, average_rating: {$gt: 0}}, {_id: 0, ratings: 0},
        function (err, result) {
            if (err) {
                support.log(err);
                res.status(500).send({error: err.message});
                return;
            }

            if (result.length == 0) {
                support.log("User tried to get the rating of a unknown or not yet rated movie with tt_id: " + tt_id + ".");
                res.status(404).send({error: "Movie not found/yet rated."});
                return;
            }

            support.log("Sending a rated movie with tt_id: " + tt_id + ".");
            res.status(200).send(result[0]);
        });
});

/**
 * /api/movies/ratings
 * Get request to get all the ratings of the authenticated user
 * Required:
 *  Header:
 *      AuthToken: <authToken>
 */
router.get("/ratings", function (req, res) {
    // the username of the logged user
    var username = req.user.username;
    // find ratings which contain an object with the user's username
    movieSchema.find({"ratings.username": username},
        {_id: 0, tt_id: 1, title: 1, publish_date: 1, length: 1, director: 1, description: 1, average_rating: 1,
            "ratings.$.username": username, "ratings.points": 1},
        support.limit(req), function (err, result) {
            if (err) {
                support.log(err);
                res.status(500).send({error: err.message});
                return;
            }

            support.log("User " + username + " gets their rated movies.");
            res.status(200).send(result);
        });
});

/**
 * /api/movies/:tt_id/ratings
 * Get request to get the rating of a certain movie of the logged user
 * Required:
 *  Header:
 *      AuthToken: <authToken>
 */
router.get("/:tt_id/ratings", function (req, res) {
    var username = req.user.username;
    var tt_id = req.params.tt_id;

    // find ratings which contain an object with the user's username
    movieSchema.find({tt_id: tt_id, "ratings.username": username},
        {_id: 0, tt_id: 1, average_rating: 1, "ratings.$.username": username, "ratings.points": 1}, function (err, result) {
            if (err) {
                support.log(err);
                res.status(500).send({error: err.message});
                return;
            }

            // if the movie was not rated by the authenticated user
            if (result.length == 0) {
                support.log("User tried to get their rating of a unknown or not yet rated movie with tt_id: " + tt_id + ".");
                res.status(404).send({error: "Movie not found/yet rated."});
                return;
            }

            support.log("User " + username + " gets their rated movie.");
            res.status(200).send(result[0]);
        });
});

/**
 * /api/movies/:tt_id/ratings
 * Post request to create a new rating for a certain movie
 * Required:
 *  Header:
 *      AuthToken: <authToken>
 *  Body:
 *      {
 *          "points": <1-10>
 *      }
 */
router.post("/:tt_id/ratings", function (req, res) {
    var username = req.user.username;
    var tt_id = req.params.tt_id;

    if (!req.body.points || isNaN(req.body.points)) {
        support.log("User tried to add a rating with wrong body content.");
        res.status(400).send({error: "Invalid body content."});
        return;
    }

    var points = parseInt(req.body.points);

    // check if the amount of points are valid
    if (points < 1 || points > 10) {
        support.log("User tried to add a rating with an unvalid amount of points.");
        res.status(400).send({error: "Amount of points is unvalid."});
        return;
    }

    support.log("\tPreparing to add a rating...");

    // create a rating object
    var rating = {username: username, points: points};

    // find a rating from the authenticated user in the movie's rating array
    movieSchema.find({tt_id: tt_id, "ratings.username": username}, {_id: 1}, function (err, result) {
        if (err) {
            support.log(err);
            res.status(500).send({error: err.message});
            return;
        }

        // the movie was already rated, because the rating should not be found
        if (result.length != 0) {
            support.log("User tried to add a rating to a movie already rated by them.");
            res.status(409).send({error: "Movie already rated."});
            return;
        }

        // get all the ratings to calculate the average
        movieSchema.find({tt_id: tt_id}, {}, function (err, result) {
            if (err) {
                support.log(err);
                res.status(500).send({error: err.message});
                return;
            }

            if (result.length == 0) {
                support.log("User tried to add a rating to an unknown movie.");
                res.status(404).send({error: "Movie not found."});
                return;
            }

            // calculate what will be the average after we add the points
            var sum = points;
            for (var i = 0; i < result[0].ratings.length; i++) sum += parseInt(result[0].ratings[i].points);
            var avg = Math.round(sum / (parseInt(result[0].ratings.length) + 1));

            support.log("\t\tAdding a rating and updating the average...");

            // add the rating to the movie
            movieSchema.findOneAndUpdate({tt_id: tt_id}, {$addToSet: {ratings: rating}, $set: {average_rating: avg}},
                function (err, result) {
                    if (err) {
                        support.log(err);
                        res.status(500).send({error: err.message});
                        return;
                    }

                    support.log("User " + username + " rated movie with tt_id: " + tt_id + ", " + points + " points.");
                    res.status(201).send(rating);
                });
        });
    });
});

/**
 * /api/movies/:tt_id/ratings
 * Put request to edit a rating for a certain movie
 *  Header:
 *      AuthToken: <authToken>
 *  Body:
 *      {
 *          "points": <1-10>
 *      }
 */
router.put("/:tt_id/ratings", function (req, res) {
    var username = req.user.username;
    var tt_id = req.params.tt_id;

    // check if we have our values
    if (!req.body.points || isNaN(req.body.points)) {
        support.log("User tried to edit a rating with wrong body content.");
        res.status(400).send({error: "Invalid body content."});
        return;
    }

    var points = parseInt(req.body.points);

    // check if the amount of points are valid
    if (points < 1 || points > 10) {
        support.log("User tried to edit a rating with an unvalid amount of points.");
        res.status(400).send({error: "Amount of points is unvalid."});
        return;
    }

    // update the amount of points, result returns the old amount of points
    movieSchema.findOneAndUpdate({tt_id: tt_id, "ratings.username": username}, {$set: {"ratings.$.points": points}},
        function (err, result) {
            if (err) {
                support.log(err);
                res.status(500).send({error: err.message});
                return;
            }

            // if the movie was not rated by the authenticated user
            if (!result) {
                support.log("User tried to edit the rating of a movie not rated by them.");
                res.status(404).send({error: "Movie not found/yet rated."});
                return;
            }

            // calculate the new average
            var sum = 0;
            for (var i = 0; i < result.ratings.length; i++) {
                if (result.ratings[i].username != username) sum += parseInt(result.ratings[i].points);
            }

            sum += points;
            var avg = Math.round(sum / result.ratings.length);


            support.log("\tUpdating the average rating...");

            // edit the new average
            movieSchema.findOneAndUpdate({tt_id: tt_id}, {$set: {average_rating: avg}}, function (err, result) {
                if (err) {
                    support.log(err);

                    // revert the change
                    movieSchema.findOneAndUpdate({tt_id: tt_id, "ratings.username": username},
                        {$set: {"ratings.$.points": oldPoints}}, function (err2, result) {
                            if (err2) {
                                /*
                                 * at this point we have invalid database contents until
                                 * the next time the average is calculated for that tt_id
                                 */
                                support.log(err2);
                                return;
                            }

                            support.log("\t\tReverted the rating edit.");

                            // send error why updating the average went wrong
                            res.status(500).send({error: err.message});
                        });
                } else {
                    // success
                    support.log("User " + username + " edited their rating for movie with tt_id: " + tt_id + ", new points: " + points + ".");
                    res.status(201).send({username: username, points: points});
                }
            });
        });
});

/**
 * /api/movies/:tt_id/ratings
 * Delete request to remove a rating from a certain movie
 *  Header:
 *      AuthToken: <authToken>
 */
router.delete("/:tt_id/ratings", function (req, res) {
    var username = req.user.username;
    var tt_id = req.params.tt_id;

    // find a movie with a certain tt_id that the authenticated user rated
    movieSchema.find({tt_id: tt_id, "ratings.username": username}, {_id: 0, ratings: 1},
        function (err, result) {
            if (err) {
                support.log(err);
                res.status(500).send({error: err.message});
                return;
            }

            // if the movie was not rated by the authenticated user
            if (result.length != 1) {
                support.log("User tried to delete the rating of an unknown or not yet rated movie.");
                res.status(404).send({error: "Movie not found/yet rated."});
                return;
            }

            support.log("\tPreparing to update the rating and the movie's average...");

            var array = result[0].ratings;
            var sum = 0;
            var avg = 0;
            // only calculate if we have other ratings left
            if (array.length - 1 > 0) {
                for (var i = 0; i < array.length; i++) {
                    // only add the other ratings
                    if (array[i].username != username) sum += parseInt(array[i].points);
                }
                avg = Math.round(sum / (array.length - 1));
            }

            // remove it and update the average
            movieSchema.findOneAndUpdate({tt_id: tt_id}, {
                    $pull: {ratings: {username: username}},
                    $set: {average_rating: avg}
                },
                function (err, result) {
                    if (err) {
                        support.log("\t\t\t" + err.message);
                        res.status(500).send({error: err.message});
                        return;
                    }

                    support.log("User " + username + " deleted their rating for movie with tt_id: " + tt_id + ".");
                    res.status(204).send();
                });
        });
});

/************************************ MOVIES ************************************/

/**
 * /api/movies
 * Get request to get all the movies
 * Required: none
 * Applies limiting
 */
router.get("", function (req, res) {
    movieSchema.find({}, {_id: 0, ratings: 0}, support.limit(req), function (err, result) {
        if (err) {
            support.log(err);
            res.status(500).send({error: err.message});
            return;
        }

        support.log("Sending all movies.");
        res.status(200).send(result);
    });
});

/**
 * /api/movies/:tt_id
 * Get request to get one of the movies
 * Required: none
 */
router.get("/:tt_id", function (req, res) {
    var tt_id = req.params.tt_id;
    movieSchema.find({tt_id: tt_id}, {_id: 0, ratings: 0}, function (err, result) {
        if (err) {
            support.log(err);
            res.status(500).send({error: err.message});
            return;
        }

        // no movie found with that id
        if (result.length != 1) {
            support.log("User tried to get a not existing movie with tt_id: " + tt_id);
            res.status(404).send({error: "Movie not found."});
            return;
        }

        // prepare the result
        support.log("Sending movie with tt_id: " + tt_id);
        res.status(200).send(result[0]);
    });
});

module.exports = router;