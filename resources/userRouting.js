/**
 * Author: Jeroen
 * Date created: 04-10-16
 */
// use express
var express = require("express");
var support = require("../support");
var router = express.Router();

var userSchema = require("../model/user");

/**
 * /api/users
 * Get request to get all users (without their hashes)
 * Required:
 *  Header:
 *      AuthToken: <authToken>
 * Applies limiting
 */
router.get("", function (req, res) {
    userSchema.find({}, {
        _id: 0,
        __v: 0,
        password_hash: 0,
        password_salt: 0
    }, support.limit(req), function (err, result) {
        if (err) {
            support.log(err);
            res.status(500).send({error: err.message});
            return;
        }

        support.log("Sending all users.");
        res.status(200).send(result);
    });
});

/**
 * /api/users/:username
 * Get request to get one user (without their hash)
 * Required:
 *  Header:
 *      AuthToken: <authToken>
 */
router.get("/:username", function (req, res) {
    // get the username variable
    var username = req.params.username;
    userSchema.find({username: username}, {_id: 0, __v: 0, password_hash: 0, password_salt: 0}, function (err, result) {
        if (err) {
            support.log(err);
            res.status(500).send({error: err.message});
            return;
        }

        // if we did not find the right result
        if (result.length != 1) {
            support.log("User was not found with username: " + username);
            res.status(404).send({error: "User not found."});
            return;
        }

        support.log("Sending user with username: " + username);
        res.status(200).send(result[0]);
    });
});

/**
 * /api/users
 * Post request to create a new user
 * Required:
 *  Body:
 *      {
 *          "last_name": "<last name>",
 *          "infix": "<infix>",
 *          "first_name": "<first name>",
 *          "username": "<username>",
 *          "password": "<password>"
 *      }
 */
router.post("", function (req, res) {
    var last_name = req.body.last_name;
    // optional infix
    var infix = req.body.infix || "";
    var first_name = req.body.first_name;
    var username = req.body.username;
    var password = req.body.password;
    // check if we have all the required values
    if (!last_name || !first_name || !username || !password) {
        // invalid body contents
        support.log("User tried to register with wrong body content.");
        res.status(400).send({error: "Invalid body content."});
        return;
    }

    // properly capitalize the name
    last_name = last_name.capitalize(true);
    infix = infix.toLowerCase();
    first_name = first_name.capitalize(true);

    // hash the password
    var tuple = support.hash(password);

    // create a user object
    var user = new userSchema({
        last_name: last_name,
        infix: infix,
        first_name: first_name,
        username: username,
        password_hash: tuple.hash,
        password_salt: tuple.salt
    });

    // add the user to the database
    user.save(function (err, result) {
        if (err) {
            // duplicate username
            if (err.code == 11000) {
                support.log("User tried to register with occupied username.");
                res.status(409).send({error: "Username occupied."});
                return;
            }

            // unknown error
            support.log(err);
            res.status(500).send({error: err.message});
            return;
        }

        // success
        support.log("User " + result.username + " was created.");

        // send the user object that was just created without the password fields
        result.password_hash = undefined;
        result.password_salt = undefined;
        result.__v = undefined;
        result._id = undefined;

        res.status(201).send(result);
    });
});

module.exports = router;