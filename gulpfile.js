
const gulp = require("gulp");
const wp = require("webpack-stream");
const nd = require("gulp-nodemon");

function clientBuild() {
    return gulp.src(["src/*.js"])
        .pipe(wp(require("./webpack.config.js")))
        .pipe(gulp.dest("http/js"));
}

function watchClientBuild() {
    clientBuild();
    return gulp.watch(["src/*.js"], clientBuild);
}

exports.clientBuild = clientBuild;
exports.watch = watchClientBuild;