import * as dat from "dat.gui";
import { playSound, Sound } from "../../core/audio/sound";
import { DisplayObject, IRenderable, ITickable } from "../../core/display";
import { Event, MouseEvent, MouseEventType } from "../../core/event";
import { signal } from "../../core/signal";
import { Vehicle } from "../../core/vehicle";
import { random } from "../../system";
import { Camera } from "./camera";
import { Cat } from "./cat";
import { Clover } from "./clover";
import { GameField } from "./game-field";
import { HUD } from "./hud";
import { Poop } from "./poop";

export interface IGameController {
  currentWave: number;
}

export interface VehicleOptions {
  enemyCount: number;
  maxSpeed: number;
  maxForce: number;
  wanderRadius: number;
  wanderDistance: number;
  wanderChange: number;
  separationRadius: number;
  separationWeight: number;
  fleeRadius: number;
  fleeWeight: number;
  boundaryAvoidance: number;
  showDebug: boolean;
}
export class GameScene extends DisplayObject implements IGameController {
  readonly gameOverSignal = signal<number>(0);
  readonly nextWaveSignal = signal<number>(0);

  // Wave system
  currentWave = 1;
  // Game state
  private miceEaten = 0;
  private isGameOver = false; // TODO: remove if not needed

  enemyOptions: VehicleOptions = {
    enemyCount: 1,
    maxSpeed: 2,
    maxForce: 0.05,
    wanderRadius: 25,
    wanderDistance: 80,
    wanderChange: 0.3,
    separationRadius: 25,
    separationWeight: 1.5,
    fleeRadius: 150,
    fleeWeight: 4.0,
    boundaryAvoidance: 50,
    showDebug: false,
  };

  private gameField: GameField;
  cat: Cat;
  private clover: Clover | null = null;
  private poops: Poop[] = [];
  enemies: Vehicle[] = [];
  private hud: HUD;

  private camera: Camera;
  private isMouseDown = false;

  constructor(width: number, height: number) {
    super(width, height);

    this.gameField = new GameField(1600, 1200, 160);
    this.cat = new Cat(30, this.gameField.width, this.gameField.height);
    this.cat.staminaEmptySignal.subscribeOnce(() => {
      this.isGameOver = true;
      this.gameOverSignal.set(this.miceEaten);
    });
    this.camera = new Camera(this.cat.position, this.gameField);

    this.spawnNewWaveMice();

    this.hud = new HUD(this.cat, this.enemies, this, this.camera.position);
  }

  *allTickables(): IterableIterator<ITickable> {
    yield this.cat;
    yield this.camera;
    if (this.clover) yield this.clover;
    yield* this.poops;
    yield* this.enemies;
    yield this.hud;
  }

  tick(dt: number): void {
    if (this.isGameOver) return;

    for (const tickable of this.allTickables()) {
      tickable.tick(dt);
    }

    if (this.cat.z > 5) return;

    if (this.clover) {
      if (this.clover.isActive && !this.clover.collectedThisWave && this.cat.collidesWith(this.clover)) {
        this.clover.collect();
        this.cat.restoreFullStamina();
        playSound(Sound.ReleaseWobble);
      }
    }

    for (let i = this.poops.length - 1; i >= 0; i--) {
      const poop = this.poops[i];
      if (!this.cat.isProtectedFromPoop && this.cat.collidesWith(poop)) {
        this.poops.splice(i, 1);
        this.cat.reduceStamina();
        playSound(Sound.Poop);
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!this.cat.isFullyInflated && this.cat.collidesWith(enemy)) {
        this.enemies.splice(i, 1);
        this.cat.restoreStaminaAndInflateFromEatingMouse();
        playSound(Sound.Smacking);

        this.miceEaten++;
        if (this.enemies.length === 0) {
          // TODO: get rid of hack
          setTimeout(() => {
            this.currentWave++;

            // Increase mice strength
            this.enemyOptions.fleeRadius += 50;
            this.enemyOptions.fleeWeight += 1;

            // Restore all stamina for the new wave
            this.cat.restoreFullStamina();

            this.nextWaveSignal.set(this.currentWave);
          }, 100);
        }
      }
    }
  }

  *allRenderables(): IterableIterator<IRenderable> {
    yield this.gameField;
    if (this.clover) yield this.clover;
    yield* this.poops;
    yield* this.enemies;
    yield this.cat;
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    context.translate(-this.camera.position.x, -this.camera.position.y);
    for (const renderable of this.allRenderables()) {
      renderable.render(context);
    }
    context.restore();
    this.hud.render(context);
  }

