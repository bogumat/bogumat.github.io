document.addEventListener('DOMContentLoaded', (event) => {
    const canvas = document.getElementById('welcome-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let planets = [];
    let mouse = {
        x: innerWidth / 2,
        y: innerHeight / 2
    };
    let texture;

    function loadTexture() {
        texture = new Image();
        texture.src = 'map.png'; // Path to your texture map
        texture.onload = () => init(); // Initialize after texture loads
    }

    class Planet {
        constructor(x, y, size, velocityX, velocityY, color) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.velocityX = velocityX;
            this.velocityY = velocityY;
            this.color = color;
        }

        update() {
            this.x += this.velocityX;
            this.y += this.velocityY;
        }

        draw() {
            // Draw planet
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            // Draw shadow with clipping
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.clip();
            this.drawShadow();
            ctx.restore();
        }

        drawShadow() {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            const shadowX = Math.cos(angle) * distance / 8;
            const shadowY = Math.sin(angle) * distance / 8;
            const shadowRadius = this.size * 1.15;
        
            // Create a radial gradient for the shadow
            const gradient = ctx.createRadialGradient(
                this.x + shadowX, this.y + shadowY, shadowRadius * 0.9, // Start circle
                this.x + shadowX, this.y + shadowY, shadowRadius // End circle
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)'); // Inner color (more opaque)
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');   // Outer color (transparent)
        
            // Apply the gradient
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x + shadowX, this.y + shadowY, shadowRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function arcAroundCenter(planet) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const attractionFactor = 7e-6; // Adjust this to change the curvature

        // Calculate the vector pointing from the planet to the center
        const dx = centerX - planet.x;
        const dy = centerY - planet.y;

        // Update velocity to arc towards the center
        planet.velocityX += dx * attractionFactor;
        planet.velocityY += dy * attractionFactor;
    }

    function init() {
        planets = [];
        for (let i = 0; i < 3; i++) {
            let size = Math.random() * 125 + 125;
            let x = Math.random() * (innerWidth - size * 2) + size;
            let y = Math.random() * (innerHeight - size * 2) + size;
            let velocityX = 0.5 * (Math.random() - 0.5) * 2;
            let velocityY = 0.8 * (Math.random() - 0.5) * 2;
            let hue = Math.random() * 180 + 180; 
            let color = `hsla(${hue}, 30%, 70%, 100%)`;
            planets.push(new Planet(x, y, size, velocityX, velocityY, color));
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < planets.length; i++) {
            arcAroundCenter(planets[i]);
            planets[i].update();
            planets[i].draw();
        }
        requestAnimationFrame(animate);
    }

    init();
    animate();

    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init();
    });

    addEventListener('mousemove', (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });

});
