'use strict'

import * as uuid from 'uuid'

import { Events as E, Engine, BaseComponents, GuiElement } from 'engine'

import TransformFollowerComponent from '../../components/transformFollowerComponent'
import ModuleHostComponent from '../../components/moduleHostComponent'
import ModuleComponent from '../../components/moduleComponent'
import StarbaseComponent from '../../components/starbaseComponent'
import PlanetComponent from '../../components/planetComponent'
import VelocityComponent from '../../components/velocityComponent'
import PlayerNetworkUpdateComponent from '../../components/playerNetworkUpdateComponent'
import AccelerationComponent from '../../components/accelerationComponent'
import PlayerControlledComponent from '../../components/playerControlledComponent'
import WaypointComponent from '../../components/waypointComponent'
import MeshComponent from '../../components/meshComponent'

import PlayerNetworkUpdateSystem from '../../systems/playernetworkUpdateSystem'
import TransformFollowerSystem from '../../systems/transformFollowerSystem'
import MotionSystem from '../../systems/motionSystem'
import PlayerController from '../../systems/playerController'
import WaypointSystem from '../../systems/waypointSystem'
import MeshSystem from '../../systems/meshSystem'

import Vector from 'common'

class Game {
  event_manager
  engine
  systems
  component_classes
  camera
  cell_width
  selected_entity
  selected_ui_txt
  ui_planet_info
  targeted
  input_text
  mouse_e_t
    //this.blocks.forEach(b => this.network.enqueue_msg(client_id, 'place_block', { block: b }))
    //this.network.enqueue_msg(client_id, )
    //
    //const build_ev = {
    //  entity: {
    //    entity_id: -500,
    //  },
    //  components: [
    //    {
    //      type: 'TransformComponent',
    //      data: {
    //        pos: { x: 100, y: 50, z: 50 }
    //      }
    //    },
    //    {
    //      type: 'RenderableComponent',
    //      data: {
    //        asset: 'default'
    //      }
    //    },
    //    {
    //      type: 'BoundsComponent',
    //      data: {
    //        width: 20,
    //        height: 20,
    //      }
    //    },
    //    {
    //      type: 'StarbaseComponent',
    //      data: {
    //        dockable: true,
    //        dock_capacity: 2,
    //        docked_count: this.starbases[0].docked
    //      }
    //    }
    //  ]
    //}
    //this.network.enqueue_msg(client_id, 'build', build_ev)

  players
  targeting

  constructor(canvas_element) {
    localStorage.debug = 'game*'
    this.engine = new Engine(canvas_element)

    this.systems = {
      player_network: new PlayerNetworkUpdateSystem(this.event_manager),
      transform_follower: new TransformFollowerSystem(),
      motion_system: new MotionSystem(),
      waypoint_system: new WaypointSystem(),
      mesh_test_system: new MeshSystem(),
      //player_controller: new PlayerController(this.event_manager),
    }
    Object.values(this.systems)
      .forEach((s) => this.engine._ecs.push_system(s))

    this.component_classes = {
      TransformFollowerComponent,
      PlayerNetworkUpdateComponent,
      ModuleHostComponent,
      ModuleComponent,
      StarbaseComponent,
      PlanetComponent,
      VelocityComponent,
      AccelerationComponent,
      WaypointComponent,
      MeshComponent,
      //PlayerControlledComponent
    }
    Object.values(this.component_classes)
      .forEach((c) => this.engine._ecs.register_component_class(c))

    //this.engine.set_render_hook(this.render_gui.bind(this))
    this.engine.set_render_hook(this.render_stuff.bind(this))
    this.engine.set_simulation_hook(this.engine_simulation_hook.bind(this))

    const net = this.engine.network
    net.on('player_join', this.handle_net_player_join.bind(this))
    net.on('player_disconnect', this.handle_net_player_disconnect.bind(this))

    const events = this.engine.event_manager
    events.on(E.MOUSE_DOWN, this.handle_mouse_down.bind(this))
    events.on('in_player_move', this.handle_player_action.bind(this))
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
    this.selected_ui_txt.pos = new Vector(10, 60, 0)
    this.engine.gui_system.add_element(this.selected_ui_txt)

    this.targeting = new GUI_TextBox({
      text: 'targeting: ',
      fg_colour: 'rgb(0, 0, 0)',
      bg_colour: 'rgb(255, 255, 255)',
      pos: new Vector(10, 80, 0)
    })
    this.engine.gui_system.add_element(this.targeting)

    this.ui_planet_info = new GUI_TextBox({
      text: '',
      fg_colour: 'rgb(0, 0, 0)',
      bg_colour: 'rgb(255, 255, 255)',
      pos: new Vector(10, 140, 0),
    })
    this.engine.gui_system.add_element(this.ui_planet_info)

    this.targeted = new GUI_TextBox({
      text: 'targeted: ',
      fg_colour: 'rgb(0, 0, 0)',
      bg_colour: 'rgb(255, 255, 255)',
      pos: new Vector(10, 100, 0)
    })
    this.engine.gui_system.add_element(this.targeted)

    this.input_text = new GUI_TextBox({
      text: '',
      fg_colour: 'rgba(255, 255, 255, 0.5)',
      bg_colour: 'rgba(100, 100, 100, 0.5)',
      pos: new Vector(10, 120, 0)
    })
    this.input_text.anchor.horizontal = 'right'
    this.input_text.anchor.vertical = 'bottom'
    this.input_text.visible = false
    const input_map = this.engine.input_mapper.get_input_mapping()
    let txt = Object.entries(input_map).map((e) => JSON.stringify(e)).join('\n')
    this.input_text.set_text(txt)
    this.engine.gui_system.add_element(this.input_text)

    this.players = []

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

    //this.engine.event_manager.push_event({
    //  event_type: 'generate_planet',
    //  e: planet_event,
    //})
    //
//    this.engine.event_manager.push_event('player_join', {
//      pos: { x: 50, y: 50 },
//      client_id: this.engine.network.client_id})

    this.selected_entity = null;

    this.create_boxes()
  }

