'use strict'

import { Component } from 'ecs'

class AccelerationComponent extends Component {
  x
  y

  constructor() {
    super()

    this.x = 0
    this.y = 0
  }
}

export default AccelerationComponent
