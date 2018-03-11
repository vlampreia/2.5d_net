'use strict'

import { System } from 'ecs'

import MeshComponent from '../components/meshComponent'
import { BaseComponents } from 'engine'
import Vector from 'common'

class MeshSystem extends System {
  camera
  camera_pos
  camera_opt
  ctx
  cursor
  lines
  vertices

  constructor() {
    super([
      MeshComponent,
      BaseComponents.TransformComponent
    ])
  }

  setup() {
    this.lines = []
    this.vertices = []

    this.vertices.push(new Vector(0, 0, 0))
    this.vertices.push(new Vector(this.ctx.canvas.width, 0, 0))
    this.vertices.push(new Vector(this.ctx.canvas.width, this.ctx.canvas.height, 0))
    this.vertices.push(new Vector(0, this.ctx.canvas.height, 0))
    this.lines.push([this.vertices[0], this.vertices[1])
    this.lines.push([this.vertices[1], this.vertices[2])
    this.lines.push([this.vertices[2], this.vertices[3])
    this.lines.push([this.vertices[3], this.vertices[0])
    return true
  }

  teardown() {
    const intersects = (a1, a2, b1, b2) => {
      const dx = (a1.x - a2.x) * (b1.y - b2.y)
               - (a1.y - a2.y) * (b1.x - b2.x)

      if (dx === 0) return false

      const t1 = ((a2.y - b2.y) * (b1.x - b2.x)) - ((a2.x - b2.x) * (b1.y - b2.y))
      const t2 = ((a2.y - b2.y) * (a1.x - a2.x)) - ((a2.x - b2.x) * (a1.y - a2.y))

      if (t1 === 0 || t2 === 0) return false

      const r = t1 / dx
      const s = t2 / dx

      if ((r > 0 && r < 1) && (s > 0 && s < 1)) {
        return true
      }
      return false
    }

    const get_intersection_point = (a1, a2, b1, b2) => {
      //const dx = (a1.x - a2.x) * (b1.y - b2.y)
      //         - (a1.y - a2.y) * (b1.x - b2.x)
      const dx = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y)

      if (dx === 0) return null

      //const t1 = ((a2.y - b2.y) * (b1.x - b2.x)) - ((a2.x - b2.x) * (b1.y - b2.y))
      //const t2 = ((a2.y - b2.y) * (a1.x - a2.x)) - ((a2.x - b2.x) * (a1.y - a2.y))
      const t1 = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)
      const t2 = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x)

      if (t1 === 0 || t2 === 0) return null

      const r = t1 / dx
      const s = t2 / dx

      if ((r > 0 && r < 1) && (s > 0 && s < 1)) {
        //return new Vector(a1.x + r * (a2.x - a1.x), a1.y + r * (a2.y - a1.y), 0)
        return r
      }
      return null
    }

    const v1 = this.cursor

    let vis = []

    const extend = (p1, p2, factor) => {
      const len = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
      const end = p2.add_v(p2.sub_v(p1).div_f(len).mul_f(factor))
      return end
    }

    const get_seg_normal = (v1, v2) => {
      return new Vector(
        + (v2.y - v1.y),
        - (v2.x - v1.x),
        0
      )
    }

    const get_cross_product = (v1, v2) => {
      return v1.x * v2.y - v1.y * v2.x
    }

    let backfacing = false
    this.vertices.forEach((v2) => {
      let seen = true

      const extended = extend(v1, v2, 100)

      let closest_intersection_point = null

      for (let i=0; i<this.lines.length; ++i) {
        const l = this.lines[i]

        const normal = get_seg_normal(l[0], l[1])
        const x = l[0].sub_v(v1)
        if (get_cross_product(x, normal) >= 0) {
          backfacing = true
        }

        const intersection_point = get_intersection_point(v1, v2, l[0], l[1])
        if (intersection_point) {
          if (
            !closest_intersection_point ||
            closest_intersection_point > intersection_point
          ) {
            closest_intersection_point = intersection_point
          }
            //intersections.push(intersection)
          //vis.push(intersection)
          //seen = false
          //break
        }
      }

      if (!closest_intersection_point) {
        //const extended = extend(v1, v2, 100)
        vis.push(v2)
      } else if (!backfacing) {
        const point = new Vector(
          v1.x + closest_intersection_point * (v2.x - v1.x),
          v1.y + closest_intersection_point * (v2.y - v1.y),
          0
        )
        vis.push(point)
      }
    })

    const lt = (a, b, c) => {
      if (a.x - v1.x >= 0 && b.x - v1.x < 0) return true
      if (a.x - v1.x < 0 && b.x - v1.x >= 0) return false
      if (a.x - v1.x == 0 && b.x - v1.x == 0) {
        if (a.y - v1.y >= 0 || b.y - v1.y >= 0) return a.y > b.y
        return b.y > a.y
      }

      // compute the cross product of vectors (v1 -> a) x (v1 -> b)
      const det = (a.x - v1.x) * (b.y - v1.y) - (b.x - v1.x) * (a.y - v1.y)
      if (det < 0) return true
      if (det > 0) return false

      // points a and b are on the same line from the v1
      // check which point is closer to the v1
      const d1 = (a.x - v1.x) * (a.x - v1.x) + (a.y - v1.y) * (a.y - v1.y)
      const d2 = (b.x - v1.x) * (b.x - v1.x) + (b.y - v1.y) * (b.y - v1.y)
      return d1 > d2
    }

    vis = vis.sort((a, b) => {
      return lt(a, b, v1) ? -1 : lt(b, a, v1) ? 1 : 0
    })

    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
    this.ctx.strokeStyle = 'rgb(255, 0, 0)'

    for (let i=0; i<vis.length; ++i) {
      let z = i+1
      if (z === vis.length) z = 0

      this.ctx.beginPath()
      this.ctx.moveTo(v1.x, v1.y)
      const e = extend(v1, vis[i], 1000)
      //this.ctx.lineTo(e.x, e.y)
      this.ctx.lineTo(vis[i].x, vis[i].y)
      this.ctx.stroke()

      this.ctx.beginPath()
      this.ctx.moveTo(v1.x, v1.y)
      this.ctx.lineTo(vis[i].x, vis[i].y)
      this.ctx.lineTo(vis[z].x, vis[z].y)
      //this.ctx.lineTo(v1.x, v1.y)
    this.ctx.fill()
    }

    this.ctx.resetTransform()
  }

  process_entities(entities, t, dt) {
    super.process_entities(entities, t, dt)
  }

  process_entity(entity, t, dt, { meshComponent, transformComponent }) {

      for (let i =0 ; i<meshComponent.vertices.length; ++i) {
        const p1 = meshComponent.vertices[i] .add_v(new Vector( (transformComponent.pos.x - transformComponent.pos.y) - 2 - (meshComponent.mid.x), ((transformComponent.pos.x + transformComponent.pos.y) - 2) / 2 - (meshComponent.mid.y) - transformComponent.pos.z, 0)) .mul_f(this.camera_opt.scale) .sub_v( this.camera_pos.pos.mul_f(this.camera_opt.scale) .sub_v(this.camera_opt.view_centre))
        let z = i+1
        if (z === meshComponent.vertices.length) z = 0
        const p2 = meshComponent.vertices[z] .add_v(new Vector( (transformComponent.pos.x - transformComponent.pos.y) - 2 - (meshComponent.mid.x), ((transformComponent.pos.x + transformComponent.pos.y) - 2) / 2 - (meshComponent.mid.y) - transformComponent.pos.z, 0)) .mul_f(this.camera_opt.scale) .sub_v( this.camera_pos.pos.mul_f(this.camera_opt.scale) .sub_v(this.camera_opt.view_centre))
        this.lines.push([p1,p2])
      }
    const vis = []
    meshComponent.vertices.forEach((v) => {
      const transf_pos = new Vector(0, 0, 0)
        .add_v(new Vector(
           (transformComponent.pos.x - transformComponent.pos.y) - 2 - (meshComponent.mid.x),
          ((transformComponent.pos.x + transformComponent.pos.y) - 2) / 2 - (meshComponent.mid.y) - transformComponent.pos.z,
           0
         ))
        .add_v(new Vector(
          v.x,
          v.y,
          0
        ))
        .mul_f(this.camera_opt.scale)
        .sub_v(
          this.camera_pos.pos.mul_f(this.camera_opt.scale)
            .sub_v(this.camera_opt.view_centre)
        )

      this.vertices.push(transf_pos)

      const sp = this.cursor//.sub_v(transf_pos)

      const len = Math.sqrt(Math.pow(sp.x - transf_pos.x, 2) + Math.pow(sp.y - transf_pos.y, 2))
      const end = transf_pos.add_v(transf_pos.sub_v(sp).div_f(len).mul_f(1000))
      })
  }

  set_camera(camera) {
    this.camera = camera
    this.camera_pos = this.ecs
      .get_entity_component(this.camera, BaseComponents.TransformComponent)
    this.camera_opt = this.ecs
      .get_entity_component(this.camera, BaseComponents.CameraComponent)
  }

  set_ctx(ctx) {
    this.ctx = ctx
  }

  set_cursor(pos) {
    this.cursor = pos
  }
}

export default MeshSystem
