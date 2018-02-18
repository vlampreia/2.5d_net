'use strict'

import { Component } from 'ecs'

class PlanetComponent extends Component {
  constructor() {
    super()
  }

  static deserialise(data) {
    const c = new this()
    c.data = data.data
    return c
  }
}

export default PlanetComponent
