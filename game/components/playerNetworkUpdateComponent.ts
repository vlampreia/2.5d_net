'use strict'

import { Component } from 'ecs'

class PlayerNetworkUpdateComponent extends Component {
  client_id: string
  event_queue: object[]

  constructor(client_id: string, event_manager) {
    super()

    this.client_id = client_id
    this.event_queue = []

    event_manager.add_listener('player_move', this.enqueue_player_move.bind(this))
  }

  enqueue_player_move(e) {
    if (e.e.client_id !== this.client_id) { return }

    this.event_queue.push(e)
  }
}

export default PlayerNetworkUpdateComponent
