'use strict'

import Entity from './entity.js'
import Component from './component.js'
import System from './system.js'

class ECS {
  constructor() {
    this.entities = []
    this.components = {}
    this.systems = []
    this.system_type_id_mapping = {}

    this.free_entities = []

    this.component_classes = {}
  }

  create_entity() {
    let entity = null
    let id = -1

    if (this.free_entities.length > 0) {
      entity = this.free_entities.shift()
    } else {
      entity = new Entity(this.entities.length)
      this.entities.push(entity)
    }

    this.systems.forEach((system) => system.offer_entity(entity))

    return entity
  }

  set_entity_component(entity, component) {
    if (!this.components.hasOwnProperty(component.get_type())) {
      this.components[component.get_type()] = []
    }

    this.components[component.get_type()][entity.id] = component

    this.systems.forEach((system) => system.offer_entity(entity))

    return component
  }

  get_entity_component(entity, component) {
    return this.components[component.get_type()][entity.id]
  }

  entity_has_component(entity, component) {
    if (!this.components.hasOwnProperty(component.get_type())) { return false }
    return (!!this.components[component.get_type()][entity.id])
  }

  push_system(system) {
    const id = this.systems.length
    this.systems.push(system)
    system.set_id(id)
    system.set_ecs(this)

    this.system_type_id_mapping[system.get_type()] = id

    return id
  }

  get_system_by_type(type) {
    if (this.systems.length === 0) { return null }

    const id = this.system_type_id_mapping[system.get_type()]
    if (!id) { return null }

    return this.systems[id]
  }

  get_system_by_id(id) {
    if (id < 0 || id >= this.systems.length) { return null }
    return this.systems[id]
  }

  clear_entity(entity) {
    console.log('clearning entity', entity)
    this.systems.forEach((system) => system.remove_entity(entity))

    this.free_entities.push(entity)

    // TODO: refresh / dirty components
  }

  register_component_class(component_class) {
    this.component_classes[component_class.get_type()] = component_class
  }

  get_component_class(class_name) {
    return this.component_classes[class_name] || null
  }
}

export { ECS, Entity, Component, System }
