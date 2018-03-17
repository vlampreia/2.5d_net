'use strict'

import { BaseComponents } from 'engine'
import Light from '../components/light.component'
import Vector from 'common'

class LightFactory {
  private ecs

  constructor(ecs) {
    this.ecs = ecs
  }

  make_light(x, y, colour) {
      const e = this.ecs.create_entity()
      const t = this.ecs.set_entity_component(e, new BaseComponents.TransformComponent())
      const r = this.ecs.set_entity_component(e, new BaseComponents.RenderableComponent())
      const l = this.ecs.set_entity_component(e, new Light())

      t.pos = new Vector(x, 0, y)
      t.pos_prev = t.pos
      t.pos_next = t.pos

      l.colour = colour

      l.renderable = document.createElement('canvas')
      const range = 700
      const w = range * 2
      const h = range * 2
      l.renderable.width = w
      l.renderable.height = h
      let ctx = l.renderable.getContext('2d')
      //ctx.setTransform(1, 0, 0, 0.5, 0, 0)

      //const gradient = this.ctx.createRadialGradient(v1.x, v1.y * 2, 0, v1.x, v1.y * 2, 1000)
      const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, range)
      gradient.addColorStop(0, colour)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)

      r.canvas = document.createElement('canvas')
      ctx = r.canvas.getContext('2d')
      ctx.fillStyle = 'rgb(255, 255, 255)'
      ctx.fillRect(0, 0, 3, 3)
      r.midpoint = new Vector(1, 0, 1)

      return e
  }
}

export default LightFactory
