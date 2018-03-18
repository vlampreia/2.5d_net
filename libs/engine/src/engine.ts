'use strict'

import Debug from 'debug'
const debug = Debug('game:engine')

import EventManager from './eventManager'
import EventType from './eventType'
import Renderer from './renderer'
import Network from './network'
import WindowEventManager from './windowEventManager'
import Vector from 'common'
import E from './events'
import GuiSystem from './gui_system'

import * as ECS from 'ecs'

import RenderSystem from './base_systems/renderSystem'
import IsometricRenderSystem from './base_systems/isometricRenderSystem'

import * as BaseComponents from './base_components'

import InputMapper from './inputMapper'

class Engine {
  event_manager
  renderer
  network
  windowEventManager
  _ecs
  render_system
  gui_system
  input_mapper
  frame_consts
  frame_stats
  active_camera_entity
  mouse_pos
  _simulation_hook_fn
  _render_hook_fn
  _pre_render_hook_fn
  show_dbg

  constructor(canvas_element) {
    this.event_manager = new EventManager()
    this.renderer = new Renderer(canvas_element)
    this.network = new Network({
      endpoint: '127.0.0.1',
      port: 3000,
      event_manager: this.event_manager,
    })

    this.windowEventManager = new WindowEventManager(this.event_manager)

    this._ecs = new ECS.ECS()

    this.render_system = new IsometricRenderSystem(this.renderer, this.active_camera_entity)
    this._ecs.push_system(this.render_system)

    this.gui_system = new GuiSystem()

    this.input_mapper = new InputMapper(this.event_manager)

    const max_fps = 60

    this.frame_consts = {
      net_update_step:  100,
      frame_time_step:  1 / max_fps,
    }

    this.frame_stats = {
      frame_time_ptr: 0,
      frame_times: new Array(50),
      last_net_update:  0,
      accumulator:      0,
      last_frame_time:  0,
      render_time:      0,
      frame_time:       0,
      sim_time:         0,
    }

    this.active_camera_entity = null

    this.mouse_pos = new Vector(0, 0, 0)

    this.event_manager.add_listener(
      E.WINDOW_RESIZE, this.resize_listener.bind(this)
    )

    this.event_manager.add_listener(E.MOUSE_MOVE, this.mouse_listener.bind(this))

    this.event_manager.add_listener('self_connect', () => {
      debug('connected to server')
    })

    this.event_manager.add_listener('self_disconnect', () => {
      debug('disconnected from server')
    })

    //this.event_manager.add_listener(
    //  'place_block', this.action_place_block.bind(this)
    //)

    this._simulation_hook_fn = null
    this._render_hook_fn = null
    this._pre_render_hook_fn = null

    this._ecs.register_component_class(BaseComponents.TransformComponent)
    this._ecs.register_component_class(BaseComponents.BoundsComponent)
    this._ecs.register_component_class(BaseComponents.RenderableComponent)
    this._ecs.register_component_class(BaseComponents.CameraComponent)
    this.show_dbg = false
  }

  get_ecs() {
    return this._ecs
  }

  set_active_camera_entity(camera) {
    this.active_camera_entity = camera
    this.render_system.set_active_camera_entity(this.active_camera_entity)
  }

  start() {
    this.network.connect()
    this.resize_listener()
    window.requestAnimationFrame(this.main_loop.bind(this))
  }

  set_simulation_hook(fn) {
    this._simulation_hook_fn = fn
  }

  call_simulation_hook(t, dt) {
    if (this._simulation_hook_fn) { this._simulation_hook_fn(t, dt) }
  }

  set_render_hook(fn) {
    this._render_hook_fn = fn
  }

  call_render_hook(ctx) {
    if (this._render_hook_fn) { this._render_hook_fn(ctx) }
  }

  set_pre_render_hook(fn) {
    this._pre_render_hook_fn = fn
  }

  call_pre_render_hook(ctx) {
    if (this._pre_render_hook_fn) { this._pre_render_hook_fn(ctx) }
  }

