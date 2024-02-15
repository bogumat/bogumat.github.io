// moonlet.js is written by Matvey Boguslavskiy in 2023
// Use however you like there is no license
// :)
class SceneInitializer {
    constructor(canvasId) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById(canvasId).appendChild(this.renderer.domElement);
        this.camera.position.z = 10;
        this.camera.position.y = -2;

        //resize event
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}

class Sphere {
    constructor(scene, radius = 1, widthSegments = 32, heightSegments = 32, color = 0x000000, position = { x: 0, y: 0, z: 0 }, bumpiness = 0.1) {
        const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
        geometry.computeVertexNormals();
        const positionAttribute = geometry.attributes.position;
        const vertex = new THREE.Vector3();

        // Basic Perlin-like noise function
        function noise() {
            return Math.random();
        }

        // Apply noise to each vertex
        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);
            const noiseValue = noise() * bumpiness;
            vertex.multiplyScalar(1 + noiseValue);
            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

        geometry.computeVertexNormals(); // Recompute normals after altering geometry

        const material = new THREE.MeshStandardMaterial({ color });
        const textureLoader = new THREE.TextureLoader();
        const alphaTexture = textureLoader.load("images/texture-map.png");
        material.alphaMap = alphaTexture;
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position.x, position.y, position.z);
        scene.add(this.mesh);
    }
}

// Add orbiting planets
class Orbiter {
    constructor(object, {
        center = { x: 0, y: 0, z: 0 },
        semiMajorAxis = 1,
        eccentricity = 0,
        inclination = 0,
        longitudeAscendingNode = 0,
        argumentOfPeriapsis = 0,
        gFactor = 1
    } = {}) {
        this.object = object.mesh;
        this.center = new THREE.Vector3(center.x, center.y, center.z);
        this.semiMajorAxis = semiMajorAxis;
        this.eccentricity = eccentricity;
        this.inclination = THREE.MathUtils.degToRad(inclination);
        this.longitudeAscendingNode = THREE.MathUtils.degToRad(longitudeAscendingNode);
        this.argumentOfPeriapsis = THREE.MathUtils.degToRad(argumentOfPeriapsis);
        this.gFactor = gFactor;
        this.meanAnomaly = 0;
    }

    update() {
        // Calculate eccentric anomaly
        let eccentricAnomaly = this.meanAnomaly;
        for (let i = 0; i < 5; i++) {
            eccentricAnomaly = this.meanAnomaly + this.eccentricity * Math.sin(eccentricAnomaly);
        }

        // True anomaly
        const trueAnomaly = 2 * Math.atan2(
            Math.sqrt(1 + this.eccentricity) * Math.sin(eccentricAnomaly / 2),
            Math.sqrt(1 - this.eccentricity) * Math.cos(eccentricAnomaly / 2)
        );

        // Distance from the focal point
        const distance = this.semiMajorAxis * (1 - this.eccentricity * Math.cos(eccentricAnomaly));

        // Update mean anomaly based on distance and gravitational factor
        this.meanAnomaly += this.gFactor / Math.pow(distance, 1.5);

        // Position in the orbital plane
        const xOrbital = distance * Math.cos(trueAnomaly);
        const yOrbital = distance * Math.sin(trueAnomaly);

        // Transform to 3D coordinates
        const cosO = Math.cos(this.longitudeAscendingNode);
        const sinO = Math.sin(this.longitudeAscendingNode);
        const cosI = Math.cos(this.inclination);
        const sinI = Math.sin(this.inclination);
        const cosw = Math.cos(this.argumentOfPeriapsis);
        const sinw = Math.sin(this.argumentOfPeriapsis);

        const x = cosO * cosw * xOrbital - cosO * sinw * yOrbital - sinO * cosI * yOrbital;
        const y = sinO * cosw * xOrbital - sinO * sinw * yOrbital + cosO * cosI * yOrbital;
        const z = sinI * sinw * xOrbital + sinI * cosw * yOrbital;

        // Set final position relative to the center
        this.object.position.set(this.center.x + x, this.center.y + y, this.center.z + z);
    }
}

