const AMORTIZATION = 0.95;

export class MouseController {
  private drag = false;
  private dX = 0;
  private dY = 0;
  private dZoom = 0;
  #theta = 0;
  #phi = 0;
  #zoom = 1;

  private moveDX = 0;
  private moveDY = 0;
  #moveX = 0;
  #moveY = 0;

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

      if (e.buttons === 1) {
        this.dX = ((e.pageX - x_prev) * Math.PI) / canvas.width;
        this.dY = ((e.pageY - y_prev) * Math.PI) / canvas.height;
        this.#theta += this.dX;
        this.#phi += this.dY;
      } else if (e.buttons === 2) {
        this.moveDX = ((e.pageX - x_prev) / canvas.width) * 10;
        this.moveDY = ((e.pageY - y_prev) / canvas.height) * 10;
        this.#moveX += this.moveDX;
        this.#moveY += this.moveDY;
      }

      x_prev = e.pageX;
      y_prev = e.pageY;
      e.preventDefault();
    };

    canvas.addEventListener('mousedown', mouseDown, false);
    canvas.addEventListener('mouseup', mouseUp, false);
    canvas.addEventListener('mouseout', mouseUp, false);
    canvas.addEventListener('mousemove', mouseMove, false);

    addEventListener('wheel', (event) => {
      this.dZoom -= event.deltaY / 20_000;
    });

    addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  get phi(): number {
    return this.#phi;
  }

  get theta(): number {
    return this.#theta;
  }

  get zoom(): number {
    return this.#zoom;
  }

  get moveY(): number {
    return this.#moveY;
  }
  get moveX(): number {
    return this.#moveX;
  }

  onRenderLoop() {
    if (!this.drag) {
      this.dX *= AMORTIZATION;
      this.dY *= AMORTIZATION;
      this.dZoom *= AMORTIZATION;
      this.moveDX *= AMORTIZATION;
      this.moveDY *= AMORTIZATION;
      this.#theta += this.dX;
      this.#phi += this.dY;
      this.#zoom = Math.max(this.#zoom + this.dZoom, 0.1);
      this.#moveX += this.moveDX;
      this.#moveY += this.moveDY;
    }
  }
}
