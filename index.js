var Report = require('plumber').Report;

var mapEachResource = require('plumber').mapEachResource;

var jshint = require('jshint').JSHINT;


function createReport(params) {
    return new Report(params);
}


module.exports = function() {
    return mapEachResource(function(resource) {
        // TODO: if necessary, expose as operation parameters
        var options = {};
        var globals;

        // FIXME: jshint not concurrency-safe? use serial map?
        var success = jshint(resource.data(), options, globals);
        return createReport({
            resource: resource,
            type: 'test',
            success: success,
            errors: jshint.errors.map(function(error) {
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
