'use strict'

import { System } from 'ecs'
import { BaseComponents } from 'engine'
import TransformFollowerComponent from '../components/transformFollowerComponent.js'

class TransformFollowerSystem extends System {
  constructor() {
    super([ BaseComponents.TransformComponent, TransformFollowerComponent ])
  }

  process_entity(entity, { transformComponent, transformFollowerComponent }) {
    const target_pos = this.ecs.get_entity_component(
      transformFollowerComponent.entity_to_follow,
      BaseComponents.TransformComponent
    )

    transformComponent.pos = target_pos.pos
  }
}

export default TransformFollowerSystem
