'use strict'

import { Component } from 'ecs'

class StarbaseComponent extends Component {
  constructor() {
    super()

    this.dockable = false
    this.dock_capacity = 0
    this.docked_count = 0
  }

  static deserialise(data) {
    const c = new this()

    c.dockable = data.dockable
    c.dock_capacity = data.dock_capacity
    c.docked_count = data.docked_count

    return c
  }
}

export default StarbaseComponent
