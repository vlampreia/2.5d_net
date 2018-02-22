'use strict'

import E from './events.js'

class InputMapper {
  private _event_manager
  private _keyboard_input_mapping

  constructor(event_manager) {
    this._event_manager = event_manager

    this._event_manager.add_listener(E.KEY_DOWN, this.handle_key_down.bind(this))
    this._event_manager.add_listener(E.KEY_UP, this.handle_key_up.bind(this))
    this._event_manager.add_listener(E.MOUSE_DOWN, this.handle_mouse_click.bind(this))

    this._keyboard_input_mapping = {
      'KeyA': { event_type: 'in_player_move', action_type: 'state', action_name: 'MOVE_LEFT' },
      'KeyD': { event_type: 'in_player_move', action_type: 'state', action_name: 'MOVE_RIGHT' },
      'KeyW': { event_type: 'in_player_move', action_type: 'state', action_name: 'MOVE_UP' },
      'KeyS': { event_type: 'in_player_move', action_type: 'state', action_name: 'MOVE_DOWN' },
      //'KeyI': { event_type: 'ui_action', action: 'TOGGLE_INPUT' },
      //'KeyO': { event_type: 'ui_action', action: 'TOGGLE_DEBUG' },
    }
  }

  handle_key_down(e) {
    if (!(this._keyboard_input_mapping.hasOwnProperty(e.code))) {
      console.log('WARNING: input mapper has no mapping for ', e.code)
      return
    }

    const out_ev = this._keyboard_input_mapping[e.code]

    const data = {
      action: out_ev.action_name,
      state: 0
    }

    if (out_ev.action_type === 'state') {
      data.state = 1
    }

    this._event_manager.push_event(
      out_ev.event_type,
      data
    )
  }

  handle_key_up(e) {
    if (!(this._keyboard_input_mapping.hasOwnProperty(e.code))) { return }

    const out_ev = this._keyboard_input_mapping[e.code]

    const data = {
      action: out_ev.action_name,
      state: 0
    }

    if (out_ev.action_type === 'state') {
      data.state = 0
    }

    this._event_manager.push_event(
      out_ev.event_type,
      data
    )
  }

  handle_mouse_click(e) {

  }

  get_input_mapping() {
    return this._keyboard_input_mapping
  }
}

export default InputMapper
