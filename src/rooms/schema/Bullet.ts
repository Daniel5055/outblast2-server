import { Orbital } from './Orbital';

export class Bullet extends Orbital {
    static bulletRadius = 5;
    static bulletMass = 5;

    type = 'Bullet' as 'Bullet';
}
