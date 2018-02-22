'use strict'

import { Component } from 'ecs'

class PlanetComponent extends Component {
  data

  constructor() {
    super()

    this.data = {}
  }

  static deserialise(data) {
    const c = new this()
    c.data = data.data
    return c
  }
}

export default PlanetComponent
