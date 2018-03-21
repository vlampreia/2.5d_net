'use strict'

import { Component } from 'ecs'
import Vector from 'common'

class PolyBounds extends Component {
  private vertices
  public offset

  constructor() {
    super()
  }

  get_mesh() {
    return this.vertices
  }

  set_mesh(vertices) {
    this.vertices = vertices
  }
}

export default PolyBounds