  spawnNewWaveMice(): void {
    // Clear existing vehicles
    this.enemies.length = 0;

    // Spawn new mice with updated strength
    for (let i = 0; i < this.enemyOptions.enemyCount; i++) {
      this.enemies.push(
        new Vehicle(
          random() * this.gameField.width,
          random() * this.gameField.height,
          { ...this.enemyOptions },
          this.enemies,
          this.cat.position,
          this.gameField,
          this.enemyOptions,
          this.camera.position,
        ),
      );
    }

    this.clover = new Clover(this.gameField, this.camera.position);
  }

  protected handleEvent(event: Event): void {
    if (this.isGameOver) return;

    if (event instanceof MouseEvent) {
      switch (event.type) {
        case MouseEventType.MouseMove:
          this.onMouseMove(event.mouseX, event.mouseY);
          break;

        case MouseEventType.MouseDown:
          this.onMouseDown(event.mouseX, event.mouseY);
          break;

        case MouseEventType.MouseUp:
        case MouseEventType.MouseLeave:
          this.onMouseUp(event.mouseX, event.mouseY);
          break;
      }
    }
  }

  private onMouseDown(x: number, y: number): void {
    const worldPos = this.camera.screenToWorld(x, y);
    const { cat } = this;
    if (cat.isPressed(worldPos)) {
      if (cat.isFullyInflated && cat.captureDoubleClick()) {
        cat.startDeflation();
        this.poops.push(new Poop(cat.position.x, cat.getFloorLevel(), 15 + random() * 10, this.camera.position));
      }
      if (!cat.isDeflating) {
        this.isMouseDown = true;
        cat.startDrag(worldPos.x, worldPos.y);
      }
    }
  }

  private onMouseUp(x: number, y: number): void {
    if (this.isMouseDown) {
      this.isMouseDown = false;
      if (this.cat.isDragging) {
        const worldPos = this.camera.screenToWorld(x, y);
        this.cat.launch(worldPos.x, worldPos.y);
        playSound(Sound.ReleaseWobble);
      }
    }
  }

  private onMouseMove(x: number, y: number): void {
    const worldPos = this.camera.screenToWorld(x, y);

    this.cat.curMousePos = worldPos;

    // Update drag if dragging
    if (this.isMouseDown && this.cat.isDragging) {
      this.cat.updateDrag(worldPos.x, worldPos.y);
    }
  }
}

