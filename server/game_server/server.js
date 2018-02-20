'use strict'

const uuid = require('uuid')
//const Engine = require('engine')
const EventManager = require('./eventManager.js')
const Network = require('./network.js')

class Server {
  constructor() {
    this.event_manager = new EventManager()
    this.network = new Network(this.event_manager)

    this.players = []
    this.blocks = []
    this.starbases = [
      {
        docked: 0
      }
    ]

//    this.event_manager.add_listener(
//      'net_client_open', this.handle_client_join.bind(this)
//    )

    this.event_manager.add_listener(
      'net_client_close', this.handle_client_leave.bind(this)
    )

    this.event_manager.add_listener(
      'player_action', this.handle_player_action.bind(this)
    )

    this.event_manager.add_listener(
      'in_player_move', this.handle_player_move_action.bind(this)
    )

    //this.network.add_listener('player_action', (e) => {
    //  this.event_manager.push_event('player_action', { e })
    //})

    this.network.add_listener('login', (e) => {
      console.log('got login', e)
      this.handle_client_join(e)
    })

    this.last_frame_start_time = 0
    this.accumulator = 0
    this.last_net_update = 0
    this.net_time_step = 100
  }

  run() {
    this.network.listen()

    this.main_loop()
    console.log('server started')
  }

  main_loop() {
    const max_fps = 60
    const timestep = 1/max_fps

    const frame_start_time = Date.now()
    let frame_time = frame_start_time - this.last_frame_start_time
    this.last_frame_start_time = frame_start_time

    this.event_manager.dispatch_events()

    this.accumulator += timestep
    while (this.accumulator >= timestep) {
      this.players.forEach((player) => {
        /* semi-implicit euler */

      player.acc.x = (1 * player.move_right) + (-1 * player.move_left)
      player.acc.y = (1 * player.move_down) + (-1 * player.move_up)

          const min = 0.0001
        if (!player.move_left && !player.move_right) {
          if (Math.abs(player.vel.x) < min) { player.vel.x = 0}
          else {
          if (player.vel.x > 0) {
            player.acc.x = -1
          } else if (player.vel.x < 0){
            player.acc.x = 1
          }

          }
        }
        if (!player.move_up && !player.move_down) {
          if (Math.abs(player.vel.y) < min) { player.vel.y = 0}
          else {
          if (player.vel.y > 0) {
            player.acc.y = -1
            } else if (player.vel.y < 0){
            player.acc.y = 1
          }

          }
        }

    const mag = Math.sqrt(player.acc.x * player.acc.x + player.acc.y * player.acc.y)
    if (mag) {
      player.acc.x /= mag
      player.acc.y /= mag
    }

    const acc = 0.001
    player.acc.x *= acc
    player.acc.y *= acc

        player.vel.x += player.acc.x * timestep
        player.vel.y += player.acc.y * timestep

        const max = 0.01
        if (player.vel.x >   max) { player.vel.x =   max}
        if (player.vel.x < - max) { player.vel.x = - max}
        if (player.vel.y >   max) { player.vel.y =   max}
        if (player.vel.y < - max) { player.vel.y = - max}

        //let vm = Math.sqrt(player.vel.x * player.vel.x + player.vel.y * player.vel.y)
        //if (vm <= timestep * acc * timestep) {
        //  player.vel.x = 0
        //  player.vel.y = 0
        //}
        //console.log(Math.abs(player.vel.x))
        //const min = 0.000001
        //if (Math.abs(player.vel.x) < min) { player.vel.x = 0}
        //if (Math.abs(player.vel.y) < min) { player.vel.y = 0}


        player.pos.x += player.vel.x * timestep
        player.pos.y += player.vel.y * timestep

        //console.log(player.pos.x)
      });
      this.accumulator -= timestep
    }


    if (frame_start_time - this.last_net_update >= this.net_time_step) {
      const work = true
    if (work) {
      this.players.forEach((player) => {
        if (player.pos.x !== player.prev_pos.x || player.pos.y !== player.prev_pos.y) {
          player.prev_pos.x = player.pos.x
          player.prev_pos.y = player.pos.y
          this.network.enqueue_msg_bc('player_move', {
            client_id: player.client_id,
            pos: player.pos,
            acc: player.acc,
            vel: player.vel
          });
        }
      })
    }
      this.last_net_update = frame_start_time
    }

    this.network.dequeue_all(frame_start_time)

    if (Date.now() - frame_start_time < timestep - 16) {
      setTimeout(this.main_loop.bind(this))
    } else {
      setImmediate(this.main_loop.bind(this))
    }
  }