  create_boxes() {
    const ps = [
//      new Vector(-80, -80,   56),
//      new Vector(-80, -60,  56),
//      new Vector(-80, -40,  56),
//      new Vector(-60, -80,  56),
//      new Vector(-60, -60,   56),
//      new Vector(-60, -40,  56),
//      new Vector(-40, -80,  56),
//      new Vector(-40, -60,  56),
//      new Vector(-40, -40, 56),
    ]//.map(v => v.div_f(3))


    const make_isometric_cube = (x, y, z, width, height, depth, color) => {
      const e = this.engine._ecs.create_entity()
      const t = this.engine._ecs.set_entity_component(e, new BaseComponents.TransformComponent())
      const r = this.engine._ecs.set_entity_component(e, new BaseComponents.RenderableComponent())
      const mesh = this.engine._ecs.set_entity_component(e, new MeshComponent())

      t.time = -1
      t.pos = new Vector(x, y, z)
      t.pos_prev = t.pos
      t.pos_next = t.pos
      r.canvas = document.createElement('canvas')
      const xwidth = width
      const ywidth = depth
      const canvas_width = xwidth + ywidth
      const canvas_height = height + xwidth / 2 + ywidth / 2
      r.canvas.width = canvas_width
      r.canvas.height = canvas_height
      const b = this.engine._ecs.set_entity_component(
        e, 
        new BaseComponents.BoundsComponent(canvas_width, canvas_height)
      )
      const ctx = r.canvas.getContext('2d')
      //ctx.strokeStyle = `rgb(255, 255, 255)`
      //ctx.strokeRect(0, 0, width, height)
      ctx.strokeStyle = color
      ctx.fillStyle = color

      //mesh.push_vertex(0,               ywidth / 2)
      mesh.push_vertex(0,               ywidth / 2 + height)
      mesh.push_vertex(xwidth,          height + xwidth * 0.5 + ywidth * 0.5)
      mesh.push_vertex(xwidth + ywidth, height + xwidth * 0.5)
      //mesh.push_vertex(xwidth + ywidth, xwidth * 0.5)
      mesh.push_vertex(ywidth,          height)
      //mesh.push_vertex(ywidth,          0)
      //mesh.push_vector(0,               ywidth / 2)
      //mesh.push_vector(xwidth,          xwidth * 0.5 + ywidth * 0.5)
      //mesh.push_vector(xwidth + ywidth, xwidth * 0.5)
      //mesh.push_vector(xwidth,          xwidth * 0.5 + ywidth * 0.5)
      //mesh.push_vector(xwidth,          height + xwidth * 0.5 + ywidth * 0.5)

      ctx.beginPath()
      ctx.moveTo(0,               ywidth / 2)
      ctx.lineTo(0,               ywidth / 2 + height)
      ctx.lineTo(xwidth,          height + xwidth * 0.5 + ywidth * 0.5)
      ctx.lineTo(xwidth + ywidth, height + xwidth * 0.5)
      ctx.lineTo(xwidth + ywidth, xwidth * 0.5)
      ctx.lineTo(ywidth,          0)
      ctx.lineTo(0,               ywidth / 2)
      ctx.lineTo(xwidth,          xwidth * 0.5 + ywidth * 0.5)
      ctx.lineTo(xwidth + ywidth, xwidth * 0.5)
      ctx.moveTo(xwidth,          xwidth * 0.5 + ywidth * 0.5)
      ctx.lineTo(xwidth,          height + xwidth * 0.5 + ywidth * 0.5)
      ctx.stroke()

      ctx.globalAlpha = 0.3
      ctx.fill()

      r.midpoint.x = canvas_width / 2
      r.midpoint.y = canvas_height / 2 + height / 2
      mesh.mid = new Vector(r.midpoint.x, r.midpoint.y, 0)
      b.offset = new Vector(r.midpoint.x, height/2, 0)
      //b.offset = new Vector(r.midpoint.x, r.midpoint.y, 0)
      //b.offset = new Vector(width / 2, height / 2, 0)
      //ctx.fillRect(canvas_width / 2 - 1, canvas_height / 2 - 1, 3, 3)
      return t
    }

    //make_isometric_cube(20, -40, 0,  60, 20, 60, 'rgb(20, 255, 255)')
    //make_isometric_cube(0,  -40, 20, 20, 20, 60, 'rgb(200, 255, 255)')
    //make_isometric_cube(40, -40, 20, 20, 20, 60, 'rgb(200, 255, 255)')
    //make_isometric_cube(20, -20, 40, 60, 20, 20, 'rgb(255, 255, 255)')
    //make_isometric_cube(20, -60, 40, 60, 20, 20, 'rgb(255, 255, 255)')

    make_isometric_cube(90,  90, -10, 200, 10, 200, 'rgb(100, 255, 100)')
    //make_isometric_cube(90,  90,  20, 150, 10, 150, 'rgba(100, 255, 100, 0.8)')
    //make_isometric_cube(90,  90,  50, 100, 10, 100, 'rgba(100, 255, 100, 0.5)')
    //make_isometric_cube(90,  90,  80, 50,  10,  50, 'rgba(100, 255, 100, 0.2)')
    make_isometric_cube(330, 90, -10, 40,  10,  40, 'rgb(100, 255, 100)')
    //make_isometric_cube(230, 50, -10, 20,  10,  20, 'rgb(100, 255, 100)')
    //make_isometric_cube(230, 10, -10, 20,  10,  20, 'rgb(100, 255, 100)')
    //make_isometric_cube(230, 50, -50, 20,  10,  20, 'rgba(100, 255, 100, 0.5)')
    //make_isometric_cube(230, 10, -50, 20,  10,  20, 'rgba(100, 255, 100, 0.5)')
    //make_isometric_cube(230, 10, -90, 20,  10,  20, 'rgba(100, 255, 100, 0.2)')

    //for (let i = 0; i < 10 * 10; ++i) {
    //  ps.push(new Vector(~~(i % 10) * 20, ~~(i / 10) * 20, 0))
    //}

    for (let i=0; i<ps.length; ++i) {
    //for (let i=0; i<21; ++i) {
      const color = `rgb(${~~(255 * ((i+1) / ps.length))}, 50, ${~~(255 * ((ps.length - (i)) / ps.length))}`
      make_isometric_cube(ps[i].x,
        //ps[i].y, ps[i].z, 20, ~~(Math.random() * 40) , 20, color)
        ps[i].y, ps[i].z, 20, 20 , 20, color)
    }

    //this.mouse_e_t = make_isometric_cube(0, 0, 0, 20, 20, 20, 'rgb(255, 255, 255)')

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

    let world_pos = new Vector(this.engine.mouse_pos.x, this.engine.mouse_pos.y, 0)
      .add_v(camera_pos.pos
        .mul_f(camera_opt.scale)
        .sub_v(camera_opt.view_centre)
      )
      .div_f(camera_opt.scale)

    const x = - ~~world_pos.x / 2
    const y = ~~world_pos.y

    world_pos.x = -(x - y)
    world_pos.y = (x + y) 

    //this.mouse_e_t.pos.x = world_pos.x
    //this.mouse_e_t.pos.y = world_pos.y


    //console.log('click at ', world_pos)
    //const world_pos = this.engine.mouse_pos
    //  .add_v(camera_pos.pos
    //    .mul_f(camera_opt.scale)
    //    .sub_v(camera_opt.view_centre)
    //  )
    //  .div_f(camera_opt.scale)
      //.sub_f(this.cell_width / 2)

    //const world_pos = this.camera.screen_to_world_pos(this.engine.mouse_pos)
    //  .sub_f(this.cell_width/2)

    const selected_entity = this.engine.get_entity_at(world_pos)

    if (selected_entity) {
      return this.handle_select_entity(selected_entity)
    }

    this.handle_move_entity(this.selected_entity, world_pos)

    //const pos = world_pos.div_f(this.cell_width).round().mul_f(this.cell_width)
    //this.engine.event_manager.push_event(
    //  'player_action', { action: 'PLACE_BLOCK', pos }
    //)


  }