class MovableLight {
    constructor(scene, radius = 0.25, color = 0xffffff, intensity = 5, distance = 100) {
        this.light = new THREE.PointLight(color, intensity, distance);
        scene.add(this.light);

        // Sphere Material
        const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 1 });
        const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
        this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        scene.add(this.sphere);

        // Halo Material
        const haloGeometry = new THREE.SphereGeometry(radius * 10, 32, 32); // Slightly larger than the main sphere
        const haloMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            // alphaMap: "images/sun-texture.jpeg",
            opacity: 0.02,
            side: THREE.DoubleSide
        });
        this.halo = new THREE.Mesh(haloGeometry, haloMaterial);
        scene.add(this.halo);

        // Target position initialization
        this.targetPos = new THREE.Vector3();
        this.easingFactor = 0.1; // Adjust for smoother or quicker movement
    }

    updatePosition(x, y) {
        const xPos = (x / window.innerWidth) * 20 - 10;
        const yPos = -(y / window.innerHeight) * 20 + 10;
        const zPos = (x / window.innerWidth) ** 2;

        // Set target position
        this.targetPos.set(xPos, yPos, zPos);
    }

    update() {
        // Gradually move the light and sphere towards the target position
        this.light.position.lerp(this.targetPos, this.easingFactor);
        this.sphere.position.lerp(this.targetPos, this.easingFactor);
        this.halo.position.lerp(this.targetPos, this.easingFactor);
    }
}

// Initialize the scene
const initializer = new SceneInitializer('canvas');
initializer.animate();

// Add main moonlet to the scene
const centreMoonlet = new Sphere(initializer.scene, 3.5, 400, 400, 0x421dff, { x: 0, y: 0, z: 0 }, 0.004);
// Add orbiting Moonlet
const M1 = new Sphere(initializer.scene, 0.75, 128, 128, 0x5a5bfa, {x: 2, y: 4, z: 0}, 0.04)
const M2 = new Sphere(initializer.scene, 0.45, 128, 128, 0x2b05ff, {x: 2, y: 9, z: 0}, 0.03)
const M1_parameters = {
    center: { x: 0, y: 0, z: 0 }, // Center of the orbit
    semiMajorAxis: 8,
    eccentricity: 0.32,
    inclination: 14, // degrees
    longitudeAscendingNode: 23, // degrees
    argumentOfPeriapsis: 28, // degrees
    gFactor: 0.05 // Gravitational factor
};
const M2_parameters = {
    center: { x: 0, y: 0, z: 0 }, // Center of the orbit
    semiMajorAxis: 8,
    eccentricity: 0.1,
    inclination: 110, // degrees
    longitudeAscendingNode: 0, // degrees
    argumentOfPeriapsis: 90, // degrees
    gFactor: 0.05 // Gravitational factor
};
const oM1 = new Orbiter(M1, M1_parameters);
const oM2 = new Orbiter(M2, M2_parameters);
let updateObjects = [oM1, oM2];

// Add a movable light to the scene
const movableLight = new MovableLight(initializer.scene);

// Add event listener for mouse movement
document.addEventListener('mousemove', (event) => {
    movableLight.updatePosition(event.clientX, event.clientY);
}, false);

// Add event listener for touches
document.addEventListener('touchmove', (event) => {
    if (event.touches.length > 0) {
        const touch = event.touches[0];
        movableLight.updatePosition(touch.clientX, touch.clientY);
    }
}, false);

//Remove draggability
const canvasElement = document.getElementById('canvas');
canvasElement.addEventListener('touchmove', (event) => {
    event.preventDefault();
}, { passive: false });

function animate() {
    requestAnimationFrame(animate);

    // Update each animated object in the array
    updateObjects.forEach(object => object.update());

    // Update the movable light position smoothly
    movableLight.update();
}

animate();