  handle_client_join({ client_id, e }) {
    console.log('new player', client_id)

    const p = {
      client_id,
      name: e.name,
      pos: {
        x: 50,
        y: 50,
      },
      prev_pos: {
        x: 50,
        y: 50,
      },
      vel: {
        x: 0,
        y: 0,
      },
      acc: {
        x: 0,
        y: 0,
      },
      move_left: 0,
      move_right: 0,
      move_up: 0,
      move_down: 0
    }

    this.players.forEach((existing_player) => {
      this.network.send_message(existing_player.client_id, 'player_join', p)
      this.network.send_message(client_id, 'player_join', existing_player)
    })

    this.blocks.forEach(b => this.network.enqueue_msg(client_id, 'place_block', { block: b }))
    //this.network.enqueue_msg(client_id, )
    //
    const build_ev = {
      entity: {
        entity_id: -500,
      },
      components: [
        {
          type: 'TransformComponent',
          data: {
            pos: { x: 100, y: 50, z: 50 }
          }
        },
        {
          type: 'RenderableComponent',
          data: {
            asset: 'default'
          }
        },
        {
          type: 'BoundsComponent',
          data: {
            width: 20,
            height: 20,
          }
        },
        {
          type: 'StarbaseComponent',
          data: {
            dockable: true,
            dock_capacity: 2,
            docked_count: this.starbases[0].docked
          }
        }
      ]
    }
    //this.network.enqueue_msg(client_id, 'build', build_ev)

    this.players.push(p)

    this.network.send_message(client_id, 'player_join', p)
  }

  handle_client_leave(e) {
    console.log('remove player ', e.client_id)

    const idx = this.players.findIndex(p => p.client_id === e.client_id)
    if (idx === -1) { return }

    const player = this.players[idx]
    this.players.splice(idx, 1)

    this.players.forEach((existing_player) => {
      this.network.send_message(existing_player.client_id, 'player_disconnect', player.client_id)
    })
  }

  handle_player_action({ client_id, e }) {
    console.log('got player action', client_id, e)
    const player = this.players.find(p => p.client_id === client_id)
    if (!player) { return }

    switch (e.e.action) {
      case 'PLACE_BLOCK':
        return this.place_block({ client_id, e })
      case 'REQ_TARGET_ENTITY':
        return this.target_entity({ client_id, e })
      case 'REQ_DOCK':
        return this.handle_dock({ client_id, e })
      default:
        return
    }
  }

  handle_player_move_action({ client_id, e }) {
    console.log(client_id)
    const player = this.players.find(p => p.client_id === client_id )
    if (!player) { return }

    switch (e.e.action) {
      case 'MOVE_LEFT':
        player.move_left = (e.e.state > 0); break
      case 'MOVE_RIGHT':
        player.move_right = (e.e.state > 0) ; break
      case 'MOVE_UP':
        player.move_up = (e.e.state > 0); break
      case 'MOVE_DOWN':
        player.move_down = (e.e.state > 0) ;break
      default:
        return
    }

    //const acc = 0.001

    //player.acc.x = (1 * player.move_right) + (-1 * player.move_left)
    //player.acc.y = (1 * player.move_down) + (-1 * player.move_up)

    //const mag = Math.sqrt(player.acc.x * player.acc.x + player.acc.y * player.acc.y)
    //if (!mag) { return }
    //player.acc.x /= mag
    //player.acc.y /= mag
    //player.acc.x *= acc
    //player.acc.y *= acc
  }

  place_block({ client_id, e }) {
    console.log('send', e, client_id)
    if (this.blocks.find(b => b.x === e.e.pos.x && b.y === e.e.pos.y)) {
      console.log('invalid block')
      return 
    }

    const block = {
      entity_id: uuid.v4(),
      pos: e.e.pos,
    }

    this.blocks.push(block)

    console.log('client', client_id)
    this.network.enqueue_msg_bc('place_block', { client_id, block })
  }

  target_entity({ client_id, e }) {
    // TODO: client_id should not equal entity_id
    // TODO: check against all entities, not just players
    const target = this.players.find(p => p.client_id === e.e.entity_id)
    if (!target) { return }

    this.network.enqueue_msg(target.client_id, 'TARGET_ENTITY', {
      source: client_id, target: target.client_id
    })

    if (target.client_id === client_id) { return }

    this.network.enqueue_msg(client_id, 'TARGET_ENTITY', {
      source: client_id, target: target.client_id
    })
  }

  handle_dock({ client_id, e }) {
    //TODO: vlaidate, check distance etc
    console.log(this.starbases)
    if (this.starbases[0].docked === 2) {
      this.network.enqueue_msg(client_id, 'player_dock', {
         client_id, result: false })
        return
    }

    this.starbases[0].docked ++
    this.network.enqueue_msg_bc('player_dock', { client_id,  result: true })
  }
}

module.exports = Server
