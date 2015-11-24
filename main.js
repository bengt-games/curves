import { Sprite, Texture, autoDetectRenderer, Container, utils } from 'pixi.js'
import keypress from 'keypress.js'

const listener = new keypress.Listener()

// Remove pesky pixi.js banner from console
utils._saidHello = true

const renderer = autoDetectRenderer(window.innerWidth, window.innerHeight, { backgroundColor: 0x000000 })

const texture = Texture.fromImage('bengt.jpg')
const bengt = new Sprite(texture)

bengt.position.x = window.innerWidth / 2 - (46/2)
bengt.position.y = window.innerHeight / 2 - (64/2)
bengt.anchor = { x: 0.5, y: 0.5 }

const c = new Container()
c.addChild(bengt)

document.getElementById('game').appendChild(renderer.view)

const rotationSpeed = 0.05
const moveSpeed = 4
const keydown = { left: false, right: false }

listener.register_combo({
  keys: 'left',
  on_keydown: (a, b, c) => {
    if (c) return
    
    keydown.left = true
  },
  on_keyup: (a, b, c) => {
    keydown.left = false
  }
})

listener.register_combo({
  keys: 'right',
  on_keydown: (a, b, c) => {
    if (c) return
    
    keydown.right = true
  },
  on_keyup: (a, b, c) => {
    keydown.right = false
  }
})

const draw = function () {
  renderer.render(c)
  requestAnimationFrame(draw)

  bengt.x += Math.sin(bengt.rotation) * moveSpeed
  bengt.y -= Math.cos(bengt.rotation) * moveSpeed

  if (keydown.left)
    bengt.rotation = (bengt.rotation - rotationSpeed) % (2 * Math.PI)
  if (keydown.right)
    bengt.rotation = (bengt.rotation + rotationSpeed) % (2 * Math.PI)

  if (bengt.rotation < 0)
    bengt.rotation += 2 * Math.PI

  if (bengt.x > window.innerWidth + 32)
    bengt.x = -32
  if (bengt.y > window.innerHeight + 32)
    bengt.y = -32
  if (bengt.x < -32)
    bengt.x = window.innerWidth + 32
  if (bengt.y < -32)
    bengt.y = window.innerHeight + 32
}

window.onresize = (e) => {
  renderer.view.style.width = window.innerWidth + 'px'
  renderer.view.style.height = window.innerHeight + 'px'

  renderer.resize(window.innerWidth, window.innerHeight)
}

draw()

