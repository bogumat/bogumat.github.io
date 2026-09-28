// IAU / USGS Gazetteer, LOLA 2011 coordinates (+east), checked 2026-09-28.
// Each id resolves at https://planetarynames.wr.usgs.gov/Feature/{id}.
const boguslawskyCraters = [
    { name: 'Boguslawsky', id: 796, latitude: -72.90, longitude: 43.26, diameterKm: 94.59 },
    { name: 'Boguslawsky A', id: 7791, latitude: -74.41, longitude: 43.57, diameterKm: 8.19 },
    { name: 'Boguslawsky B', id: 7792, latitude: -73.98, longitude: 61.12, diameterKm: 63.47 },
    { name: 'Boguslawsky C', id: 7793, latitude: -70.99, longitude: 27.70, diameterKm: 34.48 },
    { name: 'Boguslawsky D', id: 7794, latitude: -72.86, longitude: 47.41, diameterKm: 22.40 },
    { name: 'Boguslawsky E', id: 7795, latitude: -74.31, longitude: 54.33, diameterKm: 14.61 },
    { name: 'Boguslawsky F', id: 7796, latitude: -75.42, longitude: 52.97, diameterKm: 31.05 },
    { name: 'Boguslawsky G', id: 7797, latitude: -71.48, longitude: 34.35, diameterKm: 20.46 },
    { name: 'Boguslawsky H', id: 7798, latitude: -72.82, longitude: 29.06, diameterKm: 21.13 },
    { name: 'Boguslawsky J', id: 7799, latitude: -72.09, longitude: 28.40, diameterKm: 34.73 },
    { name: 'Boguslawsky K', id: 7800, latitude: -73.47, longitude: 50.35, diameterKm: 46.43 },
    { name: 'Boguslawsky L', id: 7801, latitude: -70.68, longitude: 36.47, diameterKm: 21.93 },
    { name: 'Boguslawsky M', id: 7802, latitude: -70.45, longitude: 34.84, diameterKm: 8.09 },
    { name: 'Boguslawsky N', id: 7803, latitude: -73.86, longitude: 32.88, diameterKm: 27.45 },
];

class MoonFeatures {
    // NASA's equirectangular map is centered on 0° longitude, north at the top.
    // SphereGeometry: u = (longitude + 180) / 360; v = (latitude + 90) / 180.
    static direction(latitude, longitude) {
        const lat = THREE.MathUtils.degToRad(latitude);
        const lon = THREE.MathUtils.degToRad(longitude);
        return new THREE.Vector3(
            Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)
        );
    }

    constructor(moon, relief) {
        this.moon = moon;
        const radius = moon.geometry.parameters.radius + relief / 2 + 0.006;
        this.group = new THREE.Group();
        this.group.name = 'Boguslawsky crater highlights';
        moon.add(this.group);
        const mainMaterial = new THREE.LineBasicMaterial({ color: 0xffdb91 });
        const satelliteMaterial = new THREE.LineBasicMaterial({
            color: 0xffdb91, transparent: true, opacity: 0.6, depthWrite: false,
        });
        boguslawskyCraters.forEach((crater, index) => {
            const normal = MoonFeatures.direction(crater.latitude, crater.longitude);
            const east = new THREE.Vector3().crossVectors(normal, new THREE.Vector3(0, 1, 0)).normalize();
            const north = new THREE.Vector3().crossVectors(east, normal).normalize();
            // Geodesic circles use catalogued diameters, not enlarged screen-space rings.
            const angle = crater.diameterKm / (2 * 1737.4);
            const points = Array.from({ length: 64 }, (_, step) => {
                const bearing = step / 64 * Math.PI * 2;
                return normal.clone().multiplyScalar(Math.cos(angle))
                    .addScaledVector(east, Math.sin(angle) * Math.cos(bearing))
                    .addScaledVector(north, Math.sin(angle) * Math.sin(bearing))
                    .multiplyScalar(radius);
            });
            const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),
                index === 0 ? mainMaterial : satelliteMaterial);
            ring.name = crater.name;
            this.group.add(ring);
        });
        const main = boguslawskyCraters[0];
        this.anchor = MoonFeatures.direction(main.latitude, main.longitude).multiplyScalar(radius);
        this.world = new THREE.Vector3();
        this.normal = new THREE.Vector3();
        this.view = new THREE.Vector3();
        this.screen = new THREE.Vector3();
        this.coordinates = document.getElementById('moon-coordinates');
        const latitude = `${Math.abs(main.latitude).toFixed(2)}°${main.latitude < 0 ? 'S' : 'N'}`;
        const longitude = `${Math.abs(main.longitude).toFixed(2)}°${main.longitude < 0 ? 'W' : 'E'}`;
        this.coordinates.textContent = `${latitude} / ${longitude}`;
    }

    update(camera) {
        this.moon.updateWorldMatrix(true, false);
        this.world.copy(this.anchor).applyMatrix4(this.moon.matrixWorld);
        this.normal.copy(this.anchor).normalize().transformDirection(this.moon.matrixWorld);
        this.view.copy(camera.position).sub(this.world).normalize();
        this.screen.copy(this.world).project(camera);
        const visible = this.normal.dot(this.view) > 0.08 &&
            Math.abs(this.screen.x) < 1 && Math.abs(this.screen.y) < 1 &&
            this.screen.z > -1 && this.screen.z < 1;
        this.coordinates.hidden = !visible;
        if (!visible) return;

        const x = (this.screen.x + 1) * window.innerWidth / 2;
        const y = (1 - this.screen.y) * window.innerHeight / 2;
        const width = this.coordinates.offsetWidth;
        const height = this.coordinates.offsetHeight;
        // Tuck the coordinates immediately to the left of the crater group.
        const left = Math.max(12, Math.min(x - width - 14, window.innerWidth - width - 12));
        const top = Math.max(12, Math.min(y - height / 2, window.innerHeight - height - 12));
        this.coordinates.style.transform = `translate(${left}px, ${top}px)`;
    }
}
