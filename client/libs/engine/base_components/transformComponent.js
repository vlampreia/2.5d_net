'use strict'

import { Component } from 'ecs'
import Vector from 'common'

class TransformComponent extends Component {
  constructor() {
    super()

    this.pos = new Vector(0, 0, 0)
    this.pos_prev = new Vector(0, 0, 0)
    this.pos_prev_time = 0
    this.pos_next = new Vector(0, 0, 0)
    this.pos_next_time = 0
    //this.lasttime = 0
    this.time = 0
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
