/**
 * Author: Jeroen
 * Date created: 04-10-16
 */
var express = require("express");
var jwt = require("jsonwebtoken");
var support = require("../support");
var router = express.Router();

var userSchema = require("../model/user");

var excluded = [
    // welcome page
    {
        url: "/api",
        method: "GET"
    },
    // /api/users
    {
        url: "/api/users",
        method: "POST"
    },
    // /api/login
    {
        url: "/api/login",
        method: "POST"
    },
    // /api/movies
    {
        url: "/api/movies",
        method: "GET"
    },
    // /api/movies/:tt_id
    {
        url: "/api/movies",
        method: "GET",
        /*
         * checkBase will remove everything after and including the last /
         * and check it to this url.
         */
        checkBase: true
    }
];

/*
 * Every backString that needs authentication but might be removed when checkBase equals true
 * e.g. /api/movies/:tt_id needs no authenticating, but /api/movies/ratings does
 */
var includedBackStrings = ["/ratings"];

/**
 * Authentication by using a JSON Web Token
 * Every request after /api will got through here
 */
router.use("", function (req, res, next) {
    // set the Access-Control-Allow-Origin header to allow cross domain access
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "PUT, DELETE");

    // Chrome fix
    if (req.method == "OPTIONS") {
        res.header("Access-Control-Allow-Headers", "AuthToken");
        res.status(200).send();
        return;
    }

    // check if no authentication is needed
    for (var i = 0; i < excluded.length; i++) {
        var url = req.originalUrl;

        // remove query parameters, if any
        if (url.lastIndexOf("?") != -1) {
            url = url.substring(0, url.lastIndexOf("?"));
        }

        if (excluded[i].checkBase) url = getAuthenticationCheckingURL(url);
        if (excluded[i].url == url && excluded[i].method == req.method) {
            // skip authentication
            next();
            return;
        }
    }

    support.log("\tAuthenticating...");

    // verify the token (check signature)
    jwt.verify(req.header("AuthToken"), req.app.get('privateKey'), function (err, decoded) {
        // if authentication fails
        if (err) {
            support.log("\t\t" + err);
            res.status(401).send({error: err.message});
            return;
        }

        // valid token, save the user info
        req.user = decoded._doc;
        next();
    });
});

/**
 * Login a user
 * Required:
 *  Body:
 *      {
 *          "username": "<username>",
 *          "password": "<password>"
 *      }
 */
router.post("/login", function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    if (!username || !password) {
        // invalid request
        support.log("User tried to authenticate with wrong body content.");
        res.status(400).send({error: "Invalid credentials."});
        return;
    }

    // find the corresponding user
    userSchema.find({username: username}, {_id: 0, __v: 0}, function (err, result) {
        if (err) {
            support.log(err);
            res.status(500).send({error: err.message});
            return;
        }

        // if the user is not found
        if (result.length != 1) {
            support.log("User " + username + " was not found.");
            res.status(401).send({error: "Invalid credentials."});
            return;
        }

        var user = result[0];

        // if the password does not match
        if (user.password_hash != support.createHash(password, user.password_salt)) {
            support.log("User tried to authenticate with wrong password.");
            res.status(401).send({error: "Invalid credentials."});
            return;
        }

        // login successful..
        support.log("User " + user.username + " authenticated successfully.");

        // release the password related data from the object
        user.password_hash = undefined;
        user.password_salt = undefined;

        // create a random token that expires in a week
        var token = jwt.sign(user, req.app.get('privateKey'), {expiresIn: 60 * 60 * 24 * 7});

        // return the token
        res.status(201).send({token: token});
    });
});

module.exports = router;

/**
 * Return a url without the part after the last slash
 * @param url {String}
 */
function getAuthenticationCheckingURL(url) {
    var backString = url.substring(url.lastIndexOf("/"), url.length);

    // include other urls when authenticating
    for (var i = 0; i < includedBackStrings.length; i++) {
        if (includedBackStrings[i] == backString) return url;
    }

    return url.substring(0, url.lastIndexOf("/"));
}