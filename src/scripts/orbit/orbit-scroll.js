// Scroll destinations and elastic pull gestures are independent of the 3D orbit.
export class OrbitScroll {
    constructor(inspection) {
        this.inspection = inspection;
        this.region = document.getElementById('landing');
        this.cue = document.getElementById('orbit-scroll-cue');
        this.label = document.getElementById('orbit-scroll-label');
        this.destination = document.getElementById('orbit-scroll-destination');
        this.pull = document.getElementById('orbit-pull');
        this.pullStatus = document.getElementById('orbit-pull-status');
        this.pullDestination = document.getElementById('orbit-pull-destination');
        this.sections = Array.from(document.querySelectorAll('[data-orbit-section]'));
        this.item = null;
        this.amount = 0;
        this.visualAmount = 0;
        this.opening = false;
        this.touch = null;
        this.scrollingToSection = false;
        this.navigatingToSection = false;

        this.region.addEventListener('wheel', event => this.onWheel(event), { passive: false });
        this.region.addEventListener('touchstart', event => this.onTouchStart(event), { passive: true });
        this.region.addEventListener('touchmove', event => this.onTouchMove(event), { passive: false });
        this.region.addEventListener('touchend', () => {
            this.touch = null;
            this.scrollingToSection = false;
            this.release();
        }, { passive: true });
        this.region.addEventListener('touchcancel', () => {
            this.scrollingToSection = false;
            this.reset();
        }, { passive: true });
        this.cue.addEventListener('click', event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            if (!this.canInteract()) return;
            if (this.isSection) this.scrollToSection();
            else this.openDestination();
        });
        window.addEventListener('keydown', event => this.onKeyDown(event));
        window.addEventListener('pageshow', () => this.reset(true));
        // Keep each section available to plain links, direct URLs, and browser history.
        document.addEventListener('click', event => {
            const link = event.target.closest('a[href]');
            if (!link || link === this.cue || event.defaultPrevented || event.button !== 0 ||
                event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const url = new URL(link.href, window.location.href);
            if (url.origin === window.location.origin && url.pathname === window.location.pathname && this.findSection(url.hash)) {
                event.preventDefault();
                this.scrollToSection(url.hash);
            }
        });
        window.addEventListener('hashchange', () => {
            const section = this.revealSection(window.location.hash);
            if (section) {
                this.navigatingToSection = true;
                section.scrollIntoView({ behavior: 'instant' });
            }
        });
        const initialSection = this.revealSection(window.location.hash);
        if (initialSection) {
            this.navigatingToSection = true;
            requestAnimationFrame(() => initialSection.scrollIntoView({ behavior: 'instant' }));
        } else this.revealSection('#about');
    }

    get threshold() {
        return Math.min(240, window.innerHeight * 0.32);
    }

    get isSection() {
        return this.item?.definition.href.startsWith('#');
    }

    get isPulling() {
        return this.amount > 0 || this.visualAmount > 0.5 || this.opening || !!this.touch?.claimed;
    }

    canInteract() {
        return this.item && this.item === this.inspection.active && !this.inspection.returning &&
            this.inspection.progress >= 0.9 && !this.opening &&
            Math.abs(this.region.getBoundingClientRect().top) < 4;
    }

    select(item) {
        this.reset();
        this.item = item;
        if (!item) return;
        this.cue.href = item.definition.href;
        this.label.textContent = this.isSection ? 'Scroll to explore' : 'Scroll to open';
        this.destination.textContent = this.isSection ? item.definition.scrollLabel : new URL(item.definition.href, window.location.href).hostname;
        this.pullDestination.textContent = this.destination.textContent;
        this.region.style.setProperty('--pull-accent', item.definition.caption.accent);
        this.revealSection(this.isSection ? item.definition.href : '#about');
    }

    reset(immediate = false) {
        clearTimeout(this.wheelTimer);
        clearTimeout(this.openTimer);
        this.amount = 0;
        this.opening = false;
        this.touch = null;
        if (immediate) this.visualAmount = 0;
        this.pullStatus.textContent = 'Keep scrolling to open';
        this.region.classList.remove('is-opening');
    }

    release() {
        clearTimeout(this.wheelTimer);
        if (!this.opening) this.amount = 0;
    }

    addPull(delta) {
        this.amount = Math.max(0, Math.min(this.threshold, this.amount + delta));
        if (this.amount >= this.threshold) this.openDestination();
    }

    openDestination() {
        if (!this.canInteract()) return;
        this.opening = true;
        this.amount = this.threshold;
        this.pullStatus.textContent = 'Opening';
        this.region.classList.add('is-opening');
        // Finish the ring before leaving; closing the inspection cancels this timer.
        const href = this.item.definition.href;
        this.openTimer = setTimeout(() => {
            if (this.item === this.inspection.active && !this.inspection.returning) window.location.assign(href);
        }, this.inspection.reducedMotion.matches ? 0 : 220);
    }

