'use strict'

import { Component } from 'ecs'
import Vector from 'common'

class VelocityComponent extends Component {
  constructor() {
    super()

    this.velocity = new Vector(0, 0, 0)
  }

  serialise() {

  }

  static deserialise(data) {
    const c = new this()

    return c
  }
}

export default VelocityComponent
