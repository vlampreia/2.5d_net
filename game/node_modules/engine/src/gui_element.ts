'use strict'

import Vector from 'common'

abstract class GuiElement {
  pos
  dim
  visible
  canvas
  ctx
  dirty
  anchor

  constructor() {
    this.pos = new Vector(0, 0, 0)
    this.dim = new Vector(0, 0, 0)
    this.visible = true
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
    this.dirty = true

    this.anchor = {
      horizontal: 'left',
      vertical: 'top',
    }
  }

  abstract custom_render(context)

  render(ctx) {
    if (!this.visible) { return }

    if (this.dirty) {
      this.custom_render(this.ctx)
      this.dirty = false
    }

    let x = this.pos.x
    let y = this.pos.y

    if (this.anchor.horizontal === 'right') {
      x = ctx.canvas.width - x - this.dim.x
    } else if (this.anchor.horizontal === 'centre') {
      x = (ctx.canvas.width / 2) - x - (this.dim.x / 2)
    }

    if (this.anchor.vertical === 'bottom') {
      y = ctx.canvas.height + y
    } else if (this.anchor.vertical === 'centre') {
      y = (ctx.canvas.height / 2) - y - this.dim.y /2 
    }

    ctx.drawImage(this.canvas, x, y)
  }

  set_visible(visible) {
    this.visible = visible
  }

  is_visible() {
    return this.visible
  }
}

export default GuiElement
