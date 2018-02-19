'use strict'

import uuid from 'uuid'

import { Events as E, Engine, BaseComponents, GuiElement } from 'engine'

import TransformFollowerComponent from './components/transformFollowerComponent.js'
import PlayerControlledComponent from './components/playerControlledComponent.js'
import ModuleHostComponent from './components/moduleHostComponent.js'
import ModuleComponent from './components/moduleComponent.js'
import StarbaseComponent from './components/starbaseComponent.js'
import PlanetComponent from './components/planetComponent.js'

import PlayerControllerSystem from './systems/playerController.js'
import TransformFollowerSystem from './systems/transformFollowerSystem.js'

import Vector from 'common'

class Game {
  constructor(canvas_element) {
    localStorage.debug = 'game*'
    this.engine = new Engine(canvas_element)

    this.systems = {
      player_controller: new PlayerControllerSystem(this.event_manager),
      transform_follower: new TransformFollowerSystem(),
    }
    Object.values(this.systems)
      .forEach((s) => this.engine._ecs.push_system(s))

    this.component_classes = {
      TransformFollowerComponent,
      PlayerControlledComponent,
      ModuleHostComponent,
      ModuleComponent,
      StarbaseComponent,
      PlanetComponent,
    }
    Object.values(this.component_classes)
      .forEach((c) => this.engine._ecs.register_component_class(c))

    //this.engine.set_render_hook(this.render_gui.bind(this))
    this.engine.set_simulation_hook(this.engine_simulation_hook.bind(this))

    const net = this.engine.network
    net.on('player_join', this.handle_net_player_join.bind(this))
    net.on('player_disconnect', this.handle_net_player_disconnect.bind(this))

    const events = this.engine.event_manager
    events.on(E.MOUSE_DOWN, this.handle_mouse_down.bind(this))
    events.on('player_action', this.handle_player_action.bind(this))
    events.on('TARGET_ENTITY', this.handle_target_event.bind(this))
    events.on('player_join', this.create_player_entity.bind(this))
    events.on('player_dock', (stuff) => { console.log(stuff) })
    events.on('ui_action', this.handle_ui_event.bind(this))
    events.on('build', this.deserialise_object.bind(this))
    events.on('player_disconnect', this.handle_player_disconnect.bind(this))
    events.on('generate_planet', this.handle_generate_planet.bind(this))
    events.on('select_planet', this.handle_select_planet.bind(this))
    events.on(E.WINDOW_RESIZE, this.resize_listener.bind(this))

    this.camera = this.create_camera()
    this.engine.set_active_camera_entity(this.camera)

    this.cell_width = 10

    this.selected_entity = null

    this.selected_ui_txt = new GUI_TextBox({
      text: '', 
      fg_colour: 'rgb(0, 0, 0)',
      bg_colour: 'rgb(255, 255, 255)'
    })
    this.selected_ui_txt.pos = new Vector(10, 60)
    this.engine.gui_system.add_element(this.selected_ui_txt)

    this.targeting = new GUI_TextBox({
      text: 'targeting: ',
      fg_colour: 'rgb(0, 0, 0)',
      bg_colour: 'rgb(255, 255, 255)',
      pos: new Vector(10, 80)
    })
    this.engine.gui_system.add_element(this.targeting)
    
    this.ui_planet_info = new GUI_TextBox({
      text: '',
      fg_colour: 'rgb(0, 0, 0)',
      bg_colour: 'rgb(255, 255, 255)',
      pos: new Vector(10, 140),
    })
    this.engine.gui_system.add_element(this.ui_planet_info)

    this.targeted = new GUI_TextBox({
      text: 'targeted: ',
      fg_colour: 'rgb(0, 0, 0)',
      bg_colour: 'rgb(255, 255, 255)',
      pos: new Vector(10, 100)
    })
    this.engine.gui_system.add_element(this.targeted)

    this.input_text = new GUI_TextBox({
      text: '',
      fg_colour: 'rgba(255, 255, 255, 0.5)',
      bg_colour: 'rgba(100, 100, 100, 0.5)',
      pos: new Vector(10, 120)
    })
    this.input_text.anchor.horizontal = 'right'
    this.input_text.anchor.vertical = 'bottom'
    this.input_text.visible = false
    const input_map = this.engine.input_mapper.get_input_mapping()
    let txt = Object.entries(input_map).map((e) => JSON.stringify(e)).join('\n')
    this.input_text.set_text(txt)
    this.engine.gui_system.add_element(this.input_text)

    this.players = []

    this.txtbox = new GUI_TextBox({})
    this.txtbox.pos = new Vector(0, 0)
    this.txtbox.fg_colour = 'rgb(0, 0, 0)'
    this.txtbox.bg_colour = 'rgb(255, 255, 255)'
    this.txtbox.set_text('hello')
    this.txtbox.anchor.horizontal = 'centre'
    this.txtbox.anchor.vertical = 'centre'
    this.engine.gui_system.add_element(this.txtbox)

    this.render_bg()

    const planet_event = {
      entity: {
        entity_id: -400,
      },
      components: [
        {
          type: 'TransformComponent',
          data: {
            pos: {
              x: 300,
              y: 300,
            },
          },
        },
        {
          type: 'RenderableComponent',
          data: {
            asset: 'planet',
          },
        },
        {
          type: 'BoundsComponent',
          data: {
            width: 100,
            height: 100,
          },
        },
        {
          type: 'PlanetComponent',
          data: {
            data: {
              radius: 50,
              surface_temp: 10,
              azm: 2.4,
            },
          },
        },
      ],
    }

    this.engine.event_manager.push_event({
      event_type: 'generate_planet',
      e: planet_event,
    })
  }

