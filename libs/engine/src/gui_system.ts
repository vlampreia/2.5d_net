'use strict'

import GuiElement from './gui_element.js'

const make_isometric = (v) => {
  return {
    x: (v.x - v.y),
    y: (v.x + v.y) / 2
  }
}

class GuiSystem {
  private canvas
  private buffer
  private objects
  private mouse_pos
  show_cursor

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = 0
    this.canvas.height = 0
    this.buffer = this.canvas.getContext('2d')
    this.objects = []

    this.mouse_pos = { x: 0, y: 0 }
  }

  render(ctx) {
    this.buffer.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.objects.forEach((object) => {
      object.render(this.buffer)
    })

    ctx.drawImage(this.canvas, 0, 0)
    this.draw_cursor(ctx)
  }

  resize_canvas() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  add_element(gui_element) {
    this.objects.push(gui_element)
  }

  remove_element(gui_element) {

  }

  set_mouse_pos({ x, y }) {
    this.mouse_pos.x = x
    this.mouse_pos.y = y
  }

  draw_cursor(ctx) {
    if (!this.show_cursor) { return }
    /* line stroke coords must be on boundary pixel for crisp lines */
    ctx.strokeStyle = 'rgb(200, 50, 255)'
    ctx.strokeWidth = 1
    ctx.beginPath()
    ctx.moveTo(this.mouse_pos.x + 0.5 - 1000, this.mouse_pos.y + 0.5 - 500)
    ctx.lineTo(this.mouse_pos.x + 0.5 + 1000, this.mouse_pos.y + 0.5 + 500)
    ctx.moveTo(this.mouse_pos.x + 0.5 - 1000, this.mouse_pos.y + 0.5 + 500)
    ctx.lineTo(this.mouse_pos.x + 0.5 + 1000, this.mouse_pos.y + 0.5 - 500)
    //ctx.moveTo(this.mouse_pos.x  + 0.5, 0                  + 0.5)
    //ctx.lineTo(this.mouse_pos.x  + 0.5, this.canvas.height + 0.5)
    //ctx.moveTo(0                 + 0.5, this.mouse_pos.y   + 0.5)
    //ctx.lineTo(this.canvas.width + 0.5, this.mouse_pos.y   + 0.5)
    ctx.stroke()
    //ctx.fillRect(this.mouse_pos.x - 1, this.mouse_pos.y - 1, 3, 3)
  }
}

export default GuiSystem
