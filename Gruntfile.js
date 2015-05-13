module.exports = function(grunt) {

  // grunt task config
  grunt.initConfig({
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
    }
  });

  // load the tasks
  grunt.loadNpmTasks('grunt-esri-slurp');

  // define the tasks
  grunt.registerTask('slurp', 'Download the esri amd style api.', ['esri_slurp:dev']);

};