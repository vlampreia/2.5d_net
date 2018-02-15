'use strict'

import { Component } from 'ecs'

class RenderableComponent extends Component {
  constructor() {
    super()

    this.canvas = null
  }

  serialise() {

  }

  static deserialise(data) {
    const c = new this()

    c.canvas = document.createElement('canvas')
    c.canvas.width = 20
    c.canvas.height = 20
    const ctx = c.canvas.getContext('2d')
    ctx.fillStyle = 'rgb(0,0,0)'
    ctx.fillRect(0, 0, 20, 20)

    console.log(c.canvas)
    return c
  }
}

export default RenderableComponent
