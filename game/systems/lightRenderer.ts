'use strict'

import { System } from 'ecs'

import { BaseComponents } from 'engine'
import MeshComponent from '../components/meshComponent'
import Light from '../components/light.component'
import Vector from 'common'

const get_cos_theta = (v1, v2) => {
  return get_dot_product(v1, v2) / v1.magnitude() * v2.magnitude()
}

const get_reflected_intensity = (source_vector, surface_vector, surface_normal) => {
  const light_intensity = 255
  const diffuse = 1
  return (diffuse * light_intensity )
    //get_dot_product(
    //  surface_vector.sub_v(source_vector).normalise(),
    //  surface_normal.normalise()
    //) ///
   / (get_distance(source_vector, surface_vector) * 0.01)
}

const get_distance = (v1, v2) => {
  return Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y) + (v1.z - v2.z) * (v1.z - v2.z))
}

const lt = (a, b, c) => {
  const a_sub_c_x = a.x - c.x
  const b_sub_c_x = b.x - c.x

  if (a_sub_c_x >= 0 && b_sub_c_x < 0) return true
  if (a_sub_c_x <  0 && b_sub_c_x >= 0) return false

  const a_sub_c_y = a.z - c.z
  const b_sub_c_y = b.z - c.z

  if (a_sub_c_x == 0 && b_sub_c_x == 0) {
    if (a_sub_c_y >= 0 || b_sub_c_y >= 0) return a.z > b.z
    return b.z > a.z
  }

  // compute the cross product of vectors (c -> a) x (c -> b)
  const det = (a_sub_c_x) * (b_sub_c_y) - (b_sub_c_x) * (a_sub_c_y)
  if (det < 0) return true
  if (det > 0) return false

  // points a and b are on the same line from the c
  // check which point is closer to the c
  const d1 = (a_sub_c_x) * (a_sub_c_x) + (a_sub_c_y) * (a_sub_c_y)
  const d2 = (b_sub_c_x) * (b_sub_c_x) + (b_sub_c_y) * (b_sub_c_y)

  return d1 > d2
}

const radial_sort = (centre_vertex, vertices, length) => {
  return vertices.splice(0, length).sort((a, b) => {
    return lt(a[0], b[0], centre_vertex) ? -1 : 1// lt(b, a, centre_vertex) ? 1 : 0
  })
}

const get_intersection_point = (a1, a2, b1, b2) => {
  const dx = (b2.z - b1.z) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.z - a1.z)

  if (dx === 0) return null

  const t1 = (b2.x - b1.x) * (a1.z - b1.z) - (b2.z - b1.z) * (a1.x - b1.x)
  const t2 = (a2.x - a1.x) * (a1.z - b1.z) - (a2.z - a1.z) * (a1.x - b1.x)

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
    + (v2.z - v1.z),
    0,
    - (v2.x - v1.x)
  )
}

const get_cross_product = (v1, v2) => {
  return v1.x * v2.z - v1.z * v2.x
}

const get_dot_product = (v1, v2) => {
  return v1.x * v2.x + v1.z * v2.z
}

