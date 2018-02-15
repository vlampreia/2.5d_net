'use strict'

import { Component } from 'ecs'

class TransformFollowerComponent extends Component {
  constructor(entity_to_follow) {
    super()

    this.entity_to_follow = entity_to_follow
  }
}

export default TransformFollowerComponent
