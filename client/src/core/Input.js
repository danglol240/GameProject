export class Input {
  constructor() {
    this.keys = {};
    this.jumpBuf = [0, 0];
    this._advance = false;
    this._restart = false;
    window.addEventListener('keydown', this._onDown.bind(this));
    window.addEventListener('keyup', function (e) { this.keys[e.code] = false; }.bind(this));
  }

  _onDown(e) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].indexOf(e.code) >= 0) e.preventDefault();
    this.keys[e.code] = true;
    if (e.code === 'KeyW' || e.code === 'Space') this.jumpBuf[0] = 0.13;
    if (e.code === 'ArrowUp') this.jumpBuf[1] = 0.13;
    if (e.code === 'Enter') this._advance = true;
    if (e.code === 'KeyR') this._restart = true;
  }

  consume() {
    var r = { advance: this._advance, restart: this._restart };
    this._advance = false; this._restart = false;
    return r;
  }
}
