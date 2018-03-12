'use strict'

import { Component } from 'ecs'


class Light extends Component {
  colour
  renderable

  constructor() {
    super()
  }
}

export default Light
