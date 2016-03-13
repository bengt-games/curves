import R from 'Ramda'

const keys = {
  CANCEL: { code: 3 },
  HELP: { code: 6 },
  BACK_SPACE: { code: 8 },
  TAB: { code: 9 },
  CLEAR: { code: 12 },
  RETURN: { code: 13 },
  ENTER: { code: 14 },
  SHIFT: { code: 16 },
  CONTROL: { code: 17 },
  ALT: { code: 18 },
  PAUSE: { code: 19 },
  CAPS_LOCK: { code: 20 },
  ESCAPE: { code: 27 },
  SPACE: { code: 32 },
  PAGE_UP: { code: 33 },
  PAGE_DOWN: { code: 34 },
  END: { code: 35 },
  HOME: { code: 36 },
  LEFT: { code: 37 },
  UP: { code: 38 },
  RIGHT: { code: 39 },
  DOWN: { code: 40 },
  PRINTSCREEN: { code: 44 },
  INSERT: { code: 45 },
  DELETE: { code: 46 },
  NUM_0: { code: 48 },
  NUM_1: { code: 49 },
  NUM_2: { code: 50 },
  NUM_3: { code: 51 },
  NUM_4: { code: 52 },
  NUM_5: { code: 53 },
  NUM_6: { code: 54 },
  NUM_7: { code: 55 },
  NUM_8: { code: 56 },
  NUM_9: { code: 57 },
  SEMICOLON: { code: 59 },
  EQUALS: { code: 61 },
  A: { code: 65 },
  B: { code: 66 },
  C: { code: 67 },
  D: { code: 68 },
  E: { code: 69 },
  F: { code: 70 },
  G: { code: 71 },
  H: { code: 72 },
  I: { code: 73 },
  J: { code: 74 },
  K: { code: 75 },
  L: { code: 76 },
  M: { code: 77 },
  N: { code: 78 },
  O: { code: 79 },
  P: { code: 80 },
  Q: { code: 81 },
  R: { code: 82 },
  S: { code: 83 },
  T: { code: 84 },
  U: { code: 85 },
  V: { code: 86 },
  W: { code: 87 },
  X: { code: 88 },
  Y: { code: 89 },
  Z: { code: 90 },
  CONTEXT_MENU: { code: 93 },
  NUMPAD0: { code: 96 },
  NUMPAD1: { code: 97 },
  NUMPAD2: { code: 98 },
  NUMPAD3: { code: 99 },
  NUMPAD4: { code: 100 },
  NUMPAD5: { code: 101 },
  NUMPAD6: { code: 102 },
  NUMPAD7: { code: 103 },
  NUMPAD8: { code: 104 },
  NUMPAD9: { code: 105 },
  MULTIPLY: { code: 106 },
  ADD: { code: 107 },
  SEPARATOR: { code: 108 },
  SUBTRACT: { code: 109 },
  DECIMAL: { code: 110 },
  DIVIDE: { code: 111 },
  F1: { code: 112 },
  F2: { code: 113 },
  F3: { code: 114 },
  F4: { code: 115 },
  F5: { code: 116 },
  F6: { code: 117 },
  F7: { code: 118 },
  F8: { code: 119 },
  F9: { code: 120 },
  F10: { code: 121 },
  F11: { code: 122 },
  F12: { code: 123 },
  F13: { code: 124 },
  F14: { code: 125 },
  F15: { code: 126 },
  F16: { code: 127 },
  F17: { code: 128 },
  F18: { code: 129 },
  F19: { code: 130 },
  F20: { code: 131 },
  F21: { code: 132 },
  F22: { code: 133 },
  F23: { code: 134 },
  F24: { code: 135 },
  NUM_LOCK: { code: 144 },
  SCROLL_LOCK: { code: 145 },
  COMMA: { code: 188 },
  PERIOD: { code: 190 },
  SLASH: { code: 191 },
  BACK_QUOTE: { code: 192 },
  OPEN_BRACKET: { code: 219 },
  BACK_SLASH: { code: 220 },
  CLOSE_BRACKET: { code: 221 },
  QUOTE: { code: 222 },
  META: { code: 224 },
}

module.exports = (() => {
  function setKeysPressed (e, pressed) {
    R.mapObjIndexed((key) => {
      if (key.code === e.keyCode) {
        e.preventDefault()

        key.pressed = pressed
      }

      return key
    }, keys)
  }

  window.addEventListener('keydown', (e) => {
    setKeysPressed(e, true)
  })

  window.addEventListener('keyup', (e) => {
    setKeysPressed(e, false)
  })

  return keys
})()

