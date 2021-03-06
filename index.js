'use strict'

const HOUR = 1000*60*60
const DAY = HOUR*24
const WEEK = DAY*7

const Hapi = require('hapi')
const StatusRepository = require('./lib/StatusRepository')
const server = new Hapi.Server()

server.connection({
  host: '0.0.0.0',
  port: process.env.PORT || 3000
})
server.register(require('inert'), (err) => {
  if (err) {
    throw err
  }
})
server.route({
  method: 'GET',
  path:'/assets/index.js',
  handler: function (request, reply) {
    return reply.file('./assets/index.js');
  }
})
server.route({
  method: 'GET',
  path:'/assets/index.css',
  handler: function (request, reply) {
    return reply.file('./assets/index.css');
  }
})
server.route({
  method: 'GET',
  path:'/assets/theme.dark.css',
  handler: function (request, reply) {
    return reply.file('./assets/theme.dark.css');
  }
})
server.route({
  method: 'GET',
  path:'/statuses',
  handler: function (request, reply) {
    const from = parseFrom(request.url.query.from)
    return StatusRepository.latest(from)
    .then((results) => {
      reply(results)
    })
    .catch((err) => {
      console.log('-- catch', err.message)
      reply({}).code(500)
    })
  }
})
server.route({
  method: 'GET',
  path:'/past/{type}',
  handler: function (request, reply) {
    return reply.file('./index.html');
  }
})
server.route({
  method: 'GET',
  path:'/',
  handler: function (request, reply) {
    return reply.file('./index.html');
  }
})
server.start((err) => {
  if (err) {
    throw err
  }
  console.log('Server running at:', server.info.uri)
})


function parseFrom(from) {
  if(!from) {
    return
  }
  if(/\d+hago/.test(from)) {
    const hoursAgo = from.match(/(\d)+hago/)[1]
    return Date.now()-HOUR*hoursAgo
  }
  if(/\d+dago/.test(from)) {
    const daysAgo = from.match(/(\d)+dago/)[1]
    return Date.now()-DAY*daysAgo
  }
  if(/\d+wago/.test(from)) {
    const weeksAgo = from.match(/(\d)+wago/)[1]
    return Date.now()-WEEK*weeksAgo
  }
}
