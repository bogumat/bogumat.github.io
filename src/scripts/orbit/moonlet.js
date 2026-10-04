import * as THREE from 'three';
import { MoonDrag } from './moon-drag.js';
import { MoonFeatures } from './moon-features.js';
import { MoonLibration } from './moon-libration.js';
import { OrbitInspection } from './orbit-inspection.js';
import { configureShadowLight, createOrbitingBody } from './orbit-models.js';
import { OrbitScroll } from './orbit-scroll.js';
import { PreviewDrag } from './preview-drag.js';

// moonlet.js is written by Matvey Boguslavskiy in 2023
// Use however you like there is no license
// :)
class SceneInitializer {
    constructor(canvasId) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById(canvasId).appendChild(this.renderer.domElement);
        this.framingRadius = 9.2;
        this.onWindowResize();

        //resize event
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        // Fit every orbit on narrow screens as well as desktop displays.
        const halfFov = THREE.MathUtils.degToRad(this.camera.fov / 2);
        const limitingAngle = Math.atan(Math.tan(halfFov) * Math.min(1, this.camera.aspect));
        this.camera.position.z = this.framingRadius / Math.sin(limitingAngle);
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

}

function createMoon(scene, relief) {
    const geometry = new THREE.SphereGeometry(3.5, 400, 400);
    geometry.computeVertexNormals();
    // NASA's Scientific Visualization Studio, CGI Moon Kit.
    // Source and credits: https://svs.gsfc.nasa.gov/4720/
    const loader = new THREE.TextureLoader();
    const colorMap = loader.load('/images/textures/moon-color-2k.jpg');
    colorMap.encoding = THREE.sRGBEncoding;
    // Height data stays linear; only the color map uses sRGB encoding.
    const heightMap = loader.load('/images/textures/moon-height-1k.png');
    heightMap.encoding = THREE.LinearEncoding;
    const material = new THREE.MeshStandardMaterial({
        color: 0xc4b0ff,
        roughness: 1,
        map: colorMap,
        displacementMap: heightMap,
        displacementScale: relief,
        displacementBias: -relief / 2,
        bumpMap: heightMap,
        bumpScale: relief,
    });
    const moon = new THREE.Mesh(geometry, material);
    moon.castShadow = true;
    moon.receiveShadow = true;
    // Face the near side and tip the southern highlands into view.
    moon.rotation.set(THREE.MathUtils.degToRad(-35), -Math.PI / 2, 0);
    scene.add(moon);
    return moon;
}

// One shared phase keeps all n objects exactly 360/n degrees apart.
class SharedOrbit {
    constructor(items, radius = 6.5, angularSpeed = 0.085) {
        this.items = items;
        this.radius = radius;
        this.angularSpeed = angularSpeed;
        this.phase = 0;
        const bodyRadius = Math.max(...items.map(item => item.definition.radius));
        if (radius - bodyRadius <= 3.5 + moonRelief / 2 + 0.5) {
            throw new Error('Shared orbit needs more clearance from the Moon');
        }
        if (items.length > 1 && 2 * radius * Math.sin(Math.PI / items.length) <= 2 * bodyRadius + 0.25) {
            throw new Error('Shared orbit needs more spacing between objects');
        }
        this.update(0);
    }

    update(deltaSeconds) {
        this.phase = (this.phase + this.angularSpeed * deltaSeconds) % (2 * Math.PI);
        this.items.forEach((item, index) => {
            const angle = this.phase + index * 2 * Math.PI / this.items.length;
            // Face-on vertical circle: north -> right -> south -> left.
            // Constant depth keeps the Moon from passing in front of an object.
            item.mesh.position.set(this.radius * Math.sin(angle), this.radius * Math.cos(angle), 0);
        });
    }
}

