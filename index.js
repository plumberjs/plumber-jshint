var operation = require('plumber').operation;
var Report = require('plumber').Report;
var RcLoader = require('rcloader');
var highland = require('highland');

var jshint = require('jshint').JSHINT;


function createReport(params) {
    return new Report(params);
}

function identity(x) {
    return x;
}


module.exports = function() {
    return operation(function(resources) {
        return resources.flatMap(function(resource) {
            var rcLoader = new RcLoader('.jshintrc', {}, {
                loader: function (path) {
                    var jshintcli = require('jshint/src/cli');
                    var config = jshintcli.loadConfig(path);
                    // Redundant property added by JSHint
                    delete config.dirname;
                    return config;
                }
            });

            var loadRcConfigFor = highland.wrapCallback(rcLoader.for);
            return loadRcConfigFor(resource.path().absolute()).map(function (rcConfig) {
                var globals;
                if (rcConfig.globals) {
                  globals = rcConfig.globals;
                  delete rcConfig.globals;
                }

                // FIXME: jshint not concurrency-safe? use serial map?
                var success = jshint(resource.data(), rcConfig, globals);
                return createReport({
                    resource: resource,
                    type: 'test',
                    success: success,
                    // for some reason, sometimes get `null' in the list
                    errors: jshint.errors.filter(identity).map(function(error) {
                        return {
                            line: error.line,
                            column: error.character,
                            message: error.code + ': ' + error.raw,
                            context: error.evidence
                        };
                    })
                });
            });
        });
    });
};
