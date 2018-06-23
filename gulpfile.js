const gulp = require('gulp');
const pug = require('gulp-pug');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const tap = require('gulp-tap');
const gutil = require('gulp-util');
const concat = require('gulp-concat');
const stylus = require('gulp-stylus');
const autoprefixer = require('gulp-autoprefixer');

const path = require('path');
const del = require('del');
const browserify = require('browserify');
const babelify = require('babelify');
const buffer = require('vinyl-buffer');
const browserSync = require('browser-sync').create();

const config = require('./layout-dev-config');

gulp.task('default', ['watch'], () => {
  browserSync.init(config.browsersync);
});

gulp.task('pages', () => {
  gulp
  .src([config.globs.pages])
  .pipe(plumber())
  .pipe(pug())
  .pipe(gulp.dest(config.buildDirs.pages));
});

gulp.task('stylus', () => {
  gulp
  .src([config.globs.stylus, `!${config.globs.publicFiles}`])
  .pipe(plumber())
  .pipe(stylus())
  .pipe(concat('styles.css'))
  .pipe(autoprefixer({
    browsers: ['Chrome >= 48',
      'ChromeAndroid >= 49',
      'Opera >= 35',
      'IE >= 9',
      'Firefox >= 44',
      'Safari >= 9',
      'Android >= 4']
  }))
  .pipe(gulp.dest(config.buildDirs.css));
});

gulp.task('js', () => {
  return (
    gulp
    .src(config.globs.js, { read: false })
    .pipe(plumber())
    .pipe(
      tap(function (file) {
        gutil.log(`bundling '${file.path}'`);
        file.contents = browserify(file.path, { debug: true })
        .transform('babelify', config.babel)
        .bundle();
      }),
    )
    .pipe(buffer())
    /*.pipe(
    rename({
      extname: '.bundle.js',
    }),
  )*/
    .pipe(gulp.dest(config.buildDirs.js))
  );
});

gulp.task('copy-public', () => {
  gulp.src(config.globs.publicFiles).pipe(gulp.dest(config.buildDirs.public));
});

gulp.task('watch', ['pages', 'stylus', 'js', 'copy-public'], () => {
  let watcher = gulp.watch(config.globs.watch, [
    'pages',
    'stylus',
    'js',
    'copy-public',
  ]);

  watcher.on('change', event => {
    browserSync.reload();
    if (event.type === 'deleted') {
      cleanDeletedFromBuild(event.path);
    }

    if (event.type === 'renamed') {
      cleanDeletedFromBuild(event.old);
    }
  });
});

/* todo: add map for extensions, less -> css, pug -> html . Use map from devim-templater.json */
const cleanDeletedFromBuild = eventPath => {
  const relativePath = path.relative(path.resolve('src'), eventPath);
  const buildPath = path.resolve(config.buildDir, relativePath);
  gutil.log('Deleting from build: ' + buildPath);
  del.sync(buildPath);
};
