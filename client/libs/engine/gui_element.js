'use strict'

import Vector from 'common'

class GuiElement {
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
    }

    if (this.anchor.vertical === 'bottom') {
      y = ctx.canvas.height - y
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
