module.exports = function(grunt) {

  // middleware for grunt.connect
  var middleware = function(connect, options, middlewares) {
    // inject a custom middleware into the array of default middlewares for proxy page
    var proxypage = require('proxypage');
    var proxyRe = /\/proxy\/proxy.ashx/i;

    var enableCORS = function(req, res, next) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      res.setHeader('Access-Control-Allow-Credentials', true);
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
      res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
      return next();
    };

    var proxyMiddleware = function(req, res, next) {
      if (!proxyRe.test(req.url)) {
        return next();
      }
      proxypage.proxy(req, res);
    };

    middlewares.unshift(proxyMiddleware);
    middlewares.unshift(enableCORS);
    middlewares.unshift(connect.json()); //body parser, see https://github.com/senchalabs/connect/wiki/Connect-3.0
    middlewares.unshift(connect.urlencoded()); //body parser
    return middlewares;
  };

  // grunt task config
  grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      tag: {
          banner: '/*  <%= pkg.name %>\n' +
          ' *  version <%= pkg.version %>\n' +
          ' *  Project: <%= pkg.homepage %>\n' +
          ' */\n'
      },
      copy: {
          build: {
              cwd: 'src',
              src: ['cmv/**','index-dev.html'],
              dest: 'dist/grunt/viewer',
              expand: true
          },
          dojo: {
              cwd: 'src',
              src: ['index.html'],
              dest: 'dist/dojo/viewer2',
              expand: true
          }
      },
      clean: {
          build: {
              src: ['dist/grunt/viewer']
          },
          dojo: {
              src: ['dist/dojo/viewer2']
          }
      },
      autoprefixer: {
          build: {
              expand: true,
              cwd: 'dist/grunt/viewer',
              src: ['**/*.css'],
              dest: 'dist/grunt/viewer'
          }
      },
      cssmin: {
          build: {
              expand: true,
              cwd: 'dist/grunt/viewer',
              src: ['**/*.css'],
              dest: 'dist/grunt/viewer'
          }
      },
      jshint: {
          build: {
              //cwd: 'src/cmv',
              src: ['src/cmv/**/*.js', '!**/package.*'],
              options: {
                  jshintrc: '.jshintrc',
                  reporter: require('jshint-stylish')
              }
          }
      },
      uglify: {
          build: {
              files: [{
                  expand: true,
                  cwd: 'dist/grunt/viewer',
                  src: ['**/*.js', '!**/config/**'],
                  dest: 'dist/grunt/viewer',
                  ext: '.js'
              }],
              options: {
                  banner: '<%= tag.banner %>',
                  sourceMap: true,
                  sourceMapIncludeSources: true,
                  compress: {
                      drop_console: true
                  }
              }
          }
      },
      watch: {
          dev: {
              files: ['src/cmv/**'],
              tasks: ['jshint']
          },
          build: {
              files: ['dist/grunt/viewer/**'],
              tasks: ['jshint']
          }
      },
      connect: {
          dev: {
              options: {
                  port: 3000,
                  base: 'src',
                  hostname: '*',
                  middleware: middleware
              }
          },
          build: {
              options: {
                  port: 3001,
                  base: 'dist/grunt/viewer',
                  hostname: '*',
                  middleware: middleware
              }
          }
      },
      open: {
          dev_browser: {
              path: 'http://localhost:3000/index-dev.html'
          },
          build_browser: {
              path: 'http://localhost:3001/index-dev.html'
          }
      },
      compress: {
          build: {
              options: {
                  archive: 'dist/grunt/viewer.zip'
              },
              files: [{
                  expand: true,
                  cwd: 'dist/grunt/viewer',
                  src: ['**', '!**/dijit.css']
              }]
          }
      },
      esri_slurp: {
          options: {
            version: '3.13'
          },
          dev: {
            options: {
              beautify: true
            },
            dest: 'src/esri'
          }
      },
      dojo: {
          prod: {
              options: {
                  profiles: ['profiles/viewer.profile.js']
              }
          },
          options: {
              releaseDir: '../dist/dojo/viewer2',
              dojo: 'src/dojo/dojo.js',
              load: 'build'
          }
      },
      htmlmin: {
          dojo: {
              files: [{
                  cwd: 'src',
                  expand: true,
                  src: ['index.html'],
                  dest: 'dist/dojo/viewer2'
              }],
              options: {
                  collapseWhitespace: true,
                  minifyCSS: true,
                  minifyJS: true,
                  removeComments: true
              }
          }
      }
  });

  // load the tasks
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-newer');
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-esri-slurp');
    grunt.loadNpmTasks('grunt-dojo');

    // define the tasks
    grunt.registerTask('default', 'Watches the project for changes, automatically builds them and runs a web server and opens default browser to preview.', ['jshint', 'connect:dev', 'open:dev_browser', 'watch:dev']);
    grunt.registerTask('build', 'Compiles all of the assets and copies the files to the build directory.', ['clean', 'copy', 'scripts', 'stylesheets', 'compress:build']);
    grunt.registerTask('build-view', 'Compiles all of the assets and copies the files to the build directory starts a web server and opens browser to preview app.', ['clean', 'copy', 'scripts', 'stylesheets', 'compress:build', 'connect:build', 'open:build_browser', 'watch:build']);
    grunt.registerTask('scripts', 'Compiles the JavaScript files.', ['jshint', 'uglify']);
    grunt.registerTask('stylesheets', 'Auto prefixes css and compiles the stylesheets.', ['autoprefixer', 'cssmin']);
    grunt.registerTask('hint', 'Run simple jshint.', ['jshint']);
    grunt.registerTask('slurp', 'Download the esri amd style api.', ['esri_slurp:dev']);
    grunt.registerTask('dojo-build', 'Building using dojo\'s build system', ['clean:dojo','htmlmin:dojo','dojo:prod']);

};