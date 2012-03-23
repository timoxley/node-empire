'use strict'

var assert = require('assert')
var url = require('url')

var _ = require('underscore')
var restify = require('restify')

describe('client', function() {
  var EmpireClient = require('../index')
  describe('public properties', function() {
    it('reveals submitInfo function', function() {
      assert.ok(typeof EmpireClient.submitInfo, 'function')
    })
  })
  describe('operations', function() {
    var oldCwd
    before(function() {
      oldCwd = process.cwd()
      process.chdir('./tests/fixtures/fixture_module')
    })
    after(function() {
      process.chdir(oldCwd)
    })
    describe('project info', function() {
      var info
      before(function(done) {
        EmpireClient._getProjectInfo(function(err, infoData) {
          info = infoData
          done(err)
        })
      })
      it('can get basic project info', function() {
        // get reference module
        var moduleInfo = require('./fixtures/fixture_module')
        assert.equal(info.name, moduleInfo.name)
        assert.equal(info.description, moduleInfo.description)
      })
      it('can get correct dependencies with versions', function() {
        assert.deepEqual(_.pluck(info.dependencies, 'name'), ['async', 'underscore'])
        assert.equal(info.dependencies.async.version, '0.1.18')
        assert.equal(info.dependencies.underscore.version, '1.3.1')
      })
      it('only gets minimal info about dependencies', function() {
        // Note we might grab more info later
        assert.deepEqual(Object.keys(info.dependencies.underscore), ['name', 'version'])
      })
    })
    it('can get system info', function(done) {
      EmpireClient._getSystemInfo(function(err, info) {
        assert.ok(!err)
        for (var item in info) {
          assert.notEqual(item, null)
        }
        assert.deepEqual(Object.keys(info), EmpireClient.systemInfoWhitelist)
        done()
      })
    })
    describe('submission', function() {
      var server
      before(function() {
        server = restify.createServer() 
        server.use(restify.acceptParser(server.acceptable))
        server.use(restify.bodyParser())
        server.use(restify.queryParser())
      })
      it('submits package info to server', function(done) {
        
        server.post('/submit', function(req, res) {
          var payload = req.params
          assert.ok(payload.system)
          assert.ok(payload.project)
          assert.ok(payload.project.dependencies)
          assert.ok(payload.project.dependencies.async)

          res.send()
        })
        server.listen(url.parse(EmpireClient.REMOTE_ADDR).port)

        EmpireClient.submitInfo(function(err, payload) {
          // TODO mock this better
          assert.ifError(err)
          done()
        })
      })
    })
  })
})
