'use strict';

const async = require('async')
const Vector = require('./vector.js')

const EULER_CONST = 2.71828182845904523536
const EULER_CONST_2 = EULER_CONST * EULER_CONST
const FACTOR = 3/2

class Particle {
  constructor() {
    this.position = new Vector(0, 0, 0)
    this.acceleration = new Vector(0, 0, 0)
    this.velocity = new Vector(0, 0, 0)

    this.mass = 1.0
  }
}

const _p = {
  update_particle: (particle, particle_pool, callback) => {
    let movement = new Vector(0, 0, 0)

    particle_pool.forEach((particle_2) => {
      const dv = particle_2.position.subtract(particle.position)

      const m = dv.magnitude()
      const x = Math.sqrt((m * m) + EULER_CONST_2, FACTOR)

      movement = movement.add(dv.multiply(particle_2.mass).normalise())
    })

    particle.position = particle.position.add(particle.acceleration)

    particle.velocity = particle.velocity
      .add(movement.add(particle.acceleration))

    particle.acceleration = movement
  },
}

class ParticleSimulator {
  constructor() {
    this.particles = [];
  }

  step_simulation() {
    this.particles.forEach(p => _p.update_particle(p, this.particles))
  }
}

let current_state = { position: new Vector(0, 0, 0), t: 0 }
let states = [ ]
const SERV_SEND_RATE = 100
const n_states = 10

for (let i = 0; i < n_states; ++i) {
  states[i] = {
    position: new Vector(i * 5, 0, 0),
    t: i * SERV_SEND_RATE,
  }
  console.log(states[i])
}

states[4] = null
states[5] = null
states[6] = null

let i = 1
let state_1 = states[i-1]
for (; i < states.length; ++i) {
  while (!states[i] && i < states.length) i++

  let state_2 = states[i]

  //const factor = 1/(state_2.t - state_1.t)
  const factor = 1/(state_1.t / (state_2.t - state_1.t))
  current_state.position = state_1.position.lerp(state_2.position, factor)
  current_state.t = state_2.t
  console.log('f', factor, 'vis:', current_state, state_1.t, state_2.t)

  state_1 = state_2
}

console.log('end state', current_state)

//const ps = new ParticleSimulator()
//
//const p1 = new Particle()
//p1.position = new Vector(10, 10, 10)
//
//const p2 = new Particle()
//p2.mass = 1
//
//ps.particles.push(p1)
//ps.particles.push(p2)
//
//for (let i=0; i< 1000; ++i) {
//  const p = new Particle()
//  p.position = new Vector(100, 100, 100)
//  p.velocity = new Vector(10, 10, 10)
//  ps.particles.push(p)
//}
//
//const times = []
//const t = new Date().getTime()
//for (let i=0; i<10; ++i) {
//  const t1 = new Date().getTime()
//  ps.step_simulation()
//  times.push(new Date().getTime() - t1)
//}
//console.log('time: ', new Date().getTime() - t)
//console.log('avg frame duration ', times.reduce((a,v) => a += v, 0)/times.length)
//console.log(times)
//
////for (let i = 0; i < 40000; ++i) {
////  ps.step_simulation()
////  //ps.particles.forEach(p => console.log(p.toString()))
////  //console.log()
////}
////console.log('time: ', new Date().getTime() - t)
