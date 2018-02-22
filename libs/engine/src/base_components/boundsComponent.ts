'use strict'

import { Component } from 'ecs'

class BoundsComponent extends Component {
  private width
  private height

  constructor(width, height) {
    super()

    this.width = width || 0
    this.height = height || 0
  }

  static deserialise(data) {
    const c = new this(data.width, data.height)
    return c
  }
}

export default BoundsComponent
