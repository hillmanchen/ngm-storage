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
            './src/common/moduleMgr.js',
            './src/modules/base.js',
            './src/modules/localStorage.js',
            './src/modules/webSQL.js',
            './src/modules/indexedDB.js',
            './src/api.js'
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