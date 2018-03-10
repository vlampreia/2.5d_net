'use strict'

class Renderer {
  private canvas_el
  private ctx
  private buffer_canvas
  private buffer_ctx
  private background_canvas

  constructor(canvas_element) {
    this.canvas_el = canvas_element
    this.ctx = this.canvas_el.getContext('2d')

    this.buffer_canvas = document.createElement('canvas')
    this.buffer_canvas.width = this.canvas_el.width
    this.buffer_canvas.height = this.canvas_el.height
    this.buffer_ctx = this.buffer_canvas.getContext('2d')

    this.buffer_ctx.font = '12px mono'

    this.background_canvas = null
  }

  swap_buffer(dt) {
    this.ctx.fillStyle = 'rgb(0, 0,0 )'
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
    this.ctx.drawImage(this.buffer_canvas, 0, 0)
    //this.ctx.fillStyle = 'rgv(0, 255, 255)'
    //this.ctx.fillText('hey', 10, 10)
  }

  clear_buffer() {
    this.buffer_ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
  }

  resize_canvas() {
    this.ctx.canvas.width = window.innerWidth
    this.ctx.canvas.height = window.innerHeight
    this.buffer_canvas.width = this.ctx.canvas.width
    this.buffer_canvas.height = this.ctx.canvas.height
  }

  render_box(x, y, width) {
    this.buffer_ctx.fillRect(x, y, width, width)
  }

  draw_to_background(canvas) {
    this.background_canvas = canvas
  }

  render_bg() {
    this.buffer_ctx.drawImage(this.background_canvas, 0, 0)
  }
}

export default Renderer
