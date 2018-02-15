'use strict'

class Entity {
  constructor(id) {
    this.id = id || -1
  }

  set_id(id) {
    this.id = id
  }
}

export default Entity