  handle_move_entity(entity, pos) {
    this.engine.event_manager.push_event(
      'player'
    )
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

      if (modules) { 
        this.ui_planet_info.set_text(JSON.stringify(modules, null, 2))
      }
    }

    const sbase = this.engine._ecs.get_entity_component(entity, StarbaseComponent)
    if (sbase) {
      this.engine.event_manager.push_event(
        'player_action',
        { action: 'REQ_DOCK' }
      )
    }

    const pl = this.engine._ecs.get_entity_component(entity, PlanetComponent)
    if (pl) {
      this.engine.event_manager.push_event(
        'select_planet',
        { action: 'select_planet', entity: entity, planet: pl }
      )
    }

    console.log('send target ', entity.entity_id)
    this.engine.event_manager.push_event(
      'player_action',
      { action: 'REQ_TARGET_ENTITY', entity_id: entity.entity_id }
    )
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
    this.ui_planet_info.set_text(JSON.stringify(e.planet, null, 2))
  }

  create_camera() {
    const ecs = this.engine._ecs

    const entity = ecs.create_entity()

    console.log(this.engine._ecs)
    const transform = ecs
      .set_entity_component(entity, new BaseComponents.TransformComponent())
    transform.pos = new Vector(0, 0, 0)

    const camera = ecs
      .set_entity_component(entity, new BaseComponents.CameraComponent())
    camera.scale = 1

    return entity
  }

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
    const pc = new PlayerNetworkUpdateComponent(player.client_id, this.engine.event_manager)
    this.engine._ecs.set_entity_component(entity, pc)

    const vc = new VelocityComponent()
    this.engine._ecs.set_entity_component(entity, vc)
    this.engine._ecs.set_entity_component(entity, new AccelerationComponent())

    const bc = new BaseComponents.BoundsComponent(20, 30)
    this.engine._ecs.set_entity_component(entity, bc)

    //const pcc = new PlayerControlledComponent(player.client_id, this.engine.event_manager)
    //this.engine._ecs.set_entity_component(entity, pcc)

    //const mh = new ModuleHostComponent()
    //this.engine._ecs.set_entity_component(entity, mh)

    //const m1 = this.engine._ecs.create_entity()
    //const m1m = new ModuleComponent()
    //m1m.data.type = 'engine'
    //m1m.data.health = 100
    //this.engine._ecs.set_entity_component(m1, m1m)

    //const m2 = this.engine._ecs.create_entity()
    //const m2m = new ModuleComponent()
    //m2m.data.type = 'weapon 1'
    //m2m.data.health = 50
    //this.engine._ecs.set_entity_component(m2, m2m)

    //mh.attach_module_entity(m1)
    //mh.attach_module_entity(m2)

    this.players.push(player)
    player.entity = entity
  }

  engine_simulation_hook(t, dt) {
    this.systems.player_network.update(t, dt)
    //this.systems.transform_follower.update(t, dt)
    this.systems.motion_system.update(t, dt) //this.systems.player_controller.update(t, dt)
    this.systems.waypoint_system.update(t, dt)
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
    this.engine.network.enqueue_event('in_player_move', { timestamp, e })
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
    this.engine.event_manager.push_event('player_join', e)
  }

  handle_net_player_disconnect(e) {
    this.engine.event_manager.push_event('player_disconnect', e)
  }

  resize_listener() {
    this.render_bg()
  }

  render_stuff(ctx) {
    this.systems.mesh_test_system.set_ctx(ctx)
    this.systems.mesh_test_system.set_camera(this.camera)
    this.systems.mesh_test_system.set_cursor(this.engine.mouse_pos)
    this.systems.mesh_test_system.update()
  }

  render_bg() {
    const bgcanvas = document.createElement('canvas')
    const ctx = bgcanvas.getContext('2d')
    bgcanvas.width = window.innerWidth
    bgcanvas.height = window.innerHeight
    //ctx.fillStyle = 'rgb(0, 0, 0)'
    ctx.fillStyle = 'rgb(25, 23, 23)'
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)

    //for (let i=0; i<8; ++i) {
    //  const min = 230
    //  const max = 255
    //  const a = (i+1) / 9
    //  const max_stars = 1000

    //  for (let j = 0; j < (8-i) * 500; ++j) {
    //    const r = ~~(Math.random() * (max - min + 1)) + min
    //    const g = ~~(Math.random() * (max - min + 1)) + min
    //    const b = ~~(Math.random() * (max - min + 1)) + min
    //    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`

    //    const x = ~~(Math.random() * bgcanvas.width)
    //    const y = ~~(Math.random() * bgcanvas.height)

    //    ctx.fillRect(x, y, 1, 1)
    //  }
    //}

    this.engine.renderer.draw_to_background(bgcanvas)
  }
}

class GUI_TextBox extends GuiElement {
  auto_scale
  font
  font_size
  text
  bg_colour
  fg_colour
  left_margin
  right_margin
  top_margin

  constructor({ text, fg_colour, bg_colour, pos }: { text?, fg_colour?, bg_colour?,  pos? }) {
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

  set_text(text: string) {
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
