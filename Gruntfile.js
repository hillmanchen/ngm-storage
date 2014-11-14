module.exports = function (grunt) {

  'use strict';

  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      dist: {
        files: {
          'build/ngm-storage.js': [
            // 有顺序要求
            './src/builder.js',
            './src/base.js',
            './src/localStorage.js',
            './src/webSQL.js',
            './src/indexedDB.js',
            './src/mgr.js'
          ]
        },
        options: {
          wrap: true
        }
      }
    }
  });

  grunt.registerTask('build', 'uglify');
};