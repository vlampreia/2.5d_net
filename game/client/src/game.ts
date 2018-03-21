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
import Light from '../../components/light.component'
import PolyBoundsComponent from '../../components/polyBounds.component'

import PlayerNetworkUpdateSystem from '../../systems/playernetworkUpdateSystem'
import TransformFollowerSystem from '../../systems/transformFollowerSystem'
import MotionSystem from '../../systems/motionSystem'
import PlayerController from '../../systems/playerController'
import WaypointSystem from '../../systems/waypointSystem'
import MeshSystem from '../../systems/meshSystem'
import LightRenderer from '../../systems/lightRenderer'

import LightFactory from '../../objects/light.factory'
import CuboidFactory from '../../objects/cuboid.factory'

import TextBox from '../../gui/text_box'

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
  cursor_light
  buffer_canvas
  buffer_ctx
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

    this.engine.ext_entity_getter = this.get_e_at

    this.systems = {
      player_network: new PlayerNetworkUpdateSystem(this.event_manager),
      transform_follower: new TransformFollowerSystem(),
      motion_system: new MotionSystem(),
      waypoint_system: new WaypointSystem(),
      mesh_test_system: new MeshSystem(),
      light_renderer: new LightRenderer(),
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
      Light,
      PolyBoundsComponent,
      //PlayerControlledComponent
    }
    Object.values(this.component_classes)
      .forEach((c) => this.engine._ecs.register_component_class(c))

    //this.engine.set_render_hook(this.render_gui.bind(this))
    this.engine.set_pre_render_hook(this.render_stuff.bind(this))
    this.engine.set_render_hook(this.render_stuff2.bind(this))
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
    events.on(E.MOUSE_MOVE, this.mouse_move_listener.bind(this))

    this.camera = this.create_camera()
    this.engine.set_active_camera_entity(this.camera)

    this.cell_width = 10

    this.selected_entity = null

    this.selected_ui_txt = new TextBox({
      text: '', 
      fg_colour: 'rgb(0, 0, 0)',
      bg_colour: 'rgb(255, 255, 255)'
    })
    this.selected_ui_txt.pos = new Vector(10, 60, 0)
    this.engine.gui_system.add_element(this.selected_ui_txt)

    this.targeting = new TextBox({
      text: 'targeting: ',
      fg_colour: 'rgb(0, 0, 0)',
      bg_colour: 'rgb(255, 255, 255)',
      pos: new Vector(10, 80, 0)
    })
    this.engine.gui_system.add_element(this.targeting)

    this.ui_planet_info = new TextBox({
      text: '',
      fg_colour: 'rgb(0, 0, 0)',
      bg_colour: 'rgb(255, 255, 255)',
      pos: new Vector(10, 140, 0),
    })
    this.engine.gui_system.add_element(this.ui_planet_info)

    this.targeted = new TextBox({
      text: 'targeted: ',
      fg_colour: 'rgb(0, 0, 0)',
      bg_colour: 'rgb(255, 255, 255)',
      pos: new Vector(10, 100, 0)
    })
    this.engine.gui_system.add_element(this.targeted)

    this.input_text = new TextBox({
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
    this.create_lights()
    this.buffer_canvas = document.createElement('canvas')
    this.buffer_ctx = this.buffer_canvas.getContext('2d')
    this.buffer_canvas.height = window.innerHeight
    this.buffer_canvas.width = window.innerWidth
  }

  create_lights() {
    const lf = new LightFactory(this.engine.get_ecs())
    const e = lf.make_light(0, 0, 200, 100, 10)
    this.cursor_light = this.engine._ecs.get_entity_component(e, BaseComponents.TransformComponent)

    /* 380 shows bug in shadow? system */
    lf.make_light(380, 150,   255, 10, 0)
    lf.make_light(60, -151,   55, 10, 255)
    lf.make_light(-400, -120, 255, 205, 100)
    lf.make_light(500, 500,   10, 150, 0)
    lf.make_light(-200, 500,  0, 255, 0)
    lf.make_light(500, -300,  0, 255, 0)
    lf.make_light(-155, 320, 180, 80, 8)
    //
    //make_light(-200, -300, 'rgb(0, 255, 0)')
    //make_light(-220, -300, 'rgb(0, 255, 0)')
    //make_light(-220, -330, 'rgb(0, 255, 0)')
    //make_light(-200, -200, 'rgb(0, 255, 0)')
    //make_light(-220, -200, 'rgb(0, 255, 0)')
    //make_light(-220, -230, 'rgb(0, 255, 0)')
  }

  create_boxes() {
    const cf = new CuboidFactory(this.engine.get_ecs())

    cf.make_cuboid(new Vector( 90,   0,  90  ), new Vector(200, 80, 200), 'rgb(44, 40, 4)')
    cf.make_cuboid(new Vector( 330,  0,  90  ), new Vector(40,  10,  40), 'rgb(100, 255, 100)')
    cf.make_cuboid(new Vector( 331,  0,  141 ), new Vector(20,  10,  20), 'rgb(100, 255, 100)')
    cf.make_cuboid(new Vector(-40,   0,  320 ), new Vector(200, 20, 20), 'rgb(100, 100, 255)')
    cf.make_cuboid(new Vector( 180,  0,  320 ), new Vector(100, 20, 20), 'rgb(100, 100, 255)')
    //
    cf.make_cuboid(new Vector(-40,   0, -450 ), new Vector(200, 50, 10),  'rgb(10, 8, 8)')
    cf.make_cuboid(new Vector(-100,  0, -350 ), new Vector(80,  50, 10),  'rgb(10, 8, 8)')
    cf.make_cuboid(new Vector( 30,   0, -350 ), new Vector(80,  50, 10),  'rgb(10, 8, 8)')
    cf.make_cuboid(new Vector(-140,  0, -400 ), new Vector(10,  50, 100), 'rgb(10, 8, 8)')
    cf.make_cuboid(new Vector( 60,   0, -400 ), new Vector(10,  50, 100), 'rgb(10, 8, 8)')
    //cf.make_cuboid(new Vector(-30,  60, -400 ), new Vector(200, 10, 100), 'rgb(100, 80, 80)')
    //
    cf.make_cuboid(new Vector(-500,  0, -200 ), new Vector(20,   10, 2000), 'rgb(10, 10, 10)')
    cf.make_cuboid(new Vector( 500,  0, -600 ), new Vector(2000, 10, 20),   'rgb(10, 10, 10)')
    cf.make_cuboid(new Vector( 1000, 0, -200 ), new Vector(20,   10, 2000), 'rgb(10, 10, 10)')
    cf.make_cuboid(new Vector( 500,  0,  600 ), new Vector(2000, 10, 20),   'rgb(10, 10, 10)')
    //cf.make_cuboid(new Vector( 500, -20, 500), new Vector(2000, 10, 2000), 'rgb(25, 25, 25)')
  }

  join_game() {
    this.engine.network.send_event('login', { name: uuid.v4() })
  }

  run() {
    this.engine.start()

    this.join_game()
  }

  mouse_move_listener(e) {
    const camera_pos = this.engine._ecs
      .get_entity_component(this.camera, BaseComponents.TransformComponent)
    const camera_opt = this.engine._ecs
      .get_entity_component(this.camera, BaseComponents.CameraComponent)

    let world_pos = new Vector(this.engine.mouse_pos.x, 0, this.engine.mouse_pos.y)
      .add_v(camera_pos.pos
        .mul_f(camera_opt.scale)
        .sub_v(camera_opt.view_centre)
      )
      .div_f(camera_opt.scale)

    const x = - ~~world_pos.x / 2
    const y = ~~world_pos.z

    world_pos.x = -(x - y)
    world_pos.z = (x + y) 

    this.cursor_light.pos.x = world_pos.x
    this.cursor_light.pos.z = world_pos.z

    //this.mouse_e_t.pos.x = world_pos.x
    //this.mouse_e_t.pos.y = world_pos.y
  }

  handle_mouse_down(e) {
    const camera_pos = this.engine._ecs
      .get_entity_component(this.camera, BaseComponents.TransformComponent)
    const camera_opt = this.engine._ecs
      .get_entity_component(this.camera, BaseComponents.CameraComponent)

    let world_pos = new Vector(this.engine.mouse_pos.x, 0, this.engine.mouse_pos.y)
      .add_v(camera_pos.pos
        .mul_f(camera_opt.scale)
        .sub_v(camera_opt.view_centre)
      )
      .div_f(camera_opt.scale)


    const iso_to_cartesian = (v) => {
      return new Vector(
        (2 * v.z + v.x) / 2,
        0,
        (2 * v.z - v.x) / 2
      )
    }

    world_pos = iso_to_cartesian(world_pos)

    //const x = - ~~world_pos.x / 2
    //const y = ~~world_pos.z

    //world_pos.x = -(x - y)
    //world_pos.z = (x + y) 

    this.cursor_light.pos.x = world_pos.x
    this.cursor_light.pos.z = world_pos.z

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

    //const selected_entity = this.engine.get_entity_at(world_pos)
    const selected_entity = this.get_e_at(world_pos)

    return this.handle_select_entity(selected_entity)

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
    if (!this.selected_entity) {
      this.selected_ui_txt.set_text('Selected none')
      return
    }

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
    this.buffer_canvas = document.createElement('canvas')
    this.buffer_ctx = this.buffer_canvas.getContext('2d')
    this.buffer_canvas.height = window.innerHeight
    this.buffer_canvas.width = window.innerWidth
  }

  render_stuff(ctx) {
    for (let i=0; i < this.engine._ecs.entities.length; ++i) {
      const e = this.engine._ecs.entities[i]
      const r = this.engine._ecs.get_entity_component(e, new BaseComponents.RenderableComponent())
      if (!r) { continue }
      r.visible = true
    }

    const meshes = []
    const smeshes = this.engine._ecs.components[MeshComponent.get_type()]
    const transforms = this.engine._ecs.components[BaseComponents.TransformComponent.get_type()]

    const camera_pos = this.engine._ecs
      .get_entity_component(this.camera, BaseComponents.TransformComponent)
    const camera_opt = this.engine._ecs
      .get_entity_component(this.camera, BaseComponents.CameraComponent)

    for (let i=0; i<smeshes.length; ++i) {
      const mesh = smeshes[i]
      if (!mesh) continue

      const pos = transforms[i].pos
      const m = Object.assign({}, mesh)

      m.vertices = mesh.vertices.map((v) => {
        const offset = new Vector(
            ((pos.x - pos.z) ), 
          0,
            ((pos.x + pos.z) ) / 2 //- (mesh.mid.y) - v.z,
           )
      const t = v.add_v(offset).sub_v(mesh.mid)
          .mul_f(camera_opt.scale) 
          .sub_v(camera_pos.pos.mul_f(camera_opt.scale) 
           .sub_v(camera_opt.view_centre))

        return t
      })
      //m.vertices = mesh.vertices.map((v) => v.add_v(pos).sub_v(mesh.mid))

      meshes.push(m)
      //meshes.push(Object.assign({}, m, { pos } )
    }


  let world_pos = new Vector(this.engine.mouse_pos.x, 0, this.engine.mouse_pos.y)
      .add_v(camera_pos.pos
        .mul_f(camera_opt.scale)
        .sub_v(camera_opt.view_centre)
      )
      .div_f(camera_opt.scale)

    const x = - ~~world_pos.x / 2
    const y = ~~world_pos.z

    world_pos.x = -(x - y)
    world_pos.y = (x + y) 
    this.systems.light_renderer.set_cursor(world_pos)
    this.systems.light_renderer.set_ctx(ctx)
    this.systems.light_renderer.set_camera(this.camera)
    this.systems.light_renderer.set_meshes(meshes)
    this.systems.light_renderer.update()

  }

  render_stuff2(ctx) {
    const overlay = this.systems.light_renderer.overlay_canvas
    const floor = this.systems.light_renderer.floor_canvas

    //const mask = document.createElement('canvas')
    //const mask_ctx = mask.getContext('2d')

    //mask_ctx.fillRect(0, 0, overlay.width, overlay.height)
    //mask_ctx.globalCompositeOperation = 'destination-out'
    //mask_ctx.drawImage(ctx

    //ctx.globalCompositeOperation = 'multiply'
    //ctx.fillStyle = 'rgb(0, 0, 0)'
    //ctx.fillRect(0, 0, overlay.width, overlay.height)
    //ctx.drawImage(floor, 0, 0)
    //ctx.globalCompositeOperation = 'screen'
    //ctx.drawImage(overlay, 0, 0)
    //
    this.systems.light_renderer.floor_ctx
      .globalCompositeOperation = 'destination-out'
    this.systems.light_renderer.floor_ctx.drawImage(ctx.canvas, 0, 0)

    this.buffer_ctx.globalCompositeOperation = 'normal'
    this.buffer_ctx.fillStyle = 'rgb(0, 0, 0)'
    this.buffer_ctx.fillRect(0, 0, this.buffer_canvas.width, this.buffer_canvas.height)
    this.buffer_ctx.drawImage(ctx.canvas, 0, 0)
    this.buffer_ctx.globalCompositeOperation = 'normal'
    this.buffer_ctx.drawImage(floor, 0, 0)
    this.buffer_ctx.globalCompositeOperation = 'screen'
    this.buffer_ctx.drawImage(overlay, 0, 0)
    ctx.globalCompositeOperation = 'normal'
    ctx.fillStyle = 'rgb(0, 0, 0)'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.drawImage(this.buffer_canvas, 0, 0)
    //
    //const masked_floor = this.buffer_canvas
    //const x = this.buffer_ctx
    //x.globalCompositeOperation = 'source-out'
    //x.drawImage(ctx.canvas, 0, 0)
    //x.drawImage(floor, 0, 0)

    //ctx.fillStyle='rgb(0, 0,0)'
    ////ctx.fillRect(0, 0, c.width, c.height)
    //ctx.globalCompositeOperation = 'screen'
    //ctx.drawImage(masked_floor, 0, 0)
    //ctx.drawImage(overlay, 0,0 )
    //ctx.globalCompositeOperation = 'normal'
    //ctx.drawImage(floor, 0,0)
    //ctx.drawImage(overlay, 0, 0)
  }


  get_e_at(world_pos) {
    // TODO: optimise this with a spacial datastructure
    // TODO: this does not work with rotated or non rectangular bounds

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


    const entities = []

    // cart to iso
    const rpos = new Vector(
        (world_pos.x - world_pos.z)     ,
      0,
        (world_pos.x + world_pos.z) / 2
    )

    for (let i = 0; i < this.engine._ecs.entities.length; ++i) {
      const e = this.engine._ecs.entities[i]
      if (!e) { continue }

      const t = this.engine._ecs.get_entity_component(e, BaseComponents.TransformComponent)
      if (!t) { continue }

      const b = this.engine._ecs.get_entity_component(e, BaseComponents.BoundsComponent)
      if (!b) { continue }

      const pb = this.engine._ecs.get_entity_component(e, PolyBoundsComponent)
      if (!pb) { continue }

      const mp = new Vector(
        (t.pos.x - t.pos.z)    , //- (b.offset.x),
        0,
        ((t.pos.x + t.pos.z) / 2 - (b.offset.z)) - t.pos.y
      )

      if (rpos.x < mp.x - b.width / 2) { continue }
      if (rpos.x > mp.x + b.width / 2) { continue }
      if (rpos.z < mp.z - b.height / 2) { continue }
      if (rpos.z > mp.z + b.height / 2) { continue }
      const make_isometric = (v) => {
        return new Vector(
          (v.x - v.z),
          0,
          (v.x + v.z) / 2
        )
      }

      const ray = [
        //world_pos,
        //t.pos.add_v(new Vector(b.width + 1,0,0))
        rpos,
        mp.add_v(new Vector(b.width, 0, 0))
      ]

      let intersections = 0
      const pb_vertices = pb.get_mesh()

      for (let i = 0; i < pb_vertices.length; ++i) {
        let z = i + 1
        if (z === pb_vertices.length) { z = 0 }

        const v1 =pb_vertices[i].add_v(make_isometric(t.pos)).sub_v(pb.offset)
        const v2 =pb_vertices[z].add_v(make_isometric(t.pos)).sub_v(pb.offset)

        if (get_intersection_point(ray[0], ray[1], v1, v2)) { intersections++ }
      }

      console.log('i ', e.id, intersections)
      if (intersections === 0 || intersections % 2 === 0) { continue }

      entities.push({ e: e, pos: t.pos })
    }

    if (entities.length === 0) { return null }
    return entities[0].e

    const e = entities.sort((a, b) => {
      return (b.pos.x + b.pos.y + b.pos.z) - (a.pos.x + a.pos.y + a.pos.z)
    })[0]

    return e.e
  }

  render_bg() {
    const bgcanvas = document.createElement('canvas')
    const ctx = bgcanvas.getContext('2d')
    bgcanvas.width = window.innerWidth
    bgcanvas.height = window.innerHeight
    //ctx.fillStyle = 'rgb(0, 0, 0)'
    //ctx.fillStyle = 'rgb(15, 13, 13)'
    ctx.fillStyle = 'rgb(0, 0, 0)'
    //ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)

    //for (let i=0; i<8; ++i) {
    //  const min = 50
    //  const max = 150
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

export default Game
