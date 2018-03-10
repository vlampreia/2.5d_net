'use strict'

import { Component } from 'ecs'
import Vector from 'common'

class CameraComponent extends Component {
  private view_dim
  private view_centre
  private scale

  constructor() {
    super()

    this.view_dim = new Vector(0, 0, 0)
    this.view_centre = new Vector(0, 0, 0)
    this.scale = 0
  }

  set_view_dimensions(x, y) {
    this.view_dim = new Vector(x, y, 0)
    this.view_centre = new Vector(x / 2, y / 2, 0)
  }

  set_scale(value) {
    this.scale = value
  }

}

export default CameraComponent
