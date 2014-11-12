var chai = require('chai');
chai.should();


var runOperation = require('plumber-util-test').runOperation;
var completeWithResources = require('plumber-util-test').completeWithResources;

var Resource = require('plumber').Resource;
var Report = require('plumber').Report;

var jshint = require('..');

function createResource(params) {
    return new Resource(params);
}

function resourcesError() {
    chai.assert(false, "error in resources observable");
}


describe('jshint', function(){
    it('should be a function', function(){
        jshint.should.be.a('function');
    });

    it('should return a function', function(){
        jshint().should.be.a('function');
    });


    describe('passed valid JavaScript', function() {
        var output;
        var resource;

        beforeEach(function() {
            resource = createResource({path: 'path/to/file.js', type: 'javascript', data: 'var x = 1;\nvar y = 4;'});
            output = runOperation(jshint(), [resource]).resources;
        });


        it('should return a successful report', function(done){
            completeWithResources(output, function(reports) {
                reports.length.should.equal(1);
                reports[0].should.be.instanceof(Report);
                reports[0].type.should.equal('test');
                reports[0].success.should.equal(true);
                reports[0].errors.length.should.equal(0);
            }, resourcesError, done);
        });
    });


    describe('passed invalid JavaScript', function() {
        var output;
        var resource;

        beforeEach(function() {
            resource = createResource({path: 'path/to/file.js', type: 'javascript', data: 'var x = 1\nvar y = 4'});
            output = runOperation(jshint(), [resource]).resources;
        });


        it('should return a report of failure', function(done){
            completeWithResources(output, function(reports) {
                reports.length.should.equal(1);
                reports[0].should.be.instanceof(Report);
                reports[0].type.should.equal('test');
                reports[0].success.should.equal(false);
                reports[0].writtenResource.should.equal(resource);
            }, resourcesError, done);
        });

        it('should return all the errors', function(done){
            completeWithResources(output, function(reports) {
                reports[0].errors.length.should.equal(2);
                reports[0].errors.should.deep.equal([{
                    line: 1,
                    column: 10,
                    message: 'W033: Missing semicolon.',
                    context: 'var x = 1'
                }, {
                    line: 2,
                    column: 10,
                    message: 'W033: Missing semicolon.',
                    context: 'var y = 4'
                }]);
            }, resourcesError, done);
        });

    });


    describe('passed two invalid JavaScript resources', function() {
        var output;
        var resource1;
        var resource2;

        beforeEach(function() {
            resource1 = createResource({path: 'path/to/file.js', type: 'javascript', data: 'var x = 1\nvar y = 4'});
            resource2 = createResource({path: 'path/to/other.js', type: 'javascript', data: 'var foo = "bar"'});
            output = runOperation(jshint(), [resource1, resource2]).resources;
        });


        it('should return a report of failure for each resource', function(done){
            completeWithResources(output, function(reports) {
                reports.length.should.equal(2);
                reports[0].should.be.instanceof(Report);
                reports[0].type.should.equal('test');
                reports[0].success.should.equal(false);
                reports[0].writtenResource.should.equal(resource1);
                reports[1].should.be.instanceof(Report);
                reports[1].type.should.equal('test');
                reports[1].success.should.equal(false);
                reports[1].writtenResource.should.equal(resource2);
            }, resourcesError, done);
        });

        it('should return all the errors', function(done){
            completeWithResources(output, function(reports) {
                reports[0].errors.length.should.equal(2);
                reports[0].errors.should.deep.equal([{
                    line: 1,
                    column: 10,
                    message: 'W033: Missing semicolon.',
                    context: 'var x = 1'
                }, {
                    line: 2,
                    column: 10,
                    message: 'W033: Missing semicolon.',
                    context: 'var y = 4'
                }]);

                reports[1].errors.length.should.equal(1);
                reports[1].errors.should.deep.equal([{
                    line: 1,
                    column: 16,
                    message: 'W033: Missing semicolon.',
                    context: 'var foo = "bar"'
                }]);
            }, resourcesError, done);
        });

    });
});
