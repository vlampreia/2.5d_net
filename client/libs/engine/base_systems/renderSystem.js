'use strict'

import { System } from 'ecs'
import TransformComponent from '../base_components/transformComponent.js'
import RenderableComponent from '../base_components/renderableComponent.js'
import CameraComponent from '../base_components/cameraComponent.js'
import Vector from 'common'

class RenderSystem extends System {
  constructor(render_system, camera_entity) {
    super([ TransformComponent, RenderableComponent ])

    this.render_system = render_system
    this.camera_entity = camera_entity
    this.camera_pos = null
    this.camera_opt = null
  }

  setup() {
    this.camera_pos = this.ecs
      .get_entity_component(this.camera_entity, TransformComponent)
    this.camera_opt = this.ecs
      .get_entity_component(this.camera_entity, CameraComponent)

    return true
  }

  teardown() {
    this.render_system.buffer_ctx.resetTransform()
    //this.render_system.render_frame(1)
  }

  process_entities(entities, t, dt) {
    // TODO: we are effectively retrieving the transform components twice
    // which looks inefficient. We can probably prescan the entity list and
    // append transform components before calling super.process_entities.
    // this will be a special case but who cares really
    const sorted_entities = entities.sort((a, b) => {
      const ta = this.ecs.get_entity_component(a, TransformComponent)
      const tb = this.ecs.get_entity_component(b, TransformComponent)

      return ta.pos.z - tb.pos.z
    })

    super.process_entities(sorted_entities)
  }

  process_entity(entity, t, dt, { transformComponent, renderableComponent }) {
    //const transf_pos = this.camera.world_to_screen_pos(transformComponent.pos)

    const dims = new Vector(
      renderableComponent.canvas.width,
      renderableComponent.canvas.height
    )

    const transf_pos = transformComponent.pos
      .mul_f(this.camera_opt.scale)
      .sub_v(
        this.camera_pos.pos.mul_f(this.camera_opt.scale)
          .sub_v(this.camera_opt.view_centre)
      ).sub_v(dims.div_f(2))

    /* ctx.setTransform()
     * a - hotizontal scaling
     * b - hotizontal skewing
     * c - vertical skewing
     * d - vertical scaling
     * e - horizontal moving
     * f - vertical moving
     */
    this.render_system.buffer_ctx.setTransform(
      this.camera_opt.scale, 0, 0, this.camera_opt.scale,
      transf_pos.x,
      transf_pos.y
    )

    this.render_system.buffer_ctx.drawImage(renderableComponent.canvas, 0, 0)
  }

  set_active_camera_entity(camera_entity) {
    this.camera_entity = camera_entity
  }
}

export default RenderSystem
