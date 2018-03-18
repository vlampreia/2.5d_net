'use strict'

import { Component } from 'ecs'


class Light extends Component {
  colour
  r
  g
  b
  renderable

  constructor() {
    super()
  }
}

export default Light
