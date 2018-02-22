'use strict'

import { Component } from 'ecs'

class PlayerControlledComponent extends Component {
  _client_id
  event_queue
  move_up
  move_down
  move_left
  move_right

  constructor(client_id, event_manager) {
    super()

    this._client_id = client_id
    this.event_queue = []

    this.move_right = 0
    this.move_left = 0
    this.move_up = 0
    this.move_down = 0

    event_manager.add_listener('in_player_move', this.enqueue_player_move.bind(this))
  }

  enqueue_player_move(e) {
    console.log(e.e.client_id)
    if (e.e.client_id !== this._client_id) { return }

    this.event_queue.push(e)
  }
}

export default PlayerControlledComponent
