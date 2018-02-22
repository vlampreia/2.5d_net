'use strict'

const window_events = {
  WINDOW_RESIZE: 'resize',
  KEY_DOWN:      'k_down',
  KEY_UP:        'k_up',
  MOUSE_MOVE:    'm_move',
  MOUSE_UP:      'm_up',
  MOUSE_DOWN:    'm_down',
  MOUSE_DOUBLE:  'm_double',
  MOUSE_CTX:     'm_ctx',
  MOUSE_WHEEL:   'm_wheel',
}

const Events = Object.assign({}, window_events)

export default Events