  join_game() {
    this.engine.network.send_event('login', { name: uuid.v4() })
  }

  run() {
    this.engine.start()

    this.join_game()
  }

  handle_mouse_down(e) {
    const camera_pos = this.engine._ecs
      .get_entity_component(this.camera, BaseComponents.TransformComponent)
    const camera_opt = this.engine._ecs
      .get_entity_component(this.camera, BaseComponents.CameraComponent)

    const world_pos = this.engine.mouse_pos
      .add_v(camera_pos.pos
        .mul_f(camera_opt.scale)
        .sub_v(camera_opt.view_centre)
      )
      .div_f(camera_opt.scale)
      .sub_f(this.cell_width / 2)

    //const world_pos = this.camera.screen_to_world_pos(this.engine.mouse_pos)
    //  .sub_f(this.cell_width/2)

    const selected_entity = this.engine.get_entity_at(world_pos)

    if (selected_entity) {
      return this.handle_select_entity(selected_entity)
    }

    const pos = world_pos.div_f(this.cell_width).round().mul_f(this.cell_width)
    this.engine.event_manager.push_event({
      event_type: 'player_action', e: { action: 'PLACE_BLOCK', pos }
    })
  }

  handle_select_entity(entity) {
    this.selected_entity = entity
    //this.selected_ui.text = 'Selected ' + JSON.stringify(entity)
    this.selected_ui_txt.set_text('Selected ' + JSON.stringify(entity))

    const host = this.engine._ecs.get_entity_component(entity, ModuleHostComponent)
    if (host) {
      const modules = host.modules.map((module) => {
        return this.engine._ecs.get_entity_component(module, ModuleComponent)
      })

      //if (modules) { this.selected_ui.modules = JSON.stringify(modules) }
    }

    const sbase = this.engine._ecs.get_entity_component(entity, StarbaseComponent)
    if (sbase) {
      this.engine.event_manager.push_event({
        event_type: 'player_action',
        e: { action: 'REQ_DOCK' }
      })
    }

    const pl = this.engine._ecs.get_entity_component(entity, PlanetComponent)
    if (pl) {
      this.engine.event_manager.push_event({
        event_type: 'select_planet',
        e: { action: 'select_planet', entity: entity, planet: pl }
      })
    }

    console.log('send target ', entity.entity_id)
    this.engine.event_manager.push_event({
      event_type: 'player_action',
      e: { action: 'REQ_TARGET_ENTITY', entity_id: entity.entity_id }
    })
  }

  handle_target_event(e) {
    console.log('recv target event', e.e.source, this.engine.network.client_id)
    if (e.e.source === this.engine.network.client_id) {
      this.targeting.set_text('targeting: ' + e.e.target)
    } else if (e.e.target === this.engine.network.client_id){
      this.targeted.set_text('targeted: ' + e.e.source)
    }
  }

  handle_select_planet(e) {
    console.log('select planet ev', e)
    this.ui_planet_info.set_text(JSON.stringify(e.planet, 0, 2))
  }

  create_camera() {
    const ecs = this.engine._ecs

    const entity = ecs.create_entity()

    const transform = ecs
      .set_entity_component(entity, new BaseComponents.TransformComponent())
    transform.pos = new Vector(0, 0, 0)

    const camera = ecs
      .set_entity_component(entity, new BaseComponents.CameraComponent())
    camera.scale = 1

    return entity
  }

  //render_gui(ctx) {
  //  //ctx.fillText('selected_entity: ' + this.selected_ui.text, 100, 100)
  //  ctx.fillText('modules: ' + this.selected_ui.modules, 100, 120)
  //  ctx.fillText('we are targeting:   ' + this.selected_ui.targeting, 10, 140)
  //  ctx.fillText('we are targeted by: ' + this.selected_ui.targeted, 10, 160)
  //  ctx.fillText('we are:             ' + this.engine.network.client_id, 10, 180)

  //  if (this.show_input) {
  //  }
  ///}

