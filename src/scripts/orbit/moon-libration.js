import * as THREE from 'three';

// An illustrative, sped-up approximation of the Moon's apparent libration.
// https://science.nasa.gov/moon/moon-phases/
export class MoonLibration {
    constructor(moon) {
        this.moon = moon;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.longitudeAmplitude = THREE.MathUtils.degToRad(7.9);
        this.latitudeAmplitude = THREE.MathUtils.degToRad(6.7);
        this.longitudePeriod = 48;
        this.latitudePeriod = 40;
        this.baseRotation = moon.quaternion.clone();
        this.angles = new THREE.Euler(0, 0, 0, 'ZYX');
        this.offset = new THREE.Quaternion();
        this.elapsed = 0;
    }

    rebase() {
        this.baseRotation.copy(this.moon.quaternion);
        this.elapsed = 0;
    }

    update(delta, paused = false) {
        if (paused || this.reducedMotion.matches) return;
        this.elapsed += delta;
        const longitude = this.longitudeAmplitude * Math.sin(2 * Math.PI * this.elapsed / this.longitudePeriod);
        const latitude = this.latitudeAmplitude * Math.sin(2 * Math.PI * this.elapsed / this.latitudePeriod);
        // Local Y is the polar axis. At the initial near-side view, local -Z
        // points horizontally across the screen, giving a north/south nod.
        this.angles.set(0, longitude, -latitude, 'ZYX');
        this.offset.setFromEuler(this.angles);
        this.moon.quaternion.copy(this.baseRotation).multiply(this.offset);
    }
}
