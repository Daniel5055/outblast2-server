import { Room, Client } from '@colyseus/core';
import { GameRoomState } from './schema/GameRoomState';
import { readFile } from 'fs/promises';
import { Body, Bullet, Orbital, Player } from './schema/Body';

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
        player.name = client.id;
        player.radius = Player.playerRadius;
        player.mass = Player.playerMass;
        player.x = 100;
        player.y = 100;
        player.target = -1;
        player.targetAngle = 0;
        player.cannonAngle = Math.PI / 2;
        player.cannonMovement = 0;
        player.inputs = { w: false, a: false, s: false, d: false };
        this.state.players.set(player.name, player);
        this.state.orbitals.set(player.name, player);

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

        // Updating movement of orbitals
        for (const orbital of this.state.orbitals.values()) {
            for (const body of this.state.bodies) {
                // The angle at which the body is from the orbital
                const angle =
                    Math.atan((body.y - orbital.y) / -(body.x - orbital.x)) +
                    (body.x > orbital.x ? Math.PI : 0);

                // Distance between them squared
                const rSq = Math.pow(body.x - orbital.x, 2) + Math.pow(body.y - orbital.y, 2);

                // Acceleration due to gravity
                //const g = 0.01 * body.mass * orbital.mass / rSq
                const g = ((40 / 100000) * body.mass) / Math.sqrt(rSq);

                orbital.vx += Math.cos(angle + Math.PI) * g * delta;
                orbital.vy += -Math.sin(angle + Math.PI) * g * delta;
            }

            orbital.x += orbital.vx * delta;
            orbital.y += orbital.vy * delta;
            console.log(orbital.x, orbital.y);
        }

        for (const orbital of this.state.orbitals.values()) {
            // Colliding with orbitals
            for (const o of this.state.orbitals.values()) {
                if (o === orbital) continue;

                if (this.doesCollide(orbital, o)) {
                    this.state.orbitals.delete(o.name);
                    this.state.orbitals.delete(orbital.name);

                    if (o.type === 'Bullet') {
                        this.state.bullets.delete(o.name);
                    } else if (o.type === 'Player') {
                        this.state.players.delete(o.name);
                    }
                    if (orbital.type === 'Bullet') {
                        this.state.bullets.delete(orbital.name);
                    } else if (orbital.type === 'Player') {
                        this.state.players.delete(orbital.name);
                    }
                }
            }

            // Colliding with bodies
            for (const [i, body] of this.state.bodies.entries()) {
                // The angle at which the body is from the orbital
                if (orbital.ignore !== i && this.doesCollide(orbital, body)) {
                    // If any players on planet in range
                    let deletePlayers = [];
                    for (const player of body.players.values()) {
                        const rotAngle = player.targetAngle + body.rotationAngle;
                        const px = body.x + Math.cos(rotAngle) * body.radius;
                        const py = body.y - Math.sin(rotAngle) * body.radius;
                        if (
                            this.doesCollideCoords(
                                orbital.x,
                                orbital.y,
                                orbital.radius,
                                px,
                                py,
                                player.radius
                            )
                        ) {
                            player.target = -1;
                            deletePlayers.push(player);
                        }
                    }
                    deletePlayers.forEach((p) => body.players.delete(p));

                    if (orbital.type === 'Bullet') {
                        this.state.orbitals.delete(orbital.name);
                        this.state.bullets.delete(orbital.name);
                    } else {
                        const angle =
                            Math.atan((body.y - orbital.y) / -(body.x - orbital.x)) +
                            (body.x > orbital.x ? Math.PI : 0);

                        this.state.orbitals.delete(orbital.name);
                        const player = orbital as Player;
                        player.targetAngle = (angle - body.rotationAngle) % (2 * Math.PI);
                        player.vx = 0;
                        player.vy = 0;
                        player.x = Math.cos(player.targetAngle) * body.radius;
                        player.y = -1 * Math.sin(player.targetAngle) * body.radius;
                        player.cannonAngle = Math.PI / 2;
                        body.players.add(player);
                        (orbital as Player).target = i;
                    }
                }
            }
        }

        // Moving players
        for (const player of this.state.players.values()) {
            if (player.inputs.w) {
                if (player.target !== -1) {
                    const b = this.state.bodies[player.target];
                    const bId = player.target;

                    b.players.delete(player);
                    this.state.orbitals.set(player.name, player);

                    const rotAngle = player.targetAngle + b.rotationAngle;
                    // Calculated new player position
                    player.x = b.x + Math.cos(rotAngle) * b.radius;
                    player.y = b.y - Math.sin(rotAngle) * b.radius;

                    // Calculate new speed
                    player.vx = Math.cos(rotAngle + player.cannonAngle - Math.PI / 2) * 0.06 * 17;
                    player.vy = -Math.sin(rotAngle + player.cannonAngle - Math.PI / 2) * 0.06 * 17;

                    player.ignore = player.target;
                    player.target = -1;

                    setTimeout(() => {
                        if (player.target === -1 && player.ignore === bId) {
                            player.ignore = -1;
                        }
                    }, 100);
                }
            }

            const cannonMovementTick = 0.05 / 17;
            const cannonEdge = 0.5;

            if (!player.inputs.s) {
                player.fired = false;
            }

            if (!player.fired && player.inputs.s) {
                const bId = player.target;
                if (bId !== -1) {
                    player.fired = true;
                    const b = this.state.bodies[bId];
                    const rotAngle = player.targetAngle + b.rotationAngle;
                    const bullet = new Bullet();
                    bullet.x = b.x + Math.cos(rotAngle) * b.radius;
                    bullet.y = b.y - Math.sin(rotAngle) * b.radius;
                    bullet.vx = Math.cos(rotAngle + player.cannonAngle - Math.PI / 2) * 0.08 * 17;
                    bullet.vy = -Math.sin(rotAngle + player.cannonAngle - Math.PI / 2) * 0.08 * 17;
                    bullet.name = 'Bullet';
                    bullet.mass = 5;
                    bullet.radius = 5;
                    bullet.ignore = player.target;

                    this.state.orbitals.set(bullet.name, bullet);
                    this.state.bullets.set(bullet.name, bullet);

                    setTimeout(() => {
                        if (bullet.ignore === bId) {
                            bullet.ignore = undefined;
                        }
                    }, 100);
                }
            }
            if (player.inputs.a) {
                if (player.cannonAngle < Math.PI - cannonEdge) {
                    player.cannonAngle += cannonMovementTick * delta;
                }
            }
            if (player.inputs.d) {
                if (player.cannonAngle > cannonEdge) {
                    player.cannonAngle -= cannonMovementTick * delta;
                }
            }
        }
    }
    doesCollide(a: Orbital, b: Orbital | Body) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)) < a.radius + b.radius;
    }
    doesCollideCoords(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) < r1 + r2;
    }
}
