import { type } from '@colyseus/schema';
import { Orbital } from './Orbital';

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
