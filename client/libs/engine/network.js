'use strict'

import io from 'socket.io-client'
import uuid from 'uuid'
import EventManager from './eventManager.js'

class Network {
  constructor({
    endpoint,
    port,
    event_manager,
  }) {
    this.endpoint = endpoint
    this.port = port
    this.event_manager = event_manager

    this.network_event_manager = new EventManager()

    this.client_id = null
    this.connected = false
    this.socket = null
    this.outbound_event_queue = []
    this.outbound_raw_queue = []
  }

  _handle_connection() {
    this.connected = true
    console.log('connected to server')
    this.dequeue_events()
  }

  connect() {
    this.socket = io('http://localhost:3000')
    this.socket.on('connect', (socket) => {
      this._handle_connection()
      this.event_manager.push_event({ event_type: 'self_connect', e: null })
    })

    this.socket.on('disconnect', (socket) => {
      this.event_manager.push_event({ event_type: 'self_disconnect', e: null })
    })

    this.socket.on('net_identify', ({ client_id }) => {
      this.client_id = client_id
    })

    this.socket.on('event', (e) => {
      e.events.forEach((i) => {
        i.server_send_timestamp = e.time
        this.event_manager.push_event({ event_type: i.event_type, e: i })
      })
    })

    this.network_event_manager.get_registered_events().forEach((event_type) => {
      this.socket.on(event_type, (e) => {
        this.network_event_manager.push_event({ event_type, e, immediate: true })
      })
    })
  }

  dequeue_msgs(timestamp, max) {
    while (this.outbound_raw_queue.length > 0) {
      const msg = this.outbound_raw_queue.shift()
      this.socket.emit(msg.event_type, msg.payload)
    }
  }

  send_event(event_type, payload) {
    if (!this.connected) {
      //this.outbound_event_queue.push({ event_type, payload })
      this.outbound_raw_queue.push({ event_type, payload })
      return
    }

    this.socket.emit(event_type, payload)
  }

  add_listener(event_type, delegate) {
    this.network_event_manager.add_listener(event_type, delegate)
  }

  on(event_type, delegate) {
    return this.add_listener(event_type, delegate)
  }

  enqueue_event(event_type, payload) {
    this.outbound_event_queue.push({ event_type, payload })
  }

  dequeue_events(timestamp, max) {
    if (!this.connected) { return }

    while (this.outbound_event_queue.length > 0) {
      const msg = this.outbound_event_queue.shift()
      this.send_event('event', {
        time: timestamp,
        events: [
          {
            event_type: msg.event_type,
            e: msg.payload
          }
        ]
      })
      //this.send_event(msg.event_type, msg.payload)
    }
  }
}

export default Network
