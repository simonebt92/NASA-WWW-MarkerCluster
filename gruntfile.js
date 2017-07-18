module.exports = function (grunt) {
    grunt.initConfig({
        requirejs: {
            compile: {
                options: {
                    preserveLicenseComments: false,
                    paths: {
                        bootstrap: '../example/js/bootstrap.min',
                        jquery: '../example/js/jquery.min'
                    },
                    baseUrl: 'src',
                    name: '../tools/almond',
                    include: ['../example/main'],
                    out: 'main.min.js',
                    insertRequire: ['../example/main'],
                    wrapShim: true,
                    wrap: {
                        startFile: 'tools/wrap.start',
                        endFile: 'tools/wrap.end'
                    }

                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.registerTask('default', ['requirejs']);

};