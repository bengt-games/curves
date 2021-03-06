import { Container, Graphics, Text, Sprite, Texture } from "pixi.js"
import { diffArray, diffMap, ChangeType, index } from "tsdiff"
import never from "utils/never"

import { MeshPart as TailMesh } from "./tail"
import { fillSquare } from "game/client"
import { getTexture, DehydratedTexture } from "game/texture"
import { List, Record, Map as IMap } from "immutable"
import { Snake } from "game/player"
import createModule, { Action } from "redux-typescript-module"
import { createStore } from "redux"
import { padEqual } from "utils/string"

export interface KeyText {
  x: number,
  y: number,
  rotation: number,
  text: string,
  color: number,
}

export interface PowerupSprite {
  x: number
  y: number
  texture: DehydratedTexture
  id: number
}

export interface RenderStateI {
  keytexts: KeyText[]
  powerups: IMap<number, PowerupSprite>
  tails: TailMesh[]
  snakes: Snake[]
}

export type RenderState = Record.Instance<RenderStateI>

// tslint:disable-next-line:variable-name
export const RenderStateClass: Record.Class<RenderStateI> = Record<RenderStateI>({
  keytexts: [],
  powerups: IMap<number, PowerupSprite>(),
  tails: [],
  snakes: [],
})

function neverDiff(x: never) {
  return never("Unexpected diff type in", x)
}

type Override<Obj, With> = {
  readonly [P in keyof Obj]: With;
}

export interface DehydratedTailMesh {
  vertices: number[]
  uvs: number[]
  indices: number[]
  texture: DehydratedTexture
}

interface Dehydrated {
  keytexts: KeyText[]
  powerups: [number, PowerupSprite][]
  tails: DehydratedTailMesh[]
  snakes: Snake[]
}

export const renderModule = createModule(new RenderStateClass(), {
  RENDER_NEW_ROUND: (state: RenderState, action: Action<[Snake, [string, string, number] | undefined][]>) => {
    const snakesWithKeyTextAndColor = action.payload
    state = state.set("powerups", IMap())
    state = state.set("snakes", snakesWithKeyTextAndColor.map(snakeAndMore => snakeAndMore[0]))

    for (const [snake, keysAndColor] of snakesWithKeyTextAndColor) {
      if (keysAndColor != null) {
        const [left, right, color] = keysAndColor
        const [leftP, rightP] = padEqual(left, right)
        const text = `${leftP} ▲ ${rightP}`

        state = state.set("keytexts",
          state.keytexts.concat({
            x: snake.x,
            y: snake.y,
            rotation: snake.rotation,
            text,
            color,
          }))
      }
    }
    return state
  },
  RENDER_SET_SNAKES: (state: RenderState, action: Action<Snake[]>) => state.set("snakes", action.payload),
  RENDER_CLEAR_KEYTEXTS: (state: RenderState, action: Action<undefined>) => state.delete("keytexts"),
  RENDER_ADD_POWERUP: (state: RenderState, action: Action<PowerupSprite>) => {
    const ps = action.payload
    return state.set("powerups", state.powerups.set(ps.id, ps))
  },
  RENDER_REMOVE_POWERUP: (state: RenderState, action: Action<number>) =>
    state.set("powerups", state.powerups.filter(t => t.id !== action.payload)),
  RENDER_SET_MESHES: (state: RenderState, action: Action<TailMesh[]>) =>
    state.set("tails", action.payload),
})

export default class Render {
  public store = createStore(renderModule.reducer)
  private state: RenderState

  private powerupSprites = new Map<number, Sprite>()
  private readonly keysLayer = new Graphics()
  private readonly powerupLayer = new Graphics()
  private readonly tailLayer = new Graphics()
  private readonly playerLayer = new Graphics()

  constructor(private container: Container) {
    // The order of these actually matters
    // Order is back to front
    this.container.addChild(this.keysLayer)
    this.container.addChild(this.powerupLayer)
    this.container.addChild(this.tailLayer)
    this.container.addChild(this.playerLayer)
    this.state = this.store.getState()
  }

