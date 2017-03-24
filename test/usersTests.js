/**
 * Author: Jeroen
 * Date created: 07-10-16
 */
var supertest = require("supertest");
var support = require("../support");
var mongoose = require("mongoose");
var userSchema = require("../model/user");
var server = supertest.agent("http://localhost:3000");

var mongodb;
var authToken;

var amountOfUsers;

// Users test suite
describe("GET, POST on users", function () {

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

                    // get the current amount of users
                    userSchema.find({}, {_id: 1}, function (err, result) {
                        if (!err) amountOfUsers = result.length;
                        done(err);
                    });
                });
        });
    });

    after(function () {
        // UNRELIABLE, DOES NOT ALWAYS DELETE
        // remove the just created user
        userSchema.remove({username: "evert"}, function (err, result) {
            if (err) support.log(result);

            // UNRELIABLE, DOES NOT ALWAYS DELETE
            // remove other just created user
            userSchema.remove({username: "wouter"}, function (err, result) {
                if (err) support.log(result);
                mongodb.disconnect();
            });
        });
    });

    describe("GET /api/users", function () {

        /*
         Good weather
         */
        // get all users
        it("should get all users", function (done) {
            server.get("/api/users")
                .set("AuthToken", authToken)
                .send()
                .expect(200)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.length != amountOfUsers) throw new Error("Not all users were returned.");
                })
                .end(done);

        });

        // get all users with limiting
        it("should get three users", function (done) {
            server.get("/api/users?limit=3")
                .set("AuthToken", authToken)
                .send()
                .expect(200)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.length != 3) throw new Error("Limit 3 should return 3 results.");
                })
                .end(done);

        });

        // get all users with limiting
        it("should get zero users on the second page", function (done) {
            server.get("/api/users?limit=2&page=3")
                .set("AuthToken", authToken)
                .send()
                .expect(200)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.length != 0) throw new Error("Limit 2, page 3 should return 0 results.");
                })
                .end(done);
        });

        // get all users with negative limiting
        it("should get all users because of negative limiting", function (done) {
            server.get("/api/users?limit=-1&page=-4")
                .set("AuthToken", authToken)
                .send()
                .expect(200)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.length != amountOfUsers) throw new Error("Negative limiting should return all users.");
                })
                .end(done);
        });

        /*
         Bad weather
         */
        // unauthenticated
        it("should not get all users without authentication", function (done) {
            server.get("/api/users")
                .expect(401)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("");
                })
                .end(done);
        });
    });

    describe("GET /api/users/:username", function () {

        /*
         Good weather
         */
        // get one user
        it("should get user jsmienk", function (done) {
            server.get("/api/users/jsmienk")
                .set("AuthToken", authToken)
                .send()
                .expect(200)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.username != "jsmienk") throw new Error("Wrong user received.");
                })
                .end(done);
        });

        /*
         Bad weather
         */
        // user unknown
        it("should not get unknown user", function (done) {
            server.get("/api/users/jk")
                .set("AuthToken", authToken)
                .send()
                .expect(404)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (res.body.username == "jk") throw new Error("User should not exist.");
                })
                .end(done);
        });

        // unauthenticated
        it("should not get one user without authentication", function (done) {
            server.get("/api/users/jj")
                .send()
                .expect(401)
                .expect("Content-Type", /json/)
                .end(done);
        });
    });

    describe("POST /api/users", function () {

        // after the tests
        after(function () {

            // UNRELIABLE, DOES NOT ALWAYS DELETE
            // remove the just created user
            userSchema.remove({username: "evert"}, function (err, result) {
                if (err) support.log(result);

                // UNRELIABLE, DOES NOT ALWAYS DELETE
                // remove other just created user
                userSchema.remove({username: "wouter"}, function (err, result) {
                    if (err) support.log(result);
                });
            });
        });

        /*
         Good weather
         */
        // post a user
        it("should post new user evert", function (done) {
            server.post("/api/users")
                .set("AuthToken", authToken)
                .send({
                    username: "evert",
                    password: "evert",
                    first_name: "eVeRT",
                    infix: "",
                    last_name: "DUIpmans"
                })
                .expect(201)
                .expect(function (res) {
                    if (res.body.username != "evert") throw new Error("Username wrongly received.");
                    if (res.body.first_name != "Evert") throw new Error("First name wrongly received or formatted.");
                    if (res.body.infix != "") throw new Error("Infix wrongly received or formatted.");
                    if (res.body.last_name != "Duipmans") throw new Error("Last name wrongly received or formatted.");
                })
                .expect("Content-Type", /json/)
                .end(done);
        });

        // post a user
        it("should post new user wouter without infix", function (done) {
            server.post("/api/users")
                .set("AuthToken", authToken)
                .send({
                    username: "wouter",
                    password: "wouter",
                    first_name: "WOuter",
                    last_name: "geenIdee"
                })
                .expect(201)
                .expect(function (res) {
                    if (res.body.username != "wouter") throw new Error("Username wrongly received.");
                    if (res.body.first_name != "Wouter") throw new Error("First name wrongly received or formatted.");
                    if (res.body.infix != "") throw new Error("Infix wrongly received or formatted.");
                    if (res.body.last_name != "Geenidee") throw new Error("Last name wrongly received or formatted.");
                })
                .expect("Content-Type", /json/)
                .end(done);
        });

        /*
         Bad weather
         */
        // post a user with wrong body content
        it("should not post new user without username", function (done) {
            server.post("/api/users")
                .set("AuthToken", authToken)
                .send({
                    password: "evert",
                    first_name: "eVeRT",
                    last_name: "DUIpmans"
                })
                .expect(400)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .expect("Content-Type", /json/)
                .end(done);
        });

        // post a user with wrong body content
        it("should not post new user without password", function (done) {
            server.post("/api/users")
                .set("AuthToken", authToken)
                .send({
                    username: "evert",
                    first_name: "eVeRT",
                    last_name: "DUIpmans"
                })
                .expect(400)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .expect("Content-Type", /json/)
                .end(done);
        });

        // post a user with wrong body content
        it("should not post new user without first name", function (done) {
            server.post("/api/users")
                .set("AuthToken", authToken)
                .send({
                    password: "evert",
                    username: "evert",
                    last_name: "DUIpmans"
                })
                .expect(400)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .expect("Content-Type", /json/)
                .end(done);
        });

        // post a user with wrong body content
        it("should not post new user without last name", function (done) {
            server.post("/api/users")
                .set("AuthToken", authToken)
                .send({
                    password: "evert",
                    username: "evert",
                    first_name: "DUIpmans"
                })
                .expect(400)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .expect("Content-Type", /json/)
                .end(done);
        });

        // post a duplicate user ever
        it("should not post duplicate user evert", function (done) {
            server.post("/api/users")
                .set("AuthToken", authToken)
                .send({
                    username: "evert",
                    password: "evert",
                    first_name: "eVeRT",
                    infix: "vAN DeR",
                    last_name: "DUIpmans"
                })
                .expect(409)
                .expect("Content-Type", /json/)
                .expect(function (res) {
                    if (!res.body.error) throw new Error("No error in response.");
                })
                .end(done);
        });
    });
});