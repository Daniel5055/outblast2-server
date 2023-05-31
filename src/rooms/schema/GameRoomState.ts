import { Schema, ArraySchema, MapSchema, type } from '@colyseus/schema';
import { Body } from './Body';
import { Bullet } from './Bullet';
import { Player } from './Player';
import { Orbital } from './Orbital';

export class GameRoomState extends Schema {
    @type([Body]) bodies = new ArraySchema<Body>();
    @type({ map: Bullet }) bullets = new MapSchema<Bullet>();
    @type({ map: Player }) players = new MapSchema<Player>();

    orbitals = new Map<string, Orbital>();
}
