'use strict'

import { System } from 'ecs'
import { BaseComponents } from 'engine'
import Vector from 'common'
import VelocityComponent from '../components/velocityComponent'
import AccelerationComponent from '../components/accelerationComponent'

class MotionSystem extends System {
  constructor() {
    super([
      BaseComponents.TransformComponent,
      AccelerationComponent,
      VelocityComponent
    ])
  }

  process_entity(
    entity,
    t, dt,
    { transformComponent, accelerationComponent, velocityComponent }
  ) {
    velocityComponent.x += accelerationComponent.x * dt
    velocityComponent.y += accelerationComponent.y * dt

    if (velocityComponent.max) {
      if (velocityComponent.x >   velocityComponent.max) { velocityComponent.x =   velocityComponent.max}
      if (velocityComponent.x < - velocityComponent.max) { velocityComponent.x = - velocityComponent.max}
      if (velocityComponent.y >   velocityComponent.max) { velocityComponent.y =   velocityComponent.max}
      if (velocityComponent.y < - velocityComponent.max) { velocityComponent.y = - velocityComponent.max}
    }

    transformComponent.pos.x += velocityComponent.x * dt
    transformComponent.pos.y += velocityComponent.y * dt
  }
}

export default MotionSystem
