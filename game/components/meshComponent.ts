'use strict'

import { Component } from 'ecs'

import Vector from 'common'

const get_seg_normal = (v1, v2) => {
  return new Vector(
    + (v2.y - v1.y),
    - (v2.x - v1.x),
    0
  )
}

class MeshComponent extends Component {
  vertices
  normals
  mid

  constructor() {
    super()

    this.vertices = []
    this.normals = []
    this.mid = new Vector(0, 0, 0)
  }

  push_vertex(x, y) {
    this.vertices.push(new Vector(x, y, 0))
  }

  compile_normals() {
    for (let i = 0; i < this.vertices.length; ++i) {
      let z = i + 1
      if (z === this.vertices.length) { z = 0 }

      const normal = get_seg_normal(this.vertices[i], this.vertices[z])

      this.normals.push(normal)
    }
  }
}

export default MeshComponent