const get_line_of_sight = (v, meshes, los_region, ctx) => {
  //const los_region = new Array(1000)
  let index = 0
  const v1 = v
  let n = null

  for (let mi = 0; mi < meshes.length; ++mi) {
    //meshes.forEach((target_mesh) => {
    const target_mesh = meshes[mi]

    if (target_mesh.height !== v.y) { continue }

    for (let tvi = 0; tvi < target_mesh.vertices.length; ++tvi) {
      const target_vertex = target_mesh.vertices[tvi]

      let tvi_l = tvi - 1
      if (tvi_l < 0) { tvi_l = target_mesh.vertices.length - 1 }

      let tvi_r = tvi + 1
      if (tvi_r >= target_mesh.vertices.length) { tvi_r = 0 }

      const target_src_dx = target_vertex.sub_v(v1).normalise()

      const t_seg_l_norm = target_mesh.normals[tvi_l]
      const t_seg_r_norm = target_mesh.normals[tvi]
      const t_seg_l_facing = (get_dot_product(target_src_dx, t_seg_l_norm) >= 0)
      const t_seg_r_facing = (get_dot_product(target_src_dx, t_seg_r_norm) >= 0)

      if (!t_seg_l_facing && !t_seg_r_facing) { continue }

      const targets = new Array(2)
      targets[0] = [ v1, target_vertex, t_seg_r_norm]
      let targets_size = 1

      if (t_seg_l_facing && !t_seg_r_facing) {
        const e = extend(v1, target_mesh.vertices[tvi], 1000)
          .sub_v(target_mesh.vertices[tvi_l].sub_v(target_mesh.vertices[tvi]).normalise())

        targets[1] = [target_mesh.vertices[tvi], e, t_seg_r_norm]
        targets_size = 2
      } else if (!t_seg_l_facing && t_seg_r_facing) {
        const e = extend(v1, target_mesh.vertices[tvi], 1000)
          .sub_v(target_mesh.vertices[tvi_r].sub_v(target_mesh.vertices[tvi]).normalise())

        targets[1] = [target_mesh.vertices[tvi], e, t_seg_r_norm]
        targets_size = 2
      }

      for (let ti = 0; ti < targets_size; ++ti) {
        const target = targets[ti]

        let closest_intersection_point = null
        let hide = false

        /* check for blocking meshes */
        for (let omi = 0; omi < meshes.length; ++omi) {
          const other_mesh = meshes[omi]

          if (other_mesh.height !== target[1].y) { continue }

          for (let ovi = 0; ovi < other_mesh.vertices.length; ++ovi) {
            /* we don't need to check l/r of each vertex because we're running
             * though all of them */
            //if (other_mesh.vertices[ovi].x === target[0].x && other_mesh.vertices[ovi].y === target[0].y) { continue }
            let ovi_r = ovi + 1
            if (ovi_r >= other_mesh.vertices.length) { ovi_r = 0 }
            //if (other_mesh.vertices[ovi_r].x === target[0].x && other_mesh.vertices[ovi_r].y === target[0].y) { continue }

            const o_seg_norm = other_mesh.normals[ovi]
            //const o_seg_norm = get_seg_normal(other_mesh.vertices[ovi], other_mesh.vertices[ovi_r])
            const o_seg_norm_facing = (get_dot_product(target[1].sub_v(v1).normalise(), o_seg_norm) >= 0)

            if (!o_seg_norm_facing) { continue }

            const intersection_point = get_intersection_point(v1, target[1], other_mesh.vertices[ovi], other_mesh.vertices[ovi_r])
            if (intersection_point) {
              if (ti === 0) {
                // XXX: this will cause issues within closed structures
                hide = true
                ti = targets.length
              }

              if (!closest_intersection_point || closest_intersection_point > intersection_point) {
                closest_intersection_point = intersection_point
                n = o_seg_norm
              }
            }
          }
        }

        //if (!hide) {
        let skip  = false
          let point = null
          if (!closest_intersection_point) {
            point = target[1]
            n = target[2]
          } else {
            point = new Vector(
              v1.x + closest_intersection_point * (target[1].x - v1.x),
              0,
              v1.z + closest_intersection_point * (target[1].z - v1.z)
            )
          }

          if (n) {
            let ix = null
            if (!hide) { 
              ix = get_reflected_intensity(v, point, n) 
              skip = (ti !== 0)
              ctx.strokeStyle = 'rgb(255, 0, 255)'
              ctx.moveTo(point.x, point.z)
              ctx.lineTo(point.x + n.x, point.z + n.z)
              ctx.stroke()
            }
            //ctx.fillStyle = `rgb(${~~Math.abs(ix)}, 0, 0)`
            //ctx.fillRect(point.x, point.z, 20, 20)
            los_region[index++] = [point, ix, skip]
          }
            //}
      }
    }
    //})
  }

  return { los_region, size: index }
}

class LightRenderer extends System {
  camera
  camera_pos
  camera_opt
  ctx
  meshes
  cursor
  camera_offset
  los_region
  los_region_size

  constructor() {
    super([
      BaseComponents.TransformComponent,
      Light
    ])

    this.los_region = new Array(1000)
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
    return new Vector((v.x - v.z), 0, (v.x + v.z) / 2)
      .mul_f(this.camera_opt.scale)
      .sub_v(this.camera_offset)
  }

  process_entity(entity, t, dt, { transformComponent, light }) {
    const v1 = this.transform_to_view(transformComponent.pos)
    let { los_region, size } = get_line_of_sight(v1, this.meshes, this.los_region, this.ctx)
    this.los_region = los_region
    this.los_region_size = size

    this.los_region = radial_sort(v1, los_region, size)

    this.ctx.save()
    this.ctx.beginPath()
    for (let i=0; i < size; ++i) {
      this.ctx.lineTo(this.los_region[i][0].x, this.los_region[i][0].z)
    }

    this.ctx.clip()

    this.ctx.setTransform(1, 0, 0, 0.5, 0, 0)

    this.ctx.drawImage(
      light.renderable,
      ~~(v1.x - light.renderable.width / 2),
      ~~(v1.z*2 - light.renderable.height / 2)
    )

    this.ctx.restore()

    //for(let i=0; i<size; ++i) {
    //  this.ctx.fillStyle = `rgb(${~~los_region[i][1]}, 0, 200)`
    //  this.ctx.fillRect(los_region[i][0].x, los_region[i][0].z-50, 5, 50)
    //}
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
