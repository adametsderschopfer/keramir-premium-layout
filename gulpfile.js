const gulp = require('gulp')
const del = require('del')

// ...
const plumber = require('gulp-plumber')
const imageMin = require('gulp-imagemin')
const chainStyle = require('./gulpchainstyle')
const chainScripts = require('./gulpchainscripts')

// twig
const twig = require('gulp-twig')
const changed = require('gulp-changed')
const htmlBeautify = require('gulp-html-beautify')

//webpack
const webpack = require('webpack')
const webpackStream = require('webpack-stream')

// const
const browserSync = require('browser-sync').create()
const templatePath = './public'
const imageExtensions = '{png,jpg,jpeg,webp,svg,ico}';

/*gulp.task('vue', function() {
  return gulp.src('./src/vue/index.js')
    .pipe(webpackStream(require('./webpack.config'), webpack))
    .pipe(gulp.dest(templatePath + '/assets/js'))
})*/

gulp.task('vue', () => {
  return Promise.resolve();

  // return gulp.src('./src/vue/index.js')
  //     .pipe(webpackStream(require('./webpack.config'), webpack))
  //     .pipe(gulp.dest(templatePath + '/assets/js'))
})

gulp.task('json', () => {
  return gulp.src('./src/**/*.{json,json5}')
    .pipe(gulp.dest(templatePath + '/assets/json/json'))
})

gulp.task('html', () => {
  return gulp.src('./src/*.twig')
    .pipe(plumber())
    .pipe(changed('./src/*.twig'))
    .pipe(twig())
    .pipe(htmlBeautify({ indentSize: 4 }))
    .pipe(gulp.dest(templatePath))
})

function imageHandler(isBuild) {
  const inst = gulp
    .src(['./src/images/**/*.' + imageExtensions])

  if (isBuild) {
    inst.pipe(
      imageMin([
        imageMin.optipng({optimizationLevel: 3}),
        imageMin.mozjpeg({quality: 75, progressive: true}),
        imageMin.svgo()
      ])
    );
  }

  inst.pipe(gulp.dest(templatePath + '/assets/images'));

  return inst;
}

gulp.task('images', () => {
  return imageHandler();
})

gulp.task('images:dev', () => {
  return imageHandler(true);
})

gulp.task('copy', () => {
  return gulp
    .src([
      './src/**/*.{eot,ttf,woff,woff2,png,jpg,jpeg,webp,svg,ico}',
      './src/js/vendor/**/*.js',
      './src/json/*.json',
      './src/videos/*.mp4',
    ], {
      base: 'src'
    })
    .pipe(gulp.dest(templatePath + '/assets'))
})

gulp.task('styles', () => {
  return chainStyle([
    './src/sass/style.scss'
  ], templatePath + '/assets', browserSync)
})

gulp.task('scripts', () => {
  return chainScripts([
    './src/js/polyfill/*.js',
    './src/js/functions/*.js',
    './src/js/legancy/**/*.js',
    './src/js/index.js',
    '!./src/js/**/*.min.js'
  ], templatePath + '/assets', browserSync)
});

gulp.task('clean', () => {
  return del(templatePath)
})

gulp.task('serve', () => {
  browserSync.init({
    server: templatePath
  })
  gulp.watch('./src/**/*.{json,json5}', gulp.series('json'))
  gulp.watch('./src/sass/**/*.scss', gulp.series('styles'))
  gulp.watch('./src/**/*.twig', gulp.series('html', 'reload'))
  gulp.watch(['./src/js/**/*.js', '!./src/js/**/*.min.js'], gulp.series('scripts', 'reload'))
  gulp.watch('src/vue/**/*.{js,vue}', gulp.series('vue', 'reload'))
})

gulp.task('reload', done => {
  browserSync.reload()
  done()
})

gulp.task('copy-ker', () => {
  return gulp
      .src('./public/**/*')
      .pipe(gulp.dest('keramir'));
})

gulp.task('build', gulp.series(
  'clean',
  'copy',
  'styles',
  'scripts',
  'vue',
  'html',
  'images',
  'copy-ker',
))

gulp.task('start', gulp.series(
  'clean',
  'copy',
  'styles',
  'scripts',
  'vue',
  'html',
  'serve'
))
