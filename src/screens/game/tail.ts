import { Point2D } from "../../core/geom";
import { Color } from "../../registry";
import { hypot } from "../../system";
import { BlobPoint, SoftBlob } from "./soft-blob";

const DAMPING = 0.99;

type TailNode = {
  pos: Point2D;
  prevPos: Point2D;
  isPinned: boolean;
  integrate: () => void;
  pinTo: (x: number, y: number) => void;
};

const createTailNode = (
  x: number,
  y: number,
  isPinned: boolean = false,
  pos: Point2D = { x, y },
  prevPos: Point2D = { x, y },
): TailNode => ({
  pos,
  prevPos,
  isPinned,
  integrate() {
    if (isPinned) return;

    const tempX = pos.x;
    const tempY = pos.y;

    const velX = (pos.x - prevPos.x) * DAMPING;
    const velY = (pos.y - prevPos.y) * DAMPING;

    pos.x += velX;
    pos.y += velY;

    prevPos.x = tempX;
    prevPos.y = tempY;

    pos.y -= 0.3; // GRAVITY
  },
  pinTo(x: number, y: number) {
    pos.x = prevPos.x = x;
    pos.y = prevPos.y = y;
    isPinned = true;
  },
});

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
      this.nodes.push(createTailNode(sx, sy - i * segmentLength, i === 0));
    }
  }

  tick(): void {
    const { nodes, segmentLength } = this;
    for (let i = 1; i < nodes.length; i++) {
      nodes[i].integrate();
    }

    for (let iteration = 0; iteration < 3; iteration++) {
      for (let i = 0; i < nodes.length - 1; i++) {
        const nodeA = nodes[i];
        const nodeB = nodes[i + 1];

        const dx = nodeB.pos.x - nodeA.pos.x;
        const dy = nodeB.pos.y - nodeA.pos.y;
        const distance = hypot(dx, dy);

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

  stickTo(softBody: SoftBlob): void {
    const { anchorPoint, nodes } = this;
    const [headNode] = nodes;
    if (!softBody.isPointInside(headNode.pos.x, headNode.pos.y)) {
      headNode.pinTo(anchorPoint.pos.x, anchorPoint.pos.y);
    }
  }

  render(context: CanvasRenderingContext2D): void {
    const { nodes, tailWidth } = this;
    context.strokeStyle = Color.Black;
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

    // context.fillStyle = Colors.RedComment;
    // context.beginPath();
    // context.arc(this.nodes[0].pos.x, this.nodes[0].pos.y, this.tailWidth / 2, 0, 2 * PI);
    // context.fill();
  }
}
