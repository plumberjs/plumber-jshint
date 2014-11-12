var plumber = require('plumber');
var operation = plumber.operation;
var Report = plumber.Report;

var jshint = require('jshint').JSHINT;


function createReport(params) {
    return new Report(params);
}

function identity(x) {
    return x;
}

var jshintcli = require('jshint/src/cli');

module.exports = function() {
    return operation.map(function(resource) {
        var config = jshintcli.getConfig(resource.path().absolute());
        // Redundant property added by JSHint
        delete config.dirname;

        var globals;
        if (config.globals) {
          globals = config.globals;
          delete config.globals;
        }

        // FIXME: jshint not concurrency-safe? use serial map?
        var success = jshint(resource.data(), config, globals);
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
};
