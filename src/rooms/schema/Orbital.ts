import { Schema, type } from '@colyseus/schema';

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
