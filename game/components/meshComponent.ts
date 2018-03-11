'use strict'

import { Component } from 'ecs'

import Vector from 'common'

class MeshComponent extends Component {
  vertices
  mid

  constructor() {
    super()

    this.vertices = []
    this.mid = new Vector(0, 0, 0)
  }

  push_vertex(x, y) {
    this.vertices.push(new Vector(x, y, 0))
  }
}

export default MeshComponent
