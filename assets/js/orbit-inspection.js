// A separate foreground scene lets an item leave its orbit visually without
// crossing other bodies or moving the lights illuminating the Moon.
class OrbitInspection {
    constructor(initializer) {
        this.initializer = initializer;
        this.scene = new THREE.Scene();
        this.active = null;
        this.progress = 0;
        this.returning = false;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.compactLayout = window.matchMedia('(max-width: 700px)');
        this.caption = document.getElementById('orbit-caption');
        this.captionCopy = this.caption.querySelector('.orbit-caption-copy');
        this.captionTitle = document.getElementById('orbit-caption-title');
        this.captionEyebrow = document.getElementById('orbit-caption-eyebrow');
        this.captionDescription = document.getElementById('orbit-caption-description');
        this.previewRotation = new THREE.Quaternion();
        this.previewRotationDelta = new THREE.Quaternion();
        this.appliedPreviewRotation = new THREE.Quaternion();
        this.previewRotationEuler = new THREE.Euler(0, 0, 0, 'XYZ');
        const key = new THREE.DirectionalLight(0xfff5ef, 1.3);
        key.position.set(-3, 4, 5);
        const fill = new THREE.DirectionalLight(0xaecaff, 0.35);
        fill.position.set(3, 1, 2);
        this.scene.add(key, fill);
    }

    begin(item, mode = 'mouse', pointer = new THREE.Vector2()) {
        if (!item.mesh.userData.modelLoaded) return;
        if (this.active) {
            if (this.active !== item) {
                this.close();
                this.pending = { item, mode, pointer: pointer.clone() };
            }
            return;
        }
        this.active = item;
        this.mode = mode;
        this.trigger = pointer.clone();
        this.progress = 0;
        this.returning = false;
        this.resetPreviewRotation();
        this.arcDirection = Math.sign(item.mesh.position.x || 1);
        this.preview = new THREE.Group();
        // Clone only model geometry, excluding orbital lights and their metadata.
        for (const child of item.mesh.children) {
            if (!child.isLight) this.preview.add(child.clone(true));
        }
        this.originalVisibility = [];
        item.mesh.traverse(object => {
            if (object.isMesh) {
                this.originalVisibility.push([object, object.visible]);
                object.visible = false;
            }
        });
        this.preview.traverse(object => {
            if (object.isMesh) {
                object.castShadow = false;
                object.receiveShadow = false;
            }
        });
        this.targetRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(
            ...(item.definition.inspectionRotation || item.definition.rotation || [-0.12, -0.35, -0.14])
        ));
        this.preview.position.copy(item.mesh.position);
        this.preview.quaternion.copy(item.mesh.quaternion);
        this.scene.add(this.preview);
        item.button.setAttribute('aria-pressed', 'true');
        item.button.setAttribute('aria-describedby', this.captionDescription.id);
        const caption = item.definition.caption;
        this.captionTitle.textContent = caption.title;
        this.captionEyebrow.textContent = caption.eyebrow;
        this.captionDescription.textContent = caption.description;
        this.caption.style.setProperty('--caption-accent', caption.accent);
        this.caption.classList.toggle('has-long-title', !!caption.longTitle);
        this.caption.setAttribute('aria-hidden', 'false');
    }

    close() {
        this.pending = null;
        if (this.active) this.returning = true;
    }

    rotatePreview(deltaX, deltaY, sensitivity = 0.008) {
        if (!this.active || this.returning || this.progress < 0.9) return;
        this.previewRotationEuler.set(deltaY * sensitivity, deltaX * sensitivity, 0);
        this.previewRotationDelta.setFromEuler(this.previewRotationEuler);
        this.previewRotation.premultiply(this.previewRotationDelta).normalize();
    }

    resetPreviewRotation() {
        this.previewRotation.set(0, 0, 0, 1);
    }

    keepHover(pointer) {
        // Keep a corridor between the original hover location and the enlarged
        // object, so moving towards it doesn't cause a hover/return loop.
        const marginX = 160 / window.innerWidth;
        const marginY = 160 / window.innerHeight;
        const copy = this.captionCopy.getBoundingClientRect();
        return pointer.x >= Math.min(this.trigger.x, copy.left / window.innerWidth * 2 - 1, -0.5) - marginX &&
            pointer.x <= Math.max(this.trigger.x, 0.8) + marginX &&
            pointer.y >= Math.min(this.trigger.y, 1 - copy.bottom / window.innerHeight * 2, -0.5) - marginY &&
            pointer.y <= Math.max(this.trigger.y, 1 - copy.top / window.innerHeight * 2, 0.5) + marginY;
    }

    update(delta) {
        if (!this.active) return;
        const step = this.reducedMotion.matches ? 1 : delta / 0.65;
        this.progress = THREE.MathUtils.clamp(this.progress + (this.returning ? -step : step), 0, 1);
        const t = this.progress * this.progress * (3 - 2 * this.progress);
        const camera = this.initializer.camera;
        const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
        const compact = this.compactLayout.matches;
        const distance = this.active.definition.radius /
            (Math.tan(halfFov) * (compact ? 0.48 : 0.5) * Math.min(1, camera.aspect));
        const halfHeight = Math.tan(halfFov) * distance;
        const target = new THREE.Vector3(
            compact ? 0 : halfHeight * camera.aspect * 0.38,
            halfHeight * (compact ? (window.innerHeight < 700 ? 0.42 : 0.3) : 0.04),
            camera.position.z - distance
        );
        // Follow the live orbital slot so returning rejoins the uninterrupted orbit.
        const orbitPosition = this.active.mesh.position;
        this.preview.position.lerpVectors(orbitPosition, target, t);
        this.preview.position.x += Math.sin(Math.PI * t) * 0.8 * this.arcDirection;
        this.preview.quaternion.copy(this.active.mesh.quaternion).slerp(this.targetRotation, t);
        this.appliedPreviewRotation.set(0, 0, 0, 1).slerp(this.previewRotation, t);
        this.preview.quaternion.premultiply(this.appliedPreviewRotation);
        // Reveal the copy with the flight, using the same clock in both directions.
        const reveal = THREE.MathUtils.smoothstep(this.progress, 0.25, 0.9);
        this.caption.style.setProperty('--caption-reveal', reveal);
        if (this.returning && this.progress === 0) {
            for (const [object, visible] of this.originalVisibility) object.visible = visible;
            this.scene.remove(this.preview);
            this.active.button.setAttribute('aria-pressed', 'false');
            this.active.button.removeAttribute('aria-describedby');
            this.caption.setAttribute('aria-hidden', 'true');
            this.active = null;
            this.preview = null;
            if (this.pending) {
                const { item, mode, pointer } = this.pending;
                this.pending = null;
                this.begin(item, mode, pointer);
            }
        }
    }

    render() {
        if (!this.active) return;
        const { renderer, camera } = this.initializer;
        renderer.autoClear = false;
        renderer.clearDepth();
        renderer.render(this.scene, camera);
        renderer.autoClear = true;
    }
}
