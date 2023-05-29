import { Schema, type, SetSchema } from '@colyseus/schema';

export class Orbital extends Schema {
    @type('string') name: string;
    @type('number') mass: number;
    @type('number') radius: number;
    @type('string') type: 'Player' | 'Bullet';

    @type('float32') x: number;
    @type('float32') y: number;

    vx: number = 0;
    vy: number = 0;
    ignore: number;
}

export class Player extends Orbital {
    static playerRadius = 10;
    static playerMass = 10;
    static cannonWidth = 8;
    static cannonHeight = 20;

    @type('number') cannonWidth: number = Player.cannonWidth;
    @type('number') cannonHeight: number = Player.cannonHeight;

    // Index to target
    @type('number') target: number = -1;
    @type('number') targetAngle: number;
    @type('number') cannonAngle: number;

    type = 'Player' as 'Player';

    cannonMovement: -1 | 0 | 1;

    fired: boolean = false;

    inputs: { w: boolean; a: boolean; s: boolean; d: boolean };
}

export class Bullet extends Orbital {
    static bulletRadius = 5;
    static bulletMass = 5;

    type = 'Bullet' as 'Bullet';
}

export class Body extends Schema {
    // Mutable data
    @type('string') name: string;
    @type('number') mass: number;
    @type('number') radius: number;
    @type('float32') x: number;
    @type('float32') y: number;
    @type('number') rotationAngle: number;
    @type({ set: Player }) players = new SetSchema<Player>();

    // Constant data
    centerX: number;
    centerY: number;

    orbitDistance: number;
    orbitPeriod: number;
    orbitClockwise: boolean;

    rotationPeriod: number;
    rotationClockwise: boolean;

    set orbitAngle(a: number) {
        this.x = this.centerX + Math.cos(a) * this.orbitDistance;
        this.y = this.centerY + Math.sin(a) * this.orbitDistance;
        this.#orbitAngle = a % (2 * Math.PI);
    }
    get orbitAngle() {
        return this.#orbitAngle;
    }

    #orbitAngle: number;

    constructor(data: {
        name: string;
        cx: number;
        cy: number;
        mass: number;
        radius: number;
        orbitAngle: number;
        orbitDistance: number;
        orbitPeriod: number;
        orbitClockwise: boolean;
        rotationPeriod: number;
        rotationClockwise: boolean;
    }) {
        super();
        this.name = data.name;

        this.centerX = data.cx;
        this.centerY = data.cy;

        this.radius = data.radius;
        this.mass = data.mass;

        this.orbitDistance = data.orbitDistance;
        this.orbitPeriod = data.orbitPeriod;
        this.orbitClockwise = data.orbitClockwise;

        this.rotationPeriod = data.rotationPeriod;
        this.rotationClockwise = data.rotationClockwise;

        this.orbitAngle = data.orbitAngle;
        this.rotationAngle = 0;
    }
}
