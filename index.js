
'use strict';

let player;
let particleEmitter;
let fontImage;
let coinsCollected = 0
const messageTimer = new Timer

const coinColor = getColor('coin')
const createCoinParticle = pos => new ParticleEmitter(
    pos, 0,                          // pos, angle
    5, .1, 100, PI,                  // emitSize, emitTime, emitRate, emiteCone
    0,                               // tileIndex
    coinColor, coinColor,                    // colorStartA, colorStartB
    coinColor.scale(1, 0.5), coinColor.scale(1, 0.5), // colorEndA, colorEndB
    .3, 24, .1, 0.5, .2,                // time, sizeStart, sizeEnd, speed, angleSpeed
    .95, .5, .5, PI,                 // damping, angleDamping, gravity, cone
    .2, .8, 0, 1,                    // fadeRate, randomness, collide, additive
    0, 20, 0                         // randomColorLinear, renderOrder, localSpace
);

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

function gameInit() {
    objectMaxSpeed = 100
    cameraScale = 1
    gravity = -1

    mobileGamepad.showOnDoubleTap()
    mobileGamepad.on('x', (keyDown) => inputData[0][38] = keyDown ? 3 : 4);
    mobileGamepad.on('z', (keyDown) => inputData[0][40] = keyDown ? 3 : 4);
    mobileGamepad.on('left', (keyDown) => inputData[0][37] = keyDown ? 3 : 4);
    mobileGamepad.on('down', (keyDown) => inputData[0][40] = keyDown ? 3 : 4);
    mobileGamepad.on('right', (keyDown) => inputData[0][39] = keyDown ? 3 : 4);
    mobileGamepad.on('up', (keyDown) => inputData[0][38] = keyDown ? 3 : 4);

    if (window.ontouchstart && window.ontouchend) {
        ontouchstart = ontouchend = () => { }
    }

    setTimeout(() => {
        const sizeH = vec2(mainCanvasSize.x, 10)
        const sizeV = vec2(10, mainCanvasSize.y)
        const top = cameraPos.add(vec2(0, mainCanvasSize.y / 2))
        const left = cameraPos.add(vec2(-mainCanvasSize.x / 2 - 8, 0))
        const right = cameraPos.add(vec2(mainCanvasSize.x / 2 - 24, 0))

        new Box(top, sizeH)
        new Box(left, sizeV)
        new Box(right, sizeV)

        const ground = document.querySelector('.ground')
        if (ground)
            new ElementBox(ground, 'top')

        for (const element of [...document.querySelector('#sky').children]) {
            new ElementBox(element, 'bottom', getColor('sky-medium'))
        }

        for (const element of [...document.querySelector('.game-list').children]) {
            if (!player) {
                const { x, y, width } = element.getBoundingClientRect();
                player = new Player(screenToWorld(vec2(x + width / 2, y + -32)));
            }

            new ElementBox(element, 'top')
            new ElementBox(element, 'middle', new Color(0, 0, 0, 0))
            new ElementBox(element, 'bottom')
        }

        for (const element of [...document.querySelectorAll('.coin')]) {
            const e = new ElementBox(element, 'full')
            new Sound([, , 295, .03, .06, .16, 1, .4, , , 122, .09, , , , , , .62, .04, , -1469]).play()
            e.onFullCollision = () => {
                e.element.style.visibility = 'hidden'
                createCoinParticle(e.pos)
                e.destroy()
                ++coinsCollected
                if (coinsCollected === 2)
                    messageTimer.set(5)
                return false;
            }
        }
    }, 100)
}

function gameUpdate() {
}

function gameUpdatePost() {
}

function gameRender() {
    if (messageTimer.active()) {
        for (let i = 0; i < 20; i++) {
            createCoinParticle(getRandomPosition(cameraPos, mainCanvasSize));
        }
    }
}

function gameRenderPost() {
    if (messageTimer.active()) {
        drawText('上手くできたにゃ〜！', cameraPos, 50, getColor('text'), 5, getColor('ground'))
    }
}

// Start the LittleJS engine with our custom init function
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);

function getColor(name) {
    return new Color().setHex(getComputedStyle(document.body).getPropertyValue(`--${name}`))
}