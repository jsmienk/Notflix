/**
 * Author: Jeroen
 * Date created: 07-10-16
 */
var supertest = require("supertest");
var support = require("../support");
var server = supertest.agent("http://localhost:3000");

// the amount of movies in the database
var amountOfMovies = 7;

// movies test suite
describe("GET /api/movies", function () {

    /*
     Good weather
     */
    // get all movies
    it("should get all movies", function (done) {
        server.get("/api/movies")
            .expect(200)
            .expect("Content-Type", /json/)
            .expect(function (res) {
                if (res.body.length != amountOfMovies) throw new Error("No results in response.");
            })
            .end(done);
    });

    // get the first five movies
    it("should get the first five movies by applying limiting", function (done) {
        server.get("/api/movies?limit=5")
            .expect(200)
            .expect("Content-Type", /json/)
            .expect(function (res) {
                if (res.body.length != 5) throw new Error("Wrong amount of results in response.");
            })
            .end(done);
    });

    // get the second five movies
    it("should get the second five movies (returns 2) by applying limiting", function (done) {
        server.get("/api/movies?limit=5&page=1")
            .expect(200)
            .expect("Content-Type", /json/)
            .expect(function (res) {
                if (res.body.length != amountOfMovies - 5) throw new Error("Wrong amount of results in response.");
            })
            .end(done);
    });

    // get all movies because limiting with negative number will not work
    it("should get all movies and not apply limiting", function (done) {
        server.get("/api/movies?limit=-1&page=-4")
            .expect(200)
            .expect("Content-Type", /json/)
            .expect(function (res) {
                if (res.body.length != amountOfMovies) throw new Error("Wrong amount of results in response.");
            })
            .end(done);
    });
});

describe("GET /api/movies/:tt_id", function () {

    /*
     Good weather
     */
    // get a single movie
    it("should get movie with tt_id: 0120338", function (done) {
        server.get("/api/movies/0120338")
            .expect(200)
            .expect("Content-Type", /json/)
            .expect(function (res) {
                if (!res.body) throw new Error("No result in response.");
                if (res.body.tt_id != "0120338") throw new Error("Wrong result in response");
            })
            .end(done);
    });

    /*
     Bad weather
     */
    // movie does not exist
    it("should not get movie with tt_id: 222222", function (done) {
        server.get("/api/movies/222222")
            .expect(404)
            .expect("Content-Type", /json/)
            .expect(function (res) {
                if (!res.body.error) throw new Error("Movie should not exist.");
            })
            .end(done);
    });
});