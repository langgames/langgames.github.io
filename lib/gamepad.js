class MobileGamepad {
    constructor() {
        this.gamepad = null;
        this.eventListeners = {};
        this.isVisible = false;
        this.lastTap = 0;
        this.createGamepad();
        this.addEventListeners();
        this.updateGamepadLayout();

        this.buttonColor = '#f00'
    }

    createGamepad() {
        this.gamepad = document.createElement('div');
        this.gamepad.id = 'mobile-gamepad';
        this.gamepad.style.position = 'fixed';
        this.gamepad.style.display = 'none';
        this.gamepad.style.padding = '10px';
        this.gamepad.style.pointerEvents = 'none';
        this.gamepad.style.backgroundColor = 'transparent';
        this.gamepad.style.zIndex = '9999'

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
            font-family: Helvetica, Arial, Sans-Serif;
            user-select: none;
            pointer-events: auto;
            position: absolute;
            bottom: ${label === 'X' ? '20px' : '80px'};
            right: ${label === 'X' ? '80px' : '20px'};
        `;
        return button;
    }

    setButtonColor(color) {
        this.buttonColor = color;
        [...this.gamepad.querySelectorAll('.action-button')].forEach(b => b.style.backgroundColor = color)
    }

    addEventListeners() {
        const buttons = this.gamepad.querySelectorAll('.dpad-button, .action-button');
        buttons.forEach(button => {
            ['touchstart', 'touchend'].forEach(eventType => {
                button.addEventListener(eventType, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const isPressed = eventType === 'touchstart';
                    button.style.backgroundColor = isPressed ? '#555' : (button.classList.contains('dpad-button') ? '#333' : this.buttonColor);
                    this.triggerEvent(button.id, isPressed);
                }, { passive: false });
            });
        });

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

    showOnDoubleTap() {
        document.addEventListener('touchend', this.handleDoubleTap.bind(this), { passive: false });
    }

    show() {
        this.toggleGamepad(true)
    }

    hide() {
        this.toggleGamepad(false)
    }

    toggleGamepad(value) {
        this.isVisible = value ?? !this.isVisible;
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

    checkIsMobile() {
        let check = false;
        (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
    };

    updateGamepadLayout() {
        const isMobile = this.checkIsMobile();

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

    registerDefaultButtons() {
        this.on('x', (keyDown) => inputData[0][88] = keyDown ? 3 : 4);
        this.on('z', (keyDown) => inputData[0][90] = keyDown ? 3 : 4);
        this.on('left', (keyDown) => inputData[0][37] = keyDown ? 3 : 4);
        this.on('down', (keyDown) => inputData[0][40] = keyDown ? 3 : 4);
        this.on('right', (keyDown) => inputData[0][39] = keyDown ? 3 : 4);
        this.on('up', (keyDown) => inputData[0][38] = keyDown ? 3 : 4);
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