class MovableLight {
    constructor(scene, radius = 0.25, color = 0xffffff, intensity = 5, distance = 100) {
        this.light = new THREE.PointLight(color, intensity, distance);
        configureShadowLight(this.light, 1024);
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

initializer.renderer.outputEncoding = THREE.sRGBEncoding;
const moonRelief = 0.08; // Slightly exaggerated relief for the 3.5-unit radius.
const moon = createMoon(initializer.scene, moonRelief);
const moonFeatures = new MoonFeatures(moon, moonRelief);
const moonLibration = new MoonLibration(moon);
// Model-specific appearance; orbit and display size are shared below.
const planetoidDefinitions = [
    {
        label: 'Projects', href: '#projects', scrollLabel: 'The projects below',
        caption: {
            title: 'Projects', eyebrow: '01 / Engineering & exploration', accent: '#6bcfff',
            description: 'I like to tinker. I have worked on a range of projects, from rovers, solar sails, prosthetics, 3D printers, and more.',
        },
        model: '/assets/models/svarog-cubesat.glb', rotation: [0.55, -0.5, -0.65],
        inspectionRotation: [1.05, -0.35, -0.5],
        beaconLight: { color: 0x238cff, intensity: 0.35, distance: 16 },
    },
    {
        label: 'Blog', href: '#blog', scrollLabel: 'The articles below',
        caption: {
            title: 'Blog', eyebrow: '02 / Notes & ideas', accent: '#ff9a60',
            description: 'I sometimes write about science fiction, engineering, and why I do what I do.',
        },
        model: '/assets/models/substack-book.glb',
        light: { color: 0xff6719, intensity: 0.65, distance: 22 },
    },
    {
        label: 'SoTA', href: 'https://ilikethefuture.com',
        caption: {
            title: 'The Society for Technological Advancement',
            eyebrow: '03 / People & progress', accent: '#ff8dce', longTitle: true,
            description: 'I started SoTA with friends to help promising scientists and engineers work on problems they believe matter.',
        },
        model: '/assets/models/sota-bust.glb', rotation: [0.03, 0.15, 0.05],
        eyeLight: { color: 0xff159c, intensity: 0.55, distance: 26 },
    }
].map(definition => ({ ...definition, radius: 1.3, displaySize: 1.8 }));
const sharedOrbitRadius = 6.5;
const linkLayer = document.getElementById('orbit-links');
initializer.framingRadius = sharedOrbitRadius + planetoidDefinitions[0].radius + 0.3;
initializer.onWindowResize();
const planetoids = planetoidDefinitions.map(definition => {
    const mesh = createOrbitingBody(initializer.scene, definition);
    const button = document.createElement('button');
    button.className = 'orbit-target';
    button.type = 'button';
    button.setAttribute('aria-label', `Inspect ${definition.label}`);
    button.setAttribute('aria-pressed', 'false');
    linkLayer.appendChild(button);
    return { mesh, button, definition };
});
const sharedOrbit = new SharedOrbit(planetoids, sharedOrbitRadius);
const inspection = new OrbitInspection(initializer);
const orbitScroll = new OrbitScroll(inspection);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerInside = false;
let hoverArmed = true;
const navigationCanvas = initializer.renderer.domElement;
const moonOccluder = new THREE.Sphere(moon.position, 3.5 + moonRelief / 2);
const occlusionPoint = new THREE.Vector3();
const pickPlanetoid = position => {
    raycaster.setFromCamera(position, initializer.camera);
    const hit = raycaster.intersectObjects(planetoids.filter(p => p !== inspection.active).map(p => p.mesh), true)[0];
    if (!hit) return null;
    // Test a conservative sphere instead of the Moon's 320,000 triangles.
    // This also accounts for its GPU-displaced surface when blocking links.
    if (raycaster.ray.intersectSphere(moonOccluder, occlusionPoint) &&
        raycaster.ray.origin.distanceTo(occlusionPoint) < hit.distance) return null;
    let object = hit.object;
    while (object) {
        const planetoid = planetoids.find(p => p.mesh === object);
        if (planetoid) return planetoid;
        object = object.parent;
    }
    return null;
};
function setPointer(event) {
    const bounds = navigationCanvas.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1,
        -(event.clientY - bounds.top) / bounds.height * 2 + 1);
}
const navigationRegion = document.getElementById('landing');
const moonDrag = new MoonDrag(moon, initializer.camera, navigationCanvas,
    document.getElementById('moon-drag-target'), moonOccluder.radius, () => moonLibration.rebase());
function dismissInspection() {
    hoverArmed = false;
    inspection.close();
}
const previewDrag = new PreviewDrag(inspection, initializer.camera, navigationCanvas,
    document.getElementById('preview-drag-target'), dismissInspection);
navigationRegion.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    if (orbitScroll.isPulling || moonDrag.active) return;
    setPointer(event);
    pointerInside = true;
    hoverArmed = true;
    if (inspection.active && inspection.mode === 'mouse' && !inspection.keepHover(pointer)) {
        dismissInspection();
    }
    updateNavigation();
});
navigationRegion.addEventListener('pointerleave', () => {
    pointerInside = false;
    if (inspection.mode === 'mouse' && !orbitScroll.isPulling) dismissInspection();
});
let pointerDown = null;
navigationCanvas.addEventListener('pointerdown', event => {
    pointerDown = { x: event.clientX, y: event.clientY };
});
navigationCanvas.addEventListener('pointerup', event => {
    if (!pointerDown || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 12) return;
    pointerDown = null;
    if (inspection.active) {
        dismissInspection();
        return;
    }
    if (event.pointerType !== 'mouse') {
        setPointer(event);
        const item = pickPlanetoid(pointer);
        if (item) inspection.begin(item, 'touch', pointer);
    }
});
navigationCanvas.addEventListener('pointercancel', () => { pointerDown = null; });
window.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        dismissInspection();
        if (linkLayer.contains(document.activeElement) || inspection.caption.contains(document.activeElement) ||
            previewDrag.contains(document.activeElement)) {
            document.activeElement.blur();
        }
    }
});
for (const item of planetoids) {
    item.button.addEventListener('focus', () => inspection.begin(item, 'keyboard'));
    item.button.addEventListener('click', () => inspection.begin(item, 'keyboard'));
    item.button.addEventListener('keydown', event => {
        if (event.key === 'Tab' && !event.shiftKey && inspection.active === item && !previewDrag.target.hidden) {
            event.preventDefault();
            previewDrag.target.focus();
        }
    });
    item.button.addEventListener('blur', event => {
        if (!inspection.caption.contains(event.relatedTarget) && !previewDrag.contains(event.relatedTarget)) {
            dismissInspection();
        }
    });
}
inspection.caption.addEventListener('focusout', event => {
    if (!inspection.caption.contains(event.relatedTarget) && !linkLayer.contains(event.relatedTarget) &&
        !previewDrag.contains(event.relatedTarget)) dismissInspection();
});
window.addEventListener('scroll', () => {
    pointerInside = false;
    if (window.scrollY > 4 && inspection.active) dismissInspection();
}, { passive: true });
function updateNavigation() {
    initializer.scene.updateMatrixWorld(true);
    initializer.camera.updateMatrixWorld(true);
    const hoveredPlanetoid = pointerInside && !inspection.active && !moonDrag.active && window.scrollY < 4 ? pickPlanetoid(pointer) : null;
    navigationCanvas.style.cursor = moonDrag.active ? 'grabbing' : inspection.active ? 'zoom-out' : hoveredPlanetoid ? 'zoom-in' : '';
    if (hoveredPlanetoid && hoverArmed) inspection.begin(hoveredPlanetoid, 'mouse', pointer);
    for (const item of planetoids) {
        const projected = item.mesh.position.clone().project(initializer.camera);
        item.button.hidden = inspection.active !== item && pickPlanetoid(projected) !== item;
        item.button.style.left = `${(projected.x + 1) * window.innerWidth / 2}px`;
        item.button.style.top = `${(1 - projected.y) * window.innerHeight / 2}px`;
    }
}

