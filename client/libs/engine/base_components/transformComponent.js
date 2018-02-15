'use strict'

import { Component } from 'ecs'
import Vector from 'common'

class TransformComponent extends Component {
  constructor() {
    super()

    this.pos = new Vector(0, 0, 0)
  }

  serialise() {

  }

  static deserialise(data) {
    const c = new this()
    c.pos = new Vector(data.pos.x, data.pos.y, data.pos.z)
    return c
  }
}

export default TransformComponent
