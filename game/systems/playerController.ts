'use strict'

import { System } from 'ecs'
import { BaseComponents } from 'engine'
import Vector from 'common'
import PlayerControlledComponent from '../components/playerControlledComponent'
import VelocityComponent from '../components/velocityComponent'
import AccelerationComponent from '../components/accelerationComponent'

class PlayerController extends System {
  event_manager

  constructor(event_manager) {
    super([ BaseComponents.TransformComponent, VelocityComponent, AccelerationComponent, PlayerControlledComponent ])

    this.event_manager = event_manager
  }

  process_entity(entity, t, dt, { accelerationComponent, velocityComponent, playerControlledComponent }) {
    const queue = playerControlledComponent.event_queue

    // TODO: split state from motion

    while (queue.length > 0) {
      const e = queue.shift()
      if (e.event_type === 'in_player_move') {
        switch (e.e.action) {
          case 'MOVE_LEFT':
            playerControlledComponent.move_left = (e.e.state > 0); break
          case 'MOVE_RIGHT':
            playerControlledComponent.move_right = (e.e.state > 0); break
          case 'MOVE_UP':
            playerControlledComponent.move_up = (e.e.state > 0); break
          case 'MOVE_DOWN':
            playerControlledComponent.move_down = (e.e.state > 0); break
          default:
            break
        }
      }
    }

    /* set acceleration vector */
    accelerationComponent.x = ( 1 * playerControlledComponent.move_right) +
                              (-1 * playerControlledComponent.move_left)
    accelerationComponent.y = ( 1 * playerControlledComponent.move_down) +
                              (-1 * playerControlledComponent.move_up)

    /* accelerate towards 0 if stopping */
    const min = 0.0001
    if (!playerControlledComponent.move_left && !playerControlledComponent.move_right) {
      if (Math.abs(velocityComponent.x) < min) {
        velocityComponent.x = 0
      } else {
        if (velocityComponent.x > 0) {
          accelerationComponent.x = -1
        } else if (velocityComponent.x < 0){
          accelerationComponent.x = 1
        }
      }
    }

    if (!playerControlledComponent.move_up && !playerControlledComponent.move_down) {
      if (Math.abs(velocityComponent.y) < min) {
        velocityComponent.y = 0
      } else {
        if (velocityComponent.y > 0) {
            accelerationComponent.y = -1
          } else if (velocityComponent.y < 0){
            accelerationComponent.y = 1
        }
      }
    }

    /* normalise acceleration vector */
    const mag = Math.sqrt(accelerationComponent.x * accelerationComponent.x + accelerationComponent.y * accelerationComponent.y)
    if (mag) {
      accelerationComponent.x /= mag
      accelerationComponent.y /= mag
    }

    /* boost acceleration vector */
    const acc = 0.001
    accelerationComponent.x *= acc
    accelerationComponent.y *= acc
  }
}

export default PlayerController
