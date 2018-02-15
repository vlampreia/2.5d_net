'use strict'

class EventType {
  constructor(name) {
    this.name = name
  }

  toString() {
    return this.name
  }
}

EventType.RESIZE = new EventType('resize')

module.exports = EventType
