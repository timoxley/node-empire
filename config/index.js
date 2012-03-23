'use strict'
var auto_nconf = require('./auto_nconf')
var mongoose = require('mongoose')

// create main settings configuration
var settings = exports.settings = auto_nconf.createConfiguration('settings', __dirname)
exports.settings.url = 'http://' + settings.hostname + ':' + settings.port

var environment = process.env.NODE_ENV = auto_nconf.detectEnvironment()

var dbURL = settings.db + '_' + environment

var connectTimeout, writeDots
mongoose.connection.once('open', function() {
  console.info('DB connected on ' + dbURL)
  clearTimeout(connectTimeout)
  clearInterval(writeDots)
})

mongoose.connection.once('opening', function() {
  console.info('Opening DB on ' + dbURL)
  writeDots = setInterval(function() {
    process.stdout.write('.')
  }, 500)
  connectTimeout = setTimeout(function() {
    clearInterval(writeDots)
    console.info('\nConnection timeout on ' + dbURL + '! \nHave you started mongod?')
    process.exit(1)
  }, 60000)
})
mongoose.connection.once('error', function(err) {
  clearInterval(writeDots)
  console.info('Connection error on ' + dbURL)
  console.info(arguments)
  process.exit(1)
})

mongoose.connection.once('close', function() {
  console.info("Mongoose disconnected")
})

exports.db = mongoose.connect(dbURL)
