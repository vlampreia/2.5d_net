'use strict'

import { System } from 'ecs'
import { BaseComponents } from 'engine'
import Vector from 'common'
import VelocityComponent from '../components/velocityComponent.js'

class MotionSystem extends System {
  constructor() {
    super([ BaseComponents.TransformComponent, VelocityComponent ])
  }

  process_entity(entity, t, dt, { transformComponent, velocityComponent }) {
    //const vel = velocityComponent.velocity.mul_f(dt)
    //console.log(transformComponent.pos)
    //if (! vel.x) { return }

    //transformComponent.pos = transformComponent.pos.add_v(vel.mul_f(dt))
    //console.log(transformComponent.pos)
    //if (!transformComponent.lasttime) { return }
    //const elapsed = t - transformComponent.lasttime
    //if (elapsed > 1 ) time = elapsed / dt
    //if (elapsed < 1) time = elapsed
    //if (time > 1) { console.log (time, elapsed, dt); throw(new Error());}

    //const alpha = t / dt
    //const time = 1 - alpha
    ////const time = elapsed/dt
    //transformComponent.pos.x = transformComponent.pos2.x + 
    //  ((transformComponent.pos1.x - transformComponent.pos2.x ) * time)

    //transformComponent.lasttime += dt
  }
}

export default MotionSystem
