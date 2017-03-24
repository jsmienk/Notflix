/**
 * Author: Jeroen
 * Date created: 03-10-16
 */
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ratingSchema = new Schema({
    _id: false,
    username: {
        type: String,
        required: true,
        unique: true
    },
    points: {
        type: Number,
        required: true
    }
});

var movieSchema = new Schema({
    tt_id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    publish_date: {
        type: Date,
        required: true
    },
    length: Number,
    director: String,
    description: String,
    ratings: [ratingSchema],
    average_rating: Number
});

module.exports = mongoose.model("Movie", movieSchema);
