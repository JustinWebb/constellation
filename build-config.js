module.exports  = {
  dist    : 'dist',
  assets  : 'dist/assets',
  src     : 'src',
  server  : 'server',
  db      : 'server/database',
  client  : 'client',
  app     : 'client/app',
  data    : 'client/assets/data',
  images  : 'client/assets/images',
  fonts   : 'client/assets/fonts',
  styles  : 'client/assets/styles',
  sampleData: 'docs/sampleGraph',
  appFiles : {

    // Source excluding test and template files
    js: [ 'client/app/**/*.js', '!client/app/**/*.spec.js' ],

    // Templates
    atpl: [ 'client/app/**/*.tpl.html' ],

    // Entry page
    html: [ 'client/index.html' ],

    // Module styles
    scss: [ 'client/assets/styles/**/*.scss' ]
  },
  vendorFiles  : {
    js: [
      'vendor/angular/angular.js',
      'vendor/angular-ui-router/release/angular-ui-router.js',
      'vendor/angular-animate/angular-animate.js',
      'vendor/lodash/dist/lodash.min.js',
      'vendor/d3/d3.min.js',
      'vendor/graphlib/dist/graphlib.core.min.js',
      'vendor/dagre/dist/dagre.core.min.js',
      'vendor/dagre-d3/dist/dagre-d3.core.min.js',
    ],
    css: [
      'vendor/animate.css/animate.min.css'
    ]
  },
  testFiles: {
    front: [
      'dist/src/vendor.js',
      'vendor/angular-mocks/angular-mocks.js',
      'dist/src/constellation-app.js',
      'client/app/**/*.spec.js'
    ],
    back : [
      'server/**/*.spec.js'
    ]
  },
  importPath: {
    foundationSass : 'vendor/font-awesome/scss',
    fontawesomeSass : 'vendor/font-awesome/scss'
  }
};
