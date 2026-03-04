// script.js

document.addEventListener('DOMContentLoaded', () => {

    // 1. Navbar blur effect on scroll
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. GSAP ScrollTrigger Animations
    gsap.registerPlugin(ScrollTrigger);

    // Fade up animations for modular elements
    const revealElements = document.querySelectorAll('.reveal-up');

    revealElements.forEach((el, index) => {
        gsap.fromTo(el,
            {
                y: 40,
                opacity: 0
            },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });

    // 3. Smooth scroll for internal anchor links (ignoring modal triggers)
    document.querySelectorAll('a[href^="#"]:not(.modal-trigger):not(.calendar-trigger)').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');

            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                e.preventDefault();
                const headerOffset = 80; // Account for fixed navbar
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.scrollY - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // 4. Global Modal Logic
    const modals = document.querySelectorAll('.modal-overlay');

    // Close function
    function closeModal() {
        modals.forEach(m => {
            if (m) {
                m.classList.remove('is-open');
                // Use a slight timeout to let the scale transition finish
                setTimeout(() => m.style.display = 'none', 400);
            }
        });
        document.body.classList.remove('modal-open');
    }

    // Attach close limits
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    modals.forEach(m => {
        if (m) {
            m.addEventListener('click', (e) => {
                if (e.target === m) closeModal();
            });
        }
    });

    // Open Any Modal Logic
    const modalTriggers = document.querySelectorAll('.modal-trigger');
    const auditModal = document.getElementById('audit-modal');
    const goalSelect = document.getElementById('goal');
    const selectedPlanInput = document.getElementById('selected-plan-input');

    modalTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();

            // Backwards compatibility with old audit modal if needed
            const interest = btn.getAttribute('data-select');
            if (interest && goalSelect && Array.from(goalSelect.options).some(opt => opt.value === interest)) {
                goalSelect.value = interest;
            }
            if (interest && selectedPlanInput) {
                selectedPlanInput.value = interest;
            }

            // Get target modal, fallback to audit-modal
            let targetId = btn.getAttribute('data-target');
            if (!targetId && btn.getAttribute('href')) {
                targetId = btn.getAttribute('href').substring(1);
            }

            const targetModal = document.getElementById(targetId) || auditModal;

            if (targetModal) {
                targetModal.style.display = 'flex';
                setTimeout(() => {
                    targetModal.classList.add('is-open');
                    document.body.classList.add('modal-open');
                }, 10);
            }
        });
    });

    // Open Calendar Modal Logic
    const calTriggers = document.querySelectorAll('.calendar-trigger');
    const calModal = document.getElementById('calendar-modal');

    calTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (calModal) {
                calModal.style.display = 'flex';
                setTimeout(() => {
                    calModal.classList.add('is-open');
                    document.body.classList.add('modal-open');
                }, 10);
            }
        });
    });


    // 5. AJAX Form Submit Logic (Formsubmit/Formspree)
    const ajaxForms = document.querySelectorAll('.modal-form');

    ajaxForms.forEach(form => {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const formStatusContainer = form.querySelector('.form-status');

            if (submitBtn) {
                submitBtn.textContent = 'Sending...';
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.7';
            }

            const formData = new FormData(form);

            // Normalize Website URL: accept www.domain.com, domain.com, or https://
            const websiteField = form.querySelector('input[name="website"]');
            if (websiteField && websiteField.value.trim()) {
                let websiteVal = websiteField.value.trim();
                // If it doesn't start with http:// or https://, prepend https://
                if (!/^https?:\/\//i.test(websiteVal)) {
                    websiteVal = 'https://' + websiteVal;
                }
                formData.set('website', websiteVal);
            }

            // Dynamic Subject Generation based on form field
            const companyName = formData.get('company');
            const baseSubject = formData.get('_subject') || "New Request";

            if (companyName && companyName.trim() !== "") {
                const customSubject = `${baseSubject} - ${companyName}`;
                formData.set('_subject', customSubject);
            }

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    if (formStatusContainer) {
                        formStatusContainer.innerHTML = '<span style="color: green; font-weight: 500;">✓ Your request has been received. We will review and respond shortly.</span>';
                    }
                    form.reset();
                    setTimeout(() => closeModal(), 3000); // Close after 3 seconds
                } else {
                    if (formStatusContainer) formStatusContainer.innerHTML = '<span style="color: red;">Error sending message. Please try again.</span>';
                }
            } catch (error) {
                if (formStatusContainer) formStatusContainer.innerHTML = '<span style="color: red;">Network error. Please try again.</span>';
            } finally {
                if (submitBtn) {
                    submitBtn.textContent = 'Submit Request';
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                }
                setTimeout(() => {
                    if (formStatusContainer) formStatusContainer.innerHTML = '';
                }, 5000);
            }
        });
    });

    // 6. External Google Calendar Logic
    const calendarOutlink = document.getElementById('calendar-outlink');
    const calendarConfirmation = document.getElementById('calendar-confirmation');

    if (calendarOutlink) {
        calendarOutlink.addEventListener('click', (e) => {
            // Once they click out, we listen for them returning to the window
            const handleFocus = () => {
                calendarConfirmation.style.display = 'block';
                // Remove listener so it only fires once per click
                window.removeEventListener('focus', handleFocus);
            };

            // Add a small delay robust against immediate focus switching
            setTimeout(() => {
                window.addEventListener('focus', handleFocus);
            }, 500);
        });
    }

    // 7. Hero SVG Dynamic Flow Network (Premium Bezier)
    const svgContainer = document.getElementById('hero-svg-network');

    if (svgContainer && typeof gsap !== 'undefined') {
        const isMobile = window.innerWidth < 768;
        const PATH_COUNT = isMobile ? 6 : 12; // 8-14 requested, 5-7 on mobile

        // Setup SVG viewBox to handle extensive paths
        const width = window.innerWidth > 1200 ? window.innerWidth : 1200;
        const height = window.innerHeight > 800 ? window.innerHeight : 800;

        svgContainer.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svgContainer.setAttribute('preserveAspectRatio', 'xMidYMid slice');

        // Ensure browser offloads this rendering to GPU for fluid scrolling
        svgContainer.style.willChange = 'transform';

        // Definitions for Filters & Gradients natively in SVG
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

        // Linear Gradient (Soft blue flow) - Base color #2563EB, opacity 0.05-0.12
        const gradBlue = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradBlue.setAttribute('id', 'flow-grad-blue');
        gradBlue.innerHTML = `
            <stop offset="0%" stop-color="#2563EB" stop-opacity="0.05" />
            <stop offset="50%" stop-color="#2563EB" stop-opacity="0.12" />
            <stop offset="100%" stop-color="#2563EB" stop-opacity="0.05" />
        `;
        defs.appendChild(gradBlue);

        // Linear Gradient (Subtle Gold flow) - Optional accent #C6A75E
        const gradGold = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradGold.setAttribute('id', 'flow-grad-gold');
        gradGold.innerHTML = `
            <stop offset="0%" stop-color="#C6A75E" stop-opacity="0.05" />
            <stop offset="50%" stop-color="#C6A75E" stop-opacity="0.12" />
            <stop offset="100%" stop-color="#C6A75E" stop-opacity="0.05" />
        `;
        defs.appendChild(gradGold);

        svgContainer.appendChild(defs);

        const paths = [];

        // Generate Random Flowing Paths (Cubic Bezier Curves)
        for (let i = 0; i < PATH_COUNT; i++) {
            const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const isGold = i < 2; // Optional 2 paths use subtle gold 

            pathEl.setAttribute('fill', 'none');
            pathEl.setAttribute('stroke', isGold ? 'url(#flow-grad-gold)' : 'url(#flow-grad-blue)');
            pathEl.setAttribute('stroke-width', Math.random() * 0.5 + 0.5); // Very thin: 0.5px-1px
            pathEl.setAttribute('stroke-linecap', 'round');
            pathEl.setAttribute('opacity', (Math.random() * 0.4 + 0.6).toString()); // layered depth opacity

            svgContainer.appendChild(pathEl);

            // Generate organic, sweeping anchor points that extend beyond the screen edges
            const pt = () => ({
                x: (Math.random() * width * 1.5) - (width * 0.25),
                y: (Math.random() * height * 1.5) - (height * 0.25)
            });

            const points = {
                start: pt(),
                cp1: pt(),
                cp2: pt(),
                end: pt()
            };

            paths.push({ el: pathEl, points });

            // GSAP ultra-smooth continuous animation loop per point
            const duration = Math.random() * 8 + 12; // 12-20s duration per loop

            Object.values(points).forEach(p => {
                gsap.to(p, {
                    x: `+=${(Math.random() * 300) - 150}`, // wide, slow drifting
                    y: `+=${(Math.random() * 300) - 150}`,
                    duration: duration,
                    ease: "power2.inOut",
                    yoyo: true, // Seamless loop bouncing back naturally
                    repeat: -1
                });
            });
        }

        // GSAP Master Ticker for Path Redrawing (Zero Layout Shift, Pure Spline Math)
        gsap.ticker.add(() => {
            paths.forEach(path => {
                const { start, cp1, cp2, end } = path.points;
                // Dynamically trace the shifting cubic Bezier curve points
                const d = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
                path.el.setAttribute('d', d);
            });
        });

        // Ultra-smooth parallax on scroll (no snap, instant execution)
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.to(svgContainer, {
                y: () => svgContainer.parentElement.offsetHeight * 0.25, // slower than text
                ease: "none",
                scrollTrigger: {
                    trigger: ".hero",
                    start: "top top",
                    end: "bottom top",
                    scrub: true // instant scroll synchronization eliminating lag
                }
            });
        }
    }

    // 8. Clients Infinite Loop GSAP Parallax
    if (typeof ScrollTrigger !== 'undefined') {
        const loopElement = document.querySelector('.gs-parallax-loop');
        if (loopElement) {
            // Force hardware acceleration for paint performance
            loopElement.style.willChange = 'transform';

            gsap.to(loopElement, {
                yPercent: 15,
                ease: "none",
                scrollTrigger: {
                    trigger: ".clients",
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true // Instant scroll sync
                }
            });
        }
    }

});
