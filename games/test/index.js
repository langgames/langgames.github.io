class Dialog {
    constructor() {
        this.dialog = null;
        this.content = null;
        this.typingStartSpeed = 1000;
        this.typingSpeed = 100; // milliseconds per character
        this.typingTimeout = null;
        this.fixedHeight = null;
        this.animationDuration = 300; // milliseconds
        this.isAnimating = false;
        this.createDialog();
    }

    createDialog() {
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: 'Jiskan24';
                src: url('../../fonts/jf-dot/JF-Dot-jiskan24.ttf');
                font-weight: 100 900;
            }

            .nes-dialog {
                position: fixed;
                bottom: 20px;
                left: 50%;
                width: 80%;
                max-width: 600px;
                background-color: #000;
                border: 4px solid #fff;
                padding: 20px;
                font-family: 'Jiskan24', sans-serif;
                color: #fff;
                font-size: 18px;
                line-height: 1.5;
                box-shadow: 0 0 0 4px #000;
                z-index: 1000;
                opacity: 0;
                transition: all ${this.animationDuration}ms ease-out;
                transform: translate(-50%, 100%);
            }

            .nes-dialog.fade-in {
                opacity: 1;
                transform: translate(-50%, 0);
            }

            .nes-dialog.from-top {
                transform: translate(-50%, -100%);
            }

            .nes-dialog.from-bottom {
                transform: translate(-50%, 100%);
            }

            .nes-dialog.from-left {
                transform: translate(-150%, 0);
            }

            .nes-dialog.from-right {
                transform: translate(50%, 0);
            }

            .nes-dialog::before {
                content: '';
                position: absolute;
                top: -8px;
                left: -8px;
                right: -8px;
                bottom: -8px;
                border: 4px solid #000;
                pointer-events: none;
            }

            .nes-dialog-content {
                outline: none;
                min-height: 1.5em;
                overflow-y: auto;
            }
            
            .nes-dialog-content::-webkit-scrollbar {
                width: 12px;
            }

            .nes-dialog-content::-webkit-scrollbar-track {
                background: #000;
                border: 2px solid #fff;
            }

            .nes-dialog-content::-webkit-scrollbar-thumb {
                background-color: #fff;
                border: 2px solid #000;
            }
        `;
        document.head.appendChild(style);

        this.dialog = document.createElement('div');
        this.dialog.className = 'nes-dialog';
        this.content = document.createElement('div');
        this.content.className = 'nes-dialog-content';
        this.dialog.appendChild(this.content);
        document.body.appendChild(this.dialog);
    }

    calculateHeight(text) {
        const tempElement = document.createElement('div');
        tempElement.style.visibility = 'hidden';
        tempElement.style.position = 'absolute';
        tempElement.style.width = this.content.clientWidth + 'px';
        tempElement.style.font = window.getComputedStyle(this.content).font;
        tempElement.style.lineHeight = window.getComputedStyle(this.content).lineHeight;
        tempElement.textContent = text;
        document.body.appendChild(tempElement);
        const height = tempElement.clientHeight;
        document.body.removeChild(tempElement);
        return height;
    }

    show(text = '', editable = false, direction = 'bottom') {
        this.dialog.style.display = 'block';
        this.content.contentEditable = editable;

        // Set initial position based on direction
        this.dialog.classList.remove('fade-in', 'from-top', 'from-bottom', 'from-left', 'from-right');
        this.dialog.classList.add(`from-${direction}`);

        if (this.fixedHeight) {
            this.content.style.height = `${this.fixedHeight}px`;
            this.content.style.overflowY = 'auto';
        } else {
            const calculatedHeight = this.calculateHeight(text);
            this.content.style.height = `${calculatedHeight}px`;
            this.content.style.overflowY = calculatedHeight > window.innerHeight * 0.6 ? 'auto' : 'hidden';
        }

        // Trigger the animation
        setTimeout(() => {
            this.dialog.classList.remove(`from-${direction}`);
            this.dialog.classList.add('fade-in');

            if (editable) {
                this.content.textContent = text;
                this.content.focus();

                // Set cursor to the end
                const range = document.createRange();
                const selection = window.getSelection();
                range.selectNodeContents(this.content);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);

                // Ensure the cursor is visible if content is scrollable
                this.content.scrollTop = this.content.scrollHeight;
            } else {
                this.animateText(text);
            }
        }, 500);
    }

    hide() {
        this.dialog.classList.remove('fade-in');
        this.dialog.style.opacity = '0';
        this.dialog.style.transform = 'translate(-50%, 100%)';
        setTimeout(() => {
            this.dialog.style.display = 'none';
            clearTimeout(this.typingTimeout);
        }, this.animationDuration);
    }

    animateText(text) {
        clearTimeout(this.typingTimeout);
        this.content.textContent = '';
        let index = 0;

        const typeNextChar = () => {
            if (index < text.length) {
                this.content.textContent += text[index];
                index++;
                this.typingTimeout = setTimeout(typeNextChar, this.typingSpeed);
            }
        };

        typeNextChar();
    }

    setText(text) {
        clearTimeout(this.typingTimeout);
        this.content.textContent = text;
    }

    getText() {
        return this.content.textContent;
    }

    isVisible() {
        return this.dialog.style.display === 'block';
    }

    setTypingSpeed(speed) {
        this.typingSpeed = speed;
    }
}

class ImageSlider {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.image = null;
        this.slideProgress = 0;
        this.slideDuration = 1000; // milliseconds
        this.isAnimating = false;
        this.direction = 'left';
        this.chromaKey = null;
        this.chromaTolerance = 50;
        document.body.appendChild(this.canvas)
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.image = img;
                resolve();
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    setCanvasSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    setDirection(direction) {
        if (['left', 'right', 'center'].includes(direction)) {
            this.direction = direction;
        } else {
            console.warn('Invalid direction. Using "left" as default.');
            this.direction = 'left';
        }
    }

    hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    setChromaKey(r, g, b, tolerance) {
        this.chromaKey = { r, g, b };
        if (tolerance)
            this.chromaTolerance = tolerance;
    }

    startSlideIn() {
        if (!this.image) {
            console.error('No image loaded. Call loadImage() first.');
            return;
        }

        this.isAnimating = true;
        this.slideProgress = 0;
        this.animate();
    }

    animate() {
        if (!this.isAnimating) return;

        this.slideProgress += 16.7 / this.slideDuration; // Assuming 60fps
        if (this.slideProgress >= 1) {
            this.slideProgress = 1;
            this.isAnimating = false;
        }

        this.draw();

        if (this.isAnimating) {
            requestAnimationFrame(() => this.animate());
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const drawHeight = this.canvas.height;
        const drawWidth = this.image.width * (drawHeight / this.image.height);

        let startX, endX;
        switch (this.direction) {
            case 'left':
                startX = -drawWidth;
                endX = 0;
                break;
            case 'right':
                startX = this.canvas.width;
                endX = this.canvas.width - drawWidth;
                break;
            case 'center':
                startX = (this.canvas.width - drawWidth) / 2;
                endX = startX;
                break;
        }

        const currentX = startX + (endX - startX) * this.slideProgress;
        const currentOpacity = this.slideProgress;

        // Apply chroma key effect if set
        if (this.chromaKey) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = drawWidth;
            tempCanvas.height = drawHeight;
            const tempCtx = tempCanvas.getContext('2d');

            tempCtx.drawImage(this.image, 0, 0, drawWidth, drawHeight);
            const imageData = tempCtx.getImageData(0, 0, drawWidth, drawHeight);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 4];
                if (
                    Math.abs(r - this.chromaKey.r) < this.chromaTolerance &&
                    Math.abs(g - this.chromaKey.g) < this.chromaTolerance &&
                    Math.abs(b - this.chromaKey.b) < this.chromaTolerance &&
                    (!this.chromaKey.a || Math.abas(a - this.chromaKey.a) < this.chromaTolerance)
                ) {
                    data[i + 3] = 0;
                }
            }

            tempCtx.putImageData(imageData, 0, 0);

            this.ctx.save();
            this.ctx.globalAlpha = currentOpacity;
            this.ctx.drawImage(tempCanvas, currentX, 0, drawWidth, drawHeight);
            this.ctx.restore();
        } else {
            this.ctx.save();
            this.ctx.globalAlpha = currentOpacity;
            this.ctx.drawImage(this.image, currentX, 0, drawWidth, drawHeight);
            this.ctx.restore();
        }
    }
}

// Usage example
let imageSlider
async function demo() {
    const viewportHeight = window.innerHeight
    const aspectRatio = 16 / 9;
    const canvasHeight = viewportHeight;
    const canvasWidth = canvasHeight * aspectRatio;

    imageSlider = new ImageSlider();
    imageSlider.setCanvasSize(canvasWidth, canvasHeight);
    imageSlider.setDirection('left');
    const rgb = imageSlider.hexToRgb('#c0c0c0')
    imageSlider.setChromaKey(rgb.r, rgb.g, rgb.b, 5);

    await imageSlider.loadImage('../../favicon.ico');
    imageSlider.startSlideIn();

    const dialog = new Dialog();
    dialog.show("Hello, I'm the speaker!", false, 'bottom');
}

window.addEventListener('load', demo);

window.addEventListener('resize', () => {
    const viewportHeight = window.innerHeight;
    const aspectRatio = 16 / 9;
    const canvasHeight = viewportHeight;
    const canvasWidth = canvasHeight * aspectRatio;

    const imageSlider = new ImageSlider();
    imageSlider.setCanvasSize(canvasWidth, canvasHeight);
    imageSlider.draw();
});