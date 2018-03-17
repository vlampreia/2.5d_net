'use strict'

import { BaseComponents } from 'engine'
import MeshComponent from '../components/meshComponent'
import Vector from 'common'

class CuboidFactory {
  private ecs

  constructor(ecs) {
    this.ecs = ecs
  }

  make_cuboid(position, dimensions, colour) {
    const xwidth = dimensions.x
    const ywidth = dimensions.z
    const canvas_width = xwidth + ywidth
    const canvas_height = dimensions.y + xwidth / 2 + ywidth / 2

    const e = this.ecs.create_entity()
    const t = this.ecs.set_entity_component(e, new BaseComponents.TransformComponent())
    const r = this.ecs.set_entity_component(e, new BaseComponents.RenderableComponent())
    const mesh = this.ecs.set_entity_component(e, new MeshComponent())
    const b = this.ecs.set_entity_component(
      e, 
      new BaseComponents.BoundsComponent(canvas_width, canvas_height)
    )

    t.time = -1
    t.pos = position
    t.pos_prev = position
    t.pos_next = position

    r.canvas = document.createElement('canvas')
    r.canvas.width = canvas_width
    r.canvas.height = canvas_height

    const ctx = r.canvas.getContext('2d')
    ctx.strokeStyle = colour
    ctx.fillStyle = colour

    ////
    mesh.push_vertex(0,               ywidth / 2 + dimensions.y)
    mesh.push_vertex(xwidth,          dimensions.y + xwidth * 0.5 + ywidth * 0.5)
    mesh.push_vertex(xwidth + ywidth, dimensions.y + xwidth * 0.5)
    mesh.push_vertex(ywidth,          dimensions.y)
    mesh.height = position.y
    mesh.compile_normals()
    ////

    ctx.beginPath()
    ctx.moveTo(0,               ywidth / 2)
    ctx.lineTo(0,               ywidth / 2 + dimensions.y)
    ctx.lineTo(xwidth,          dimensions.y + xwidth * 0.5 + ywidth * 0.5)
    ctx.lineTo(xwidth + ywidth, dimensions.y + xwidth * 0.5)
    ctx.lineTo(xwidth + ywidth, xwidth * 0.5)
    ctx.lineTo(ywidth,          0)
    ctx.lineTo(0,               ywidth / 2)
    ctx.lineTo(xwidth,          xwidth * 0.5 + ywidth * 0.5)
    ctx.lineTo(xwidth + ywidth, xwidth * 0.5)
    ctx.moveTo(xwidth,          xwidth * 0.5 + ywidth * 0.5)
    ctx.lineTo(xwidth,          dimensions.y + xwidth * 0.5 + ywidth * 0.5)
    ctx.stroke()

    ctx.globalAlpha = 0.3
    ctx.fill()

    r.midpoint.x = canvas_width / 2
    r.midpoint.z = canvas_height / 2 + dimensions.y / 2
    mesh.mid = new Vector(r.midpoint.x, 0, r.midpoint.z)
    b.offset = new Vector(r.midpoint.x, 0, dimensions.z/2)

    return t
  }
}

export default CuboidFactory
