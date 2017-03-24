/**
 * Author: Jeroen
 * Date created: 30-09-16
 */
// imports
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var fs = require("fs");
var support = require("./support");

// use express
var app = express();

// parse json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// json web token for authentication
app.set("privateKey", support.createHash("privateKey", "json"));

// connect to the database
mongoose.connect("mongodb://localhost:27017/notflix");
mongoose.connection.on('error', function (err) {
    support.log("Could not connect to MongoDB server: " + err);
});
mongoose.connection.once('open', function () {
    support.log("Connected to MongoDB server.");

    mongoose.Promise = global.Promise;

    // server variables
    app.set("apiPath", "/api");

    // get request on the root
    app.get(app.get("apiPath"), function (req, res) {
        support.log("Documentation was displayed.");

        fs.readFile("./pdfs/notflix.pdf", function (err, data) {
            if (err) {
                console.log(err);
                res.status(500).send({error: err});
                return;
            }

            res.contentType("application/pdf");
            res.status(200).send(data);
        });
    });

    /************************************ AUTHENTICATION ****************************/
    app.use(app.get("apiPath"), require("./resources/authRouting"));

    /************************************ MOVIES ************************************/
    app.use(app.get("apiPath") + "/movies", require("./resources/movieRouting"));

    /************************************ USERS *************************************/
    app.use(app.get("apiPath") + "/users", require("./resources/userRouting"));

    /************************************ START UP **********************************/
    var port = 3000;
    app.listen(port, function () {
        support.log("REST API started and listening on port " + port + ".");
    });
});