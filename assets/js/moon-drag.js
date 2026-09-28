// Rotate the Moon around the surface point being grabbed, without moving its orbit.
class MoonDrag {
    constructor(moon, camera, canvas, target, radius, onRotate = () => {}) {
        this.moon = moon;
        this.camera = camera;
        this.canvas = canvas;
        this.target = target;
        this.onRotate = onRotate;
        this.sphere = new THREE.Sphere(new THREE.Vector3(), radius);
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.start = new THREE.Vector3();
        this.current = new THREE.Vector3();
        this.rotation = new THREE.Quaternion();
        this.startRotation = new THREE.Quaternion();
        this.initialRotation = moon.quaternion.clone();
        this.projected = new THREE.Vector3();
        this.pointerId = null;
        this.enabled = true;

        target.addEventListener('pointerdown', event => this.begin(event));
        target.addEventListener('pointermove', event => this.move(event));
        target.addEventListener('pointerup', event => {
            if (event.pointerId === this.pointerId) this.release();
        });
        target.addEventListener('pointercancel', () => this.release());
        target.addEventListener('lostpointercapture', () => this.release());
        target.addEventListener('keydown', event => this.onKeyDown(event));
        target.addEventListener('dragstart', event => event.preventDefault());
        window.addEventListener('blur', () => this.release());
        window.addEventListener('scroll', () => this.release(), { passive: true });
        window.addEventListener('resize', () => {
            this.release();
            this.layout();
        });
        this.layout();
    }

    get active() {
        return this.pointerId !== null;
    }

    layout() {
        this.moon.getWorldPosition(this.sphere.center);
        this.camera.updateMatrixWorld(true);
        this.projected.copy(this.sphere.center).project(this.camera);
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        const distance = this.camera.position.distanceTo(this.sphere.center);
        const focalLength = height / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)));
        const radius = focalLength * this.sphere.radius / Math.sqrt(distance ** 2 - this.sphere.radius ** 2);
        this.target.style.width = this.target.style.height = `${radius * 2}px`;
        this.target.style.left = `${(this.projected.x + 1) * width / 2 - radius}px`;
        this.target.style.top = `${(1 - this.projected.y) * height / 2 - radius}px`;
    }

    surfaceDirection(event, result) {
        const bounds = this.canvas.getBoundingClientRect();
        this.pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1,
            1 - (event.clientY - bounds.top) / bounds.height * 2);
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const ray = this.raycaster.ray;
        // Outside the silhouette, continue along the limb rather than losing the grab.
        if (!ray.intersectSphere(this.sphere, result)) ray.closestPointToPoint(this.sphere.center, result);
        return result.sub(this.sphere.center).normalize();
    }

    begin(event) {
        if (!event.isPrimary) {
            this.release();
            return;
        }
        if (!this.enabled || this.active || event.button !== 0) return;
        this.pointerId = event.pointerId;
        this.surfaceDirection(event, this.start);
        this.startRotation.copy(this.moon.quaternion);
        this.target.setPointerCapture(event.pointerId);
        this.target.classList.add('is-grabbing');
        event.preventDefault();
    }

    move(event) {
        if (event.pointerId !== this.pointerId) return;
        // Recover if a mouse release happened outside the browser window.
        if (event.pointerType === 'mouse' && !(event.buttons & 1)) {
            this.release();
            return;
        }
        this.surfaceDirection(event, this.current);
        this.rotation.setFromUnitVectors(this.start, this.current);
        this.moon.quaternion.copy(this.startRotation).premultiply(this.rotation).normalize();
        this.onRotate();
    }

    release() {
        const pointerId = this.pointerId;
        this.pointerId = null;
        this.target.classList.remove('is-grabbing');
        if (pointerId !== null && this.target.hasPointerCapture(pointerId)) {
            this.target.releasePointerCapture(pointerId);
        }
    }

    onKeyDown(event) {
        if (event.key === 'Escape') this.release();
        if (!this.enabled || event.altKey || event.ctrlKey || event.metaKey) return;
        const axes = {
            ArrowLeft: [0, -1, 0], ArrowRight: [0, 1, 0],
            ArrowUp: [-1, 0, 0], ArrowDown: [1, 0, 0],
        };
        if (!axes[event.key] && event.key !== 'Home') return;
        event.preventDefault();
        event.stopPropagation();
        this.release();
        if (event.key === 'Home') this.moon.quaternion.copy(this.initialRotation);
        else {
            this.rotation.setFromAxisAngle(new THREE.Vector3(...axes[event.key]), Math.PI / 36);
            this.moon.quaternion.premultiply(this.rotation).normalize();
        }
        this.onRotate();
    }

    update(enabled) {
        this.enabled = enabled;
        if (!enabled) this.release();
        this.target.hidden = !enabled;
    }
}
