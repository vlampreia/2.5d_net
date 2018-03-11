'use strict';

class Vector {
  x
  y
  z

  constructor(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }

  add_v(vector) {
    return new Vector(this.x + vector.x, this.y + vector.y, this.z + vector.z)
  }

  subtract(vector) {
    return new Vector(this.x - vector.x, this.y - vector.y, this.z - vector.z)
  }

  sub_v(vector) {
    return this.subtract(vector)
  }

  multiply(factor) {
    return new Vector(this.x * factor, this.y * factor, this.z * factor)
  }

  mul_v(vector) {
    return new Vector(this.x * vector.x, this.y * vector.y, this.z * vector.z)
  }

  mul_f(factor) {
    return this.multiply(factor)
  }

  add_f(value) {
    return new Vector(this.x + value, this.y + value, this.z + value)
  }

  sub_f(value) {
    return new Vector(this.x - value, this.y - value, this.z - value)
  }

  divide(factor) {
    if (factor === 0) { return this }

    return new Vector(this.x / factor, this.y / factor, this.z / factor)
  }

  div_f(factor) {
    return this.div(factor)
  }

  div(factor) {
    return this.divide(factor)
  }

  lerp(target, percent) {
    return this.add_v(target.sub(this).mul(percent))
  }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
  }

  normalise() {
    return this.divide(this.magnitude())
  }

  floor() {
    return new Vector(~~this.x, ~~this.y, ~~this.z)
  }

  round() {
    return new Vector(Math.round(this.x), Math.round(this.y), Math.round(this.z))
  }
}

export default Vector
