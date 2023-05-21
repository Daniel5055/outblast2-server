import { Schema, ArraySchema, MapSchema, type } from '@colyseus/schema';
import { Body, Orbital, Player } from './Body';

export class GameRoomState extends Schema {
    @type([Orbital]) orbitals = new ArraySchema<Orbital>();
    @type([Body]) bodies = new ArraySchema<Body>();

    @type({ map: Player }) players = new MapSchema<Player>();
}
