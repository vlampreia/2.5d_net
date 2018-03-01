'use strict'

import { System } from 'ecs'
import { BaseComponents } from 'engine'
import WaypointComponent from '../components/waypointComponent'
import AccelerationComponent from '../components/accelerationComponent'
import VelocityComponent from '../components/velocityComponent'

class WaypointSystem extends System {
  contructor() {
    super([
      BaseComponents.TransformComponent,
      VelocityComponent,
      AccelerationComponent,
      WaypointComponent,
    ]);
  }

  process_entity(entity, t, dt, {
    accelerationComponent, velocityComponent, transformComponent, waypointComponent
  }) {
    if (!waypointComponent.active) { return }

    const target_position = waypointComponent.waypoint

    const direction = target_position.sub_v(transformComponent.pos).normalise()

  }
}

export default WaypointSystem
