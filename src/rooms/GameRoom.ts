import { Room, Client } from '@colyseus/core';
import { GameRoomState } from './schema/GameRoomState';
import { readFile } from 'fs/promises';
import { Body, Player } from './schema/Body';

export class MyRoom extends Room<GameRoomState> {
    onCreate(options: any) {
        this.setState(new GameRoomState());

        // Creating bodies from file
        readFile('boards/classic.json')
            .then((data) => data.toString())
            .then((data) => JSON.parse(data))
            .then((data) => (this.state.bodies = data.map((b: any) => new Body(b))));

        this.setSimulationInterval((delta) => this.update(delta));

        this.onMessage(0, (client, msg: { w: boolean; s: boolean; a: boolean; d: boolean }) => {
            this.state.players.get(client.id).inputs = msg;
        });
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, 'joined!');

        const player = new Player();
        player.name = 'Player';
        player.radius = Player.playerRadius;
        player.mass = Player.playerMass;
        player.x = 100;
        player.y = 100;
        player.target = null;
        player.targetAngle = 0;
        player.cannonAngle = Math.PI / 2;
        player.cannonMovement = 0;
        player.inputs = { w: false, a: false, s: false, d: false };

        this.state.orbitals.push(player);
        this.state.players.set(client.id, player);

        client.send('self', { id: this.state.players.size });
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, 'left!');
    }

    onDispose() {
        console.log('room', this.roomId, 'disposing...');
    }

    update(delta: number) {
        // Updating movement of bodies
        for (const body of this.state.bodies) {
            body.orbitAngle =
                body.orbitDistance === 0
                    ? 0
                    : ((delta % body.orbitPeriod) / body.orbitPeriod) *
                          (body.orbitClockwise ? 2 : -2) *
                          Math.PI +
                      body.orbitAngle;

            body.rotationAngle =
                ((delta % body.rotationPeriod) / body.rotationPeriod) *
                    (body.rotationClockwise ? -2 : 2) *
                    Math.PI +
                body.rotationAngle;
        }

        // Moving players
        for (const player of this.state.players.values()) {
            if (player.inputs.w) {
                player.y -= 1;
            }
            if (player.inputs.s) {
                player.y += 1;
            }
            if (player.inputs.a) {
                player.x -= 1;
            }
            if (player.inputs.d) {
                player.x += 1;
            }
        }
    }
}
