'use strict'

import * as uuid from 'uuid'
import { Engine, EventManager, BaseComponents, } from 'engine'
import Network from './network'
import * as ECS from 'ecs'

//import TransformFollowerComponent from '../../components/transformFollowerComponent'
import ModuleHostComponent from '../../components/moduleHostComponent'
import ModuleComponent from '../../components/moduleComponent'
//import StarbaseComponent from '../../components/starbaseComponent'
//import PlanetComponent from '../../components/planetComponent'
import VelocityComponent from '../../components/velocityComponent'
//import PlayerNetworkUpdateComponent from '../../components/playerNetworkUpdateComponent'
import AccelerationComponent from '../../components/accelerationComponent'
import PlayerControlledComponent from '../../components/playerControlledComponent'

//import PlayerNetworkUpdateSystem from '../../systems/playernetworkUpdateSystem'
//import TransformFollowerSystem from '../../systems/transformFollowerSystem'
import MotionSystem from '../../systems/motionSystem'
import PlayerController from '../../systems/playerController'

import Vector from 'common'

class Server {
  private event_manager
  private network
  private players
  private blocks
  private starbases
  private last_frame_start_time
  private accumulator
  private last_net_update
  private net_time_step
  ecs
  systems
  component_classes

  constructor() {

    this.event_manager = new EventManager()
    this.network = new Network(this.event_manager)

    this.ecs = new ECS.ECS()

    this.systems = {
      motion_system: new MotionSystem(),
      player_controller: new PlayerController(this.event_manager)
    }
    Object.values(this.systems).forEach(s => this.ecs.push_system(s))
    this.component_classes = [
      AccelerationComponent,
      ModuleHostComponent,
      ModuleComponent,
      VelocityComponent
    ]
    this.component_classes.forEach(c => this.ecs.register_component_class(c))

    this.players = []
    this.blocks = []
    this.starbases = [
      {
        docked: 0
      }
    ]

    this.event_manager.add_listener(
      'net_client_close', this.handle_client_leave.bind(this)
    )

//    this.event_manager.add_listener(
//      'player_action', this.handle_player_action.bind(this)
//    )

    //this.event_manager.add_listener(
    //  'in_player_move', this.handle_player_move_action.bind(this)
    //)

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

    /* read local and network pushed events */
    this.event_manager.dispatch_events()

    this.systems.player_controller.update()

    /* perform simulation steps */
    this.accumulator += timestep
    while (this.accumulator >= timestep) {
      this.systems.motion_system.update(frame_start_time, frame_time)

      this.accumulator -= timestep
    }

    /* pusg network events to queue */
    if (frame_start_time - this.last_net_update >= this.net_time_step) {
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

      this.last_net_update = frame_start_time
    }

    /* update network */
    this.network.dequeue_all(frame_start_time)

    /* request next frame */
    if (Date.now() - frame_start_time < timestep - 16) {
      setTimeout(this.main_loop.bind(this))
    } else {
      setImmediate(this.main_loop.bind(this))
    }
  }

  create_player_entity(client_id) {
    const entity = this.ecs.create_entity()
    entity.entity_id = client_id

    const transform = this.ecs.set_entity_component(entity, new BaseComponents.TransformComponent())
    const velocity = this.ecs.set_entity_component(entity, new VelocityComponent())
    const acceleration = this.ecs.set_entity_component(entity, new AccelerationComponent())
    const bounds = this.ecs.set_entity_component(entity, new BaseComponents.BoundsComponent(20, 30))
    const module_host = this.ecs.set_entity_component(entity, new ModuleHostComponent())
    const control = this.ecs.set_entity_component(entity, new PlayerControlledComponent(client_id, this.event_manager))

    transform.pos = new Vector(50, 50, 0)
    return entity
  }

