'use strict'

import { Component } from 'ecs'
import Vector from 'common'

class BoundsComponent extends Component {
  private width
  private height
  offset

  constructor(width, height) {
    super()

    this.width = width || 0
    this.height = height || 0
    this.offset = new Vector(0, 0, 0)
  }

  static deserialise(data) {
    const c = new this(data.width, data.height)
    return c
  }
}

export default BoundsComponent
