'use strict'

import { System } from 'ecs'
import { BaseComponents } from 'engine'
import Vector from 'common'
import PlayerControlledComponent from '../components/playerControlledComponent.js'

class PlayerController extends System {
  constructor(event_manager) {
    console.log(BaseComponents)
    super([ BaseComponents.TransformComponent, PlayerControlledComponent ])

    this.event_manager = event_manager
  }

  process_entity(entity, { transformComponent, playerControlledComponent }) {
    const queue = playerControlledComponent.event_queue
    while (queue.length > 0) {
      const e = queue.shift()
      if (e.event_type === 'player_move') {
        transformComponent.pos = new Vector(e.e.pos.x, e.e.pos.y, 1)
      }
    }
  }
}

export default PlayerController
