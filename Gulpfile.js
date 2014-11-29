var gulp = require('gulp'),
	del = require('del'),
	coffee = require('gulp-coffee'),
	run_sequence = require('run-sequence').use(gulp);

gulp.task('coffee', function () {
	return gulp.src('src/*.litcoffee')
		.pipe(coffee())
		.pipe(gulp.dest('dist'));
});

gulp.task('del', function() {
	del(['dist/**']);
});

gulp.task('_build', ['coffee']);

gulp.task('default', function (cb) {
	run_sequence('del', '_build', cb)
});