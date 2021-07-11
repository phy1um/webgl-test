/* eslint-disable no-undef */

const gulp = require("gulp");
const wp = require("webpack-stream");
// const nd = require("gulp-nodemon");
const ws = require("gulp-webserver");

const WP_CONFIG = "./webpack.config.js";
const SRC = "./src/*.js";
const DEST = "./http/js";

function clientBuild() {
    return gulp.src([SRC])
        .pipe(wp(require(WP_CONFIG)))
        .pipe(gulp.dest(DEST));
}

function webserver() {
    return gulp.src("http").pipe(ws({
        host: "localhost",
        port: 8000,
        livereload: true,
        open: true,
        fallback: "./http/index.js"
    }));
}

function watchClientBuild() {
    clientBuild();
    webserver();
    return gulp.watch([SRC], clientBuild);
}

exports.clientBuild = clientBuild;
exports.watch = watchClientBuild;