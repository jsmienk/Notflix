/**
 * Author: Jeroen
 * Date created: 08-10-16
 */
var supertest = require("supertest");
var support = require("../support");
var mongoose = require("mongoose");
var server = supertest.agent("http://localhost:3000");

var mongodb;
var authToken;

// the amount of movies with any ratings
var amountOfAverages = 4;
describe("GET, POST, PUT, DELETE on ratings", function () {

    // before the tests
    before(function (done) {
        // connect to the database
        mongodb = mongoose.connect("mongodb://localhost:27017/notflix");
        mongoose.connection.on('error', function (err) {
            support.log("Could not connect to MongoDB server: " + err);
        });
        mongoose.connection.once('open', function () {
            // get an authentication token to use in some tests
            server.post("/api/login")
                .send({username: "jsmienk", password: "jj"})
                .expect(201)
                .expect("Content-Type", /json/)
                .end(function (err, result) {
                    authToken = result.body.token;

                    done();
                });
        });
    });

    // after te tests
    after(function () {
        mongodb.disconnect();
    });

    // get average ratings test suite
    describe("GET /api/movies/ratings/all", function () {

        /*
         Good weather
         */
        // get all average ratings
        it("should get all average ratings", function (done) {
            server.get("/api/movies/ratings/all")
                .set("AuthToken", authToken)
                .expect(200)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.length != amountOfAverages) throw new Error("Wrong amount of results in response.");
                })
                .end(done);
        });

        // limiting
        it("should get 3 average ratings by applying limiting", function (done) {
            server.get("/api/movies/ratings/all?limit=3")
                .set("AuthToken", authToken)
                .expect(200)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.length != 3) throw new Error("Wrong amount of results in response.");
                })
                .end(done);
        });

        // limiting and paging
        it("should get 1 average rating by applying limiting", function (done) {
            server.get("/api/movies/ratings/all?limit=3&page=1")
                .set("AuthToken", authToken)
                .expect(200)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.length != 1) throw new Error("Wrong amount of results in response.");
                })
                .end(done);
        });

        // negative limiting
        it("should get all average rating by applying negative limiting", function (done) {
            server.get("/api/movies/ratings/all?limit=-2&page=-1")
                .set("AuthToken", authToken)
                .expect(200)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.length != amountOfAverages) throw new Error("Wrong amount of results in response.");
                })
                .end(done);
        });

        /*
         Bad weather
         */
        // no authentication
        it("should not get average ratings without authentication", function (done) {
            server.get("/api/movies/ratings/all")
                .expect(401)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });
    });

    // get average rating test suite
    describe("GET /api/movies/:tt_id/ratings/all", function () {

        /*
         Good weather
         */
        // valid movie
        it("should get the average rating", function (done) {
            server.get("/api/movies/234487/ratings/all")
                .set("AuthToken", authToken)
                .expect(200)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.tt_id != "234487") throw new Error("Wrong result in response.");
                    if (res.body.average_rating != 5) throw new Error("Wrong result in response.");
                })
                .end(done);
        });

        /*
         Bad weather
         */
        // no authentication
        it("should not get an average rating without authentication", function (done) {
            server.get("/api/movies/0123456/ratings/all")
                .expect(401)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });

        // movie not found
        it("should not get the average rating of an unknown movie", function (done) {
            server.get("/api/movies/222222/ratings/all")
                .set("AuthToken", authToken)
                .expect(404)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });

        // movie not yet rated
        it("should not get the average rating of a not yet rated movie", function (done) {
            server.get("/api/movies/9728456/ratings/all")
                .set("AuthToken", authToken)
                .expect(404)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });


    });

    // get user ratings test suite
    describe("GET /api/movies/ratings", function () {

        /*
         Good weather
         */
        // get all average ratings
        it("should get all ratings from the authenticated user", function (done) {
            server.get("/api/movies/ratings")
                .set("AuthToken", authToken)
                .expect(200)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.length != 3) throw new Error("Wrong amount of results in response.");
                })
                .end(done);
        });

        // limiting
        it("should get 2 ratings from the authenticated user by applying limiting", function (done) {
            server.get("/api/movies/ratings?limit=2")
                .set("AuthToken", authToken)
                .expect(200)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.length != 2) throw new Error("Wrong amount of results in response.");
                })
                .end(done);
        });

        // limiting and paging
        it("should get 1 ratings from the authenticated user by applying limiting", function (done) {
            server.get("/api/movies/ratings?limit=2&page=1")
                .set("AuthToken", authToken)
                .expect(200)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.length != 1) throw new Error("Wrong amount of results in response.");
                })
                .end(done);
        });

        // negative limiting
        it("should get all ratings from the authenticated user by applying negative limiting", function (done) {
            server.get("/api/movies/ratings?limit=-2&page=-1")
                .set("AuthToken", authToken)
                .expect(200)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.length != 3) throw new Error("Wrong amount of results in response.");
                })
                .end(done);
        });

        /*
         Bad weather
         */
        // get all average ratings
        it("should get all ratings from the authenticated user", function (done) {
            server.get("/api/movies/ratings")
                .set("AuthToken", authToken)
                .expect(200)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.length != 3) throw new Error("Wrong amount of results in response.");
                })
                .end(done);
        });

        // no authentication
        it("should not get all ratings from a user without authentication", function (done) {
            server.get("/api/movies/ratings")
                .expect(401)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });
    });

    //get user rating test suite
    describe("GET /api/movies/:tt_id/ratings", function () {

        /*
         Good weather
         */
        // valid movie
        it("should get the rating of the authenticated user", function (done) {
            server.get("/api/movies/0345666/ratings")
                .set("AuthToken", authToken)
                .expect(200)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.tt_id != "0345666") throw new Error("Wrong result in response.");
                    if (res.body.ratings[0].points != 2) throw new Error("Wrong result in response.");
                })
                .end(done);
        });

        /*
         Bad weather
         */
        // no authentication
        it("should not get a rating without authentication", function (done) {
            server.get("/api/movies/0123456/ratings")
                .expect(401)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });

        // movie not found
        it("should not get a rating of an unknown movie", function (done) {
            server.get("/api/movies/222222/ratings")
                .set("AuthToken", authToken)
                .expect(404)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });

        // movie not yet rated by user
        it("should not get a rating of a not yet by the user rated movie", function (done) {
            server.get("/api/movies/234487/ratings")
                .set("AuthToken", authToken)
                .expect(404)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });
    });

    // post new user rating
    describe("POST /api/movies/:tt_id/ratings", function () {

        /*
         Good weather
         */
        // post new rating
        it("should post a rating to a not rated movie", function (done) {
            server.post("/api/movies/0114369/ratings")
                .set("AuthToken", authToken)
                .send({points: 8})
                .expect(201)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.username != "jsmienk") throw new Error("Rating saved with wrong username.");
                    if (res.body.points != 8) throw new Error("Rating saved with wrong amount of points.");
                })
                .end(done);
        });

        // post new rating
        it("should post a rating to a rated movie", function (done) {
            server.post("/api/movies/234487/ratings")
                .set("AuthToken", authToken)
                .send({points: 6})
                .expect(201)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.username != "jsmienk") throw new Error("Rating saved with wrong username.");
                    if (res.body.points != 6) throw new Error("Rating saved with wrong amount of points.");
                })
                .end(done);
        });

        /*
         Bad weather
         */
        // without points
        it("should not post a rating without points", function (done) {
            server.post("/api/movies/098711/ratings")
                .set("AuthToken", authToken)
                .expect(400)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });

        // with invalid points
        it("should not post a rating with invalid points", function (done) {
            server.post("/api/movies/098711/ratings")
                .set("AuthToken", authToken)
                .send({points: -3})
                .expect(400)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });

        // without authentication
        it("should not post a rating without authentication", function (done) {
            server.post("/api/movies/098711/ratings")
                .send({points: 3})
                .expect(401)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });

        // unknown movie
        it("should not post a rating to an unknown movie", function (done) {
            server.post("/api/movies/222222/ratings")
                .set("AuthToken", authToken)
                .send({points: 7})
                .expect(404)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });

        // already rated
        it("should not post a rating to an already rated movie", function (done) {
            server.post("/api/movies/0114369/ratings")
                .set("AuthToken", authToken)
                .send({points: 8})
                .expect(409)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });
    });

    // edit a user rating
    describe("PUT /api/movies/:tt_id/ratings", function () {

        /*
         Good weather
         */
        // update a record
        it("should update the rating from the authenticated user", function (done) {
            server.put("/api/movies/0345666/ratings")
                .set("AuthToken", authToken)
                .send({points: 6})
                .expect(201)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.username != "jsmienk") throw new Error("Wrong rating was updated.");
                    if (res.body.points != 6) throw new Error("Rating was updated to wrong amount of points.");
                })
                .end(done);
        });

        // update a record
        it("should update the rating from the authenticated user", function (done) {
            server.put("/api/movies/0345666/ratings")
                .set("AuthToken", authToken)
                .send({points: 2})
                .expect(201)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.username != "jsmienk") throw new Error("Wrong rating was updated.");
                    if (res.body.points != 2) throw new Error("Rating was updated to wrong amount of points.");
                })
                .end(done);
        });

        // update a record
        it("should update the rating of a movie with more ratings", function (done) {
            server.put("/api/movies/0198940/ratings")
                .set("AuthToken", authToken)
                .send({points: 10})
                .expect(201)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.username != "jsmienk") throw new Error("Wrong rating was updated.");
                    if (res.body.points != 10) throw new Error("Rating was updated to wrong amount of points.");
                })
                .end(done);
        });

        /*
         Bad weather
         */
        // no points
        it("should not update a rating without points", function (done) {
            server.put("/api/movies/0123456/ratings")
                .set("AuthToken", authToken)
                .expect(400)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });

        // invalid amount of points
        it("should not update a rating with invalid points", function (done) {
            server.put("/api/movies/0123456/ratings")
                .set("AuthToken", authToken)
                .send({points: -7})
                .expect(400)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });

        // not authenticated
        it("should not update a rating without authentication", function (done) {
            server.put("/api/movies/0123456/ratings")
                .send({points: 7})
                .expect(401)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });

        // unknown movie
        it("should not update a rating of an unknown movie", function (done) {
            server.put("/api/movies/222222/ratings")
                .set("AuthToken", authToken)
                .send({points: 7})
                .expect(404)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });

        // not rated yet
        it("should not update a rating of a not yet rated movie", function (done) {
            server.put("/api/movies/098711/ratings")
                .set("AuthToken", authToken)
                .send({points: 7})
                .expect(404)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });
    });

    // delete a user rating
    describe("DELETE /api/movies/:tt_id/ratings", function () {

        /*
         Good weather
         */
        // remove a rating
        it("should remove the rating from the authenticated user", function (done) {
            server.del("/api/movies/0114369/ratings")
                .set("AuthToken", authToken)
                .expect(204)
                .expect(function (res) {
                    if (Object.keys(res.body).length !== 0) throw new Error("Response body should be empty on success.");
                })
                .end(done);
        });

        // remove a rating
        it("should remove the rating from the authenticated user", function (done) {
            server.del("/api/movies/234487/ratings")
                .set("AuthToken", authToken)
                .expect(204)
                .expect(function (res) {
                    if (Object.keys(res.body).length !== 0) throw new Error("Response body should be empty on success.");
                })
                .end(done);
        });

        /*
         Bad weather
         */
        // not authenticated
        it("should not remove a rating without authentication", function (done) {
            server.del("/api/movies/9728456/ratings")
                .expect(401)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });

        // unknown movie
        it("should not remove a rating from an unknown movie", function (done) {
            server.del("/api/movies/222222/ratings")
                .set("AuthToken", authToken)
                .expect(404)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });

        // movie not yet rated
        it("should not remove a rating from a movie that is not yet rated", function (done) {
            server.del("/api/movies/9728456/ratings")
                .set("AuthToken", authToken)
                .expect(404)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });
    });
});