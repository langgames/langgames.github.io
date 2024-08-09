///////////////////////////////////////////////////////////////////////////////
class Dialog {
    constructor() {
        this.dialog = null;
        this.content = null;
        this.menu = null;
        this.onMenuClick = null;
        this.typingStartSpeed = 1000;
        this.typingSpeed = 100; // milliseconds per character
        this.typingTimeout = null;
        this.fixedHeight = null;
        this.animationDuration = 300; // milliseconds
        this.isAnimating = false;
        this.createDialog();

        this.setOnMenuClick((e) => {
            e.stopPropagation()

            if (!this.isTypingAnimationComplete) {
                this.completeTypingAnimation();
            }

            const isAttachedToDocument = this.menu.parentNode === document.body;
            if (isAttachedToDocument) {
                this.dialog.style.display = 'block';
                this.dialog.classList.remove('fade-in', 'from-top', 'from-bottom', 'from-left', 'from-right');
                this.dialog.classList.add('from-bottom');

                // Trigger the animation
                setTimeout(() => {
                    this.dialog.classList.remove('from-bottom');
                    this.dialog.classList.add('fade-in');
                    document.body.removeChild(this.menu);
                    this.menu.classList.remove('up')
                    this.menu.classList.add('down')
                    this.dialog.appendChild(this.menu);
                }, 100);
            } else {
                this.dialog.removeChild(this.menu);
                document.body.appendChild(this.menu);
                this.menu.classList.remove('down')
                this.menu.classList.add('up')
                this.remove()
            }
        })
    }

    createDialog() {
        if (!document.head.querySelector('#nes-dialog-style')) {
            const style = document.createElement('style');
            style.id = "nes-dialog-style"
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
                    pointer-events: auto;
                    user-select: none;
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

                .nes-dialog-menu {
                    position: absolute;
                    left: calc(50% - 15px);
                    bottom: -2px;
                    width: 30px;
                    height: 20px;
                    border: 2px solid white;
                    background-color: black;
                    pointer-events: auto;
                    z-index: 9999;
                }
                
                .nes-dialog-menu::after {
                    content: '';
                    display: block;
                    position: relative;
                    left: calc(50% - 5px);
                    top: 7.5px;
                    width: 0; 
                    height: 0; 
                    border-left: 5px solid transparent;
                    border-right: 5px solid transparent;
                }

                .nes-dialog-menu.up::after {
                    border-bottom: 5px solid white;
                }
                
                .nes-dialog-menu.down::after {
                    border-top: 5px solid white;
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
        }

        this.dialog = document.createElement('div');
        this.dialog.className = 'nes-dialog';
        this.content = document.createElement('div');
        this.content.className = 'nes-dialog-content';
        this.menu = document.createElement('div');
        this.menu.classList.add('nes-dialog-menu', 'down');
        this.dialog.appendChild(this.content);
        this.dialog.appendChild(this.menu);
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

    // calling with empty text keeps current text
    show(text = '', editable = false, direction = 'bottom') {
        this.dialog.style.display = 'block';
        this.content.contentEditable = editable;

        // Set initial position based on direction
        this.dialog.classList.remove('fade-in', 'from-top', 'from-bottom', 'from-left', 'from-right');
        this.dialog.classList.add(`from-${direction}`);

        if (text) {
            if (this.fixedHeight) {
                this.dialog.style.height = `${this.fixedHeight}px`;
                this.dialog.style.overflowY = 'auto';
            } else {
                const calculatedHeight = this.calculateHeight(text);
                this.dialog.style.height = `${calculatedHeight}px`;
                this.dialog.style.overflowY = calculatedHeight > window.innerHeight * 0.6 ? 'auto' : 'hidden';
            }
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
            } else if (text) {
                this.animateText(text);
            }
        }, 500);
    }

    remove() {
        this.dialog.classList.remove('fade-in', 'from-top', 'from-bottom', 'from-left', 'from-right');
    }

