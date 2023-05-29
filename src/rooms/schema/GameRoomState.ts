import { Schema, ArraySchema, MapSchema, type } from '@colyseus/schema';
import { Body, Bullet, Orbital, Player } from './Body';

export class GameRoomState extends Schema {
    @type([Body]) bodies = new ArraySchema<Body>();
    @type({ map: Bullet }) bullets = new MapSchema<Bullet>();
    @type({ map: Player }) players = new MapSchema<Player>();

    // Used for general movement stuff
    @type({ map: Orbital }) orbitals = new MapSchema<Orbital>();
}
