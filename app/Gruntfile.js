'use strict';

module.exports = function (grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Configurable paths for the application
  var appConfig = {
    app: require('./bower.json').appPath || 'app',
    gen: require('./bower.json').genPath || 'src-gen',
    version: require('./bower.json').version || '1.5.0',
    bowerPath: require('./bower.json').bowerPath || 'bower_components',
    test: require('./bower.json').testPath || 'test',
    dist: require('./bower.json').distPath || 'dist',
    build: require('./package.json').build || {}
  };

  // Define the configuration for all the tasks
  grunt.initConfig({

    // Project settings
    yeoman: appConfig,

    // Watches files for changes and runs tasks based on the changed files
    watch: {
      bower: {
        files: ['bower.json'],
        tasks: ['wiredep']
      },
      js: {
        files: ['<%= yeoman.app %>/scripts/{,*/}*.js'],
        tasks: ['newer:jshint:all'],
        options: {
          livereload: '<%= connect.options.livereload %>'
        }
      },
      sass: {
        files: ['<%= yeoman.app %>/styles/{,*/}*.{scss,sass}'],
        tasks: ['sass', 'autoprefixer']
      },
      jsTest: {
        files: ['test/spec/{,*/}*.js'],
        tasks: ['newer:jshint:test', 'karma']
      },
      styles: {
        files: ['<%= yeoman.app %>/styles/{,*/}*.css'],
        tasks: ['newer:copy:styles', 'autoprefixer']
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '<%= yeoman.app %>/{,*/}*.html',
          '.tmp/styles/{,*/}*.css',
          '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }
    },

    // The actual grunt server settings
    connect: {
      options: {
        port: 9000,
        // Change this to '0.0.0.0' to access the server from outside.
        hostname: 'localhost',
        livereload: 35729
      },
      livereload: {
        options: {
          open: true,
          middleware: function (connect) {
            return [
              connect.static('.tmp'),
              connect().use('/bower_components', connect.static('./bower_components')),
              connect().use('/fonts', connect.static('./bower_components/ionic/release/fonts')),
              connect().use('/app/styles', connect.static('./app/styles')),
              connect.static(appConfig.app),
              require('grunt-connect-proxy/lib/utils').proxyRequest
            ];
          }
        }
      },
      test: {
        options: {
          port: 9001,
          middleware: function (connect) {
            return [
              connect.static('.tmp'),
              connect.static('test'),
              connect().use('/bower_components', connect.static('./bower_components')),
              connect.static(appConfig.app)
            ];
          }
        }
      },
      dist: {
        options: {
          open: true,
          base: '<%= yeoman.dist %>'
        }
      }
    },

    // Make sure code styles are up to par and there are no obvious mistakes
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: {
        src: [
          'Gruntfile.js',
          '<%= yeoman.app %>/scripts/{,*/}*.js'
        ]
      },
      test: {
        options: {
          jshintrc: '<%= yeoman.test %>/.jshintrc'
        },
        src: ['<%= yeoman.test %>/spec/{,*/}*.js']
      }
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= yeoman.dist %>/{,*/}*',
            '!<%= yeoman.dist %>/.git{,*/}*'
          ]
        }]
      },
      server: '.tmp'
    },

    // Compiles Sass to CSS and generates necessary files if requested

    sass: {
      dist: {
        options: {
          sourceMap: true,
          style: 'expanded',
          includePaths: [
            'bower_components/compass-mixins/lib/'
          ]
        },
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/styles',
          src: ['**/*.scss'],
          dest: '.tmp/styles',
          ext: '.css'
        }]
      }

    },

    // Add vendor prefixed styles
    autoprefixer: {
      options: {
        browsers: ['last 1 version']
      },
      server: {
        options: {
          map: true,
        },
        files: [{
          expand: true,
          cwd: '.tmp/styles/',
          src: '{,*/}*.css',
          dest: '.tmp/styles/'
        }]
      },
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/styles/',
          src: '{,*/}*.css',
          dest: '.tmp/styles/'
        }]
      }
    },

    // Automatically inject Bower components into the app
    wiredep: {
      app: {
        src: ['<%= yeoman.app %>/index.html'],
        ignorePath: /\.\.\.\//
      },
      test: {
        devDependencies: true,
        src: '<%= karma.unit.configFile %>',
        ignorePath: /\.\.\.\//,
        fileTypes: {
          js: {
            block: /(([\s\t]*)\/{2}\s*?bower:\s*?(\S*))(\n|\r|.)*?(\/{2}\s*endbower)/gi,
            detect: {
              js: /'(.*\.js)'/gi
            },
            replace: {
              js: '\'{{filePath}}\','
            }
          }
        }
      }
    },

    // Renames files for browser caching purposes
    filerev: {
      dist: {
        src: [
          '<%= yeoman.dist %>/scripts/{,*/}*.js',
          '<%= yeoman.dist %>/styles/{,*/}*.css',
          '<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }
    },

    // Reads HTML for usemin blocks to enable smart builds that automatically
    // concat, minify and revision files. Creates configurations in memory so
    // additional tasks can operate on them
    useminPrepare: {
      html: '<%= yeoman.app %>/index.html',
      options: {
        dest: '<%= yeoman.dist %>',
        flow: {
          html: {
            steps: {
              js: ['concat', 'uglify'],
              css: ['cssmin']
            },
            post: {}
          }
        }
      }
    },

    // Performs rewrites based on filerev and the useminPrepare configuration
    usemin: {
      html: ['<%= yeoman.dist %>/{,*/}*.html'],
      css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
      options: {
        assetsDirs: [
          '<%= yeoman.dist %>',
          '<%= yeoman.dist %>/images',
          '<%= yeoman.dist %>/styles'
        ]
      }
    },
    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/images',
          src: '{,*/}*.{png,jpg,jpeg,gif}',
          dest: '<%= yeoman.dist %>/images'
        }]
      }
    },

    svgmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/images',
          src: '{,*/}*.svg',
          dest: '<%= yeoman.dist %>/images'
        }]
      }
    },

    htmlmin: {
      dist: {
        options: {
          collapseWhitespace: true,
          conservativeCollapse: true,
          collapseBooleanAttributes: true,
          removeCommentsFromCDATA: true,
          removeOptionalTags: true
        },
        files: [{
          expand: true,
          cwd: '<%= yeoman.dist %>',
          src: ['*.html', 'views/{,*/}*.html'],
          dest: '<%= yeoman.dist %>'
        }]
      }
    },

    // ng-annotate tries to make the code safe for minification automatically
    // by using the Angular long form for dependency injection.
    ngAnnotate: {
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/concat/scripts',
          src: '*.js',
          dest: '.tmp/concat/scripts'
        }]
      }
    },

    // Replace Google CDN references
    cdnify: {
      dist: {
        html: ['<%= yeoman.dist %>/*.html']
      }
    },

    replace: {
      server: {
        src: ['.tmp/styles/*.css'],// source files array (supports minimatch)
        dest: '.tmp/styles/',// destination directory or file
        replacements: [{
          from: 'fonts/',// string replacement
          to: 'bower_components/ionic/release/fonts/'
        }]

      }
    },

    // Copies remaining files to places other tasks can use
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= yeoman.app %>',
          dest: '<%= yeoman.dist %>',
          src: [
            '*.{ico,png,txt}',
            '.htaccess',
            '*.html',
            'scripts/cordova*.js',
            '*.json',
            'scripts/webworker*.js',
            'templates/{,*/}*.html',
            'views/{,*/}*.html',
            'images/{,*/}*.{webp}',
            'styles/fonts/{,*/}*.*'
          ]
        }, {
          expand: true,
          dot: true,
          cwd: '<%= yeoman.gen %>',
          dest: '<%= yeoman.dist %>',
          src: [
            '*.{ico,png,txt}',
            '.htaccess',
            'config.json',
            'images/{,*/}*.*',
            'styles/fonts/*',
            '*.js'
          ]
        }, {
          expand: true,
          cwd: '.tmp/images',
          dest: '<%= yeoman.dist %>/images',
          src: ['generated/*']
        }, {
          expand: true,
          cwd: 'bower_components/ionic/release/fonts/',
          src: '*',
          dest: '<%= yeoman.dist %>/fonts'
        }]
      }
    },

    // Run some tasks in parallel to speed up the build process
    concurrent: {
      server: [],
      test: [],
      dist: [
        'imagemin',
        'svgmin'
      ]
    },

    // Test settings
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true
      },

      dev: {
        configFile: 'karma.conf.js',
        singleRun: false,
        autoWatch: true
      }
    },

    open: {
      karma: {
        path: 'http://127.0.0.1:9080',
        options: {
          delay: 2000
        }
      }
    },
    plato: {
      report: {
        files: {
          'target/plato-report': ['<%= yeoman.app %>/scripts/**/*.js']
        }
      }
    },
    shell: {
      options: {
        failOnError: true,
        stdout: true,
        stderr: true,
        execOptions: {
          maxBuffer: Infinity
        }
      },
      buildIOS: {
        command: 'cordova build ios --release --device'
      },
      buildAndroid: {
        command: 'cp "<%= yeoman.build.android.ant_property_file %>" "$(pwd)/platforms/android/release-signing.properties" && cp "<%= yeoman.build.android.android_keystore %>" "$(pwd)/platforms/android/android_keystore" && cordova build android --release'
      },
      prepare: {
        command: 'cordova prepare'
      },
      buildIPA: {
        command: 'cp "/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk/ResourceRules.plist" "$(pwd)/platforms/ios/build/device/Flynn.app" && xcrun -sdk iphoneos PackageApplication -v "$(pwd)/platforms/ios/build/device/Flynn.app" -o "$(pwd)/target/Flynn_<%= yeoman.version %>.ipa" --sign "<%= yeoman.build.ios.signer %>" --embed "<%= yeoman.build.ios.provisionProfile %>"'
      },
      buildAPK: {
        command: 'cp "$(pwd)/platforms/android/build/outputs/apk/android-release.apk" "$(pwd)/target/Flynn_<%= yeoman.version %>.apk"'
      },
      prepareNW: {
        command: 'touch "<%= yeoman.dist %>/cordova.js" && touch "<%= yeoman.dist %>/cordova_plugins.js"'
      }
    },
    nodewebkit: {
      options: {
        version: "0.12.3",
        appName: "<%= yeoman.name %>",
        appVersion: "<%= yeoman.version %>",
        main: "index.html",
        platforms: ['win32', 'win64', 'osx32', 'osx64', 'linux32', 'linux64'],
        buildDir: './target/desktop',
        icon: './etc/icon.png'/*,
         macIcns: './etc/icon.icns',
         winIco: './etc/icon.ico'*/
      },
      src: ['./www/**/*'] // Your node-webkit app
    }
  });

  grunt.registerTask('buildIPA', ['build', 'shell:buildIOS', 'shell:buildIPA']);
  grunt.registerTask('buildAPK', ['build', 'shell:buildAndroid', 'shell:buildAPK']);
  grunt.registerTask('buildCordova', ['build', 'shell:buildAndroid', 'shell:buildIOS']);
  grunt.registerTask('buildDesktop', ['build', 'shell:prepareNW', 'nodewebkit']);

  grunt.registerTask('serve', 'Compile then start a connect web server', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'clean:server',
      'wiredep',
      'sass',
      'configureProxies:server',
      'concurrent:server',
      'replace:server',
      'autoprefixer:server',
      'connect:livereload',
      'watch'
    ]);
  });

  grunt.registerTask('server', 'DEPRECATED TASK. Use the "serve" task instead', function (target) {
    grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
    grunt.task.run(['serve:' + target]);
  });

  grunt.registerTask('test', [
    'clean:server',
    'wiredep',
    'concurrent:test',
    'autoprefixer',
    'connect:test',
    'karma:unit'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'wiredep',
    'sass',
    'useminPrepare',
    'concurrent:dist',
    'autoprefixer',
    'concat',
    'ngAnnotate',
    'cssmin',
    'uglify',
    'filerev',
    'copy:dist',
    'usemin',
    'htmlmin'
  ]);

  grunt.registerTask('debug', [
    'open:karma',
    'karma:dev'
  ]);

  grunt.registerTask('check', [
    'jshint',
    'build'
  ]);

  grunt.registerTask('default', [
    'check'
  ]);
};

