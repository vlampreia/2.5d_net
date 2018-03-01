'use strict'

import { Component } from 'ecs'
import Vector from 'common'

class WaypointComponent extends Component {
  waypoint
  active: boolean

  constructor() {
    super()

    this.waypoint = new Vector(0, 0, 0)
    this.active = false
  }
}

export default WaypointComponent
