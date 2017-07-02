module.exports = function (config) {
    config.set({

        basePath: '../',

        frameworks: ['jasmine', 'requirejs'],

        files: [
            'test/test-main.js',
            {pattern: 'test/*.js', included: false},
            {pattern: 'src/MarkerCluster.js', included: false},
            {pattern: 'libraries/supercluster.min.js', included: false},
            {pattern: 'libraries/WorldWind/*.js', included: false},
            {pattern: 'libraries/WorldWind/**/*.js', included: false},
        ],

        exclude: [],

        preprocessors: {},
        reporters: ['progress'],

        port: 9876,

        colors: true,

        logLevel: config.LOG_INFO,

        autoWatch: true,

        browsers: ['Chrome'],

        singleRun: false,

        concurrency: Infinity
    })
}
