'use strict'

import { Component } from 'ecs'

class BoundsComponent extends Component {
  constructor(width, height) {
    super()

    this.width = width || 0
    this.height = height || 0
  }

  static deserialise(data) {
    const c = new this()
    c.width = data.width
    c.height = data.height
    return c
  }
}

export default BoundsComponent
