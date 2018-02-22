'use strict'

import { System } from 'ecs'
import { BaseComponents } from 'engine'
import Vector from 'common'
import PlayerNetworkUpdateComponent from '../components/playerNetworkUpdateComponent'
import VelocityComponent from '../components/velocityComponent'

class PlayerNetworkUpdateSystem extends System {
  event_manager

  constructor(event_manager) {
    super([ BaseComponents.TransformComponent, VelocityComponent, PlayerNetworkUpdateComponent ])

    this.event_manager = event_manager
  }

  process_entity(entity, t, dt, { transformComponent, velocityComponent, playerNetworkUpdateComponent }) {
    const queue = playerNetworkUpdateComponent.event_queue

    while (queue.length > 0) {
      const e = queue.shift()
      if (e.event_type === 'player_move') {
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
      }
    }
  }
}

export default PlayerNetworkUpdateSystem
