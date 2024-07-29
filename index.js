
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
        this.color = this.canPass ? new Color(0, 0, 1) : new Color(0, 0, 0, 0)
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

    ontouchstart = ontouchend = () => { }
}

let postInit = true
function gameUpdate() {
    if (postInit) {
        postInit = false
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
    engineObjectsDestroy()
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
    player = new Player(bot.add(vec2(0, 24)), vec2(20));
    // for (const e of [...document.querySelector('#content').children]) {
    //     const { x, y, width, height } = e.getBoundingClientRect()
    //     let pos = screenToWorld(vec2(x, y + height))
    //     const size = vec2(screenToWorld(vec2(x + width, y + height)).subtract(pos).x, 1)
    //     pos = pos.add(size.scale(0.5))
    //     const box = new Box(pos, size)
    //     box.canPass = true
    // }
}

window.addEventListener('resize', drawElementBoxes)