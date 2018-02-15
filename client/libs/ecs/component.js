'use strict'

class Component {
  constructor() {
    if (this.constructor === Component) {
      throw new TypeError('Abstract class "Component" cannot be instantiated directly.')
    }
  }

  static get_type() {
    return this.name
  }

  get_type() {
    return this.constructor.name
  }
}

export default Component
