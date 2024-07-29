class MobileGamepad {
    constructor() {
        this.gamepad = null;
        this.eventListeners = {};
        this.isVisible = false;
        this.lastTap = 0;
        this.createGamepad();
        this.addEventListeners();
        this.updateGamepadLayout();
    }

    createGamepad() {
        this.gamepad = document.createElement('div');
        this.gamepad.id = 'mobile-gamepad';
        this.gamepad.style.position = 'fixed';
        this.gamepad.style.display = 'none';
        this.gamepad.style.padding = '10px';
        this.gamepad.style.pointerEvents = 'none';
        this.gamepad.style.backgroundColor = 'transparent';

        const dpad = this.createDpad();
        const buttons = this.createButtons();

        this.gamepad.appendChild(dpad);
        this.gamepad.appendChild(buttons);

        document.body.appendChild(this.gamepad);
    }

    createDpad() {
        const dpad = document.createElement('div');
        dpad.id = 'dpad';
        dpad.style.width = '150px';
        dpad.style.height = '150px';
        dpad.style.position = 'relative';
        dpad.style.display = 'grid';
        dpad.style.gridTemplateColumns = 'repeat(3, 1fr)';
        dpad.style.gridTemplateRows = 'repeat(3, 1fr)';
        dpad.style.gap = '5px';

        const directions = [
            { id: 'up', path: 'M25,35 L25,15 L15,25 M25,15 L35,25', gridArea: '1 / 2 / 2 / 3' },
            { id: 'right', path: 'M15,25 L35,25 L25,15 M35,25 L25,35', gridArea: '2 / 3 / 3 / 4' },
            { id: 'down', path: 'M25,15 L25,35 L15,25 M25,35 L35,25', gridArea: '3 / 2 / 4 / 3' },
            { id: 'left', path: 'M35,25 L15,25 L25,15 M15,25 L25,35', gridArea: '2 / 1 / 3 / 2' }
        ];

        directions.forEach(dir => {
            const button = document.createElement('div');
            button.id = dir.id;
            button.className = 'dpad-button';
            button.style.cssText = `
                background-color: #333;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                user-select: none;
                pointer-events: auto;
                grid-area: ${dir.gridArea};
                border-radius: 5px;
            `;

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('viewBox', '0 0 50 50');

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', dir.path);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', 'white');
            path.setAttribute('stroke-width', '3');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');

            svg.appendChild(path);
            button.appendChild(svg);
            dpad.appendChild(button);
        });

        return dpad;
    }

    createButtons() {
        const buttons = document.createElement('div');
        buttons.id = 'buttons';
        buttons.style.display = 'flex';
        buttons.style.flexDirection = 'column';
        buttons.style.alignItems = 'flex-end';
        buttons.style.marginTop = '10px';

        const bButton = this.createButton('X');
        const aButton = this.createButton('Z');

        buttons.appendChild(bButton);
        buttons.appendChild(aButton);

        return buttons;
    }

    createButton(label) {
        const button = document.createElement('div');
        button.id = label.toLowerCase();
        button.textContent = label;
        button.className = 'action-button';
        button.style.cssText = `
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #f00;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            user-select: none;
            pointer-events: auto;
            position: absolute;
            bottom: ${label === 'X' ? '20px' : '80px'};
            right: ${label === 'X' ? '80px' : '20px'};
        `;
        return button;
    }

    addEventListeners() {
        const buttons = this.gamepad.querySelectorAll('.dpad-button, .action-button');
        buttons.forEach(button => {
            ['touchstart', 'touchend'].forEach(eventType => {
                button.addEventListener(eventType, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const isPressed = eventType === 'touchstart';
                    button.style.backgroundColor = isPressed ? '#555' : (button.classList.contains('dpad-button') ? '#333' : '#f00');
                    this.triggerEvent(button.id, isPressed);
                }, { passive: false });
            });
        });

        document.addEventListener('touchend', this.handleDoubleTap.bind(this), { passive: false });
        window.addEventListener('resize', this.updateGamepadLayout.bind(this));
        window.addEventListener('orientationchange', this.updateGamepadLayout.bind(this));
    }

    handleDoubleTap(event) {
        if (event.target.closest('.dpad-button, .action-button')) {
            return;  // Ignore double-taps on gamepad buttons
        }
        const currentTime = new Date().getTime();
        const tapLength = currentTime - this.lastTap;
        if (tapLength < 300 && tapLength > 0) {
            this.toggleGamepad();
            event.preventDefault();
        }
        this.lastTap = currentTime;
    }

    toggleGamepad() {
        this.isVisible = !this.isVisible;
        this.gamepad.style.display = this.isVisible ? 'flex' : 'none';
        this.updateGamepadLayout();

        // Toggle pointer-events for the entire document body
        document.body.style.pointerEvents = this.isVisible ? 'none' : 'auto';

        // Ensure gamepad buttons are always interactive when visible
        if (this.isVisible) {
            const buttons = this.gamepad.querySelectorAll('.dpad-button, .action-button');
            buttons.forEach(button => {
                button.style.pointerEvents = 'auto';
            });
        }
    }

    updateGamepadLayout() {
        const isMobile = window.innerWidth <= 767;

        if (isMobile && this.isVisible) {
            this.gamepad.style.display = 'flex';
            this.gamepad.style.bottom = '0';
            this.gamepad.style.left = '0';
            this.gamepad.style.right = '0';
            this.gamepad.style.top = 'auto';
            this.gamepad.style.flexDirection = 'row';
            this.gamepad.style.justifyContent = 'space-between';
            this.gamepad.style.alignItems = 'flex-end';
        } else {
            this.gamepad.style.display = 'none';
        }
    }

    on(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }

    off(eventName, callback) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName] = this.eventListeners[eventName].filter(cb => cb !== callback);
        }
    }

    triggerEvent(eventName, isPressed) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach(callback => callback(isPressed));
        }
    }

    removeEventListeners() {
        const buttons = this.gamepad.querySelectorAll('.dpad-button, .action-button');
        buttons.forEach(button => {
            ['touchstart', 'touchend'].forEach(eventType => {
                button.removeEventListener(eventType, this.handleButtonEvent);
            });
        });

        this.gamepad.removeEventListener('touchend', this.doubleTapHandler);
        window.removeEventListener('resize', this.resizeHandler);
        window.removeEventListener('orientationchange', this.resizeHandler);
    }

    destroy() {
        this.removeEventListeners();
        if (this.gamepad && this.gamepad.parentNode) {
            this.gamepad.parentNode.removeChild(this.gamepad);
        }
    }
}

const mobileGamepad = new MobileGamepad();