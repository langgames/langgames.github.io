
'use strict';

let player;
let particleEmitter;
let fontImage;

class Player extends EngineObject {
    constructor(pos) {
        super(pos, vec2(20));
        this.setCollision();

        this.friction = 0.9
        this.acc = 0.2

        this.jumpTimer = new Timer

        this.angle = 0
        this.dir = 1
        this.frameOffset = 0
    }

    update() {
        super.update();
        this.gravityScale = 1
        this.frameOffset = 0

        const moveInput = keyIsDown(39) - keyIsDown(37);

        // jump
        if (keyIsDown(38) || keyIsDown(32)) {
            if (this.jumpTimer.active()) {
                this.velocity.y += 2
            }

            if (this.isGrounded()) {
                this.jumpTimer.set(0.15)
            }
        }

        // wall climp
        if (moveInput && !this.velocity.x) {
            this.gravityScale = 0
            const wallInput = keyIsDown(38) - keyIsDown(40);
            this.velocity.y += wallInput * this.acc
            this.velocity.y *= this.friction
            this.angle = sign(moveInput) * 3 * PI / 2
            if (wallInput) {
                this.frameOffset = 16
                this.dir = 1 - sign(moveInput * wallInput)
            } else {
                this.frameOffset = 0
            }
        } else if (moveInput) {
            this.dir = 1 - sign(moveInput)
            this.frameOffset = Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1 ? 16 : 0
        }

        this.velocity.x += moveInput * this.acc


        if (!this.isGrounded()) {
            this.velocity.x *= this.friction
        } else {
            this.angle = 0
        }

        // if (this.velocity.y < 0 && !this.climbTimer.active()) // slight extra gravity when moving down
        //     this.velocity.y += gravity * 0.2;
    }

    render() {
        const frame = Math.floor(time * 4) % 6 + this.frameOffset
        drawTile(this.pos.add(vec2(16)), vec2(50), tile(frame, 16), undefined, this.angle, this.dir)
    }

    isGrounded() {
        return this.groundObject ? true : false
    }
}

class Box extends EngineObject {
    constructor(pos, size) {
        super(pos, size)
        this.setCollision()
        this.mass = 0
        this.gravityScale = 0
        this.canPass = false
    }

    collideWithObject(object) {
        if (this.canPass && keyWasPressed(40)) {
            return false
        }

        if (this.canPass && object.velocity.y > 0) {
            return false
        }
        return true
    }

    render() {
        this.color = this.canPass ? new Color().setHex('#8B6E4E') : new Color(0, 0, 0, 0)
        this.renderOrder = -1
        super.render()
    }
}
function gameInit() {
    objectMaxSpeed = 100
    cameraScale = 1
    gravity = -1

    mobileGamepad.on('x', (keyDown) => inputData[0][38] = keyDown ? 3 : 4);
    mobileGamepad.on('z', (keyDown) => inputData[0][40] = keyDown ? 3 : 4);
    mobileGamepad.on('left', (keyDown) => inputData[0][37] = keyDown ? 3 : 4);
    mobileGamepad.on('down', (keyDown) => inputData[0][40] = keyDown ? 3 : 4);
    mobileGamepad.on('right', (keyDown) => inputData[0][39] = keyDown ? 3 : 4);
    mobileGamepad.on('up', (keyDown) => inputData[0][38] = keyDown ? 3 : 4);

    if (window.ontouchstart && window.ontouchend) {
        ontouchstart = ontouchend = () => { }
    }
}

let postInit = true
function gameUpdate() {
    if (postInit) {
        postInit = false
        addPlatforms()
        drawElementBoxes()
    }
}

function gameUpdatePost() {
}

function gameRender() {
}

function gameRenderPost() {
}

// Start the LittleJS engine with our custom init function
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);


