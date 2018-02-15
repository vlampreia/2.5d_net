'use strict'

import E from './events.js'

const window_event_map = {
  resize:       E.WINDOW_RESIZE,
  keydown:      E.KEY_DOWN,
  keyup:        E.KEY_UP,
  mousemove:    E.MOUSE_MOVE,
  mouseup:      E.MOUSE_UP,
  mousedown:    E.MOUSE_DOWN,
  dblclick:     E.MOUSE_DOUBLE,
  contextmenu:  E.MOUSE_CTX,
  wheel:        E.MOUSE_WHEEL,
}

class windowEventManager {
  constructor(event_manager) {
    this.event_manager = event_manager

    this.listening = false

    this.register_window_listeners()
  }

  register_window_listeners() {
    if (this.listening) { return }

    Object.keys(window_event_map).forEach((src_event) => {
      window.addEventListener(src_event, (e) => {
        this.event_manager.push_event({ event_type: window_event_map[src_event], e })
      })
    })

    this.listening = true
  }
}

export default windowEventManager
