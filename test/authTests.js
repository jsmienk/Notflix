/**
 * Author: Jeroen
 * Date created: 07-10-16
 */
var supertest = require("supertest");
var support = require("../support");
var server = supertest.agent("http://localhost:3000");

// valid AuthToken to use in some requests
var authToken;

// Authentication test suite
describe("authenticating", function () {

    /*
     Good weather
     */
    // login test case
    it("should authenticate user jj", function (done) {
        server.post("/api/login")
            .send({username: "jsmienk", password: "jj"})
            .expect(201)
            .expect("Content-Type", /json/)
            .expect(function (res) {
                if (!res.body.token) throw new Error("No token in response.");
            })
            .end(done);
    });

    /*
     Bad weather
     */
    // user known, password incorrect
    it("should not authenticate wrong password", function (done) {
        server.post("/api/login")
            .send({username: "jsmienk", password: "jr"})
            .expect(401)
            .expect("Content-Type", /json/)
            .expect(function (res) {
                if (!res.body.error) throw new Error("No error in response.");
            })
            .end(done);
    });

    // user unknown
    it("should not authenticate unknown username", function (done) {
        server.post("/api/login")
            .send({username: "kk", password: "jj"})
            .expect(401)
            .expect("Content-Type", /json/)
            .expect(function (res) {
                if (!res.body.error) throw new Error("No error in response.");
            })
            .end(done);
    });

    // missing username
    it("should not authenticate without username", function (done) {
        server.post("/api/login")
            .send({password: "jj"})
            .expect(400)
            .expect("Content-Type", /json/)
            .expect(function (res) {
                if (!res.body.error) throw new Error("No error in response.");
            })
            .end(done);
    });

    // missing password
    it("should not authenticate without password", function (done) {
        server.post("/api/login")
            .send({username: "jsmienk"})
            .expect(400)
            .expect("Content-Type", /json/)
            .expect(function (res) {
                if (!res.body.error) throw new Error("No error in response.");
            })
            .end(done);
    });

    // no body
    it("should not authenticate without body", function (done) {
        server.post("/api/login")
            .expect(400)
            .expect("Content-Type", /json/)
            .expect(function (res) {
                if (!res.body.error) throw new Error("No error in response.");
            })
            .end(done);
    });
});