  public dehydrate() {
    const {
      keytexts,
      powerups,
      tails,
      snakes,
    } = this.state

    const obj: Dehydrated = {
      keytexts,
      powerups: powerups.entrySeq().toArray(),
      tails: tails.map(tail => ({
        vertices: Array.from(tail.vertices),
        uvs: Array.from(tail.uvs),
        indices: Array.from(tail.indices),
        texture: tail.texture,
      })),
      snakes,
    }

    return JSON.stringify(obj)
  }

  public rehydrate(s: string) {
    const obj: Dehydrated = JSON.parse(s)

    const {
      keytexts,
      powerups,
      tails,
      snakes,
    } = obj

    const state: RenderState = new RenderStateClass({
      keytexts,
      powerups: IMap(powerups),
      tails: tails.map(tail => ({
        vertices: new Float32Array(tail.vertices),
        uvs: new Float32Array(tail.uvs),
        indices: new Uint16Array(tail.indices),
        texture: tail.texture,
      })),
      snakes,
    })

    console.log(state)

    this.setState(state)

  }

  public render() {
    this.setState(this.store.getState())
  }

  private setState(state: RenderState) {
    if (state === this.state) {
      return
    }

    const keytextsdiff = diffArray(this.state.keytexts, state.keytexts)

    keytextsdiff.forEach(diff => {
      switch (diff.type) {
        case ChangeType.ADD: {
          diff.vals.forEach((v, i) => {
            const text = new Text(v.text, {
              fontFamily: "Courier New",
              fill: v.color,
              fontSize: 24,
            })

            text.anchor.set(0.5, 1.5)
            text.x = v.x
            text.y = v.y
            text.rotation = v.rotation
            this.keysLayer.addChildAt(text, index(diff) + i)

          })
          break
        }
        case ChangeType.REMOVE: {
          this.keysLayer.removeChildren(index(diff), index(diff) + diff.num)
          break
        }
        case ChangeType.SET: {
          throw new Error(`unhandled diff ${diff.type}`)
        }
        case ChangeType.MODIFIED: {
          throw new Error(`unhandled diff ${diff.type}`)
        }
        default:
          neverDiff(diff)
      }
    })

    const powerupsdiff = diffMap(this.state.powerups, state.powerups)

    powerupsdiff.forEach(diff => {
      switch (diff.type) {
        case ChangeType.ADD: {
          diff.vals.forEach((v, i) => {
            const powerupSprite = new Sprite(getTexture(v.texture))
            powerupSprite.position.set(v.x, v.y)
            powerupSprite.anchor.set(0.5)

            this.powerupSprites.set(index(diff) + i, this.powerupLayer.addChild(powerupSprite))
          })
          break
        }
        case ChangeType.REMOVE: {
          for (let i = index(diff); i < index(diff) + diff.num; i++) {
            const sprite = this.powerupSprites.get(i)
            if (sprite) {
              this.powerupLayer.removeChild(sprite)
              this.powerupSprites.delete(i)
            }
          }
          break
        }
        case ChangeType.SET: {
          const sprite = this.powerupSprites.get(index(diff))
          const value = diff.val

          sprite!.position.set(value.x, value.y)
          sprite!.texture = getTexture(value.texture)
          break
        }
        default:
          neverDiff(diff)
      }
    })

    const tailsdiff = diffArray(this.state.tails, state.tails)

    tailsdiff.forEach(diff => {
      switch (diff.type) {
        case ChangeType.ADD: {
          diff.vals.forEach((v, i) => {
            const mesh = new PIXI.mesh.Mesh(
              getTexture(v.texture),
              v.vertices,
              v.uvs,
              v.indices)

            this.tailLayer.addChildAt(mesh, index(diff) + i)
          })
          break
        }
        case ChangeType.REMOVE: {
          this.tailLayer.removeChildren(index(diff), index(diff) + diff.num)
          break
        }
        case ChangeType.SET: {
          const i = diff.path[0] as number
          const mesh = this.tailLayer.getChildAt(i) as PIXI.mesh.Mesh
          const value = diff.val

          mesh.texture = getTexture(value.texture)
          mesh.vertices = value.vertices
          mesh.uvs = value.uvs
          mesh.indices = value.indices

          mesh.dirty++
          mesh.indexDirty++
          const meshy = mesh as any
          meshy.refresh()
          mesh.updateTransform()
          break
        }
        case ChangeType.MODIFIED: {
          throw new Error(`unhandled diff ${diff.type}`)
        }
        default:
          neverDiff(diff)
      }
    })

    const snakesdiff = diffArray(this.state.snakes, state.snakes)

    function moveSnake(container: Graphics, snake: Snake) {
      const graphics = container.getChildAt(0) as PIXI.mesh.Mesh
      const powerupGraphics = container.getChildAt(1) as PIXI.Graphics
      const {
        x, y,
        fatness,
        rotation,
        powerupProgress,
        texture,
      } = snake

      container.position.set(x, y)
      graphics.texture = getTexture(texture)
      graphics.vertices.set(fillSquare(fatness * 2, fatness * 2))
      graphics.uvs.set(fillSquare(fatness * 2 / graphics.texture.width, fatness * 2 / graphics.texture.height))
      graphics.rotation = rotation
      graphics.children[0].scale.set(fatness, fatness)

      graphics.dirty++
      graphics.indexDirty++
      const meshy = graphics as any
      meshy.refresh()
      graphics.updateTransform()

      powerupGraphics.clear()
      let i = 1
      powerupProgress.forEach(progress => {
        powerupGraphics.beginFill(0x000000, 0)
        const lineWidth = 5
        powerupGraphics.lineStyle(lineWidth, 0xffffff)

        const r = fatness + (lineWidth * i)
        i += 1.5
        const startAngle = - Math.PI / 2
        const endAngle = startAngle + Math.PI * 2 - Math.PI * 2 * progress % (Math.PI * 2)
        const startX = Math.cos(startAngle) * r
        const startY = Math.sin(startAngle) * r

        // Perform moveTo so that no line is drawn between arcs
        powerupGraphics.moveTo(startX, startY)
        powerupGraphics.arc(0, 0, r, startAngle, endAngle)
        powerupGraphics.endFill()

      })
    }

    snakesdiff.forEach(diff => {
      switch (diff.type) {
        case ChangeType.ADD: {
          diff.vals.forEach((v, i) => {
            const container = new Graphics()
            const graphics = new PIXI.mesh.Mesh(
              getTexture(v.texture),
              fillSquare(1, 1),
              fillSquare(1, 1),
              new Uint16Array([0, 1, 2, 3]))
            const mask = new Graphics()
            mask.beginFill(0x000000)

            mask.drawCircle(0, 0, 1)
            mask.endFill()
            // adding the mask as child makes it follow the snake position
            graphics.addChild(mask)
            // also sets mask.renderable to false :)
            graphics.mask = mask
            graphics.rotation = v.rotation

            container.addChild(graphics)
            container.addChild(new Graphics())

            this.playerLayer.addChildAt(container, index(diff) + i)
            moveSnake(container, v)
          })
          break
        }
        case ChangeType.REMOVE: {
          this.playerLayer.removeChildren(index(diff), index(diff) + diff.num)
          break
        }
        case ChangeType.SET: {
          const i = diff.path[0] as number
          const container = this.playerLayer.getChildAt(i) as Graphics
          moveSnake(container, diff.val)

          break
        }
        case ChangeType.MODIFIED: {
          const i = diff.path[0] as number
          const container = this.playerLayer.getChildAt(i) as Graphics
          moveSnake(container, diff.to)
          break
        }
        default:
          neverDiff(diff)
      }
    })

    this.state = state
  }
}
