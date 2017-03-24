'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jshintXMLReporter = require('gulp-jshint-xml-file-reporter');

gulp.task('default', function () {

    return gulp.src(['resources/*.js', 'test/*.js']).pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('jshint-stylish', {
            filename: './reports/jshint-output.report'
        }))
        .pipe(jshint.reporter(jshintXMLReporter))
        .on('end', jshintXMLReporter.writeFile({
            format: 'checkstyle',
            filePath: './reports/jshint.xml',
            alwaysReport: true
        }));
});