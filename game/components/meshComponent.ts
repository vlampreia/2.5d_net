'use strict'

import { Component } from 'ecs'

import Vector from 'common'

const get_seg_normal = (v1, v2) => {
  return new Vector(
    + (v2.z - v1.z),
    0,
    - (v2.x - v1.x)
  )
}

class MeshComponent extends Component {
  vertices
  normals
  mid
  height

  constructor() {
    super()

    this.vertices = []
    this.normals = []
    this.mid = new Vector(0, 0, 0)
    this.height = 0
  }

  push_vertex(x, z) {
    this.vertices.push(new Vector(x, 0, z))
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
