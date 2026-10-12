document.addEventListener("DOMContentLoaded", () => {

    // --- SHARED TECHNOLOGY NETWORK BACKGROUND ---
    const canvas = document.createElement('canvas');
    canvas.className = 'technology-network';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.setAttribute('role', 'presentation');
    document.body.prepend(canvas);

    const context = canvas.getContext('2d', { alpha: true });
    if (context) {
        const palette = ['183, 110, 121', '128, 90, 213', '232, 180, 188'];
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let width = 0;
        let height = 0;
        let pixelRatio = 1;
        let particles = [];
        let pointer = null;
        let scrollOffset = 0;
        let targetScrollOffset = 0;
        let animationFrame = 0;
        let previousTime = 0;
        let isVisible = !document.hidden;

        const randomVelocity = () => (Math.random() - 0.5) * 0.28;

        const createGlow = (color) => {
            const sprite = document.createElement('canvas');
            sprite.width = 28;
            sprite.height = 28;
            const spriteContext = sprite.getContext('2d');
            const gradient = spriteContext.createRadialGradient(14, 14, 0, 14, 14, 14);
            gradient.addColorStop(0, `rgba(${color}, 0.95)`);
            gradient.addColorStop(0.2, `rgba(${color}, 0.62)`);
            gradient.addColorStop(0.55, `rgba(${color}, 0.16)`);
            gradient.addColorStop(1, `rgba(${color}, 0)`);
            spriteContext.fillStyle = gradient;
            spriteContext.fillRect(0, 0, 28, 28);
            return sprite;
        };

        const glowSprites = palette.map(createGlow);

        const createParticle = (x, y) => ({
            x: x ?? Math.random() * width,
            y: y ?? Math.random() * height,
            vx: randomVelocity(),
            vy: randomVelocity(),
            color: Math.floor(Math.random() * palette.length),
            phase: Math.random() * Math.PI * 2
        });

        const drawNetwork = (time, moveParticles) => {
            if (!width || !height) return;

            context.clearRect(0, 0, width, height);
            const delta = moveParticles ? Math.min((time - previousTime) / 16.67 || 1, 2) : 0;
            previousTime = time;
            scrollOffset += (targetScrollOffset - scrollOffset) * 0.06;

            if (moveParticles) {
                for (const particle of particles) {
                    particle.phase += 0.012 * delta;
                    particle.vx += Math.cos(particle.phase) * 0.0009 * delta;
                    particle.vy += Math.sin(particle.phase * 0.83) * 0.0009 * delta;

                    if (pointer) {
                        const dx = particle.x - pointer.x;
                        const dy = particle.y - pointer.y;
                        const distanceSquared = dx * dx + dy * dy;
                        const interactionRadius = 150;
                        if (distanceSquared < interactionRadius * interactionRadius && distanceSquared > 0) {
                            const distance = Math.sqrt(distanceSquared);
                            const force = (1 - distance / interactionRadius) * 0.035 * delta;
                            particle.vx += (dx / distance) * force;
                            particle.vy += (dy / distance) * force;
                        }
                    }

                    particle.vx *= 0.997;
                    particle.vy *= 0.997;
                    particle.x += particle.vx * delta;
                    particle.y += particle.vy * delta;

                    if (particle.x < 0 || particle.x > width) particle.vx *= -1;
                    if (particle.y < 0 || particle.y > height) particle.vy *= -1;
                    particle.x = Math.max(0, Math.min(width, particle.x));
                    particle.y = Math.max(0, Math.min(height, particle.y));
                }
            }

            const connectionDistance = Math.min(156, Math.max(96, width * 0.105));
            const connectionDistanceSquared = connectionDistance * connectionDistance;
            const cellSize = connectionDistance;
            const grid = new Map();

            particles.forEach((particle, index) => {
                const cellX = Math.floor(particle.x / cellSize);
                const cellY = Math.floor(particle.y / cellSize);
                const key = `${cellX},${cellY}`;
                if (!grid.has(key)) grid.set(key, []);
                grid.get(key).push(index);
            });

            const lineGroups = Array.from({ length: 12 }, () => []);
            const packets = [];

            particles.forEach((particle, index) => {
                const cellX = Math.floor(particle.x / cellSize);
                const cellY = Math.floor(particle.y / cellSize);

                for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
                    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
                        const neighbors = grid.get(`${cellX + offsetX},${cellY + offsetY}`);
                        if (!neighbors) continue;

                        for (const neighborIndex of neighbors) {
                            if (neighborIndex <= index) continue;
                            const neighbor = particles[neighborIndex];
                            const dx = neighbor.x - particle.x;
                            const dy = neighbor.y - particle.y;
                            const distanceSquared = dx * dx + dy * dy;
                            if (distanceSquared >= connectionDistanceSquared) continue;

                            const distance = Math.sqrt(distanceSquared);
                            const strength = 1 - distance / connectionDistance;
                            const tone = (index + neighborIndex) % 2;
                            const opacityBand = Math.min(5, Math.floor(strength * 6));
                            lineGroups[opacityBand * 2 + tone].push(
                                particle.x,
                                particle.y + scrollOffset,
                                neighbor.x,
                                neighbor.y + scrollOffset
                            );

                            if ((index * 31 + neighborIndex * 17) % 17 === 0) {
                                const phase = ((index * 37 + neighborIndex * 61) % 100) / 100;
                                const progress = reducedMotion.matches ? phase : (time * 0.00012 + phase) % 1;
                                packets.push({
                                    x: particle.x + dx * progress,
                                    y: particle.y + dy * progress + scrollOffset,
                                    color: tone
                                });
                            }
                        }
                    }
                }
            });

            context.lineWidth = 1.2;
            lineGroups.forEach((segments, groupIndex) => {
                if (!segments.length) return;
                const opacityBand = Math.floor(groupIndex / 2);
                context.beginPath();
                for (let index = 0; index < segments.length; index += 4) {
                    context.moveTo(segments[index], segments[index + 1]);
                    context.lineTo(segments[index + 2], segments[index + 3]);
                }
                context.strokeStyle = `rgb(${palette[groupIndex % 2]})`;
                context.globalAlpha = 0.16 + opacityBand * 0.05;
                context.stroke();
            });

            context.globalAlpha = 1;
            for (const packet of packets) {
                context.globalAlpha = 0.76;
                context.drawImage(glowSprites[packet.color], packet.x - 9, packet.y - 9, 18, 18);
                context.globalAlpha = 1;
                context.fillStyle = `rgb(${palette[packet.color]})`;
                context.beginPath();
                context.arc(packet.x, packet.y, 1.7, 0, Math.PI * 2);
                context.fill();
            }

            particles.forEach((particle) => {
                const pulse = 0.48 + (Math.sin(particle.phase) + 1) * 0.13;
                context.globalAlpha = pulse;
                context.drawImage(glowSprites[particle.color], particle.x - 13, particle.y + scrollOffset - 13, 26, 26);
                context.globalAlpha = 1;
                context.fillStyle = `rgb(${palette[particle.color]})`;
                context.beginPath();
                context.arc(particle.x, particle.y + scrollOffset, 1.45, 0, Math.PI * 2);
                context.fill();
            });

            canvas.dataset.nodeCount = String(particles.length);
        };

        const resizeCanvas = () => {
            const previousWidth = width || window.innerWidth;
            const previousHeight = height || window.innerHeight;
            width = window.innerWidth;
            height = window.innerHeight;
            pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = Math.round(width * pixelRatio);
            canvas.height = Math.round(height * pixelRatio);
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

            const targetCount = Math.min(320, Math.max(110, Math.round((width * height) / 5000)));
            particles = particles.slice(0, targetCount);
            particles.forEach((particle) => {
                particle.x *= width / previousWidth;
                particle.y *= height / previousHeight;
            });
            while (particles.length < targetCount) particles.push(createParticle());

            if (reducedMotion.matches || !isVisible) drawNetwork(0, false);
        };

        const animate = (time) => {
            if (reducedMotion.matches || !isVisible) {
                animationFrame = 0;
                return;
            }
            drawNetwork(time, true);
            animationFrame = window.requestAnimationFrame(animate);
        };

        const startAnimation = () => {
            if (!animationFrame && isVisible && !reducedMotion.matches) {
                previousTime = 0;
                animationFrame = window.requestAnimationFrame(animate);
            } else if (reducedMotion.matches) {
                drawNetwork(0, false);
            }
        };

        window.addEventListener('resize', resizeCanvas, { passive: true });
        window.addEventListener('pointermove', (event) => {
            pointer = { x: event.clientX, y: event.clientY };
        }, { passive: true });
        window.addEventListener('pointerout', (event) => {
            if (event.relatedTarget === null) pointer = null;
        });
        window.addEventListener('scroll', () => {
            targetScrollOffset = Math.min(24, window.scrollY * 0.025);
        }, { passive: true });
        document.addEventListener('visibilitychange', () => {
            isVisible = !document.hidden;
            if (!isVisible && animationFrame) {
                window.cancelAnimationFrame(animationFrame);
                animationFrame = 0;
            } else {
                startAnimation();
            }
        });

        if (reducedMotion.addEventListener) {
            reducedMotion.addEventListener('change', startAnimation);
        } else {
            reducedMotion.addListener(startAnimation);
        }

        resizeCanvas();
        startAnimation();
    }
    
    // --- 1. MOBILE MENU TOGGLE ---
    const menuToggle = document.getElementById('mobile-menu');
    const navList = document.getElementById('nav-list');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = navList.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', String(isExpanded));
            menuToggle.setAttribute('aria-label', isExpanded ? 'Close navigation' : 'Open navigation');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });

        navList.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navList.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.setAttribute('aria-label', 'Open navigation');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            });
        });
    }

    // --- 2. HOME PAGE: WORD SWITCHER ---
    const wordElement = document.getElementById('spin-word');
    if (wordElement && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const words = ["CODER", "DEVELOPER", "PROGRAMMER", "DESIGNER", "FREELANCER"];
        let i = 0;
        setInterval(() => {
            i = (i + 1) % words.length;
            wordElement.style.opacity = 0;
            setTimeout(() => {
                wordElement.textContent = words[i];
                wordElement.style.opacity = 1;
            }, 300);
        }, 2000);
    }

    // --- 3. ACTIVE LINK HIGHLIGHTER ---
    const currentLocation = location.href;
    const menuItems = document.querySelectorAll('.nav-links a');
    menuItems.forEach(item => {
        if(item.href === currentLocation){
            item.classList.add("active");
        }
    });
});