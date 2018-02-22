'use strict'

import { Component } from 'ecs'

class RenderableComponent extends Component {
  canvas

  constructor() {
    super()

    this.canvas = null
  }

  serialise() {

  }

  static deserialise(data) {
    const c = new this()

    c.canvas = document.createElement('canvas')
    const ctx = c.canvas.getContext('2d')
    if (data.asset === 'planet') {
      console.log('planet')
      c.canvas.width = 100
      c.canvas.height = 100
      ctx.fillStyle = 'rgb(50, 200, 90)'
      ctx.beginPath()
      ctx.arc(50, 50, 50, 0, 2*Math.PI, false)
      ctx.fill()
    } else {
      c.canvas.width = 20
      c.canvas.height = 20
      ctx.fillStyle = 'rgb(255, 255, 255)'
      ctx.fillRect(0, 0, 20, 20)
    }

    console.log('deserialised')
    return c
  }
}

export default RenderableComponent