// Add a movable light to the scene
const movableLight = new MovableLight(initializer.scene, 0.25, 0xffffff, 1.5);
// Illuminate the Moon before the first pointer movement.
movableLight.targetPos.set(-5, 4, 7);

// Add event listener for mouse movement
document.addEventListener('mousemove', (event) => {
    if (!inspection.active && !moonDrag.active) movableLight.updatePosition(event.clientX, event.clientY);
}, false);

// Add event listener for touches
document.addEventListener('touchmove', (event) => {
    if (event.touches.length > 0) {
        const touch = event.touches[0];
        if (!inspection.active && !moonDrag.active) movableLight.updatePosition(touch.clientX, touch.clientY);
    }
}, false);

const animationClock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(animationClock.getDelta(), 0.05);
    // Keep every orbital slot advancing, including the hidden inspected item.
    sharedOrbit.update(delta);
    orbitScroll.update(delta);
    moonDrag.update(!inspection.active && !orbitScroll.isPulling);
    moonLibration.update(delta, document.hidden || moonDrag.active || document.activeElement === moonDrag.target);
    updateNavigation();
    if (!inspection.active && !moonDrag.active) {
        movableLight.update();
    }
    inspection.update(delta);
    previewDrag.update();
    moonFeatures.update(initializer.camera);
    initializer.renderer.render(initializer.scene, initializer.camera);
    inspection.render();
}

animate();
