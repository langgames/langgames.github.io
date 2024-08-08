let imageSlider;
let annotatedDialog;
let currentSceneIndex = 0;
let currentImage = null;
const isMobile = mobileGamepad.checkIsMobile()

function updateArrowVisibility() {
    leftArrow.style.visibility = currentSceneIndex > 0 ? 'visible' : 'hidden';
    rightArrow.style.visibility = currentSceneIndex < scenes.length - 1 ? 'visible' : 'hidden';
}

async function init() {
    imageSlider = new ImageSlider();
    imageSlider.setDirection('center');
    const rgb = imageSlider.hexToRgb('#c0c0c0');
    imageSlider.setChromaKey(rgb.r, rgb.g, rgb.b, 5);
    await imageSlider.loadImage('./scenes/title.webp');
    imageSlider.startSlideIn();

    // Create container for all text
    const textContainer = document.createElement('div');
    textContainer.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 0;
        right: 0;
        text-align: center;
        color: white;
    `;
    if (isMobile) {
        textContainer.style.bottom = undefined
        textContainer.style.top = '20px'
    }

    // Define text outline style
    const textOutlineStyle = `
        text-shadow: 
            -1px -1px 0 #000,
            1px -1px 0 #000,
            -1px 1px 0 #000,
            1px 1px 0 #000;
    `;

    // Add instruction text
    const instructionText = document.createElement('div');
    instructionText.innerHTML = 'Press the arrow keys to select words<br>Press X and Z for definitions and readings';
    instructionText.style.cssText = `
        font-size: 24px;
        margin-bottom: 20px;
        font-weight: bold;
        ${textOutlineStyle}
    `;
    textContainer.appendChild(instructionText);

    // Add "Click to start" text
    const startText = document.createElement('div');
    startText.textContent = 'Click to start';
    startText.style.cssText = `
        font-size: 36px;
        font-weight: bold;
        ${textOutlineStyle}
    `;
    textContainer.appendChild(startText);

    document.body.appendChild(textContainer);

    // Add click event listener
    const clickHandler = async () => {
        // Remove the text container and click event listener
        document.body.removeChild(textContainer);
        document.removeEventListener('click', clickHandler);

        // Run these functions when the screen is clicked
        annotatedDialog = new AnnotatedDialog();
        createArrows();
        await loadScene(0);
    };

    document.addEventListener('click', clickHandler);
}

async function loadScene(index) {
    if (index < 0 || index >= scenes.length) return;

    currentSceneIndex = index;
    const scene = convertToJSONFormat(scenes[currentSceneIndex]);

    if (currentImage !== scene.image) {
        await imageSlider.loadImage(scene.image);
        imageSlider.startSlideIn();
        currentImage = scene.image
    }

    annotatedDialog.show(scene.words, isMobile ? 'top' : 'bottom');
    if (isMobile) {
        annotatedDialog.dialog.style.bottom = undefined
        annotatedDialog.dialog.style.top = '20px'
    }

    updateArrowVisibility();
}

function createArrows() {
    const arrowStyle = `
        position: fixed;
        bottom: ${isMobile ? '30%' : 0};
        transform: translateY(-50%);
        font-size: 48px;
        color: white;
        background-color: rgba(0, 0, 0, 0.5);
        border: none;
        padding: 10px;
        cursor: pointer;
        pointer-events: auto;
    `;

    leftArrow = document.createElement('button');
    leftArrow.innerHTML = '&#8592;'; // Left arrow character
    leftArrow.style.cssText = arrowStyle + 'left: 20px;';
    leftArrow.onclick = () => loadScene(currentSceneIndex - 1);
    leftArrow.style.visibility = "hidden"

    rightArrow = document.createElement('button');
    rightArrow.innerHTML = '&#8594;'; // Right arrow character
    rightArrow.style.cssText = arrowStyle + 'right: 20px;';
    rightArrow.onclick = () => loadScene(currentSceneIndex + 1);
    rightArrow.style.visibility = "hidden"

    document.body.appendChild(leftArrow);
    document.body.appendChild(rightArrow);
}

window.addEventListener('load', init);

window.addEventListener('resize', () => {
    if (imageSlider && imageSlider.image) {
        imageSlider.resizeCanvas();
        imageSlider.draw();
    }
});

const keys = { x: 'x', z: 'z', left: 'arrowleft', down: 'arrowdown', right: 'arrowright', up: 'arrowup' };
Object.entries(keys).forEach(([btn, key]) =>
    mobileGamepad.on(btn, down => document.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { key })))
);
mobileGamepad.setButtonColor('#6482AD')
mobileGamepad.show()