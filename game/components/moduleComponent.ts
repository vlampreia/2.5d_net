'use strict'

import { Component } from 'ecs'

class ModuleComponent extends Component {
  data

  constructor() {
    super()

    this.data = {}
  }
}

export default ModuleComponent
