/**
 * Author: Jeroen
 * Date created: 04-10-16
 */
var md5 = require("blueimp-md5");

/**
 * Allow a request to be limited by returning a options object to give to a Mongoose method
 * @param req
 * @returns {*}
 */
var limit = function limit(req) {
    var count = req.query.limit;
    var page = req.query.page;
    var limiting = {skip: 0};
    if (!isNaN(count) && count > 0) {
        log("\tLimiting results...");
        limiting.limit = parseInt(count);
        if (!isNaN(page) && page > 0) limiting.skip = (count * page);
    }
    return limiting;
};

/**
 * Logs a message to the console with the current timestamp
 * @param msg the message to log
 */
var log = function log(msg) {
    var date = new Date();
    var hour = date.getHours();
    if (hour < 10) hour = '0' + hour;
    var minute = date.getMinutes();
    if (minute < 10) minute = '0' + minute;
    var second = date.getSeconds();
    if (second < 10) second = '0' + second;

    var timeString = hour + ":" + minute + ":" + second;
    var dateTime = "[" + timeString + "]";

    console.log(dateTime + " " + msg);
};

/**
 * Returns a hash of a password hashed with the given salt
 * @param password
 * @param salt
 */
var createHash = function createHash(password, salt) {
    return md5(password + salt);
};

/**
 * Create a random hash from a password and returns the hash and salt
 * @param password
 * @returns {{hash, salt: string}}
 */
var hash = function hash(password) {
    var salt = Math.random().toString(36).substring(8);
    var hash = createHash(password, salt);
    return {"hash": hash, "salt": salt};
};

/**
 * Capitalize the first letter of every word
 * @param lower if set to true, it lowers the other letters
 * @returns {string}
 */
String.prototype.capitalize = function (lower) {
    return (lower ? this.toLowerCase() : this).replace(/(?:^|\s)\S/g, function (a) {
        return a.toUpperCase();
    });
};

module.exports.limit = limit;
module.exports.log = log;
module.exports.createHash = createHash;
module.exports.hash = hash;