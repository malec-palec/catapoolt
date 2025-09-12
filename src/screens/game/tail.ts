import { BlobPoint, SoftBlob, Vector2D } from "./soft-blob";

const DAMPING = 0.99;
const GRAVITY = 0.3;

class TailNode {
  pos: Vector2D;
  prevPos: Vector2D;

  constructor(
    x: number,
    y: number,
    public isPinned: boolean = false,
  ) {
    this.pos = { x, y };
    this.prevPos = { x, y };
  }

  verletIntegrate(): void {
    const { pos, prevPos, isPinned } = this;
    if (isPinned) return;

    const tempX = pos.x;
    const tempY = pos.y;

    const velX = (pos.x - prevPos.x) * DAMPING;
    const velY = (pos.y - prevPos.y) * DAMPING;

    pos.x += velX;
    pos.y += velY;

    prevPos.x = tempX;
    prevPos.y = tempY;
  }

  applyGravity(): void {
    const { pos, isPinned } = this;
    if (isPinned) return;
    pos.y -= GRAVITY;
  }

  pinTo(x: number, y: number): void {
    const { pos, prevPos } = this;
    pos.x = x;
    pos.y = y;
    prevPos.x = x;
    prevPos.y = y;
    this.isPinned = true;
  }
}

export class Tail {
  private nodes: TailNode[] = [];

  constructor(
    private anchorPoint: BlobPoint,
    numNodes: number,
    public segmentLength: number,
    public tailWidth: number,
  ) {
    const sx = anchorPoint.pos.x;
    const sy = anchorPoint.pos.y;
    for (let i = 0; i < numNodes; i++) {
      this.nodes.push(new TailNode(sx, sy - i * segmentLength, i === 0));
    }
  }

  tick(): void {
    const { nodes, segmentLength } = this;
    for (let i = 1; i < nodes.length; i++) {
      nodes[i].verletIntegrate();
      nodes[i].applyGravity();
    }

    for (let iteration = 0; iteration < 3; iteration++) {
      for (let i = 0; i < nodes.length - 1; i++) {
        const nodeA = nodes[i];
        const nodeB = nodes[i + 1];

        const dx = nodeB.pos.x - nodeA.pos.x;
        const dy = nodeB.pos.y - nodeA.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          const difference = segmentLength - distance;
          const percent = difference / distance / 2;
          const offsetX = dx * percent;
          const offsetY = dy * percent;

          if (!nodeA.isPinned) {
            nodeA.pos.x -= offsetX;
            nodeA.pos.y -= offsetY;
          }
          if (!nodeB.isPinned) {
            nodeB.pos.x += offsetX;
            nodeB.pos.y += offsetY;
          }
        }
      }
    }
  }

  setAnchor(point: BlobPoint): void {
    this.anchorPoint = point;
  }

  stickTo(softBody: SoftBlob): void {
    const { anchorPoint, nodes } = this;
    const [headNode] = nodes;
    if (!softBody.isPointInside(headNode.pos.x, headNode.pos.y)) {
      headNode.pinTo(anchorPoint.pos.x, anchorPoint.pos.y);
    }
  }

  render(context: CanvasRenderingContext2D): void {
    const { nodes, tailWidth } = this;
    context.strokeStyle = "#000000";
    context.lineCap = "round";
    context.lineWidth = tailWidth;

    context.beginPath();
    context.moveTo(nodes[0].pos.x, nodes[0].pos.y);
    for (let i = 1; i < nodes.length - 1; i++) {
      const current = nodes[i];
      const next = nodes[i + 1];
      context.quadraticCurveTo(
        current.pos.x,
        current.pos.y,
        (current.pos.x + next.pos.x) / 2,
        (current.pos.y + next.pos.y) / 2,
      );
    }
    const lastNode = nodes[nodes.length - 1];
    context.lineTo(lastNode.pos.x, lastNode.pos.y);
    context.stroke();

    // context.fillStyle = "#FF0000";
    // context.beginPath();
    // context.arc(this.nodes[0].pos.x, this.nodes[0].pos.y, this.tailWidth / 2, 0, 2 * Math.PI);
    // context.fill();
  }
}
