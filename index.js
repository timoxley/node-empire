'use strict'

var restify = require('restify');
var path = require('path')
var _ = require('underscore')
var settings = require('./config').settings

var Client = function() {

}

Client.REMOTE_ADDR = settings.url

function filterAllPropertiesExcept(object, properties, depth) {
  var result = {}
  if (!depth) depth = 0
  _.each(object, function(value, key) {
    if (key === 'dependencies') {
      if (depth > 0) return
      result[key] = {}
      _.each(object[key], function(value, dep) {
        if (!value.private) {
          result[key][dep] = filterAllPropertiesExcept(value, ['name', 'version'], 1)
        }
      })
    } else {
      properties.forEach(function(property) {
        if (property === key && object[property]) {
          result[key] = object[property]
        }
      })
    }
  })
  return result
}

Client._getProjectInfo = function(callback) {
  var exec = require('child_process').exec
  exec(path.join(__dirname, './node_modules/.bin/npm') + ' ls --json --long --depth 1', function(err, stdout, stderr) {
    //process.stdout.write(stdout)
    if (err) return callback(err)
    var allProjectInfo
    try {
      allProjectInfo = JSON.parse(stdout)
    } catch (err) {
      callback(err)
    }

    if (allProjectInfo) {
      // only grab whitelisted properties
      var projectInfo = {}
      projectInfo = filterAllPropertiesExcept(allProjectInfo, Client.projectInfoWhitelist)

      callback(null, projectInfo)
    } else {
      callback(new Error('Problem getting projectInfo.'))
    }
  })
}

Client._getSystemInfo = function(callback) {
  var systemInfo = {}
  Client.systemInfoWhitelist.forEach(function(key) {
    if (typeof process[key] === 'function') {
      systemInfo[key] = process[key]()
    } else {
      systemInfo[key] = process[key]
    }
  })
  callback(null, systemInfo)
}

Client.projectInfoWhitelist = [
  'name',
  'version',
  'description',
  'dependencies',
  'engines',
  'homepage',
  'keywords'
]

Client.systemInfoWhitelist = [
  'arch',
  'platform',
  'versions',
  'memoryUsage',
  'uptime'
]

Client.submitInfo = function(callback) {
  // Creates a JSON client
  var client = restify.createJsonClient({
    url: settings.url
  })

  Client._getSystemInfo(function(err, systemInfo) {
    if (err) callback(err)
    Client._getProjectInfo(function(err, projectInfo) {
      if (err) callback(err)
      var payload = {
        system: systemInfo,
        project: projectInfo
      }
      client.post('/submit', payload, function(err, req, res) {
        callback(err, payload)
      })
    })
  })
}
module.exports = exports = Client
