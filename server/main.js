import { getColors, createPolygon, createConnectedPolygon, chunk } from "../game/util.js"
import { Player, containsPoint, ROTATION_SPEED } from "../game/game"

export default class Server {
  constructor(clients, tick_rate) {
    this.clients = clients
    this.pause_delta = 0
    this.paused = true
    this.tick_rate = tick_rate

    const players = this.createPlayers()
    this.clients.forEach(client => client.init(players, this))

    this.players = players.map(obj => new Player(obj.name, obj.start_point, obj.color, obj.rotation))
  }

  createPlayers = () => {
    let colors = getColors(this.clients.length)

    return this.clients.map(client => {
      const name = `${client.index}`
      const start_point = { x: window.innerWidth / 2 + 300 * (client.index ? 1 : -1), y: window.innerHeight / 2 }
      const color = colors.pop()
      const rotation = Math.random() * Math.PI * 2

      return { name, start_point, color, rotation }
    })
  }

  start = () => {
    if (this.paused) {
      if (this.pause_delta) {
        this.last_update = Date.now() - this.pause_delta
      } else {
        this.last_update = Date.now() - (1000 / this.tick_rate)
      }
      this.paused = false
      this.serverTick()
    }
  }

  pause = () => {
    this.pause_delta = Date.now() - this.last_update
    this.paused = true
  }


  serverTick = () => {
    if (this.paused) {
      return
    }

    const ticks_needed = Math.floor((Date.now() - this.last_update) * this.tick_rate / 1000)

    this.last_update += ticks_needed * 1000 / this.tick_rate

    for (let i = 0; i < ticks_needed; i++) {
      let player_updates = []
      const players_alive = this.players.filter(player => player.alive)

      if (players_alive.length < 2) {
        return
      }

      for (let player of players_alive) {

        // Update player positions
        player.x += Math.sin(player.rotation) * player.speed
        player.y -= Math.cos(player.rotation) * player.speed

        // Edge wrapping
        if (player.x > window.innerWidth + player.fatness) {
          player.x = -player.fatness
          player.last_x = player.x - 1
          player.last_end = null
        }

        if (player.y > window.innerHeight + player.fatness) {
          player.y = -player.fatness
          player.last_y = player.y - 1
          player.last_end = null
        }

        if (player.x < -player.fatness) {
          player.x = window.innerWidth + player.fatness
          player.last_x = player.x + 1
          player.last_end = null
        }

        if (player.y < -player.fatness) {
          player.y = window.innerHeight + player.fatness
          player.last_y = player.y + 1
          player.last_end = null
        }

        // Create tail polygon, this returns null if it's supposed to be a hole
        let p = player.createTail()

        if (p !== null) {
          const collides = collider => {
            let pt = collider.polygon_tail

            if (collider === player) {
              pt = pt.slice(0, -1)
            }

            for (let i = 0; i < p.length; i += 2) {
              const x = p[i]
              const y = p[i + 1]

              if (pt.some(poly => containsPoint(poly, x, y))) {
                return true
              }
            }
            return false
          }

          if (this.players.some(collides)) {
            player.alive = false
          }

          player.polygon_tail.push(p)
        }

        player_updates.push({
          x: player.x,
          y: player.y,
          rotation: player.rotation,
          tail_part: p,
          alive: player.alive
        })
      }

      this.clients.map(client => client.updatePlayers(player_updates))
    }

    setTimeout(this.serverTick, (this.last_update + (1000 / this.tick_rate)) - Date.now())
  }

  rotateLeft = (index) => {
    const player = this.players[index]
    player.rotate(-(ROTATION_SPEED / player.fatness))
  }

  rotateRight = (index) => {
    const player = this.players[index]
    player.rotate((ROTATION_SPEED / player.fatness))
  }
}
