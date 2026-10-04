import * as THREE from 'three';

// A DOM hit area follows the foreground model so pointer and touch gestures
// can rotate it without blocking the inspection copy or scroll cue.
export class PreviewDrag {
    constructor(inspection, camera, canvas, target, onClick) {
        this.inspection = inspection;
        this.camera = camera;
        this.canvas = canvas;
        this.target = target;
        this.onClick = onClick;
        this.pointerId = null;
        this.moved = false;
        this.start = new THREE.Vector2();
        this.last = new THREE.Vector2();
        this.bounds = new THREE.Box3();
        this.corners = Array.from({ length: 8 }, () => new THREE.Vector3());

        target.addEventListener('pointerdown', event => this.begin(event));
        target.addEventListener('pointermove', event => this.move(event));
        target.addEventListener('pointerup', event => this.end(event));
        target.addEventListener('pointercancel', event => this.cancel(event));
        target.addEventListener('lostpointercapture', event => this.cancel(event));
        target.addEventListener('keydown', event => this.onKeyDown(event));
        target.addEventListener('dragstart', event => event.preventDefault());
        window.addEventListener('blur', () => this.release());
    }

    get active() {
        return this.pointerId !== null;
    }

    get available() {
        return this.inspection.active && !this.inspection.returning &&
            this.inspection.progress >= 0.9 && this.inspection.preview;
    }

    contains(node) {
        return node === this.target;
    }

    begin(event) {
        if (!event.isPrimary || event.button !== 0 || this.active || !this.available) return;
        this.pointerId = event.pointerId;
        this.moved = false;
        this.start.set(event.clientX, event.clientY);
        this.last.copy(this.start);
        this.target.setPointerCapture(event.pointerId);
        this.target.classList.add('is-grabbing');
        event.preventDefault();
        event.stopPropagation();
    }

    move(event) {
        if (event.pointerId !== this.pointerId) return;
        if (event.pointerType === 'mouse' && !(event.buttons & 1)) {
            this.release();
            return;
        }
        const deltaX = event.clientX - this.last.x;
        const deltaY = event.clientY - this.last.y;
        this.last.set(event.clientX, event.clientY);
        if (Math.hypot(event.clientX - this.start.x, event.clientY - this.start.y) > 3) {
            this.moved = true;
        }
        this.inspection.rotatePreview(deltaX, deltaY);
        event.preventDefault();
        event.stopPropagation();
    }

    end(event) {
        if (event.pointerId !== this.pointerId) return;
        const clicked = !this.moved;
        this.release();
        event.preventDefault();
        event.stopPropagation();
        if (clicked) this.onClick();
    }

    cancel(event) {
        if (event.pointerId !== this.pointerId) return;
        this.release();
        event.stopPropagation();
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
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.onClick();
            return;
        }
        const directions = {
            ArrowLeft: [-1, 0], ArrowRight: [1, 0],
            ArrowUp: [0, -1], ArrowDown: [0, 1],
        };
        if (!directions[event.key] && event.key !== 'Home') return;
        event.preventDefault();
        event.stopPropagation();
        if (event.key === 'Home') this.inspection.resetPreviewRotation();
        else {
            const [x, y] = directions[event.key];
            this.inspection.rotatePreview(x, y, THREE.MathUtils.degToRad(5));
        }
    }

    update() {
        if (!this.available) {
            this.release();
            this.target.hidden = true;
            return;
        }
        const preview = this.inspection.preview;
        preview.updateWorldMatrix(true, true);
        this.bounds.setFromObject(preview);
        if (this.bounds.isEmpty()) {
            this.target.hidden = true;
            return;
        }

        const { min, max } = this.bounds;
        let left = Infinity;
        let right = -Infinity;
        let top = Infinity;
        let bottom = -Infinity;
        const canvasBounds = this.canvas.getBoundingClientRect();
        this.corners.forEach((corner, index) => {
            corner.set(index & 1 ? max.x : min.x, index & 2 ? max.y : min.y,
                index & 4 ? max.z : min.z).project(this.camera);
            const x = (corner.x + 1) * canvasBounds.width / 2;
            const y = (1 - corner.y) * canvasBounds.height / 2;
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
        });

        const padding = 12;
        left = Math.max(0, left - padding);
        right = Math.min(canvasBounds.width, right + padding);
        top = Math.max(0, top - padding);
        bottom = Math.min(canvasBounds.height, bottom + padding);
        this.target.style.left = `${left}px`;
        this.target.style.top = `${top}px`;
        this.target.style.width = `${right - left}px`;
        this.target.style.height = `${bottom - top}px`;
        this.target.style.setProperty('--caption-accent', this.inspection.active.definition.caption.accent);
        this.target.setAttribute('aria-label',
            `Rotate ${this.inspection.active.definition.label} preview: drag, or use arrow keys. Home resets the view.`);
        this.target.hidden = false;
    }
}
