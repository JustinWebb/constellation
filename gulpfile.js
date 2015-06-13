/* 
* @Author: justinwebb
* @Date:   2015-05-26 15:18:17
* @Last Modified by:   Austin Liu
* @Last Modified time: 2015-06-12 13:13:44
*/

'use strict';

// ---------------------------------------------------------
// Require build process dependencies
// ---------------------------------------------------------
var gulp = require('gulp');
var gUtil = require('gulp-util');
var fs = require('fs');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
var inject = require('gulp-inject');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var karma = require('gulp-karma');
var mocha = require('gulp-mocha');
var streamSeries = require('stream-series');
var nodemon = require('gulp-nodemon');
var html2js = require('gulp-html2js');
var config = require('./build-config');
var browserSyncReload = browserSync.reload;
var ngAnnotate = require('gulp-ng-annotate');
var shell = require('gulp-shell');
var gulpif = require('gulp-if');

// ---------------------------------------------------------
// Helper methods
// ---------------------------------------------------------

var onNodeProcessError = function () {
  process.exit(1);
};
var onNodeProcessEnd = function () {
  process.exit();
};

// ---------------------------------------------------------
// Define tasks
// ---------------------------------------------------------

// --------------------- Testing -------------------------//
gulp.task('testback', function () {
  return gulp.src(config.testFiles.back)
    .on('error', function (err) {throw err;})
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(mocha({
      reporter: 'spec'
    }));
});

gulp.task('testfront', function () {
  return gulp.src(config.testFiles.front)
    .on('error', function (err) {throw err;})
    .pipe(karma({
      configFile: 'karma.config.js',
      action: 'watch'
    }));
});

// ------------------ PostgreSQL -------------------------//
gulp.task('dbstatus', function () {
  return gulp.src('')
    .pipe(shell([
      'pg_ctl -D /usr/local/var/postgres status',
    ]))
    .on('error', onNodeProcessError)
    .on('end', onNodeProcessEnd);
});

gulp.task('dbstart', function () {
  return gulp.src('')
    .pipe(shell([
      'pg_ctl -D /usr/local/var/postgres',
      ' -l /usr/local/var/postgres/server.log start',
    ].join('')))
    .on('error', onNodeProcessError)
    .on('end', onNodeProcessEnd);
});

gulp.task('dbstop', function () {
  return gulp.src('')
    .pipe(shell([
      'pg_ctl -D /usr/local/var/postgres stop -s -m fast',
    ]))
    .on('error', onNodeProcessError)
    .on('end', onNodeProcessEnd);
});


// --------------- Contiguous Integration ---------------//
gulp.task('clean', function cleanPreviousBuild (cb) {
  del([config.dist]);
  cb();
});

gulp.task('copy', function copyMediaFiles () {
  var media = [
    '!'+ config.client +'/assets/styles/**/*',
    config.client +'/assets/**/*'
  ];
  console.log('Media', media);
  return gulp.src(media)
    .pipe(gulp.dest(config.assets));
});

gulp.task('sass', function compileSassFiles (cb) {
  gulp.src(config.appFiles.scss)
    .on('error', sass.logError)
    .pipe(sourcemaps.init())
    .pipe(sass({
        includePaths: [config.importPath.fontawesomeSass],
        sourcemap: true
      })
    )
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(config.assets +'/styles'))
    .pipe(browserSyncReload({stream: true}));

  cb();
});

gulp.task('dist', ['sass'], function transformSourceToDistFiles (cb) {
  var environment = process.env.NODE_ENV || 'development';
  var startTag = {starttag: '<!-- inject:head:{{ext}} -->'};
  var cssDest = config.assets +'/styles/main.css';
  var cssOptions = {
    addRootSlash: false,
    ignorePath: ['dist', 'client']
  };
  var jsOptions = {
    addRootSlash: false,
    ignorePath: ['dist', 'client']
  };

  // The CSS is generated by the previously ran SASS task, 
  // which runs slower than the distribution task and 
  // results in race conditions. The 'injectWhenCSSReady'
  // function solves this by polling for the CSS file.
  var intervalId;
  var injectWhenCSSReady = function () {
    fs.stat(cssDest, function (err) {
      if (!err) {
        // Concatenate vendor scripnots 
        var vendor = gulp.src(config.vendorFiles.js)
          .pipe(concat(config.src +'/vendor.js'))
          .pipe(gulp.dest(config.dist));
         
        // Concatenate AND minify app sources 
        var app = gulp.src(config.appFiles.js)
          .pipe(jshint())
          .pipe(jshint.reporter(stylish))
          .pipe(jshint.reporter('fail'))
          .pipe(sourcemaps.init())
          .pipe(concat(config.src +'/constellation-app.js'))
          .pipe(ngAnnotate())
          .pipe(gulpif(environment === 'production', uglify()))
          .pipe(sourcemaps.write('.', {
            includeContent: true,
            sourceRoot: './'
          }))
          .pipe(gulp.dest(config.dist));

        var templates = gulp.src(config.appFiles.atpl)
          .pipe(html2js({
            base: 'client/app',
            outputModuleName: 'app-templates',
            useStrict: true
          }))
          .pipe(concat(config.src +'/constellation-templates.js'))
          .pipe(gulp.dest(config.dist));

        // Inject CSS and JS into index.html
        gulp.src(config.client +'/index.html')
          .pipe(inject(gulp.src(cssDest, {read: false}), cssOptions), startTag)
          .pipe(inject(streamSeries(vendor, app, templates), jsOptions))
          .pipe(gulp.dest(config.dist));

        // Exit polling function and task
        clearInterval(intervalId);
        cb();
      }
    });
  };
  intervalId = setInterval(injectWhenCSSReady, 60);
});

gulp.task('build', ['clean', 'copy', 'dist']);

gulp.task('nodemon', function runNodemon (cb) {
  var isActive = false;
  return nodemon({
    script: config.server +'/server.js',
    watch: [config.server +'/**/*.js']
  })
    .on('start', function onStart() {
      gUtil.log('runNodemon:\tstarting up...');
      if (!isActive) {
        isActive = true;
        cb();
      }
    })
    .on('restart', function onRestart() {
      setTimeout(function reload() {
        browserSyncReload({stream: false});
      }, 500);
    });
});

gulp.task('update-js', ['dist'], browserSyncReload);

gulp.task('update-html', ['dist'], function reloadOnDelay() {
  setTimeout(browserSyncReload, 500);
});

gulp.task('develop', ['build', 'nodemon'], function serveExpressOnBrowserSync() {
  
  var port = process.env.PORT || 3999;

  browserSync.init({
    server: {
      baseDir: config.dist,
      proxy: 'http://localhost:'+ port,
    }
  });

  gulp.watch(config.appFiles.scss, ['sass']);
  gulp.watch(config.appFiles.js, ['update-js']);
  gulp.watch(config.appFiles.html, ['update-html']);
  gulp.watch(config.appFiles.atpl, ['update-html']);
});

gulp.task('serve', ['build'], shell.task([
  'node '+ config.server +'/server.js'
]));

gulp.task('default', ['develop']);
