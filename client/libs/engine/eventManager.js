'use strict'

const DEFAULT_MAX_EVENTS = 100

class EventManager {
  constructor() {
    this.event_listeners = {}

    this.event_queue = []
  }

  dispatch_event({ event_type, e, timestamp }) {
    if (!(event_type in this.event_listeners)) return
    this.event_listeners[event_type].forEach(listener => listener(e, timestamp))
  }

  dispatch_events(max) {
    const max_events = max || DEFAULT_MAX_EVENTS
    let event_ptr = 0

    while (
      this.event_queue.length &&
      (max_events >= 0 && event_ptr < max_events)
    ) {
      const e = this.event_queue.shift()
      this.dispatch_event(e)
      ++event_ptr
    }
  }

  push_event({ event_type, e, timestamp, immediate }) {
    const t = timestamp || new Date().getTime()

    if (immediate) {
      return this.dispatch_event({ event_type, e, timestamp: t })
    }

    this.event_queue.push({ event_type, e , timestamp: t})
  }

  add_listener(event_type, listener) {
    if (!(event_type in this.event_listeners)) {
      this.event_listeners[event_type] = []
    }

    this.event_listeners[event_type].push(listener)
  }

  on(event_type, listener) {
    return this.add_listener(event_type, listener)
  }

  get_registered_events() {
    return Object.keys(this.event_listeners)
  }
}

export default EventManager
