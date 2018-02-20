'use strict'

import { Component } from 'ecs'

class PlayerControlledComponent extends Component {
  constructor(client_id, event_manager) {
    super()

    this._client_id = client_id
    this.event_queue = []

    event_manager.add_listener('player_move', this.enqueue_player_move.bind(this))
  }

  enqueue_player_move(e) {
    console.log(e.e.client_id)
    if (e.e.client_id !== this._client_id) { return }

    this.event_queue.push(e)
  }
}

export default PlayerControlledComponent