  create_player_entity(player) {
    const entity = this.engine._ecs.create_entity()
    entity.entity_id = player.client_id

    const transform = this.engine
      ._ecs.set_entity_component(entity, new BaseComponents.TransformComponent())
    transform.pos = new Vector(player.pos.x, player.pos.y, 1)

    const rc = new BaseComponents.RenderableComponent()
    this.engine._ecs.set_entity_component(entity, rc)
    rc.canvas = document.createElement('canvas')
    rc.canvas.width = 20
    rc.canvas.height = 30
    const ctx = rc.canvas.getContext('2d')
    if (player.client_id === this.engine.network.client_id) {
      ctx.fillStyle = 'rgb(0, 255, 0)'
      const follower = new TransformFollowerComponent(entity)
      this.engine._ecs.set_entity_component(this.camera, follower)
      console.log('my player id is ', player.client_id)
    } else {
      ctx.fillStyle = 'rgb(0, 0, 255)'
    }
    ctx.beginPath()
    ctx.moveTo(10, 0)
    ctx.lineTo(20, 30)
    ctx.lineTo(0, 30)
    ctx.lineTo(10, 0)
    ctx.stroke()
    ctx.fill()
    //ctx.fillRect(0, 0, 10, 10)
    const pc = new PlayerControlledComponent(player.client_id, this.engine.event_manager)
    this.engine._ecs.set_entity_component(entity, pc)

    const bc = new BaseComponents.BoundsComponent(20, 30)
    this.engine._ecs.set_entity_component(entity, bc)

    const mh = new ModuleHostComponent()
    this.engine._ecs.set_entity_component(entity, mh)

    const m1 = this.engine._ecs.create_entity()
    const m1m = new ModuleComponent()
    m1m.data.type = 'engine'
    m1m.data.health = 100
    this.engine._ecs.set_entity_component(m1, m1m)

    const m2 = this.engine._ecs.create_entity()
    const m2m = new ModuleComponent()
    m2m.data.type = 'weapon 1'
    m2m.data.health = 50
    this.engine._ecs.set_entity_component(m2, m2m)

    mh.attach_module_entity(m1)
    mh.attach_module_entity(m2)

    this.players.push(player)
    player.entity = entity
  }

  engine_simulation_hook() {
    this.systems.player_controller.update()
    this.systems.transform_follower.update()
  }

  handle_generate_planet(e) {
    const ev = {e}
    this.deserialise_object(ev)
  }

  deserialise_object(e) {
    const description = e.e

    const entity = this.engine._ecs.create_entity(description.entity.entity_id)
    //entity.entity_id = description.entity.entity_id

    description.components.forEach((component) => {
      const c = this.engine._ecs.get_component_class(component.type)
        .deserialise(component.data)

      console.log(c)

      this.engine._ecs.set_entity_component(entity, c)
    })
  }

  handle_player_action(e, timestamp) {
    this.engine.network.enqueue_event('player_action', { timestamp, e })
  }

  handle_ui_event(e) {
    switch (e.action) {
      case 'TOGGLE_INPUT':
        return this.input_text.set_visible(!this.input_text.is_visible())
      case 'TOGGLE_DEBUG':
        return this.engine.show_dbg = !this.engine.show_dbg
    }
    //this.show_input = !this.show_input
  }

  handle_player_disconnect(player_id) {
    const idx = this.players.findIndex(p => p.client_id === player_id)
    console.log(this.players)
    const [ player ] = this.players.splice(idx, 1)
    console.log('player id',player_id)
    console.log('removing ', player)
    console.log('removing idx', idx)

    this.engine._ecs.clear_entity(player.entity)
  }

  handle_net_player_join(e) {
    this.engine.event_manager.push_event({ event_type: 'player_join', e })
  }

  handle_net_player_disconnect(e) {
    this.engine.event_manager.push_event({ event_type: 'player_disconnect', e })
  }

  resize_listener() {
    this.render_bg()
  }

  render_bg() {
    const bgcanvas = document.createElement('canvas')
    const ctx = bgcanvas.getContext('2d')
    bgcanvas.width = window.innerWidth
    bgcanvas.height = window.innerHeight
    ctx.fillStyle = 'rgb(0, 0, 0)'
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)

    for (let i=0; i<8; ++i) {
      const min = 230
      const max = 255
      const a = (i+1) / 9
      const max_stars = 1000

      for (let j=0; j<(8-i)*500; ++j) {
        const r = ~~(Math.random() * (max - min + 1)) + min
        const g = ~~(Math.random() * (max - min + 1)) + min
        const b = ~~(Math.random() * (max - min + 1)) + min
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`

        const x = ~~(Math.random() * bgcanvas.width)
        const y = ~~(Math.random() * bgcanvas.height)

        ctx.fillRect(x, y, 1, 1)
      }
    }

    this.engine.renderer.draw_to_background(bgcanvas)
  }
}

class GUI_TextBox extends GuiElement {
  constructor({ text, fg_colour, bg_colour, pos }) {
    super()

    this.auto_scale = true
    this.font = '12px Consolas'
    this.font_size = 12
    this.text = text || ''
    this.bg_colour = bg_colour || ''
    this.fg_colour = fg_colour || ''

    if (pos) { this.pos = pos }

    this.left_margin = 3
    this.right_margin = 5
    this.top_margin = 3
  }

  set_text(text) {
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

export default Game
