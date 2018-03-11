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
  meshes
  //  lines
  //  vertices

  constructor() {
    super([
      MeshComponent,
      BaseComponents.TransformComponent
    ])
  }

  setup() {
    //this.lines = []
    //this.vertices = []
    this.meshes = []

    this.meshes.push([
      new Vector(0, 0, 0),
      new Vector(this.ctx.canvas.width, 0, 0),
      new Vector(this.ctx.canvas.width, this.ctx.canvas.height, 0),
      new Vector(0, this.ctx.canvas.height, 0),
    ])
    //this.meshes.push([
    //  new Vector(0, this.ctx.canvas.height, 0),
    //  new Vector(this.ctx.canvas.width, this.ctx.canvas.height, 0),
    //  new Vector(this.ctx.canvas.width, 0, 0),
    //  new Vector(0, 0, 0),
    //])

    //this.vertices.push(new Vector(0, 0, 0))
    //this.vertices.push(new Vector(this.ctx.canvas.width, 0, 0))
    //this.vertices.push(new Vector(this.ctx.canvas.width, this.ctx.canvas.height, 0))
    //this.vertices.push(new Vector(0, this.ctx.canvas.height, 0))
    //this.lines.push([this.vertices[0], this.vertices[1]])
    //this.lines.push([this.vertices[1], this.vertices[2]])
    //this.lines.push([this.vertices[2], this.vertices[3]])
    //this.lines.push([this.vertices[3], this.vertices[0]])
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

    const source_positions = [
      this.cursor,
      new Vector(50, 200, 0),
      new Vector(800, 300, 0),
      //this.cursor.add_v(new Vector( 5, 0, 0)),
      //this.cursor.add_v(new Vector(-5, 0, 0)),
      //this.cursor.add_v(new Vector(0, 5, 0)),
      //this.cursor.add_v(new Vector(0, -5, 0)),
    ]

    //const v1 = this.cursor
    for (let spi = 0; spi < source_positions.length; ++spi) {
      const v1 = source_positions[spi]

      let vis = []

      const extend = (p1, p2, factor) => {
        const len = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
        const end = p2.add_v(p2.sub_v(p1).normalise().mul_f(factor))
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

      const get_dot_product = (v1, v2) => {
        return v1.x * v2.x + v1.y * v2.y
      }

      this.meshes.forEach((target_mesh) => {
        for (let tvi = 0; tvi < target_mesh.length; ++tvi) {
          let closest_intersection_point = null
          let backfacing = false

          const target_vertex = target_mesh[tvi]

          let tvi_l = tvi - 1
          if (tvi_l < 0) { tvi_l = target_mesh.length - 1 }
          let tvi_r = tvi + 1
          if (tvi_r >= target_mesh.length) { tvi_r = 0 }
          const t_seg_l_norm = get_seg_normal(target_mesh[tvi_l], target_vertex)
          const t_seg_r_norm = get_seg_normal(target_vertex, target_mesh[tvi_r])
          const t_seg_l_facing = (get_dot_product(target_vertex.sub_v(v1), t_seg_l_norm) >= 0)
          const t_seg_r_facing = (get_dot_product(target_vertex.sub_v(v1), t_seg_r_norm) >= 0)

          if (!t_seg_l_facing && !t_seg_r_facing) { continue }

          const targets = [ [ v1, target_vertex ] ]
          //const targets = []

          if (t_seg_l_facing && !t_seg_r_facing) {
            //targets.push(extend(v1, target_mesh[tvi], 1000))
            const e = extend(v1, target_mesh[tvi], 1000).sub_v(target_mesh[tvi_l].sub_v(target_mesh[tvi]).normalise())
            //this.ctx.beginPath()
            //this.ctx.moveTo(target_mesh[tvi].x, target_mesh[tvi].y)
            //this.ctx.lineTo(e.x, e.y)
            //this.ctx.stroke()
            //targets.push([v1, e])
            targets.push([target_mesh[tvi], e])
            //targets.push([target_mesh[tvi], e])
          } else if (!t_seg_l_facing && t_seg_r_facing) {
            //const e = extend(v1, target_mesh[tvi], 1000)
            const e = extend(v1, target_mesh[tvi], 1000).sub_v(target_mesh[tvi_r].sub_v(target_mesh[tvi]).normalise())
            targets.push([target_mesh[tvi], e])
            ////targets.push([v1, e])
            //targets.push([target_mesh[tvi], e])
            //targets.push([target_mesh[tvi].add_f(1), e])
            //targets.push(extend(v1, target_mesh[tvi_r], 1000))
          }

          for (let ti = 0; ti < targets.length; ++ti) {
            const target = targets[ti]
            //targets.forEach((target) => {
            let closest_intersection_point = null
            let hide = false
            //this.ctx.beginPath()
            //this.ctx.moveTo(target[0].x, target[0].y)
            //this.ctx.lineTo(target[1].x, target[1].y)
            //this.ctx.stroke()
            for (let omi = 0; omi < this.meshes.length; ++omi) {
              const other_mesh = this.meshes[omi]

              for (let ovi = 0; ovi < other_mesh.length; ++ovi) {
                /* we don't need to check l/r of each vertex because we're running
                 * though all of them */
                if (other_mesh[ovi].x === target[0].x && other_mesh[ovi].y === target[0].y) { continue }
                let ovi_r = ovi + 1
                if (ovi_r >= other_mesh.length) { ovi_r = 0 }
                if (other_mesh[ovi_r].x === target[0].x && other_mesh[ovi_r].y === target[0].y) { continue }

                const o_seg_norm = get_seg_normal(other_mesh[ovi], other_mesh[ovi_r])
                const o_seg_norm_facing = (get_dot_product(target[1].sub_v(v1), o_seg_norm) >= 0)

                if (!o_seg_norm_facing) { continue }

                const intersection_point = get_intersection_point(v1, target[1], other_mesh[ovi], other_mesh[ovi_r])
                if (intersection_point) {
                  if (ti === 0) {
                    // XXX: this will cause issues within closed structures
                    //hide = true
                      ti = targets.length
                  }
                    if (!closest_intersection_point || closest_intersection_point > intersection_point) {
                      closest_intersection_point = intersection_point
                    }
                  //}
                }
              }
            }

            if (!hide) {

            if (!closest_intersection_point && !backfacing) {
              //const extended = extend(v1, v2, 100)
              //if (!hide)
                vis.push(target[1])
            } else if(!backfacing) {
              const point = new Vector(
                v1.x + closest_intersection_point * (target[1].x - v1.x),
                v1.y + closest_intersection_point * (target[1].y - v1.y),
                0
              )
              vis.push(point)
            }
            }
            //  })
          }
        }
      }

      //this.vertices.forEach((v2) => {
      //  let seen = true
      //  let backfacing = false
      //  const extended = extend(v1, v2, 100)
      //  let closest_intersection_point = null

      //  for (let i=0; i<this.lines.length; ++i) {
      //    const l = this.lines[i]

      //    const normal = get_seg_normal(l[0], l[1])
      //    this.ctx.beginPath()
      //    this.ctx.moveTo(l[0].x, l[0].y)
      //    const rzxx = normal.add_v(l[0])
      //    this.ctx.lineTo(rzxx.x, rzxx.y)
      //    this.ctx.stroke()
      //    if (get_dot_product(l[0].sub_v(v1), normal) >= 0) {
      //      //continue
      //    }

      //    //backfacing = false

      //    const intersection_point = get_intersection_point(v1, v2, l[0], l[1])
      //    if (intersection_point) {
      //      if (
      //        !closest_intersection_point ||
      //        closest_intersection_point > intersection_point
      //      ) {
      //        //backfacing = b
      //        closest_intersection_point = intersection_point
      //      }
      //        //intersections.push(intersection)
      //      //vis.push(intersection)
      //      //seen = false
      //      //break
      //    }
      //  }

      //  if (!closest_intersection_point && !backfacing) {
      //  //const extended = extend(v1, v2, 100)
      //      vis.push(v2)
      //  } else if(!backfacing) {
      //    const point = new Vector(
      //      v1.x + closest_intersection_point * (v2.x - v1.x),
      //      v1.y + closest_intersection_point * (v2.y - v1.y),
      //      0
      //    )
      //    vis.push(point)
      //  }
      //})

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

      this.ctx.fillStyle = 'rgb(255, 255, 255)'

      this.ctx.fillRect(v1.x-2, v1.y-2, 5, 5)

      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
      this.ctx.strokeStyle = 'rgb(255, 0, 0)'

      this.ctx.beginPath()
      for (let i=0; i<vis.length; ++i) {
        let z = i+1
        if (z === vis.length) z = 0

        //this.ctx.beginPath()
        //this.ctx.moveTo(v1.x, v1.y)
        //const e = extend(v1, vis[i], 1000)
        ////this.ctx.lineTo(e.x, e.y)
        //this.ctx.lineTo(vis[i].x, vis[i].y)
        //this.ctx.stroke()

        //this.ctx.beginPath()
        //this.ctx.moveTo(v1.x, v1.y)
        this.ctx.lineTo(vis[i].x, vis[i].y)
        //this.ctx.lineTo(vis[z].x, vis[z].y)
        //this.ctx.lineTo(v1.x, v1.y)
        //this.ctx.fill()
      }
      this.ctx.closePath()
      this.ctx.setTransform(1, 0, 0, 0.5, 0, 0)

      //this.ctx.globalCompositeOperation = 'destination-out'
      this.ctx.globalCompositeOperation = 'screen'
      const gradient = this.ctx.createRadialGradient(v1.x, v1.y * 2, 0, v1.x, v1.y * 2, 1000)
      gradient.addColorStop(0, `rgba(200, ${~~(255/source_positions.length)*spi}, 10, 1.0)`)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      this.ctx.fillStyle = gradient
      this.ctx.fill()
    this.ctx.resetTransform()
    }

    this.ctx.globalCompositeOperation = 'normal'
  }

  process_entities(entities, t, dt) {
    super.process_entities(entities, t, dt)
  }

  process_entity(entity, t, dt, { meshComponent, transformComponent }) {
    const mesh = []
      for (let i =0 ; i<meshComponent.vertices.length; ++i) {
        const p1 = meshComponent.vertices[i] .add_v(
          new Vector(
            ((transformComponent.pos.x - transformComponent.pos.y) ) - (meshComponent.mid.x),
            ((transformComponent.pos.x + transformComponent.pos.y) ) / 2 - (meshComponent.mid.y) - transformComponent.pos.z, 0)) 
          .mul_f(this.camera_opt.scale) 
          .sub_v( this.camera_pos.pos.mul_f(this.camera_opt.scale) 
            .sub_v(this.camera_opt.view_centre))
        mesh.push(p1)
      }

    this.meshes.push(mesh)

      /*
      for (let i =0 ; i<meshComponent.vertices.length; ++i) {
        const p1 = meshComponent.vertices[i] .add_v(
          new Vector(
            ((transformComponent.pos.x - transformComponent.pos.y) - 2) - (meshComponent.mid.x),
            ((transformComponent.pos.x + transformComponent.pos.y) - 2) / 2 - (meshComponent.mid.y) - transformComponent.pos.z, 0)) 
          .mul_f(this.camera_opt.scale) 
          .sub_v( this.camera_pos.pos.mul_f(this.camera_opt.scale) 
            .sub_v(this.camera_opt.view_centre))

        let z = i+1
        if (z === meshComponent.vertices.length) z = 0
        const p2 = meshComponent.vertices[z] .add_v(new Vector( (transformComponent.pos.x - transformComponent.pos.y) - 2 - (meshComponent.mid.x), ((transformComponent.pos.x + transformComponent.pos.y) - 2) / 2 - (meshComponent.mid.y) - transformComponent.pos.z, 0)) .mul_f(this.camera_opt.scale) .sub_v( this.camera_pos.pos.mul_f(this.camera_opt.scale) .sub_v(this.camera_opt.view_centre))
        this.lines.push([p1,p2])
      }
      */
    //meshComponent.vertices.forEach((v) => {
    //  const transf_pos = new Vector(0, 0, 0)
    //    .add_v(new Vector(
    //       (transformComponent.pos.x - transformComponent.pos.y) - 2 - (meshComponent.mid.x),
    //      ((transformComponent.pos.x + transformComponent.pos.y) - 2) / 2 - (meshComponent.mid.y) - transformComponent.pos.z,
    //       0
    //     ))
    //    .add_v(new Vector(
    //      v.x,
    //      v.y,
    //      0
    //    ))
    //    .mul_f(this.camera_opt.scale)
    //    .sub_v(
    //      this.camera_pos.pos.mul_f(this.camera_opt.scale)
    //        .sub_v(this.camera_opt.view_centre)
    //    )

    //  this.vertices.push(transf_pos)

    //  const sp = this.cursor//.sub_v(transf_pos)

    //  const len = Math.sqrt(Math.pow(sp.x - transf_pos.x, 2) + Math.pow(sp.y - transf_pos.y, 2))
    //  const end = transf_pos.add_v(transf_pos.sub_v(sp).div_f(len).mul_f(1000))
    //  })
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
