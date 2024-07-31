class MobileKeyboard {
    constructor() {
        this.keyboard = null;
        this.eventListeners = {};
        this.isVisible = false;
        this.lastTap = 0;
        this.currentOpacity = 1;
        this.keyMappings = this.initializeKeyMappings();
        this.createKeyboard();
        this.addEventListeners();
        this.updateKeyboardLayout();
    }

    initializeKeyMappings() {
        return {
            'a': { code: 'KeyA', keyCode: 65 },
            'b': { code: 'KeyB', keyCode: 66 },
            'c': { code: 'KeyC', keyCode: 67 },
            'd': { code: 'KeyD', keyCode: 68 },
            'e': { code: 'KeyE', keyCode: 69 },
            'f': { code: 'KeyF', keyCode: 70 },
            'g': { code: 'KeyG', keyCode: 71 },
            'h': { code: 'KeyH', keyCode: 72 },
            'i': { code: 'KeyI', keyCode: 73 },
            'j': { code: 'KeyJ', keyCode: 74 },
            'k': { code: 'KeyK', keyCode: 75 },
            'l': { code: 'KeyL', keyCode: 76 },
            'm': { code: 'KeyM', keyCode: 77 },
            'n': { code: 'KeyN', keyCode: 78 },
            'o': { code: 'KeyO', keyCode: 79 },
            'p': { code: 'KeyP', keyCode: 80 },
            'q': { code: 'KeyQ', keyCode: 81 },
            'r': { code: 'KeyR', keyCode: 82 },
            's': { code: 'KeyS', keyCode: 83 },
            't': { code: 'KeyT', keyCode: 84 },
            'u': { code: 'KeyU', keyCode: 85 },
            'v': { code: 'KeyV', keyCode: 86 },
            'w': { code: 'KeyW', keyCode: 87 },
            'x': { code: 'KeyX', keyCode: 88 },
            'y': { code: 'KeyY', keyCode: 89 },
            'z': { code: 'KeyZ', keyCode: 90 },
            'space': { code: 'Space', keyCode: 32 },
            'enter': { code: 'Enter', keyCode: 13 },
            '⌫': { code: 'Backspace', keyCode: 8 },
            '-': { code: 'Minus', keyCode: 189 }
        };
    }

    convertKey(key) {
        key = key.toLowerCase();
        if (this.keyMappings[key]) {
            return this.keyMappings[key];
        } else {
            console.warn(`No mapping found for key: ${key}`);
            return { code: 'Unidentified', keyCode: 0 };
        }
    }

    createKeyboard() {
        this.keyboard = document.createElement('div');
        this.keyboard.id = 'mobile-keyboard';
        this.keyboard.style.position = 'fixed';
        this.keyboard.style.bottom = '0';
        this.keyboard.style.left = '0';
        this.keyboard.style.width = '100%';
        this.keyboard.style.display = 'none';
        this.keyboard.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.keyboard.style.padding = '10px';
        this.keyboard.style.boxSizing = 'border-box';
        this.keyboard.style.zIndex = '9999';

        const rows = [
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
            ['z', 'x', 'c', 'v', 'b', 'n', 'm', '-']
        ];

        rows.forEach(row => {
            const rowElement = document.createElement('div');
            rowElement.style.display = 'flex';
            rowElement.style.justifyContent = 'center';
            rowElement.style.marginBottom = '5px';

            row.forEach(key => {
                const button = this.createButton(key);
                rowElement.appendChild(button);
            });

            this.keyboard.appendChild(rowElement);
        });

        // Add special keys
        const specialRow = document.createElement('div');
        specialRow.style.display = 'flex';
        specialRow.style.justifyContent = 'center';

        const enterButton = this.createButton('Enter');
        enterButton.style.width = '20%';
        specialRow.appendChild(enterButton);

        const spaceButton = this.createButton('Space');
        spaceButton.style.width = '60%';
        specialRow.appendChild(spaceButton);

        const backspaceButton = this.createButton('⌫');
        backspaceButton.style.width = '20%';
        specialRow.appendChild(backspaceButton);

        this.keyboard.appendChild(specialRow);

        document.body.appendChild(this.keyboard);
    }

    createButton(label) {
        const button = document.createElement('button');
        button.className = 'action-button';
        button.textContent = label;
        button.style.width = '10%';
        button.style.height = '40px';
        button.style.margin = '2px';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.backgroundColor = 'rgba(68, 68, 68, 1)';
        button.style.color = 'white';
        button.style.fontSize = '16px';
        button.style.cursor = 'pointer';
        return button;
    }

    addEventListeners() {
        const buttons = this.keyboard.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const key = button.textContent.toLowerCase();
                this.handleKeyPress(key, true);
                this.setButtonPressed(button, true);
            }, { passive: false });

            button.addEventListener('touchend', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const key = button.textContent.toLowerCase();
                this.handleKeyPress(key, false);
                this.setButtonPressed(button, false);
            }, { passive: false });
        });

        window.addEventListener('resize', this.updateKeyboardLayout.bind(this));
        window.addEventListener('orientationchange', this.updateKeyboardLayout.bind(this));
    }

    handleDoubleTap(event) {
        if (event.target.closest('.action-button')) {
            return;  // Ignore double-taps on gamepad buttons
        }
        const currentTime = new Date().getTime();
        const tapLength = currentTime - this.lastTap;
        if (tapLength < 300 && tapLength > 0) {
            this.toggleKeyboard();
            event.preventDefault();
        }
        this.lastTap = currentTime;
    }

    showOnDoubleTap() {
        document.addEventListener('touchend', this.handleDoubleTap.bind(this), { passive: false });
    }

    show() {
        this.isVisible = true
        this.updateKeyboardLayout()
    }

    hide() {
        this.isVisible = false
        this.updateKeyboardLayout()
    }

    toggleKeyboard() {
        this.isVisible = !this.isVisible;
        this.updateKeyboardLayout();
    }

    handleKeyPress(key, isPressed) {
        const { code, keyCode } = this.convertKey(key);
        this.triggerEvent('input', code, keyCode, isPressed);
    }

    setButtonPressed(button, isPressed) {
        const currentColor = window.getComputedStyle(button).backgroundColor;
        const rgbValues = currentColor.match(/\d+/g);
        if (rgbValues) {
            const newColor = isPressed ? '102, 102, 102' : '68, 68, 68'; // Darker when pressed
            button.style.backgroundColor = `rgba(${newColor}, ${this.currentOpacity})`;
            button.style.color = `rgba(255, 255, 255, ${this.currentOpacity})`;
        }
    }

    checkIsMobile() {
        let check = false;
        (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
    };

    updateKeyboardLayout() {
        const isMobile = this.checkIsMobile();
        const isLandscape = window.innerWidth > window.innerHeight;

        if (isMobile && this.isVisible) {
            this.keyboard.style.display = 'block';

            if (isLandscape) {
                this.keyboard.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                this.updateKeyOpacity(0.5);
            } else {
                this.keyboard.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                this.keyboard.style.height = 'auto';
                this.updateKeyOpacity(1);
            }
        } else {
            this.keyboard.style.display = 'none';
        }
    }

    updateKeyOpacity(opacity) {
        this.currentOpacity = opacity;
        const buttons = this.keyboard.querySelectorAll('button');
        buttons.forEach(button => {
            const currentColor = window.getComputedStyle(button).backgroundColor;
            const rgbValues = currentColor.match(/\d+/g);
            if (rgbValues) {
                button.style.backgroundColor = `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, ${opacity})`;
                button.style.color = `rgba(255, 255, 255, ${opacity})`;
            }
        });
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

    triggerEvent(eventName, code, keyCode, isPressed) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach(callback => callback(code, keyCode, isPressed));
        }
    }

    destroy() {
        const buttons = this.keyboard.querySelectorAll('button');
        buttons.forEach(button => {
            button.removeEventListener('touchstart', this.handleKeyPress);
            button.removeEventListener('touchend', this.handleKeyPress);
        });

        document.removeEventListener('touchend', this.handleDoubleTap);
        window.removeEventListener('resize', this.updateKeyboardLayout);
        window.removeEventListener('orientationchange', this.updateKeyboardLayout);

        if (this.keyboard && this.keyboard.parentNode) {
            this.keyboard.parentNode.removeChild(this.keyboard);
        }
    }
}

const mobileKeyboard = new MobileKeyboard();

mobileKeyboard.on('input', (code, keyCode, isPressed) => {
    inputData[0][keyCode] = isPressed ? 3 : 4;
});