  set_frame_time(t) {
    this.frame_stats.frame_time = t
    this.frame_stats.frame_times[this.frame_stats.frame_time_ptr++] = t
    if (this.frame_stats.frame_time_ptr === this.frame_stats.frame_times.length) {
      this.frame_stats.frame_time_ptr = 0
    }
  }

  main_loop(t) {
    const frame_start_time = Date.now()

    this.set_frame_time(t - this.frame_stats.last_frame_time)
    this.frame_stats.last_frame_time = t
    this.frame_stats.accumulator += this.frame_stats.frame_time

    /* read local and network pushed events */
    this.event_manager.dispatch_events()

    /* perform simulation steps */
    const sim_t1 = Date.now()
    while (this.frame_stats.accumulator >= this.frame_consts.frame_time_step) {
      this.call_simulation_hook(frame_start_time, this.frame_consts.frame_time_step)

      this.frame_stats.accumulator -= this.frame_consts.frame_time_step
    }
    const sim_t2 = Date.now()

    /* send local events to network */
    if (frame_start_time - this.frame_stats.last_net_update >= this.frame_consts.net_update_step) {
      this.frame_stats.last_net_update = frame_start_time
      this.network.dequeue_msgs(frame_start_time)
      this.network.dequeue_events(frame_start_time)
    }

    /* interpolate positions before render */
    const time = frame_start_time - 100
    this._ecs.components.TransformComponent.forEach((t) => {
      if (time === -1) { return }
      if (time  < t.pos_prev_time ) {
        t.pos.x = t.pos_prev.x
        t.pos.y = t.pos_prev.y
        t.time = t.pos_prev_time
        //console.log('early')
      } else if (time > t.pos_next_time) {
        //console.log('late', time - t.pos_next_time, time, t.pos_next_time)
        t.pos.x = t.pos_next.x
        t.pos.y = t.pos_next.y
        t.time = t.pos_next_time
      } else {
        const xt = (time - t.pos_prev_time) / (t.pos_next_time - t.pos_prev_time)
        t.pos.x = t.pos_prev.x + ((t.pos_next.x - t.pos_prev.x) * xt)
        t.pos.y = t.pos_prev.y + ((t.pos_next.y - t.pos_prev.y) * xt)
        t.time = t.pos_prev_time + ((t.pos_next_time - t.pos_prev_time) * xt)
      }
    });

    /* render */
    const render_t1 = Date.now()
    this.renderer.clear_buffer()
    this.renderer.render_bg()
    this.call_pre_render_hook(this.renderer.buffer_ctx)
    this.render_system.update()
    this.call_render_hook(this.renderer.buffer_ctx)
    this.render_ui()
    this.render()
    this.renderer.swap_buffer()
    const render_t2 = Date.now()

    /* update stats */
    this.frame_stats.sim_time = sim_t2 - sim_t1
    this.frame_stats.render_time = render_t2 - render_t1

    /* request next frame */
    window.requestAnimationFrame(this.main_loop.bind(this))
  }

  render() {
    if (!this.show_dbg) { return }

    const ctx = this.renderer.buffer_ctx

    ctx.fillStyle = 'rgb(150, 255, 255)'
    ctx.fillRect(0, 0, 200, 60)

    ctx.fillStyle = 'rgb(200, 50, 0)'
    this.renderer.render_box(this.mouse_pos.x - 1, this.mouse_pos.y - 1, 3)

    this.renderer.buffer_ctx.font = '10px mono'
    this.renderer.buffer_ctx.fillStyle = 'rgb(0, 0, 0)'

    let avg_frame_time = 0
    for (let i=0; i<this.frame_stats.frame_times.length; ++i) {
      avg_frame_time += this.frame_stats.frame_times[i]
    }
    avg_frame_time /= this.frame_stats.frame_times.length

    //this.renderer.buffer_ctx.fillText('frame time: ' + this.frame_stats.frame_time, 10, 20)
    this.renderer.buffer_ctx.fillText('frame time: ' + ~~avg_frame_time, 10, 20)
    this.renderer.buffer_ctx.fillText('fps: ' + ~~(1000/avg_frame_time), 100, 20)
    this.renderer.buffer_ctx.fillText('sim time:   ' + this.frame_stats.sim_time, 10, 30)
    this.renderer.buffer_ctx.fillText('render time:' + this.frame_stats.render_time, 10, 40)

    if (this.network.connected) {
      this.renderer.buffer_ctx.fillText('CONNECTED', 10, 50)
    } else {
      this.renderer.buffer_ctx.fillText('DISCONNECTED', 10, 50)
    }
  }

