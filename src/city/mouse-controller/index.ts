const AMORTIZATION = 0.95;

export class MouseController {
  private drag = false;
  private dX = 0;
  private dY = 0;
  #theta = 0;
  #phi = 0;

  constructor(canvas: HTMLCanvasElement) {
    let x_prev = 0;
    let y_prev = 0;

    const mouseDown = (e: MouseEvent) => {
      this.drag = true;
      x_prev = e.pageX;
      y_prev = e.pageY;
      e.preventDefault();
      return false;
    };

    const mouseUp = (_e: MouseEvent) => {
      this.drag = false;
    };

    const mouseMove = (e: MouseEvent): any => {
      if (!this.drag) return false;
      this.dX = ((e.pageX - x_prev) * Math.PI) / canvas.width;
      this.dY = ((e.pageY - y_prev) * Math.PI) / canvas.height;
      this.#theta += this.dX;
      this.#phi += this.dY;
      x_prev = e.pageX;
      y_prev = e.pageY;
      e.preventDefault();
    };

    canvas.addEventListener('mousedown', mouseDown, false);
    canvas.addEventListener('mouseup', mouseUp, false);
    canvas.addEventListener('mouseout', mouseUp, false);
    canvas.addEventListener('mousemove', mouseMove, false);
  }

  get phi(): number {
    return this.#phi;
  }

  get theta(): number {
    return this.#theta;
  }

  onRenderLoop() {
    if (!this.drag) {
      this.dX *= AMORTIZATION;
      this.dY *= AMORTIZATION;
      this.#theta += this.dX;
      this.#phi += this.dY;
    }
  }
}
