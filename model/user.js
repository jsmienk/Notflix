/**
 * Author: Jeroen
 * Date created: 03-10-16
 */
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var userSchema = new Schema({
    last_name: {
        type: String,
        required: true
    },
    infix: String,
    first_name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password_hash: {
        type: String,
        required: true
    },
    password_salt: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("User", userSchema);