'use strict'

import { System } from 'ecs'
import { BaseComponents } from 'engine'
import Vector from 'common'
import PlayerControlledComponent from '../components/playerControlledComponent.js'
import VelocityComponent from '../components/velocityComponent.js'

class PlayerController extends System {
  constructor(event_manager) {
    console.log(BaseComponents)
    super([ BaseComponents.TransformComponent, VelocityComponent, PlayerControlledComponent ])

    this.event_manager = event_manager
  }

  process_entity(entity, t, dt, { transformComponent, velocityComponent, playerControlledComponent }) {
    const queue = playerControlledComponent.event_queue
    while (queue.length > 0) {
      const e = queue.shift()
      if (e.event_type === 'player_move') {
        //console.log(
        //  'st',
        //  e.server_send_timestamp - t,
        //  e.server_send_timestamp,
        //  t
        //)
        //if (Math.abs(transformComponent.pos.x-e.e.pos.x) > 0.5){
        //  console.log('td', e.e.pos.x - transformComponent.pos.x, transformComponent.pos.x, e.e.pos.x)
        if (e.server_send_timestamp <= transformComponent.pos_next_time) {
          console.log('bad time!')
        } else{
          transformComponent.pos_prev.x = transformComponent.pos.x
          transformComponent.pos_prev.y = transformComponent.pos.y
          transformComponent.pos_prev_time = transformComponent.time
          transformComponent.pos_next.x = e.e.pos.x
          transformComponent.pos_next.y = e.e.pos.y
          transformComponent.pos_next_time = e.server_send_timestamp
        }
        //  transformComponent.lasttime = 0
        //if (transformComponent.pos.x > transformComponent.pos1) {
        //  transformComponent.pos2 = transformComponent.pos1
        //} else {
        //  transformComponent.pos2 = transformComponent.pos
        //}
        //transformComponent.pos1 = new Vector(e.e.pos.x, e.e.pos.y, 1)
        //transformComponent.pos = transformComponent.pos2
        ////} else {
        ////  console.log('bingo')
        ////}
        //velocityComponent.velocity = new Vector(e.e.vel.x, e.e.vel.y)
      }
    }
  }
}

export default PlayerController
