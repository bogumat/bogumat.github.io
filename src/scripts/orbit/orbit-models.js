import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Model loading is separate from orbital movement and navigation.
export function configureShadowLight(light, resolution = 512) {
    light.castShadow = true;
    light.shadow.mapSize.set(resolution, resolution);
    light.shadow.camera.near = 0.05;
    light.shadow.camera.far = 30;
    light.shadow.bias = -0.0002;
    light.shadow.normalBias = 0.015;
}

export function createOrbitingBody(scene, definition) {
    const mesh = new THREE.Group();
    scene.add(mesh);
    // A simple silhouette remains usable if the model fails to load.
    const placeholder = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 1.2, 0.25),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    placeholder.castShadow = true;
    placeholder.receiveShadow = true;
    mesh.add(placeholder);
    const modelUrl = new URL(definition.model, window.location.href);
    new GLTFLoader().load(modelUrl.href, gltf => {
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const sphere = bounds.getBoundingSphere(new THREE.Sphere());
        // Match the visible width/height after each model's presentation rotation,
        // rather than matching box diagonals (which shrink the cross-shaped sail array).
        const rotation = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(
            ...(definition.rotation || [-0.12, -0.35, -0.14])));
        const visibleBounds = new THREE.Box3();
        let actualRadius = 0;
        const vertex = new THREE.Vector3();
        model.updateMatrixWorld(true);
        model.traverse(object => {
            if (!object.isMesh) return;
            const positions = object.geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                vertex.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld).sub(sphere.center);
                actualRadius = Math.max(actualRadius, vertex.length());
                visibleBounds.expandByPoint(vertex.applyMatrix4(rotation));
            }
        });
        const visibleSize = visibleBounds.getSize(new THREE.Vector3());
        const desiredScale = definition.displaySize
            ? definition.displaySize / Math.max(visibleSize.x, visibleSize.y)
            : definition.radius / actualRadius;
        const scale = Math.min(desiredScale, definition.radius / actualRadius);
        model.position.copy(sphere.center).multiplyScalar(-scale);
        model.scale.setScalar(scale);
        model.updateMatrixWorld(true);
        model.traverse(object => {
            if (!object.isMesh) return;
            const isLogo = object.name === 'Substack_luminous_cover_mark';
            const isEmissive = isLogo || object.userData.emissiveSurface === true;
            object.castShadow = !isEmissive;
            object.receiveShadow = true;
            if (!isEmissive) object.material.emissive.setHex(0x000000);
            if (isLogo && mesh.userData.coverLight) {
                mesh.userData.coverLight.position.copy(object.getWorldPosition(new THREE.Vector3()));
                mesh.userData.coverLight.position.z += 0.06;
            }
        });
        if (definition.beaconLight) {
            // Two opposite beacons represent the two banks of corner lights.
            // This keeps real occlusion without eight extra cube shadow maps.
            const positions = [];
            model.traverse(object => {
                if (object.isMesh && object.name.startsWith('Blue_corner_beacon')) {
                    positions.push(object.getWorldPosition(new THREE.Vector3()));
                }
            });
            positions.sort((a, b) => (a.x + a.y + a.z) - (b.x + b.y + b.z));
            if (positions.length) {
                const center = positions.reduce((sum, p) => sum.add(p), new THREE.Vector3())
                    .divideScalar(positions.length);
                const { color, intensity, distance } = definition.beaconLight;
                [positions[0], positions[positions.length - 1]].forEach(position => {
                    const light = new THREE.PointLight(color, intensity, distance);
                    // Move just outside the lens and frame to avoid self-blocking.
                    light.position.copy(position).addScaledVector(
                        position.clone().sub(center).normalize(), 0.035);
                    configureShadowLight(light, 256);
                    mesh.add(light);
                });
            }
        }
        if (definition.eyeLight) {
            const { color, intensity, distance } = definition.eyeLight;
            model.traverse(object => {
                if (!object.isMesh || !object.userData.emissiveSurface) return;
                const light = new THREE.PointLight(color, intensity, distance);
                light.position.copy(object.getWorldPosition(new THREE.Vector3()));
                // The bust faces +Z in glTF; emit just in front of each eye.
                light.position.z += 0.06;
                configureShadowLight(light, 256);
                mesh.add(light);
            });
        }
        mesh.remove(placeholder);
        placeholder.geometry.dispose();
        placeholder.material.dispose();
        mesh.add(model);
        mesh.userData.modelLoaded = true;
    }, undefined, error => console.error('Could not load orbit model:', definition.model, error));
    // Present the closed front cover with a little spine and page depth visible.
    mesh.rotation.set(...(definition.rotation || [-0.12, -0.35, -0.14]));
    if (definition.light) {
        const { color, intensity, distance } = definition.light;
        // An emissive texture alone cannot light other objects in WebGL.
        // Place an actual light just above the closed front cover.
        const light = new THREE.PointLight(color, intensity, distance);
        light.position.set(0.025, 0.04, 0.24);
        configureShadowLight(light);
        mesh.add(light);
        mesh.userData.coverLight = light;
    }
    return mesh;
}
