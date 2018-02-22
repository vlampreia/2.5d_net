'use strict'

import Game from './game'

const canvas_element = document.getElementById('canvas')
const game = new Game(canvas_element)

function start() {
  (<any>window).game = game

  window.addEventListener('resize', (e) => {
    game.engine.event_manager.push_event('window_resize', e)
  })

  game.run()
}

start()