    findSection(hash) {
        return this.sections.find(section => `#${section.id}` === hash);
    }

    revealSection(hash) {
        const section = this.findSection(hash);
        if (section && section !== this.visibleSection) {
            for (const candidate of this.sections) candidate.hidden = candidate !== section;
            this.visibleSection = section;
        }
        return section;
    }

    scrollToSection(href = this.item?.definition.href) {
        const section = this.revealSection(href);
        if (!section) return;
        this.scrollingToSection = !!this.touch?.claimed;
        // Closing the object must not replace the destination before scrolling starts.
        this.navigatingToSection = true;
        this.inspection.close();
        if (window.location.hash !== `#${section.id}`) history.pushState(null, '', `#${section.id}`);
        section.scrollIntoView({ behavior: this.inspection.reducedMotion.matches ? 'instant' : 'smooth' });
        section.focus({ preventScroll: true });
    }

    onWheel(event) {
        if (this.opening && !event.ctrlKey) {
            event.preventDefault();
            return;
        }
        if (!this.canInteract() || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
        if (this.isSection) {
            if (event.deltaY > 2) {
                event.preventDefault();
                this.scrollToSection();
            }
            return;
        }
        if (event.deltaY <= 0 && this.amount === 0) return;
        event.preventDefault();
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
        // Several intentional wheel steps, rather than a single large event, fill the ring.
        this.addPull(Math.max(-90, Math.min(90, event.deltaY * unit)));
        clearTimeout(this.wheelTimer);
        this.wheelTimer = setTimeout(() => this.release(), 200);
    }

    onTouchStart(event) {
        if (event.touches.length !== 1 || !this.canInteract()) {
            this.touch = null;
            return;
        }
        const touch = event.touches[0];
        this.touch = { x: touch.clientX, y: touch.clientY, lastY: touch.clientY, claimed: false };
    }

    onTouchMove(event) {
        if ((this.opening || this.scrollingToSection) && event.touches.length === 1) {
            event.preventDefault();
            return;
        }
        if (!this.touch || !this.canInteract()) return;
        if (event.touches.length !== 1) {
            this.reset();
            return;
        }
        const touch = event.touches[0];
        const vertical = this.touch.y - touch.clientY;
        const horizontal = Math.abs(this.touch.x - touch.clientX);
        if (!this.touch.claimed && (vertical < 10 || horizontal > Math.abs(vertical))) return;
        event.preventDefault();
        this.touch.claimed = true;
        if (this.isSection) {
            this.scrollToSection();
        } else {
            this.addPull(this.touch.lastY - touch.clientY);
            this.touch.lastY = touch.clientY;
        }
    }

    onKeyDown(event) {
        if (this.opening && ['ArrowDown', 'PageDown', ' ', 'ArrowUp', 'PageUp'].includes(event.key)) {
            event.preventDefault();
            return;
        }
        if (!this.canInteract() || event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
        const down = event.key === 'ArrowDown' || event.key === 'PageDown' || (event.key === ' ' && !event.shiftKey);
        const up = event.key === 'ArrowUp' || event.key === 'PageUp' || (event.key === ' ' && event.shiftKey);
        if (!down && !up) return;
        if (this.isSection) {
            if (down) {
                event.preventDefault();
                this.scrollToSection();
            }
        } else if (down || this.amount > 0) {
            event.preventDefault();
            this.addPull((down ? 1 : -1) * this.threshold / 4);
            clearTimeout(this.wheelTimer);
            this.wheelTimer = setTimeout(() => this.release(), 900);
        }
    }

    update(delta) {
        const item = this.inspection.returning ? null : this.inspection.active;
        if (item !== this.item) this.select(item);
        const atOrbit = Math.abs(this.region.getBoundingClientRect().top) < 4;
        if (!atOrbit) this.navigatingToSection = false;
        if (!item && !this.navigatingToSection && atOrbit) this.revealSection('#about');
        const ready = !!this.canInteract();
        this.cue.tabIndex = ready ? 0 : -1;
        this.cue.classList.toggle('is-ready', ready);
        this.region.classList.toggle('has-external-selection', (ready || this.opening) && !this.isSection);
        this.visualAmount += (this.amount - this.visualAmount) * (1 - Math.exp(-18 * delta));
        if (Math.abs(this.visualAmount - this.amount) < 0.05) this.visualAmount = this.amount;
        const progress = Math.min(1, this.visualAmount / this.threshold);
        const distance = 150 * (1 - Math.exp(-this.visualAmount / 150));
        this.region.style.setProperty('--pull-distance', `${distance}px`);
        this.region.style.setProperty('--pull-progress', progress);
        this.region.classList.toggle('is-pulling', this.isPulling);
        this.pull.setAttribute('aria-hidden', String(!this.isPulling));
    }
}
