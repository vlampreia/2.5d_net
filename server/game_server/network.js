'use strict'

const SocketIO = require('socket.io')
const uuid = require('uuid')
const EventManager = require('./eventManager.js')

class Network {
  constructor(event_manager) {
    this.event_manager = event_manager
    this.network_event_manager = new EventManager()

    this.io = new SocketIO()

    this.io.on('connection', (client) => {
      this.handle_client_connection(client)
    })

    this.clients = {}

    this.msg_queue = []
    this.msg_bc_queue = []
  }

  listen() {
    this.io.listen(3000)
  }

  handle_client_connection(client_socket) {
    const client_id = uuid.v4()

    console.log('client connected ', client_id)

    this.event_manager.push_event('net_client_open', { e: { client_id } })

    this.clients[client_id] = client_socket

    client_socket.emit('net_identify', { client_id })

    client_socket.on('disconnect', this.handle_client_disconnect(client_id).bind(this))

    this.network_event_manager.get_registered_events().forEach((event_type) => {
      client_socket.on(event_type, (e) => {
        if (!(client_id in this.clients)) { return }

        this.network_event_manager.push_event(event_type, {
          e: {
            client_id,
            e
          },
          immediate: true
        })
      })
    })

    client_socket.on('event', (e) => {
      console.log('got event from client', JSON.stringify(e))
      e.events.forEach((i) => {
        i.client_send_timestamp = e.time
        i.client_id = client_id
        this.event_manager.push_event(i.event_type, { e: i })
      })
    })
  }

  handle_client_disconnect(client_id) {
    return () => {
      if (!(client_id in this.clients)) { return }

      delete this.clients[client_id]
      this.event_manager.push_event('net_client_close', { e: { client_id } })
    }
  }

  send_message(client_id, event_type, e) {
    if (!(client_id in this.clients)) { return }

    this.clients[client_id].emit(event_type, e)
  }

  broadcast_message(event_type, e) {
    Object.keys(this.clients).forEach((ck) => {
      this.clients[ck].emit(event_type, e)
    })
  }

  add_listener(event_type, delegate) {
    this.network_event_manager.add_listener(event_type, delegate)
  }

  enqueue_msg(client_id, event_type, e) {
    this.msg_queue.push({ client_id, event_type, e })
  }

  dequeue_msg(frame_time, max) {
    while (this.msg_queue.length > 0) {
      const msg = this.msg_queue.shift()

      this.send_message(msg.client_id, 'event', {
        time: frame_time,
        events: [
          {
            event_type: msg.event_type,
            e: msg.e,
          },
        ],
      })
    }
  }

  enqueue_msg_bc(event_type, e) {
    this.msg_bc_queue.push({ event_type, e })
  }

  dequeue_msg_bc(frame_time, max) {
    while (this.msg_bc_queue.length > 0) {
      const msg = this.msg_bc_queue.shift()

      this.broadcast_message('event', {
        time: frame_time,
        events: [
          {
            event_type: msg.event_type,
            e: msg.e,
          },
        ],
      })
    }
  }

  dequeue_all(frame_start_time) {
    this.dequeue_msg(frame_start_time)
    this.dequeue_msg_bc(frame_start_time)
  }
}

module.exports = Network