function drawElementBoxes() {
    const mediaQuery = window.matchMedia('(max-width: 800px) and (orientation: landscape)');
    engineObjects.forEach(o => o instanceof Box && (o.canPass = false))
    engineObjectsDestroy()
    player = null
    const sizeH = vec2(mainCanvasSize.x, 10)
    const sizeV = vec2(10, mainCanvasSize.y)
    const bot = cameraPos.add(vec2(0, -mainCanvasSize.y / 2 - 8 + 25))
    const top = cameraPos.add(vec2(0, mainCanvasSize.y / 2))
    const left = cameraPos.add(vec2(-mainCanvasSize.x / 2 - 8, 0))
    const right = cameraPos.add(vec2(mainCanvasSize.x / 2 - 24, 0))
    new Box(bot, sizeH)
    new Box(top, sizeH)
    new Box(left, sizeV)
    new Box(right, sizeV)
    for (const element of [...document.querySelector('.game-list').children]) {
        if (!player) {
            const { x, y, width } = element.getBoundingClientRect();
            player = new Player(screenToWorld(vec2(x + width / 2, y + -32)));
        }
        createBoxFromElement(element, 'top')
        if (!mediaQuery.matches) {
            createBoxFromElement(element, 'middle')
        }
        createBoxFromElement(element, 'bottom')
    }
    for (const element of [...document.querySelector('.platform-container').children]) {
        createBoxFromElement(element, 'top')
    }
}

function createBoxFromElement(element, position = 'bottom') {
    if (!element) {
        console.error(`Element not found with selector: ${element}`);
        return null;
    }

    const { x, y, width, height } = element.getBoundingClientRect();
    let pos;

    switch (position.toLowerCase()) {
        case 'top':
            pos = screenToWorld(vec2(x + width / 2, y));
            break;
        case 'bottom':
            pos = screenToWorld(vec2(x + width / 2, y + height));
            break;
        case 'left':
            pos = screenToWorld(vec2(x, y + height / 2));
            break;
        case 'right':
            pos = screenToWorld(vec2(x + width, y + height / 2));
            break;
        case 'middle':
            pos = screenToWorld(vec2(x + width / 2, y + height / 2));
            break;
        default:
            console.error(`Invalid position: ${position}. Use 'top', 'bottom', 'left', or 'right'.`);
            return null;
    }

    const size = vec2(screenToWorld(vec2(x + width, y + height)).subtract(screenToWorld(vec2(x, y))).x, 4);

    const box = new Box(pos, size);
    box.canPass = true;

    return box;
}

function addPlatforms() {
    const platformContainer = document.querySelector('.platform-container');
    platformContainer.innerHTML = ''; // Clear existing platforms

    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const groundHeight = 50; // Height of the ground element
    const minSpaceForPlatforms = 300; // Minimum space required to add platforms
    const platformHeight = 20;
    const platformWidth = 150;
    const spacing = 50; // Minimum space between platforms

    // Check if there's enough space for platforms
    if (windowHeight - groundHeight < minSpaceForPlatforms) {
        return; // Don't add platforms if there's not enough space
    }

    const availableSpace = windowHeight - groundHeight - 300; // Leave some space at the top
    const numPlatforms = Math.floor(availableSpace / spacing) - 1;

    for (let i = 0; i < numPlatforms; i++) {
        const platform = document.createElement('div');
        platform.className = 'platform';

        // Alternate left and right
        const left = windowWidth / 2 + (i % 2 ? 1 : -1) * platformWidth / 2 - platformWidth / 2

        let previousBottom = 0
        if (platformContainer.lastChild)
            previousBottom = parseFloat(platformContainer.lastChild.style.bottom);
        const bottom = previousBottom + spacing;

        platform.style.cssText = `
            position: absolute;
            width: ${platformWidth}px;
            height: ${platformHeight}px;
            left: ${left}px;
            bottom: ${bottom}px;
            background-color: var(--button);
            border: 2px solid var(--ground);
        `;

        platformContainer.appendChild(platform);
    }
}

function handleResize() {
    requestAnimationFrame(() => {
        addPlatforms()
        requestAnimationFrame(drawElementBoxes)
    })
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', drawElementBoxes);