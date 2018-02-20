'use strict'

class System {
  constructor(component_types) {
    if (this.constructor === System) {
      throw new TypeError('Abstract class "System" cannot be instantiated directly.')
    }

    if (this.process_entity === undefined) {
      throw new TypeError('Classes extending the "System" class must implement "update" function.')
    }

    this.id = -1
    this.ecs = null
    this._entities = []
    this._interested_types = [ ...component_types ]
  }

  set_id(id) {
    this.id = id
  }

  set_ecs(ecs) {
    this.ecs = ecs
  }

  setup() { return true }
  teardown() {}

  update(t, dt) {
    const cont = this.setup()
    if (!cont) { return }
    this.process_entities(this._entities, t, dt)
    this.teardown()
  }

  process_entities(entities, t, dt) {
    entities.forEach((entity) => {
      const components = {}

      this._interested_types.forEach((interest) => {
        const c = this.ecs.get_entity_component(entity, interest)
        const string = interest.get_type()
        const friendly_string = string[0].toLowerCase() + string.slice(1)
        components[friendly_string] = c
      })

      this.process_entity(entity, t, dt, components)
    })
  }

  offer_entity(entity) {
    const reject = this._interested_types.some((interest) => {
      return !this.ecs.entity_has_component(entity, interest)
    })

    if (reject) { return }

    if (this._entities.find((e) => e.id === entity.id)) { return }

    this._entities.push(entity)
  }

  remove_entity(entity) {
    const i = this._entities.findIndex((e) => e.id === entity.id)
    if (i === -1 ) { return }
    this._entities.splice(i, 1)
  }

  static get_type() {
    return this.name
  }

  get_type() {
    return this.constructor.name
  }
}

export default System