export function setupGUI(folder: dat.GUI, scene: GameScene): void {
  const miceFolder = folder.addFolder("Enemies");

  const vehicleFolder = miceFolder.addFolder("Vehicles");
  vehicleFolder.add(scene.enemyOptions, "enemyCount", 1, 100, 1).onChange(() => scene.spawnNewWaveMice());
  vehicleFolder
    .add(scene.enemyOptions, "maxSpeed", 0.1, 10, 0.1)
    .onChange(() => updateVehicleProperties(scene.enemies, scene.enemyOptions));
  vehicleFolder
    .add(scene.enemyOptions, "maxForce", 0.01, 1, 0.01)
    .onChange(() => updateVehicleProperties(scene.enemies, scene.enemyOptions));

  const wanderFolder = miceFolder.addFolder("Wandering");
  wanderFolder
    .add(scene.enemyOptions, "wanderRadius", 5, 100, 1)
    .onChange(() => updateVehicleProperties(scene.enemies, scene.enemyOptions));
  wanderFolder
    .add(scene.enemyOptions, "wanderDistance", 10, 200, 1)
    .onChange(() => updateVehicleProperties(scene.enemies, scene.enemyOptions));
  wanderFolder
    .add(scene.enemyOptions, "wanderChange", 0.01, 1, 0.01)
    .onChange(() => updateVehicleProperties(scene.enemies, scene.enemyOptions));

  const separationFolder = miceFolder.addFolder("Separation");
  separationFolder
    .add(scene.enemyOptions, "separationRadius", 10, 100, 1)
    .onChange(() => updateVehicleProperties(scene.enemies, scene.enemyOptions));
  separationFolder
    .add(scene.enemyOptions, "separationWeight", 0, 5, 0.1)
    .onChange(() => updateVehicleProperties(scene.enemies, scene.enemyOptions));

  const fleeFolder = miceFolder.addFolder("Flee from Cat");
  fleeFolder
    .add(scene.enemyOptions, "fleeRadius", 50, 300, 10)
    .onChange(() => updateVehicleProperties(scene.enemies, scene.enemyOptions));
  fleeFolder
    .add(scene.enemyOptions, "fleeWeight", 0, 10, 0.1)
    .onChange(() => updateVehicleProperties(scene.enemies, scene.enemyOptions));

  const boundaryFolder = miceFolder.addFolder("Boundary Avoidance");
  boundaryFolder.add(scene.enemyOptions, "boundaryAvoidance", 0, 150, 5);

  const catFolder = folder.addFolder("Cat");
  catFolder.add(scene.cat, "radius", 10, 100, 1);
  catFolder.add(scene.cat, "catHeight", 10, 200, 1);
  catFolder.add(scene.cat, "debugDraw");

  const physicsFolder = catFolder.addFolder("Physics");
  physicsFolder.add(scene.cat, "mass", 0.1, 5.0, 0.1);
  physicsFolder.add(scene.cat, "gravity", 0.1, 2.0, 0.1);
  physicsFolder.add(scene.cat, "launchPower", 0.01, 0.2, 0.005);
  physicsFolder.add(scene.cat, "maxLaunchPower", 0.05, 0.5, 0.005);
  physicsFolder.add(scene.cat, "maxDragDistance", 50, 400, 10);
  physicsFolder.add(scene.cat, "jumpHeightMultiplier", 0.1, 3.0, 0.1).name("Jump Height");
  physicsFolder.add(scene.cat, "bounceDamping", 0.1, 1.0, 0.1);
  physicsFolder.add(scene.cat, "maxBounces", 0, 10, 1);

  const staminaFolder = catFolder.addFolder("Stamina");
  staminaFolder.add(scene.cat, "maxStamina", 50, 200, 10);
  staminaFolder.add(scene.cat, "currentStamina", 0, 200, 1);
  staminaFolder.add(scene.cat, "staminaCostMultiplier", 0.1, 1.0, 0.05).name("Cost Multiplier");
  staminaFolder.add(scene.cat, "staminaRestoreAmount", 5, 50, 5).name("Restore Amount");

  const inflationFolder = catFolder.addFolder("Inflation");
  inflationFolder.add(scene.cat, "inflationLevel", 0, 20, 0.1).name("Inflation Level").listen();
  inflationFolder.add(scene.cat, "maxInflationLevel", 5, 20, 1).name("Max Inflation");
  inflationFolder.add(scene.cat, "inflationPerMouse", 0.5, 3, 0.1).name("Inflation Per Mouse");
  inflationFolder.add(scene.cat, "inflationMultiplier", 1.1, 3.0, 0.1).name("Size Multiplier");
  inflationFolder.add(scene.cat, "inflationStaminaPenalty", 0.0, 0.5, 0.01).name("Stamina Penalty");
  inflationFolder.add(scene.cat, "inflationJumpPenalty", 0.0, 0.2, 0.01).name("Jump Penalty");

  // Test buttons for inflation
  const inflationTestControls = {
    resetInflation: () => {
      scene.cat.setInflationLevel(0);
    },
    maxInflation: () => {
      scene.cat.setInflationLevel(scene.cat.maxInflationLevel);
    },
  };
  inflationFolder.add(inflationTestControls, "resetInflation").name("🔄 Reset Inflation");
  inflationFolder.add(inflationTestControls, "maxInflation").name("🎈 Max Inflation");
  inflationFolder.open();

  const debugFolder = folder.addFolder("Debug");
  debugFolder.add(scene.enemyOptions, "showDebug");
  // debugFolder.add(scene.cat, "predictiveSteps", 50, 300, 10).name("Prediction Steps");
  // debugFolder.add(scene.cat, "predictiveStepSize", 0.1, 2.0, 0.1).name("Prediction Accuracy");
  debugFolder.add(scene, "spawnNewWaveMice").name("Reset");

  // vehicleFolder.open();
  // wanderFolder.open();
  // separationFolder.open();
  // fleeFolder.open();
  // boundaryFolder.open();
  // catFolder.open();
  // physicsFolder.open();
  // gameFieldFolder.open();
  debugFolder.open();
}

function updateVehicleProperties(enemies: Vehicle[], enemyOptions: VehicleOptions): void {
  for (const enemy of enemies) {
    enemy.maxSpeed = enemyOptions.maxSpeed;
    enemy.maxForce = enemyOptions.maxForce;
    enemy.wanderRadius = enemyOptions.wanderRadius;
    enemy.wanderDistance = enemyOptions.wanderDistance;
    enemy.wanderChange = enemyOptions.wanderChange;
    enemy.separationRadius = enemyOptions.separationRadius;
    enemy.separationWeight = enemyOptions.separationWeight;
    enemy.fleeRadius = enemyOptions.fleeRadius;
    enemy.fleeWeight = enemyOptions.fleeWeight;
  }
}
