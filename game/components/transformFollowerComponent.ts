'use strict'

import { Component } from 'ecs'

class TransformFollowerComponent extends Component {
  entity_to_follow

  constructor(entity_to_follow) {
    super()

    this.entity_to_follow = entity_to_follow
  }
}

export default TransformFollowerComponent