    animateText(text) {
        clearTimeout(this.typingTimeout);
        this.content.textContent = '';
        let index = 0;

        const typeNextChar = () => {
            if (index < text.length) {
                this.content.innerHTML += `<span>${text[index]}</span>`
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

    setOnMenuClick(onClick) {
        if (this.onMenuClick)
            this.menu.removeEventListener('click', this.onMenuClick)
        this.onMenuClick = onClick
        this.menu.addEventListener('click', this.onMenuClick)
    }
}

class AnnotatedDialog extends Dialog {
    constructor() {
        super();
        this.words = [];
        this.currentWordIndex = 0;
        this.highlightColor = '#C0C0C0';
        this.highlightedStyle = `background-color: ${this.highlightColor}; padding: 2px; color: black;`;
        this.speechBubble = null;
        this.isTypingAnimationComplete = false;
        this.separator = '';
        this.highlightDuration = 3000; // 3 seconds by default
        this.highlightTimeout = null;
        this.stops = ['.', '。', '!', '?', '！', '？']; // Array of sentence-ending punctuation
        this.isHighlightVisible = false;
        this.addListeners();
    }

    addListeners() {
        let xKeyDown = false;
        let zKeyDown = false;

        this.dialog.addEventListener('click', (event) => {
            this.onClickWord(event.target)
        })

        document.addEventListener('keydown', (event) => {
            if (this.isVisible()) {
                switch (event.key.toLowerCase()) {
                    case 'arrowright':
                    case 'arrowleft':
                    case 'arrowdown':
                    case 'arrowup':
                        if (!this.isTypingAnimationComplete) {
                            this.completeTypingAnimation();
                        }
                        if (!this.isHighlightVisible) {
                            this.showHighlight();
                            break;
                        }
                        switch (event.key.toLowerCase()) {
                            case 'arrowright':
                                this.highlightNextWord();
                                break;
                            case 'arrowleft':
                                this.highlightPreviousWord();
                                break;
                            case 'arrowdown':
                                this.jumpToNextSentence();
                                break;
                            case 'arrowup':
                                this.jumpToPreviousSentence();
                                break;
                        }
                        break;
                    case 'x':
                        if (!xKeyDown) {
                            this.toggleReading();
                            xKeyDown = true;
                        }
                        break;
                    case 'z':
                        if (!zKeyDown) {
                            this.toggleDefinition();
                            zKeyDown = true;
                        }
                        break;
                }
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key.toLowerCase() === 'x') {
                xKeyDown = false;
            } else if (event.key.toLowerCase() === 'z') {
                zKeyDown = false;
            }
        });
    }

    show(words = [], direction = 'bottom', separator = '') {
        if (!Array.isArray(words) || !words.every(this.isValidWordObject)) {
            throw new Error('Invalid input: expected an array of word objects');
        }

        this.words = words;
        this.separator = separator
        this.currentWordIndex = 0;
        this.isTypingAnimationComplete = false;

        const text = this.words.map(wordObj => wordObj.word).join(separator);
        super.show(text, false, direction);

        this.renderHighlightedText(separator);
        this.createSpeechBubble();
    }

    isValidWordObject(obj) {
        return obj && typeof obj === 'object' &&
            'word' in obj && typeof obj.word === 'string' &&
            'reading' in obj && typeof obj.reading === 'string' &&
            'definition' in obj && typeof obj.definition === 'string';
    }

    onClickWord(element) {
        if (!this.isTypingAnimationComplete) {
            this.completeTypingAnimation();
        }
        for (let [index, e] of [...this.dialog.querySelectorAll('span')].entries()) {
            if (element === e) {
                this.currentWordIndex = index
                const word = this.words[index]
                this.showHighlight()
                this.renderHighlightedText();
                this.startHighlightTimer();

                const sb = this.speechBubble
                if (sb) {
                    const content = sb.textContent
                    if (content === word.reading) {
                        this.showSpeechBubble(word.definition)
                    } else if (content === word.definition) {
                        this.hideSpeechBubble()
                    } else {
                        this.showSpeechBubble(word.reading)
                    }
                }
                return index
            }
        }
        this.hideSpeechBubble()
        this.hideHighlight()
        return -1
    }

    highlightNextWord() {
        if (this.currentWordIndex < this.words.length - 1) {
            this.currentWordIndex++;
            this.renderHighlightedText();
            this.hideSpeechBubble();
            this.startHighlightTimer();
        }
    }

    highlightPreviousWord() {
        if (this.currentWordIndex > 0) {
            this.currentWordIndex--;
            this.renderHighlightedText();
            this.hideSpeechBubble();
            this.startHighlightTimer();
        }
    }

    jumpToNextSentence() {
        let nextSentenceStart = this.findNextSentenceStart(this.currentWordIndex);
        if (nextSentenceStart === -1) {
            // If no next sentence, wrap to the beginning
            nextSentenceStart = 0;
        }
        this.currentWordIndex = nextSentenceStart;
        this.renderHighlightedText();
        this.hideSpeechBubble();
        this.startHighlightTimer();
    }

    jumpToPreviousSentence() {
        let previousSentenceStart = this.findPreviousSentenceStart(this.currentWordIndex);
        if (previousSentenceStart === -1) {
            // If no previous sentence, wrap to the last sentence
            previousSentenceStart = this.findPreviousSentenceStart(this.words.length);
        }
        this.currentWordIndex = previousSentenceStart;
        this.renderHighlightedText();
        this.hideSpeechBubble();
        this.startHighlightTimer();
    }

    findNextSentenceStart(startIndex) {
        for (let i = startIndex + 1; i < this.words.length; i++) {
            if (this.stops.includes(this.words[i - 1].word)) {
                return i;
            }
        }
        return -1; // No next sentence found
    }

    findPreviousSentenceStart(startIndex) {
        for (let i = startIndex - 1; i >= 0; i--) {
            if (i === 0 || this.stops.includes(this.words[i - 1].word)) {
                return i;
            }
        }
        return -1; // No previous sentence found
    }

    startHighlightTimer() {
        clearTimeout(this.highlightTimeout);
        this.highlightTimeout = setTimeout(() => {
            if (!this.isSpeechBubbleVisible()) {
                this.hideHighlight();
            }
        }, this.highlightDuration);
    }

    hideHighlight() {
        const highlightedWord = document.getElementById('highlighted-word');
        if (highlightedWord) {
            highlightedWord.style.backgroundColor = 'transparent';
            highlightedWord.style.color = 'inherit';
        }
        this.isHighlightVisible = false;
    }

    showHighlight() {
        this.isHighlightVisible = true;
        this.renderHighlightedText();
        this.startHighlightTimer();
    }

    renderHighlightedText(separator = this.separator) {
        let highlightedText = this.words.map((wordObj, index) => {
            if (index === this.currentWordIndex && this.isHighlightVisible) {
                return `<span id="highlighted-word" style="${this.highlightedStyle};">${wordObj.word}</span>`;
            }
            return `<span>${wordObj.word}</span>`;
        }).join(separator);

        this.content.innerHTML = highlightedText;
    }

    setHighlightDuration(duration) {
        this.highlightDuration = duration;
    }

    setStops(stops) {
        if (Array.isArray(stops)) {
            this.stops = stops;
        }
    }

    completeTypingAnimation() {
        clearTimeout(this.typingTimeout);
        const text = this.words.map(wordObj => wordObj.word).join(this.separator ?? '');
        this.content.textContent = text;
        this.isTypingAnimationComplete = true;
        this.renderHighlightedText();
    }

    createSpeechBubble() {
        if (!this.speechBubble) {
            this.speechBubble = document.createElement('div');
            this.speechBubble.style.cssText = `
                position: absolute;
                background-color: white;
                border: 2px solid black;
                border-radius: 10px;
                padding: 10px;
                font-family: 'Jiskan24', sans-serif;
                font-size: 16px;
                max-width: 200px;
                display: none;
                z-index: 1001;
            `;
            document.body.appendChild(this.speechBubble);
        }
    }

    isSpeechBubbleVisible() {
        return this.speechBubble && this.speechBubble.style.display === 'block';
    }

    showSpeechBubble(content) {
        const highlightedWord = document.getElementById('highlighted-word');
        if (!highlightedWord) return;

        this.speechBubble.style.display = 'block';
        this.speechBubble.textContent = content;

        const rect = highlightedWord.getBoundingClientRect();
        const bubbleRect = this.speechBubble.getBoundingClientRect();

        let left = rect.left + window.scrollX + (rect.width - bubbleRect.width) / 2;
        let top = rect.top + window.scrollY - bubbleRect.height - 10;

        // Adjust position if it overflows the window
        if (left < 0) left = 0;
        if (left + bubbleRect.width > window.innerWidth) left = window.innerWidth - bubbleRect.width;
        if (top < 0) top = rect.bottom + window.scrollY + 10; // Show below if not enough space above

        this.speechBubble.style.left = `${left}px`;
        this.speechBubble.style.top = `${top}px`;


        this.showHighlight(); // Ensure highlight is visible when speech bubble is shown
        clearTimeout(this.highlightTimeout); // Clear any existing timeout
    }

    hideSpeechBubble() {
        if (this.speechBubble) {
            this.speechBubble.textContent = ''
            this.speechBubble.style.display = 'none';
            this.startHighlightTimer(); // Start the timer to hide highlight after closing speech bubble
        }
    }

    toggleSpeechBubble(content) {
        const sb = this.speechBubble
        if (sb && sb.style.display === 'block' && sb.textContent === content) {
            this.hideSpeechBubble()
        } else {
            this.showSpeechBubble(content)
        }
    }

    toggleReading() {
        const reading = this.words[this.currentWordIndex].reading;
        this.toggleSpeechBubble(reading);
    }

    toggleDefinition() {
        const definition = this.words[this.currentWordIndex].definition;
        this.toggleSpeechBubble(definition);
    }

    setHighlightColor(color) {
        this.highlightColor = color;
        this.renderHighlightedText();
    }

    getText() {
        return this.words.map(wordObj => wordObj.word).join(' ');
    }

    setText(words, separator = '') {
        if (!Array.isArray(words) || !words.every(this.isValidWordObject)) {
            throw new Error('Invalid input: expected an array of word objects');
        }

        this.words = words;
        this.currentWordIndex = 0;
        const text = this.words.map(wordObj => wordObj.word).join(separator);
        super.setText(text);
        this.renderHighlightedText(separator);
        this.hideSpeechBubble();
    }

    setWordInfo(index, reading, definition) {
        if (index >= 0 && index < this.words.length) {
            this.words[index].reading = reading;
            this.words[index].definition = definition;
            this.renderHighlightedText();
        }
    }

    getWordInfo(index) {
        if (index >= 0 && index < this.words.length) {
            return this.words[index];
        }
        return null;
    }
}

class ImageSlider {
    constructor() {
        this.canvasWrapper = document.createElement('div');
        this.canvas = document.createElement('canvas');
        this.canvasWrapper.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.image = null;
        this.slideProgress = 0;
        this.slideDuration = 1000; // milliseconds
        this.isAnimating = false;
        this.direction = 'left';
        this.chromaKey = null;
        this.chromaTolerance = 50;
        this.onClick = null; // Initialize onClick property

        this.canvasWrapper.style.position = 'fixed';
        this.canvasWrapper.style.top = '0';
        this.canvasWrapper.style.left = '0';
        this.canvasWrapper.style.width = '100%';
        this.canvasWrapper.style.height = '100%';
        this.canvasWrapper.style.display = 'flex';
        this.canvasWrapper.style.justifyContent = 'center';
        this.canvasWrapper.style.alignItems = 'center';
        this.canvasWrapper.style.pointerEvents = 'auto';

        document.body.appendChild(this.canvasWrapper);

        this.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.image = img;
                this.resizeCanvas(); // Resize canvas when image is loaded
                resolve();
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    resizeCanvas() {
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const imgAspectRatio = this.image.width / this.image.height;
        const viewportAspectRatio = viewportWidth / viewportHeight;

        let canvasWidth, canvasHeight;

        if (imgAspectRatio > viewportAspectRatio) {
            // Image is wider than viewport
            canvasWidth = viewportWidth;
            canvasHeight = canvasWidth / imgAspectRatio;
        } else {
            // Image is taller than viewport
            canvasHeight = viewportHeight;
            canvasWidth = canvasHeight * imgAspectRatio;
        }

        this.setCanvasSize(canvasWidth, canvasHeight);
    }

    setCanvasSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.canvas.style.objectFit = 'contain';
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
        if (tolerance !== undefined) {
            this.chromaTolerance = tolerance;
        }
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

        const drawWidth = this.canvas.width;
        const drawHeight = this.canvas.height;

        let startX, endX;
        switch (this.direction) {
            case 'left':
                startX = -drawWidth;
                endX = 0;
                break;
            case 'right':
                startX = drawWidth;
                endX = 0;
                break;
            case 'center':
                startX = 0;
                endX = 0;
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
                if (
                    Math.abs(r - this.chromaKey.r) < this.chromaTolerance &&
                    Math.abs(g - this.chromaKey.g) < this.chromaTolerance &&
                    Math.abs(b - this.chromaKey.b) < this.chromaTolerance
                ) {
                    data[i + 3] = 0; // Set alpha to 0 (transparent)
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

    handleClick(event) {
        if (this.onClick) {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.onClick({ x, y });
        }
    }
}

// // Usage example
// let imageSlider;
// async function demo() {
//     imageSlider = new ImageSlider();
//     imageSlider.setDirection('left');
//     const rgb = imageSlider.hexToRgb('#c0c0c0');
//     imageSlider.setChromaKey(rgb.r, rgb.g, rgb.b, 5);
//     imageSlider.onClick = (position) => {
//         console.log('Canvas clicked at:', position);
//     };

//     await imageSlider.loadImage('../../favicon.ico');
//     imageSlider.startSlideIn();

//     const dialog = new Dialog();
//     dialog.show("Hello, I'm the speaker!", false, 'bottom');
// }

// window.addEventListener('load', demo);

// window.addEventListener('resize', () => {
//     if (imageSlider && imageSlider.image) {
//         imageSlider.resizeCanvas();
//         imageSlider.draw();
//     }
// });
