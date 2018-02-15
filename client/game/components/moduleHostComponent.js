'use strict'

import { Component } from 'ecs'

class ModuleHostComponent extends Component {
  constructor() {
    super()

    this.modules = []
  }

  attach_module_entity(module_entity) {
    this.modules.push(module_entity)
  }
}

export default ModuleHostComponent
