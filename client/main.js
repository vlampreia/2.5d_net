'use strict'

import Game from './game/game.js'

const canvas_element = document.getElementById('canvas')

const game = new Game(canvas_element)
window.game = game

window.addEventListener('resize', (e) => {
  game.engine.event_manager.push_event({ event_type: 'window_resize', e })
})

game.run()
