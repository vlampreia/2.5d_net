'use strict'

import { System } from 'ecs'
import TransformComponent from '../base_components/transformComponent'
import RenderableComponent from '../base_components/renderableComponent'
import CameraComponent from '../base_components/cameraComponent'
import Vector from 'common'

class IsometricRenderSystem extends System {
  private render_system
  private camera_entity
  private camera_pos
  private camera_opt

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
  }

  process_entities(entities, t, dt) {
    let sorted_entities = entities.sort((a, b) => {
      return Math.random() - Math.random()
    })

    //sorted_entities = entities.sort((a, b) => {
    //  const ta = this.ecs.get_entity_component(a, TransformComponent)
    //  const tb = this.ecs.get_entity_component(b, TransformComponent)

    //  return ta.pos.z - tb.pos.z
    //})
    //
    sorted_entities = entities.sort((a, b) => {
      const ta = this.ecs.get_entity_component(a, TransformComponent)
      const tb = this.ecs.get_entity_component(b, TransformComponent)

      return (ta.pos.x + ta.pos.y + ta.pos.z) - (tb.pos.x + tb.pos.y + tb.pos.z)
    })

    super.process_entities(sorted_entities, t, dt)
  }

  process_entity(entity, t, dt, { transformComponent, renderableComponent }) {
    const buffer = this.render_system.buffer_ctx

    const dims = new Vector(
      renderableComponent.canvas.width,
      renderableComponent.canvas.height,
      0
    )

    const transf_pos = new Vector(
      (transformComponent.pos.x - transformComponent.pos.y),
      (transformComponent.pos.x + transformComponent.pos.y)/2 - dims.y / 2,
      0
    ) .mul_f(this.camera_opt.scale)
      .sub_v(
        this.camera_pos.pos.mul_f(this.camera_opt.scale)
          .sub_v(this.camera_opt.view_centre)
      ).sub_v(dims.div_f(2))

    buffer.setTransform(
      this.camera_opt.scale, 0, 0, this.camera_opt.scale,
      transf_pos.x,
      transf_pos.y
    )

    buffer.drawImage(renderableComponent.canvas, 0, 0)
  }

  set_active_camera_entity(camera_entity) {
    this.camera_entity = camera_entity
  }
}

export default IsometricRenderSystem
