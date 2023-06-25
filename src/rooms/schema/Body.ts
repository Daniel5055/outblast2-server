import { Schema, type, SetSchema } from '@colyseus/schema';

export class Body extends Schema {
    // Mutable data
    @type('string') name: string;
    @type('number') mass: number;
    @type('number') radius: number;
    @type('float32') x: number;
    @type('float32') y: number;
    @type('number') rotationAngle: number;
    @type({ set: 'string' }) players = new SetSchema<string>();
    @type('number') bulletCount: number;

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
        bulletCount: number;
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
        this.bulletCount = data.bulletCount;
    }
}