  handle_client_join({ client_id, e }) {
    console.log('new player', client_id)

    const ent = this.create_player_entity(client_id)

    const p = {
      entity: {
        entity_id: client_id
      },
      components: [
        {
          type: BaseComponents.TransformComponent.get_type(),
          data: {
            pos: { x: 50, y: 50, z: 0 }
          }
        },
        {
          type: VelocityComponent.get_type()
        },
        {
          type: AccelerationComponent.get_type()
        },
        {
          type: BaseComponents.BoundsComponent.get_type(),
          data: {
            width: 20,
            height: 30,
          }
        },
        {
          type: ModuleHostComponent.get_type()
        },
        {
          type: PlayerControlledComponent.get_type()
        }
      ]
    }

    this.players.forEach((existing_player) => {
      this.network.send_message(existing_player.client_id, 'player_join', p)
      this.network.send_message(client_id, 'player_join', existing_player)
    })

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

  //handle_player_action({ client_id, e }) {
  //  console.log('got player action', client_id, e)
  //  const player = this.players.find(p => p.client_id === client_id)
  //  if (!player) { return }

  //  switch (e.e.action) {
  //    case 'PLACE_BLOCK':
  //      return this.place_block({ client_id, e })
  //    case 'REQ_TARGET_ENTITY':
  //      return this.target_entity({ client_id, e })
  //    case 'REQ_DOCK':
  //      return this.handle_dock({ client_id, e })
  //    default:
  //      return
  //  }
  //}

  //handle_player_move_action({ client_id, e }) {
  //  console.log(client_id)
  //  const player = this.players.find(p => p.client_id === client_id )
  //  if (!player) { return }

  //  switch (e.e.action) {
  //    case 'MOVE_LEFT':
  //      player.move_left = (e.e.state > 0); break
  //    case 'MOVE_RIGHT':
  //      player.move_right = (e.e.state > 0) ; break
  //    case 'MOVE_UP':
  //      player.move_up = (e.e.state > 0); break
  //    case 'MOVE_DOWN':
  //      player.move_down = (e.e.state > 0) ;break
  //    default:
  //      return
  //  }

    //const acc = 0.001

    //player.acc.x = (1 * player.move_right) + (-1 * player.move_left)
    //player.acc.y = (1 * player.move_down) + (-1 * player.move_up)

    //const mag = Math.sqrt(player.acc.x * player.acc.x + player.acc.y * player.acc.y)
    //if (!mag) { return }
    //player.acc.x /= mag
    //player.acc.y /= mag
    //player.acc.x *= acc
    //player.acc.y *= acc
  //}

  //place_block({ client_id, e }) {
  //  console.log('send', e, client_id)
  //  if (this.blocks.find(b => b.x === e.e.pos.x && b.y === e.e.pos.y)) {
  //    console.log('invalid block')
  //    return 
  //  }

  //  const block = {
  //    entity_id: uuid.v4(),
  //    pos: e.e.pos,
  //  }

  //  this.blocks.push(block)

  //  console.log('client', client_id)
  //  this.network.enqueue_msg_bc('place_block', { client_id, block })
  //}

  //target_entity({ client_id, e }) {
  //  // TODO: client_id should not equal entity_id
  //  // TODO: check against all entities, not just players
  //  const target = this.players.find(p => p.client_id === e.e.entity_id)
  //  if (!target) { return }

  //  this.network.enqueue_msg(target.client_id, 'TARGET_ENTITY', {
  //    source: client_id, target: target.client_id
  //  })

  //  if (target.client_id === client_id) { return }

  //  this.network.enqueue_msg(client_id, 'TARGET_ENTITY', {
  //    source: client_id, target: target.client_id
  //  })
  //}

  //handle_dock({ client_id, e }) {
  //  //TODO: vlaidate, check distance etc
  //  console.log(this.starbases)
  //  if (this.starbases[0].docked === 2) {
  //    this.network.enqueue_msg(client_id, 'player_dock', {
  //       client_id, result: false })
  //      return
  //  }

  //  this.starbases[0].docked ++
  //  this.network.enqueue_msg_bc('player_dock', { client_id,  result: true })
  //}
}

export default Server
