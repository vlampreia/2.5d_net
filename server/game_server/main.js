'use strict'

const Server = require('./server.js')

const server = new Server()

const entities = []


server.run()

//const uuid = require('uuid')
//const io = require('socket.io')()
//
//const NET_TICK_RATE_MS = 100
//
//const players = []
//const clients = []
//
//io.on('connection', (client) => {
//  console.log('got connection')
//
//  let client_id = null
//
//  console.log('wait identify')
//
//  client.on('disconnect', () => {
//    if (!client_id) { return }
//    console.log('process disconnect of ', client_id)
//    const pi = players.findIndex(p => p.id === client_id)
//    const ci = clients.findIndex(c => c.id === client_id)
//
//    clients.forEach(existing_client => {
//      existing_client.socket.emit('player_disconnect', players[pi].id)
//    })
//
//    players.splice(pi, 1)
//    clients.splice(ci, 1)
//  })
//
//  client.on('identify', (data) => {
//    client_id = data
//
//    const player = {
//      id: client_id,
//      pos: {
//        x: 50,
//        y: 50,
//      }
//    }
//
//    players.push(player)
//
//    console.log(clients)
//    clients.forEach(existing_client => {
//      const p = players.find(p => p.id === existing_client.id)
//      client.emit('player_join', p)
//      existing_client.socket.emit('player_join', player)
//    })
//
//    clients.push({
//      id: client_id,
//      socket: client,
//    })
//
//    client.emit('player_join', player)
//  })
//
//  client.on('player_input', (data) => {
//    if (!client_id) { return }
//
//    console.log('srv recv: ', JSON.stringify(data))
//    const e = data.e
//    const player = players.find((p) => p.id === client_id)
//    player_logic_stuff(player, e)
//  })
//})
//
//
//io.listen(3000)
//
//const player_logic_stuff = (player, e) => {
//  if (e.keyCode == 65) {
//    player.pos.x += 10
//    player.pos.y += 10
//  }
//}
//
//const run = () => {
//  const time = new Date().getTime()
//  //console.log('loop', time)
//
//  //players.forEach((player, i) => {
////  const player = players[1]
////  const i = 1
////    if (player.pos.x >= 500) player.dir = -1
////    if (player.pos.x <= 50 * (i + 1)) player.dir = 1
////    player.pos.x += 10 * (i + 1) * player.dir
//  //})
//
//  //Object.keys(io.sockets.sockets).forEach((skey) => {
//  clients.forEach(client => {
//    const client_socket = client.socket
//    //const client = io.sockets.sockets[skey]
//    //const player = players[1]
//
//    players.forEach((player, i) => {
//      //if (client.id === player.id) { return }
//
//      //console.log('emit event ', player.id, 'to', client.id)
//      client_socket.emit('event', {
//        time,
//        event_type: 'player_move',
//        e: {
//          id: player.id,
//          pos: player.pos,
//        }
//      })
//    })
//    //client.emit('state', {
//    //  time,
//    //  state: {
//    //    players
//    //  }
//    //})
//  })
//
//  const total_time = new Date().getTime() - time
//  const dt = NET_TICK_RATE_MS - total_time
//  setTimeout(run, dt > 0 ? dt : 0)
//}

//run()
