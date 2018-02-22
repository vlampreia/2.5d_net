'use strict'

import { Component } from 'ecs'
import Vector from 'common'

class VelocityComponent extends Component {
  velocity
  max

  constructor() {
    super()

    this.velocity = new Vector(0, 0, 0)
    this.max = null
  }

  serialise() {

  }

  static deserialise(data) {
    const c = new this()

    return c
  }
}

export default VelocityComponent
