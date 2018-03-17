'use strict'

import { GuiElement } from 'engine'

class TextBox extends GuiElement {
  auto_scale
  font
  font_size
  text
  bg_colour
  fg_colour
  left_margin
  right_margin
  top_margin

  constructor({ text, fg_colour, bg_colour, pos }: { text?, fg_colour?, bg_colour?,  pos? }) {
    super()

    this.auto_scale = true
    this.font = '12px monospace'
    this.font_size = 12
    this.text = text || ''
    this.bg_colour = bg_colour || ''
    this.fg_colour = fg_colour || ''

    if (pos) { this.pos = pos }

    this.left_margin = 3
    this.right_margin = 5
    this.top_margin = 3
  }

  set_text(text: string) {
    this.text = text
    this.dirty = true
  }

  custom_render(ctx) {
    let width = 0
    let height = 0

    const lines = this.text.split('\n')

    ctx.font = this.font
    if (this.auto_scale) {
      lines.forEach((line) => {
        const d = ctx.measureText(line)
        if (d.width > width) { width = ~~d.width }
        height = ~~(12 * 1.1 * lines.length)
      })
    } else {
      width = this.dim.x
      height = this.dim.y
    }

    width += this.right_margin + this.left_margin
    height += this.top_margin

    this.dim.x = width
    this.dim.y = height

    this.canvas.width = width
    this.canvas.height = height
    ctx.font = this.font

    ctx.fillStyle = this.bg_colour
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = this.fg_colour
    lines.forEach((line, i) => {
      ctx.fillText(
        line,
        this.left_margin,
        13 * (i + 1)
      )
    })
  }
}

export default TextBox
