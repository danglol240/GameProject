export class Input {
  constructor() {
    this.keys = {}
    this.mouse = { dx: 0, dy: 0, isPointerLocked: false }

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true
    })
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false
    })

    document.addEventListener('pointerlockchange', () => {
      this.mouse.isPointerLocked = document.pointerLockElement != null
    })

    window.addEventListener('mousemove', (e) => {
      if (this.mouse.isPointerLocked) {
        this.mouse.dx += e.movementX
        this.mouse.dy += e.movementY
      }
    })
  }

  requestPointerLock(element) {
    element.requestPointerLock()
  }

  consume() {
    const k = this.keys
    const result = {
      forward:   !!(k['KeyW'] || k['ArrowUp']),
      backward:  !!(k['KeyS'] || k['ArrowDown']),
      left:      !!(k['KeyA'] || k['ArrowLeft']),
      right:     !!(k['KeyD'] || k['ArrowRight']),
      run:       !!(k['ShiftLeft'] || k['ShiftRight']),
      interact:  !!(k['KeyP']),
      mouseDx:   this.mouse.dx,
      mouseDy:   this.mouse.dy
    }
    this.mouse.dx = 0
    this.mouse.dy = 0
    return result
  }
}
