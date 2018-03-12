'use strict'

import { System } from 'ecs'

import { BaseComponents } from 'engine'
import MeshComponent from '../components/meshComponent'
import Light from '../components/light.component'
import Vector from 'common'

const lt = (a, b, c) => {
  if (a.x - c.x >= 0 && b.x - c.x < 0) return true
  if (a.x - c.x < 0 && b.x - c.x >= 0) return false
  if (a.x - c.x == 0 && b.x - c.x == 0) {
    if (a.y - c.y >= 0 || b.y - c.y >= 0) return a.y > b.y
    return b.y > a.y
  }

  // compute the cross product of vectors (c -> a) x (c -> b)
  const det = (a.x - c.x) * (b.y - c.y) - (b.x - c.x) * (a.y - c.y)
  if (det < 0) return true
  if (det > 0) return false

  // points a and b are on the same line from the c
  // check which point is closer to the c
  const d1 = (a.x - c.x) * (a.x - c.x) + (a.y - c.y) * (a.y - c.y)
  const d2 = (b.x - c.x) * (b.x - c.x) + (b.y - c.y) * (b.y - c.y)

  return d1 > d2
}

const get_intersection_point = (a1, a2, b1, b2) => {
  const dx = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y)

  if (dx === 0) return null

  const t1 = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)
  const t2 = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x)

  if (t1 === 0 || t2 === 0) return null

  const r = t1 / dx
  const s = t2 / dx

  if ((r > 0 && r < 1) && (s > 0 && s < 1)) {
    return r
  }

  return null
}
const extend = (p1, p2, factor) => {
  return p2.add_v(p2.sub_v(p1).normalise().mul_f(factor))
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

const get_dot_product = (v1, v2) => {
  return v1.x * v2.x + v1.y * v2.y
}

class LightRenderer extends System {
  camera
  camera_pos
  camera_opt
  ctx
  meshes
  cursor
  camera_offset

  constructor() {
    super([
      BaseComponents.TransformComponent,
      Light
    ])
  }

  setup() {
    this.camera_offset = this.camera_pos.pos
      .mul_f(this.camera_opt.scale)
      .sub_v(this.camera_opt.view_centre)

    this.ctx.globalCompositeOperation = 'screen'
    return true
  }

  teardown() {
    this.ctx.resetTransform()
    this.ctx.globalCompositeOperation = 'normal'
  }

  transform_to_view(v) {
    return new Vector((v.x - v.y), (v.x + v.y) / 2, 0)
      .mul_f(this.camera_opt.scale)
      .sub_v(this.camera_offset)
  }

  process_entity(entity, t, dt, { transformComponent, light }) {
    const v1 = this.transform_to_view(transformComponent.pos)
    let los_region = []

    this.meshes.forEach((target_mesh) => {
      for (let tvi = 0; tvi < target_mesh.vertices.length; ++tvi) {
        let closest_intersection_point = null

        const target_vertex = target_mesh.vertices[tvi]

        let tvi_l = tvi - 1
        if (tvi_l < 0) { tvi_l = target_mesh.vertices.length - 1 }

        let tvi_r = tvi + 1
        if (tvi_r >= target_mesh.vertices.length) { tvi_r = 0 }

        const target_src_dx = target_vertex.sub_v(v1)

        const t_seg_l_norm = target_mesh.normals[tvi_l]
        const t_seg_r_norm = target_mesh.normals[tvi]
        //const t_seg_l_norm = get_seg_normal(target_mesh.vertices[tvi_l], target_vertex)
        //const t_seg_r_norm = get_seg_normal(target_vertex, target_mesh.vertices[tvi_r])
        const t_seg_l_facing = (get_dot_product(target_src_dx, t_seg_l_norm) >= 0)
        const t_seg_r_facing = (get_dot_product(target_src_dx, t_seg_r_norm) >= 0)

        if (!t_seg_l_facing && !t_seg_r_facing) { continue }

        const targets = [ [ v1, target_vertex ] ]

        if (t_seg_l_facing && !t_seg_r_facing) {
          const e = extend(v1, target_mesh.vertices[tvi], 1000)
            .sub_v(target_mesh.vertices[tvi_l].sub_v(target_mesh.vertices[tvi]).normalise())

          targets.push([target_mesh.vertices[tvi], e])
        } else if (!t_seg_l_facing && t_seg_r_facing) {
          const e = extend(v1, target_mesh.vertices[tvi], 1000)
            .sub_v(target_mesh.vertices[tvi_r].sub_v(target_mesh.vertices[tvi]).normalise())

          targets.push([target_mesh.vertices[tvi], e])
        }

        for (let ti = 0; ti < targets.length; ++ti) {
          const target = targets[ti]
          let closest_intersection_point = null
          let hide = false
          for (let omi = 0; omi < this.meshes.length; ++omi) {
            const other_mesh = this.meshes[omi]

            for (let ovi = 0; ovi < other_mesh.vertices.length; ++ovi) {
              /* we don't need to check l/r of each vertex because we're running
               * though all of them */
              //if (other_mesh.vertices[ovi].x === target[0].x && other_mesh.vertices[ovi].y === target[0].y) { continue }
              let ovi_r = ovi + 1
              if (ovi_r >= other_mesh.vertices.length) { ovi_r = 0 }
              //if (other_mesh.vertices[ovi_r].x === target[0].x && other_mesh.vertices[ovi_r].y === target[0].y) { continue }

              const o_seg_norm = other_mesh.normals[ovi]
              //const o_seg_norm = get_seg_normal(other_mesh.vertices[ovi], other_mesh.vertices[ovi_r])
              const o_seg_norm_facing = (get_dot_product(target[1].sub_v(v1), o_seg_norm) >= 0)

              if (!o_seg_norm_facing) { continue }

              const intersection_point = get_intersection_point(v1, target[1], other_mesh.vertices[ovi], other_mesh.vertices[ovi_r])
              if (intersection_point) {
                if (ti === 0) {
                  // XXX: this will cause issues within closed structures
                  //hide = true
                  ti = targets.length
                }

                if (!closest_intersection_point || closest_intersection_point > intersection_point) {
                  closest_intersection_point = intersection_point
                }
              }
            }
          }

          if (!hide) {
            if (!closest_intersection_point) {
                los_region.push(target[1])
            } else {
              const point = new Vector(
                v1.x + closest_intersection_point * (target[1].x - v1.x),
                v1.y + closest_intersection_point * (target[1].y - v1.y),
                0
              )

              los_region.push(point)
            }
          }
        }
      }
    })

    los_region = los_region.sort((a, b) => {
      return lt(a, b, v1) ? -1 : lt(b, a, v1) ? 1 : 0
    })

    this.ctx.fillStyle = 'rgb(255, 255, 255)'
    this.ctx.fillRect(v1.x-2, v1.y-2, 5, 5)

    this.ctx.beginPath()
    for (let i=0; i < los_region.length; ++i) {
      this.ctx.lineTo(los_region[i].x, los_region[i].y)
    }

    this.ctx.save()
    this.ctx.clip()

    this.ctx.setTransform(1, 0, 0, 0.5, 0, 0)

    //this.ctx.globalCompositeOperation = 'destination-out'
    //const gradient = this.ctx.createRadialGradient(v1.x, v1.y * 2, 0, v1.x, v1.y * 2, 1000)
    //gradient.addColorStop(0, light.colour)
    //gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    //this.ctx.fillStyle = gradient
    this.ctx.drawImage(light.renderable, ~~(v1.x - light.renderable.width / 2), ~~(v1.y*2 - light.renderable.height / 2))
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.restore()
  }

  set_ctx(ctx) {
    this.ctx = ctx
  }

  set_camera(camera) {
    this.camera = camera
    this.camera_pos = this.ecs
      .get_entity_component(this.camera, BaseComponents.TransformComponent)
    this.camera_opt = this.ecs
      .get_entity_component(this.camera, BaseComponents.CameraComponent)
  }

  set_meshes(meshes) {
    this.meshes = []
    this.meshes = [ ...this.meshes, ...meshes ]
  }

  set_cursor(pos) {
    this.cursor = pos
  }
}

export default LightRenderer
