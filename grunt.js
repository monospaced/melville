/*global module:false*/
module.exports = function(grunt) {
  'use strict';
  // Project configuration.
  grunt.initConfig({
    meta: {
      version: '0.1.0',
      banner: '/*! Melville - v<%= meta.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '* http://scottboyle.co.uk/\n' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
        'Monospaced; Licensed MIT */'
    },
    lint: {
      files: ['grunt.js', '<config:concat.js.dest>']
    },
    concat: {
      js: {
        src: ['<banner:meta.banner>',
              '<file_strip_banner:functions.js>',
              '<file_strip_banner:wikifier.js>',
              '<file_strip_banner:fx.js>',
              '<file_strip_banner:history.js>',
              '<file_strip_banner:macros.js>',
              '<file_strip_banner:passage.js>',
              '<file_strip_banner:tale.js>',
              '<file_strip_banner:init.js>'],
        dest: 'templates/script.js'
      },
      dist: {
        src: ['<file_strip_banner:templates/head.html>',
              '<config:cssmin.dist.dest>',
              '<file_strip_banner:templates/separator.html>',
              '<config:min.dist.dest>',
              '<file_strip_banner:templates/body.html>'],
        dest: 'header.html'
      }
    },
    min: {
      dist: {
        src: ['<config:concat.js.dest>'],
        dest: 'templates/script.min.js'
      }
    },
    cssmin: {
      dist: {
        src: 'style.css',
        dest: 'templates/style.min.css'
      }
    },
    watch: {
      files: ['**/*.*',
              '*.*'],
      tasks: 'concat:js min cssmin concat:dist'
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        forin: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        //nonew: true,
        quotmark: 'single',
        sub: true,
        undef: true,
        unused: true,
        strict: true,
        trailing: true,
        browser: true,
        devel: true,
        evil: true
      },
      globals: {}
    },
    uglify: {
      codegen: {
        ascii_only: true
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-css');
  
  // Default task.
  grunt.registerTask('default', 'concat:js lint min cssmin concat:dist');

};
