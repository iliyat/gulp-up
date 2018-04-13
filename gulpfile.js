const gulp = require('gulp');
const config = require('./layout-dev-config');
const pug = require('gulp-pug');
const path = require('path');
const del = require('del');
const browserify = require('browserify');
const babelify = require('babelify');
const buffer = require('vinyl-buffer');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const tap = require('gulp-tap');
const gutil = require('gulp-util');
const browserSync = require('browser-sync').create();

const templates = 'src/**/*.html';
const pugTemplates = 'src/**/*.pug';
const jsTemplates = 'src/**/*.js';
const publicFiles = 'src/public/**/*';

gulp.task('default', ['watch'], () => {
  browserSync.init(config.browsersync);
});

gulp.task('html', () => {
  gulp
    .src(templates)
    .pipe(plumber())
    .pipe(gulp.dest(config.buildDir));
});

gulp.task('pug', () => {
  gulp
    .src(pugTemplates)
    .pipe(plumber())
    .pipe(pug())
    .pipe(gulp.dest(config.buildDir));
});

gulp.task('js', () => {
  return (
    gulp
      .src(jsTemplates, { read: false })
      .pipe(plumber())
      .pipe(
        tap(function(file) {
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
      .pipe(gulp.dest(config.buildDir))
  );
});

gulp.task('copy-public', () => {
  gulp.src(publicFiles).pipe(gulp.dest(config.publicBuildDir));
});

gulp.task('watch', ['html', 'pug', 'js', 'copy-public'], () => {
  let watcher = gulp.watch(config.globs.watch, [
    'html',
    'pug',
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

/* todo: stylus, svg */
