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
      //PlayerControlledComponent
    }
    Object.values(this.component_classes)
      .forEach((c) => this.engine._ecs.register_component_class(c))

    //this.engine.set_render_hook(this.render_gui.bind(this))
    this.engine.set_pre_render_hook(this.render_stuff.bind(this))
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
  }

  create_lights() {
    const lf = new LightFactory(this.engine.get_ecs())
    const e = lf.make_light(0, 0, 'rgb(100, 50, 10)')
    this.cursor_light = this.engine._ecs.get_entity_component(e, BaseComponents.TransformComponent)

    /* 380 shows bug in shadow? system */
    //lf.make_light(380, 150, 'rgba(255, 10, 0, 0.8)')
    //lf.make_light(60, -151, 'rgb(55, 10, 255)')
    //lf.make_light(-400, -120, 'rgb(255, 205, 100)')
    //lf.make_light(500, 500, 'rgb(0, 255, 0)')
    //lf.make_light(-200, 500, 'rgb(0, 255, 0)')
    //lf.make_light(500, -300, 'rgb(0, 255, 0)')
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

    cf.make_cuboid(new Vector( 90,   0,  90  ), new Vector(200, 80, 200), 'rgb(100, 255, 100)')
    cf.make_cuboid(new Vector( 330,  0,  90  ), new Vector(40,  10,  40), 'rgb(100, 255, 100)')
    cf.make_cuboid(new Vector( 330,  0,  140 ), new Vector(20,  10,  20), 'rgb(100, 255, 100)')
    cf.make_cuboid(new Vector(-40,   0,  320 ), new Vector(200, 20, 20), 'rgb(100, 100, 255)')
    cf.make_cuboid(new Vector( 180,  0,  320 ), new Vector(100, 20, 20), 'rgb(100, 100, 255)')
    cf.make_cuboid(new Vector(-40,   0, -450 ), new Vector(200, 50, 10), 'rgb(100, 80, 80)')
    cf.make_cuboid(new Vector(-100,  0, -350 ), new Vector(80,  50, 10), 'rgb(100, 80, 80)')
    cf.make_cuboid(new Vector( 30,   0, -350 ), new Vector(80,  50, 10), 'rgb(100, 80, 80)')
    cf.make_cuboid(new Vector(-140,  0, -400 ), new Vector(10,  50, 100), 'rgb(100, 80, 80)')
    cf.make_cuboid(new Vector( 60,   0, -400 ), new Vector(10,  50, 100), 'rgb(100, 80, 80)')
    cf.make_cuboid(new Vector(-30,  60, -400 ), new Vector(200, 10, 100), 'rgb(100, 80, 80)')
    cf.make_cuboid(new Vector(-500,  0, -200 ), new Vector(20,   10, 2000), 'rgv(100, 100, 100)')
    cf.make_cuboid(new Vector( 500,  0, -600 ), new Vector(2000, 10, 20), 'rgv(100, 100, 100)')
    cf.make_cuboid(new Vector( 1000, 0, -200 ), new Vector(20,   10, 2000), 'rgv(100, 100, 100)')
    cf.make_cuboid(new Vector( 500,  0,  600 ), new Vector(2000, 10, 20), 'rgv(100, 100, 100)')
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

    const x = - ~~world_pos.x / 2
    const y = ~~world_pos.z

    world_pos.x = -(x - y)
    world_pos.z = (x + y) 

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

    const vr = this.systems.light_renderer.los_region
    const vrl = this.systems.light_renderer.los_region_size
    const visible_segs = {}

    for (let i=0; i < vrl; ++i) {
      if (!vr[i][1]) { continue }

      const wp = new Vector(vr[i][0].x, 0, vr[i][0].z)
        .add_v(camera_pos.pos
          .mul_f(camera_opt.scale)
          .sub_v(camera_opt.view_centre)
        )
        .div_f(camera_opt.scale)

      const x =  (~~wp.x)
      const z =  (~~wp.z)

      wp.x = ( 2 * z + x) / 2
      wp.z = ( 2 * z - x) / 2

      const e = this.get_e_at(wp)
      //const e = this.engine.get_entity_at(wp)
      if (!e) { continue }
      //let z = i+1
      //if ( z == vrl) { z = 0 }

      const m = this.engine._ecs.get_entity_component(e, MeshComponent)
      if (!m) { continue }
        /*
      const r = this.engine._ecs.get_entity_component(e, BaseComponents.RenderableComponent)
      if (!r) { continue }
      r.visible = true
      */

      const h = m.vertices[3].z

      if (!visible_segs[e.id]) {
        visible_segs[e.id] = []
      }
      visible_segs[e.id].push([vr[i][0], h, vr[i][2], vr[i][1])

      ctx.beginPath()
      ctx.moveTo(vr[i][0].x, vr[i][0].z)
      //ctx.lineTo(vr[z][0].x, vr[z][0].z)
      //ctx.lineTo(vr[z][0].x, vr[z][0].z - 50)
      ctx.lineTo(vr[i][0].x, vr[i][0].z - h)
      //ctx.fillStyle = `rgb(${~~vr[i][1]}, 0, 200)`
      ctx.strokeStyle = 'rgb(255, 0, 0)'
      //ctx.fillRect(vr[i][0].x, vr[i][0].z - 50, 5, 50)
      ctx.stroke()
      ctx.closePath()
    }

    ctx.strokeStyle = 'rgb(0, 0, 255)'
    //ctx.fillStyle = 'rgb(255,255, 255)'
    let prev_hide = false
    Object.keys(visible_segs).forEach((k) => {
      const esegs = visible_segs[k]
      //for (let i=0; i<visible_segs.length; ++i) {
      for (let j=0; j<esegs.length; ++j) {
        let nj = j + 1
        if (nj === esegs.length) { nj = 0 }
        let pj = j - 1
        if (pj === -1) { pj = esegs.length - 1 }
        const seg = esegs[j]
        const nseg = esegs[nj]
        const pseg = esegs[pj]
        ctx.fillStyle = 'rgb(255, 255, 255)'
        ctx.fillText(`${j}`, seg[0].x, seg[0].z)
        ctx.fillText(`${seg[3]}`, seg[0].x, seg[0].z + 20)
        if (j === esegs.length - 1) { break }
        if ((prev_hide) || j===0 || !seg[2] || !nseg[2] || esegs.length === 2) {
          const ix1 = ~~Math.max(0, seg[3])
          const ix2 = ~~Math.max(0, nseg[3])
          const ix = ~~((ix1 + ix2) /2 )
          ctx.fillStyle = `rgba(${ix}, 0, 0, 1.0)`
          prev_hide = false
          ctx.beginPath()
          ctx.moveTo(seg[0].x, seg[0].z)
          ctx.lineTo(nseg[0].x, nseg[0].z)
          ctx.lineTo(nseg[0].x, nseg[0].z - nseg[1])
          ctx.lineTo(seg[0].x, seg[0].z - nseg[1])
          //ctx.stroke()
          ctx.fill()
          ctx.closePath()
        } else {
          prev_hide = true
        }
      }
    })
  }

  get_e_at(world_pos) {
    const entities = []
    for (let i=0; i < this.engine._ecs.entities.length; ++i) {
      const e = this.engine._ecs.entities[i]
      const t = this.engine._ecs.get_entity_component(e, BaseComponents.TransformComponent)
      const m = this.engine._ecs.get_entity_component(e, MeshComponent)
      const b = this.engine._ecs.get_entity_component(e, BaseComponents.BoundsComponent)

      if (!e || !t || !m || !b) { continue }

      const offset = t.pos//.sub_v(b.offset)
      if (world_pos.x < offset.x - b.width / 2) { continue }
      if (world_pos.x > offset.x + b.width / 2) { continue }
      if (world_pos.z < offset.z - b.height / 2) { continue }
      if (world_pos.z > offset.z + b.height / 2) { continue }

      entities.push([e, t.pos])
    }

    if (entities.length === 0) { return null }
    return entities[0][0] 


    if (entities.length === 1) { return entities[0][0] }

    //const e = entities.sort((a, b) => {
    //  return (b[1].x + b[1].y + b[1].z) - (a[1].x + a[1].y + a[1].z)
    //})[0]

    return null
    //return e[0]
  }

  render_bg() {
    const bgcanvas = document.createElement('canvas')
    const ctx = bgcanvas.getContext('2d')
    bgcanvas.width = window.innerWidth
    bgcanvas.height = window.innerHeight
    //ctx.fillStyle = 'rgb(0, 0, 0)'
    ctx.fillStyle = 'rgb(15, 13, 13)'
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)

    for (let i=0; i<8; ++i) {
      const min = 50
      const max = 150
      const a = (i+1) / 9
      const max_stars = 1000

      for (let j = 0; j < (8-i) * 500; ++j) {
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

export default Game