  render_ui() {
    this.gui_system.render(this.renderer.buffer_ctx)
  }

  resize_listener() {
    this.renderer.resize_canvas()
    this.gui_system.resize_canvas()

    const camera = this._ecs.get_entity_component(this.active_camera_entity, BaseComponents.CameraComponent)

    camera.set_view_dimensions(
      this.renderer.buffer_ctx.canvas.width,
      this.renderer.buffer_ctx.canvas.height
    )
  }

  mouse_listener(e) {
    this.mouse_pos.x = e.clientX
    this.mouse_pos.y = e.clientY
    this.gui_system.set_mouse_pos(this.mouse_pos)
  }

//  action_place_block({ event_type, e }) {
//    const entity = this._ecs.create_entity()
//    const tc = new TransformComponent()
//    entity.entity_id = e.block.entity_id
//    tc.pos = new Vector(e.block.pos.x, e.block.pos.y, 0)
//    this._ecs.set_entity_component(entity, tc)
//    const rd = new RenderableComponent()
//    this._ecs.set_entity_component(entity, rd)
//    rd.canvas = document.createElement('canvas')
//    rd.canvas.width = 10
//    rd.canvas.height = 10
//    const ctx = rd.canvas.getContext('2d')
//
//    if (e.client_id === this.network.client_id) {
//      ctx.fillStyle = 'rgb(0, 220, 100)'
//    } else {
//      ctx.fillStyle = 'rgb(60, 120, 0)'
//    }
//
//    ctx.fillRect(0, 0, 10, 10)
//  }

  get_entity_at(position) {
    // TODO: optimise this with a spacial datastructure
    // TODO: this does not work with rotated or non rectangular bounds

    const entities = []

    const rpos = new Vector(
        (position.x - position.z)     ,
      0,
        (position.x + position.z) / 2
    )

    for (let i = 0; i < this._ecs.entities.length; ++i) {
      const e = this._ecs.entities[i]
      if (!e) { continue }

      const t = this._ecs.get_entity_component(e, BaseComponents.TransformComponent)
      if (!t) { continue }

      const b = this._ecs.get_entity_component(e, BaseComponents.BoundsComponent)
      if (!b) { continue }

        const mp = new Vector(
          (t.pos.x - t.pos.z)    , //- (b.offset.x),
          0,
          (t.pos.x + t.pos.z) / 2 - (b.offset.z) - t.pos.y
        )

      //console.log(rpos, mp)

      //const mp = new Vector(
      //  (t.pos.x),//+ (b.offset.x),
      //  0,
      //  (t.pos.y)- (b.offset.y),
      //)
      //if (position.x < mp.x - b.width / 2) { continue }
      //if (position.x > mp.x + b.width / 2) { continue }
      //if (position.z < mp.z - b.height / 2) { continue }
      //if (position.z > mp.z + b.height / 2) { continue }

      if (rpos.x < mp.x - b.width / 2) { continue }
      if (rpos.x > mp.x + b.width / 2) { continue }
      if (rpos.z < mp.z - b.height / 2) { continue }
      if (rpos.z > mp.z + b.height / 2) { continue }

      entities.push({ e: e, pos: t.pos })
    }

    if (entities.length === 0) { return null }

    const e = entities.sort((a, b) => {
      return (b.pos.x + b.pos.y + b.pos.z) - (a.pos.x + a.pos.y + a.pos.z)
    })[0]

    return e.e
  }
}

export default Engine
