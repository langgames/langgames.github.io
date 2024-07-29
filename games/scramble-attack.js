/*
2024 Steve Kidd
github: swkidd
*/

'use strict';

let levelSize

const GameState = {
    TITLE: 0,
    TRANSLATION: 1,
    GAME: 2,
    PAUSED: 3,
    WIN: 4,
};

let currentState = GameState.TITLE;
let currentTranslation = '';

///////////////////////////////////////////////////////////////////////////////
class HPBar extends EngineObject {
    constructor(pos, size, maxHP) {
        super(pos, size);
        this.maxHP = maxHP;
        this.currentHP = maxHP;
        this.targetHP = maxHP;
        this.flashHP = maxHP;
        this.barColor = hsl(0.6, 0.4, 0.6);
        this.flashColor = null;
        this.animationSpeed = 50; // HP units per second
        this.visible = true
    }

    addHP(amount) {
        if (this.currentHP >= this.maxHP) return
        this.targetHP = Math.min(this.maxHP, this.currentHP + amount);
        this.flashHP = this.targetHP
        this.flashColor = new Color().setHex('#98fb98');
    }

    removeHP(amount) {
        if (this.currentHP <= 0) return
        this.targetHP = Math.max(0, this.currentHP - amount);
        this.flashHP = this.currentHP
        this.flashColor = new Color().setHex('#f74c7d')
    }

    update() {
        if (!this.visible) return
        super.update();

        // Animate HP change
        if (this.currentHP !== this.targetHP) {
            const delta = this.animationSpeed * timeDelta;
            if (this.currentHP < this.targetHP) {
                this.currentHP = Math.min(this.targetHP, this.currentHP + delta);
            } else {
                this.currentHP = Math.max(this.targetHP, this.currentHP - delta);
            }
        } else {
            this.flashHP = this.currentHP
        }
    }

    render() {
        if (!this.visible) return
        // Draw background
        drawRect(this.pos, this.size, rgb(0.2, 0.2, 0.2));

        // Draw HP bar
        const hpRatio = this.currentHP / this.maxHP;
        const barWidth = this.size.x * hpRatio;
        const barSize = vec2(barWidth, this.size.y);
        const barPos = vec2(this.pos.x + (this.size.x - barWidth) / 2, this.pos.y);

        // Draw flash effect
        if (this.flashHP !== this.currentHP) {
            const flashRatio = this.flashHP / this.maxHP;
            const flashWidth = this.size.x * flashRatio;
            const flashSize = vec2(flashWidth, this.size.y);
            const flashPos = vec2(this.pos.x + (this.size.x - flashWidth) / 2, this.pos.y);
            drawRect(flashPos, flashSize, this.flashColor);
        }

        drawRect(barPos, barSize, this.barColor);

        drawText('HP', this.pos, 0.8, rgb(1, 1, 1), 0.1);
    }

    show() { this.visible = true }
    hide() { this.visible = false }
}

///////////////////////////////////////////////////////////////////////////////
const textLineWidth = 0.2
const lineColor = new Color().setHex('#222222')
class Menu extends EngineObject {
    constructor(pos, size, title) {
        super(pos, size);
        this.title = title;
        this.buttons = [];
        this.visible = true;
        this.columns = 4;
        this.buttonSize = vec2(6, 1.5);
        this.buttonSpacing = vec2(0.5, 0.5);
    }

    addButton(text, onClick) {
        const button = new Button(vec2(0, 0), this.buttonSize, text, onClick);
        this.buttons.push(button);
        this.updateButtonPositions();
        return button;
    }

    updateButtonPositions() {
        const totalWidth = this.columns * (this.buttonSize.x + this.buttonSpacing.x) - this.buttonSpacing.x;
        const startX = this.pos.x - totalWidth / 2 + this.buttonSize.x / 2;
        const startY = this.pos.y + this.size.y / 2 - 3 - this.buttonSize.y / 2;

        this.buttons.forEach((button, index) => {
            const col = index % this.columns;
            const row = Math.floor(index / this.columns);
            button.pos = vec2(
                startX + col * (this.buttonSize.x + this.buttonSpacing.x),
                startY - row * (this.buttonSize.y + this.buttonSpacing.y)
            );
        });
    }

    update() {
        if (!this.visible) return;
        super.update();
        this.buttons.forEach(button => button.update());
    }

    render() {
        if (!this.visible) return;
        // Render menu title
        if (this.title) {
            const titlePos = vec2(this.pos.x, this.pos.y + this.size.y / 2 - 0.5);
            drawText(this.title, titlePos, 3, hsl(0, 0, 1), textLineWidth, lineColor);
        }
        // Render buttons
        this.buttons.forEach(button => button.render());
    }

    show() { this.visible = true; this.buttons.forEach(b => b.visible = true) }
    hide() { this.visible = false; this.buttons.forEach(b => b.visible = false) }
    toggle() { this.visible ? this.hide() : this.show() }
}

///////////////////////////////////////////////////////////////////////////////
class Button extends EngineObject {
    constructor(pos, size, text, onClick) {
        super(pos, size);
        this.text = text;
        this.onClick = onClick;
        this.hovered = false;
        this.pressed = false;
        this.visible = true;
    }

    update() {
        if (!this.visible) return
        super.update();

        // Check if mouse is over the button
        this.hovered = isOverlapping(mousePos, vec2(0.1, 0.1), this.pos, this.size);

        // Handle click
        if (this.hovered && mouseWasPressed(0)) {
            this.pressed = true;
        }
        else if (this.pressed && mouseWasReleased(0)) {
            this.pressed = false;
            if (this.hovered && this.onClick) {
                this.onClick();
            }
        }
    }

    render() {
        if (!this.visible) return
        // Button background
        const color = this.pressed ? hsl(0, 0, .4) : (this.hovered ? hsl(0, 0, .6) : hsl(0, 0, .5));
        drawRect(this.pos, this.size, color);

        // Button text
        const textSize = min(this.size.x, this.size.y) * 0.4;
        drawText(this.text, this.pos, textSize, hsl(0, 0, 1));

        // Button border
        drawRect(this.pos, this.size, hsl(0.6, 0.4, 0.5), .1);
    }
}

class StarButton extends Button {
    constructor(pos, size, text, onClick) {
        super(pos, size, text, onClick);
        this.completed = false;
    }

    render() {
        if (!this.visible) return;

        // Call the parent class's render method
        super.render();

        // If completed, render a yellow star to the left of the button
        if (this.completed) {
            const starSize = min(this.size.x, this.size.y) * 0.4;
            const starPos = this.pos.add(vec2(-2, 0))
            drawText('⭐', starPos, 2)
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
class Word extends EngineObject {
    constructor(pos, word, reading, definition, color = new Color(1, 1, 1)) {
        super(pos, vec2(), null, 0, color)
        this.size.y = 2
        this.size.x = Math.max(word.length + 0.5, this.size.y)
        this.word = word
        this.showReading = false
        this.reading = reading
        this.definition = definition
        this.wordSize = 1
        this.readingSize = this.wordSize * 0.5
        this.selected = false
    }

    render() {
        // hack
        if (currentState === GameState.PAUSED) return

        const color = this.color
        drawRect(this.pos, this.size, this.selected ? hsl(0.1, 0.7, 0.6) : hsl(0.6, 0.4, 0.5))

        if (this.showReading)
            drawText(this.reading, this.pos.add(vec2(0, this.readingSize)), this.readingSize, color)

        drawText(this.word, this.pos.add(vec2(0, - this.wordSize / 4.5)), this.wordSize, color)
    }
}

class Row extends EngineObject {
    constructor(children = [], margin = vec2(0.5)) {
        super(vec2(), vec2(), null, 0, new Color(0, 0, 0, 0))
        this.margin = margin
        for (const c of children) {
            this.addChild(c)
        }
        this.reflow()
    }

    reflow(offset = - this.width / 2 + this.margin.x) {
        this.size.x = this.width
        let o = offset
        for (const c of this.children) {
            c.localPos.x = o + c.size.x / 2
            o += c.size.x + this.margin.x
        }
    }


    get width() {
        let width = this.children.map(c => c.size.x).reduce((a, c) => a + c, 0)
        width += (this.children.length + 1) * this.margin.x
        return width
    }

    get height() {
        if (!this.children.length) {
            return 0
        }
        return Math.max(...this.children.map(c => c.size.y))
    }

    get length() {
        return this.children.length
    }

    addChild(c, p, a) {
        super.addChild(c, p, a)
        this.size.x = this.width
        this.size.y = this.height
    }

    forEach(fn) {
        let index = 0;
        for (const c of this.children) {
            fn(c, index);
            index++;
        }
    }
}

class Grid extends EngineObject {
    constructor() {
        super(cameraPos, vec2(levelSize.x, 10), null, 0, new Color(0, 0, 0, 0))
        this.margin = vec2(1)
        this.align = 'center'
    }

    get width() {
        return levelSize.x + 5
        // return Math.max(...this.children.map(c => c.width))
    }

    get height() {
        // let height = this.children.map(c => c.height).reduce((a, c) => a + c, 0)
        // height += (this.children.length + 1) * this.margin.y
        // return height
        return levelSize.y / 3
    }

    get length() {
        return this.children.map(c => c.length).reduce((a, c) => a + c, 0)
    }

    get(index) {
        let i = index
        for (const c of this.children) {
            const w = c.length
            if (i < w) {
                return c.children[i]
            }
            i -= w
        }
    }

    set(index, value) {
        let i = index
        for (const c of this.children) {
            const w = c.length
            if (i < w) {
                c.children[i] = value
                value.parent = c
                return
            }
            i -= w
        }
    }

    addChild(c, p, a) {
        super.addChild(c, p, a)
        this.size.x = this.width
        this.size.y = this.height
    }

    reflow() {
        this.size.y = this.height
        let offset = this.height / 2 - this.margin.y
        let o
        if (this.align === 'left') {
            o = - this.width / 2 + this.margin.x
        }
        for (const c of this.children) {
            c.reflow(o)
            c.localPos.y = offset + c.size.y / 2
            offset -= c.size.y + this.margin.y
        }
    }

    forEach(fn) {
        let index = 0;
        for (const row of this.children) {
            row.forEach((child, rowIndex) => {
                fn(child, index, rowIndex);
                index++;
            });
        }
    }
}

////////////////////////////////////////////////////////////////////////////////
class SelectableGrid extends Grid {
    constructor(arr) {
        super();
        this.index = 0
        this.lastIndex = 0;
        this.arr = arr
    }

    select(index) {
        if (index < 0 || index >= this.length) return;
        this.index = index
        this.lastIndex = index;
        this.updateSelection();
    }

    swap(currIndex, newIndex) {
        if (currIndex < 0 || currIndex >= this.length) return;
        if (newIndex < 0 || newIndex >= this.length) return;

        const tmp = this.arr[currIndex]
        this.arr.splice(currIndex, 1)
        this.arr.splice(newIndex, 0, tmp)

        this.reflow()
    }

    updateSelection() {
        this.forEach((word, index) => {
            word.selected = index === this.index
        });
    }

    moveSelection(direction, shouldMove = false) {
        const currentIndex = this.lastIndex;
        let newIndex;

        switch (direction) {
            case 'left':
                newIndex = (currentIndex - 1 + this.length) % this.length;
                break;
            case 'right':
                newIndex = (currentIndex + 1) % this.length;
                break;
            case 'up':
                newIndex = this.getUpDownIndex(currentIndex, -1);
                break;
            case 'down':
                newIndex = this.getUpDownIndex(currentIndex, 1);
                break;
            default:
                return;
        }

        if (shouldMove) {
            sound_move.play()
            hpBar?.removeHP(1)
            this.swap(currentIndex, newIndex)
        } else {
            sound_select.play()
        }


        this.select(newIndex);
    }

    getUpDownIndex(currentIndex, direction) {
        const currentRow = this.getRowIndex(currentIndex);
        const prevIndex = (currentRow + direction + this.children.length) % this.children.length
        const prevRow = this.children[prevIndex];
        const currentCol = currentIndex - this.getRowStartIndex(currentRow);
        return this.getRowStartIndex(prevIndex) + Math.min(currentCol, prevRow.length - 1);
    }

    getRowIndex(index) {
        let rowIndex = 0;
        let count = 0;
        while (count <= index && rowIndex < this.children.length) {
            count += this.children[rowIndex].length;
            rowIndex++;
        }
        return rowIndex - 1;
    }

    getRowStartIndex(rowIndex) {
        let startIndex = 0;
        for (let i = 0; i < rowIndex; i++) {
            startIndex += this.children[i].length;
        }
        return startIndex;
    }

    reflow() {
        engineObjects.forEach(o => {
            if (this.children.includes(o) || this.children.includes(o.parent)) {
                o.destroy()
            }
        })
        this.children = []
        let row = new Row
        for (const word of this.arr) {
            const w = new Word(vec2(0, cameraPos.y), word.word, word.reading, word.definition)
            row.addChild(w)
            if ((word.word.length > 7 || (row.width + word.word.length * 2) > this.width - 2) && word != sentence[sentence.length - 1]) {
                this.addChild(row)
                row = new Row
            }
        }
        this.addChild(row)

        super.reflow()
    }

    get selectedWord() {
        return this.get(this.index)
    }
}

///////////////////////////////////////////////////////////////////////////////
function shuffle(array) {
    const cpy = structuredClone(array)
    for (let i = cpy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cpy[i], cpy[j]] = [cpy[j], cpy[i]];
    }
    return cpy
}

///////////////////////////////////////////////////////////////////////////////
const sound_start = new Sound([1.7, , 454, .01, .08, .13, 1, 3.7, , , 255, .08, , , , , , .83, .02, , 496]);
const sound_menu = new Sound([, , 236, .09, .15, .33, 1, 1.4, , -6, 196, .06, .04, , , , , .56, .19, .44]);
const sound_victory = new Sound([2.4, , 95, .03, .07, .33, 2, 3.9, , , , , , .3, , 1, .07, .4, .26, .3]);
const sound_select = new Sound([2.1, , 247, , .03, .05, 1, 2.3, , , 78, .29, .17, , , , .24, .83, .01]);
const sound_move = new Sound([, , 493, , .02, .03, 1, 1.5, , , 41, , , , , , , .63, .01, .36, -1030])
const sound_info = new Sound([, , 230, .01, .09, .08, 1, 1.9, -1, 15, , , , , , , , .66, .12, , -1480]);
const sound_firework = new Sound([1.1, , 55, .02, .18, .74, 2, .6, -5, 7, , , .08, 1.6, , .3, , .48, .1, .01]);
const sound_restart = new Sound([, , 700, .05, .26, .29, , , 8, , 294, .09, .02, , , , , .57, .26, .38]);

function victoryEffect() {
    sound_victory.play();
    for (let i = 0; i < 100; i++) {
        const pos = vec2(rand(0, levelSize.x), rand(0, levelSize.y));
        const color = visibleRandBlue();
        createParticles(pos, color);
    }
}

function createParticles(pos, color) {
    const particle = new ParticleEmitter(
        pos, 0,                          // pos, angle
        1, .1, 100, PI,                  // emitSize, emitTime, emitRate, emiteCone
        0,                               // tileIndex
        color, color,                    // colorStartA, colorStartB
        color.scale(1, 0), color.scale(1, 0), // colorEndA, colorEndB
        .2, 2, .2, .1, .05,              // time, sizeStart, sizeEnd, speed, angleSpeed
        .99, 1, .5, PI,                  // damping, angleDamping, gravity, cone
        .1, .5, 0, 0,                     // fadeRate, randomness, collide, additive
        0, 10, 0                         // randomColorLinear, renderOrder, localSpace
    );
    particle.renderOrder = 10
}

function visibleRandBlue() {
    const h = 0.6; // 216 degrees in the range [0, 1]
    const s = rand(0.5, 1.0);
    const l = rand(0.2, 0.8);
    return new Color().setHSLA(h, s, l);
}

function createFireworkParticles(pos, color) {
    new ParticleEmitter(
        pos, 0,                          // pos, angle
        1, .1, 100, PI,                  // emitSize, emitTime, emitRate, emiteCone
        0,                               // tileIndex
        color, color,                    // colorStartA, colorStartB
        color.scale(1, 0.5), color.scale(1, 0.5), // colorEndA, colorEndB
        .3, 2.4, .1, 0.5, .2,                // time, sizeStart, sizeEnd, speed, angleSpeed
        .95, .5, .5, PI,                 // damping, angleDamping, gravity, cone
        .2, .8, 0, 1,                    // fadeRate, randomness, collide, additive
        0, 20, 0                         // randomColorLinear, renderOrder, localSpace
    );
}

function getRandomPosition(cameraPos, levelSize) {
    const randomX = cameraPos.x + (Math.random() - 0.5) * levelSize.x;
    const randomY = cameraPos.y + (Math.random() - 0.5) * levelSize.y;
    return vec2(randomX, randomY)
}

///////////////////////////////////////////////////////////////////////////////
let grid, target, sentences, sentence, definition, pauseButton, pauseMenu, titleMenu, hpBar
let currSentIndex, currLevel, completed = [], showHintTimer = new Timer, showHowToTimer = new Timer

function pauseGame() {
    currentState = GameState.PAUSED
    pauseButton.visible = false
    pauseMenu.show()
    sound_menu.play()
}

function unpauseGame() {
    currentState = GameState.GAME
    pauseButton.visible = true
    pauseMenu.hide()
    sound_menu.play()
}

function showWin() {
    titleMenu?.hide()
    currentState = GameState.WIN
    const menu = new Menu(cameraPos.add(vec2(0, -7)), vec2(16, 12));
    menu.columns = 1
    menu.addButton('Reset level', () => {
        clearSave()
        completed = []
        startSentence()
        menu.hide()
        menu.destroy()
    });
    menu.addButton('Main menu', () => {
        showTitleMenu()
        menu.hide()
        menu.destroy()
    });
}


function showTitleMenu() {
    initTitleMenu()
    currentState = GameState.TITLE
    hpBar?.hide()
    titleMenu?.show()
}

function mainMenu() {
    grid.destroy()
    unpauseGame()
    showTitleMenu()
}

function newSentence() {
    grid.destroy()
    unpauseGame()
    startSentence()
}

function showHint() {
    showHintTimer.set(10)
    unpauseGame()
}

function showHowTo() {
    showHowToTimer.set(10)
    unpauseGame()
}

function nextSentenceIndex(list, completedIndices) {
    if (completedIndices.includes("all")) return -1
    const arr = [...Array(list.length).keys()].filter((i) => !completedIndices.includes(i))
    return arr.length ? arr[Math.floor(Math.random() * arr.length)] : -1;
}

function startSentence() {
    currentState = GameState.GAME

    currSentIndex = nextSentenceIndex(sentences, completed)

    if (currSentIndex === -1) {
        showWin()
        return
    }

    sentence = sentences[currSentIndex]
    target = sentence.words.map(s => s.word).join('')
    currentTranslation = sentence.translation || "Translation not available"

    let scrambledWords = shuffle(sentence.words)
    while (scrambledWords.map(w => w.word).join('') === target) {
        scrambledWords = shuffle(sentence.words)
    }

    grid = new SelectableGrid(scrambledWords)
    // grid.align = 'left'

    grid.reflow()
    grid.select(0)

    hpBar?.show()
    hpBar?.addHP(50)
    titleMenu?.hide()

    // Create pause menu
    pauseMenu = new Menu(cameraPos.add(vec2(0, 3)), vec2(16, 12));
    pauseMenu.columns = 1
    pauseMenu.addButton('Resume', unpauseGame);
    pauseMenu.addButton('New sentence', newSentence);
    pauseMenu.addButton('Show hint', showHint);
    pauseMenu.addButton('How to', showHowTo);
    pauseMenu.addButton('Main menu', mainMenu);
    pauseMenu.hide()
    pauseButton = new Button(vec2(levelSize.x, cameraPos.y - 7), vec2(3, 2), 'Pause', () => {
        pauseMenu.visible ? unpauseGame() : pauseGame()
    })

    sound_start.play()
}

function initTitleMenu() {
    currLevel = null
    if (titleMenu) titleMenu.destroy()
    titleMenu = new Menu(cameraPos, vec2(20, 14), 'スクランブルATTACK');
    for (const key of Object.keys(compactSentences)) {
        const button = new StarButton(vec2(0, 0), titleMenu.buttonSize, key.replace('_', ' ').toUpperCase(), () => {
            currLevel = key
            completed = load(key)
            sentences = sentenceToJSON(compactSentences[key])
            hpBar?.addHP(100)
            startSentence()
        });
        const nextIndex = nextSentenceIndex(compactSentences[key], load(key))
        button.completed = nextIndex === -1
        titleMenu.buttons.push(button)
        titleMenu.updateButtonPositions();
    }
}

function initHpBar() {
    hpBar = new HPBar(cameraPos.add(vec2(0, 10)), vec2(10, 1), 100);
    hpBar.visible = false
}
///////////////////////////////////////////////////////////////////////////////

function drawTitleScreen() {
    drawText("Select a level", cameraPos.add(vec2(0, -5)), 2, new Color(0.8, 0.8, 0.8), 0.2, new Color(0.2, 0.2, 0.2));
    drawText("How to play:", cameraPos.add(vec2(0, -7)), 1, new Color(0.8, 0.8, 0.8), 0.2, new Color(0.2, 0.2, 0.2));
    drawHowTo()
}

function drawTranslationScreen() {
    const maxWidth = levelSize.x * 0.8
    const fontSize = 1.2
    const wrappedSentence = wrapText(target, maxWidth, fontSize + 3, '');
    const wrappedTranslation = wrapText(currentTranslation, maxWidth, fontSize);

    drawText(wrappedSentence, cameraPos.add(vec2(0, 7)), fontSize, new Color(0.9, 0.9, 0.9), 0.2, new Color(0.2, 0.2, 0.2));
    drawText(wrappedTranslation, cameraPos.add(vec2(0, 0)), fontSize, new Color(0.9, 0.9, 0.9), 0.2, new Color(0.2, 0.2, 0.2));
    drawText("Click to continue", cameraPos.add(vec2(0, -7)), 2, new Color(0.8, 0.8, 0.8), 0.2, new Color(0.2, 0.2, 0.2));
}

function drawHint() {
    if (!currentTranslation) return
    const maxWidth = levelSize.x * 0.8
    const fontSize = 1
    const wrappedTranslation = wrapText(currentTranslation, maxWidth, fontSize);
    const pos = cameraPos.add(vec2(0, -7))
    drawText(wrappedTranslation, pos, fontSize, new Color(0.9, 0.9, 0.9), 0.2, new Color(0.2, 0.2, 0.2));
}

function drawHowTo() {
    if (currentState === GameState.GAME)
        drawText("Unscramble the sentence", cameraPos.add(vec2(0, -7)), 1, new Color(0.8, 0.8, 0.8), 0.2, new Color(0.2, 0.2, 0.2));
    drawText("Hold 'z' and press the arrows to swap words", cameraPos.add(vec2(0, -9)), 1, new Color(0.8, 0.8, 0.8), 0.2, new Color(0.2, 0.2, 0.2));
    drawText("Hold 'x' to view word definitions and readings", cameraPos.add(vec2(0, -10)), 1, new Color(0.8, 0.8, 0.8), 0.2, new Color(0.2, 0.2, 0.2));
}

function drawDefinition() {
    if (!definition) return
    const maxWidth = levelSize.x * 0.8
    const fontSize = 2
    const wrappedDefinition = wrapText(definition, maxWidth, fontSize);
    drawText(wrappedDefinition, cameraPos.add(vec2(0, -9)), 2, new Color(0.9, 0.9, 0.9), 0.2, new Color(0.2, 0.2, 0.2));
}

function drawCompleted() {
    drawText(`${completed.length} / ${sentences.length}`, cameraPos.add(vec2(9, 10)), 1, new Color(0.9, 0.9, 0.9), 0.2, new Color(0.2, 0.2, 0.2))
}

function drawWinScreen() {
    drawText(`上手くできたぞ`, cameraPos, 3, new Color(0.9, 0.9, 0.9), 0.2, new Color(0.2, 0.2, 0.2))
}

engineInit(
    () => {
        setTouchGamepadEnable(true)
        setTouchGamepadAnalog(false)
        canvasFixedSize = vec2(1280, 720); // use a 720p fixed size canvas
        levelSize = vec2(20, 38)
        cameraPos = levelSize.scale(0.5)
        initTitleMenu()
        initHpBar()
        glInitPostProcess(shader, true)
    },
    () => {
        if (pauseButton) {
            pauseButton.visible = false;
        }
        switch (currentState) {
            case GameState.TITLE:
                break;
            case GameState.TRANSLATION:
                if (mouseWasPressed(0)) {
                    currentState = GameState.GAME;
                    if (completed.length === sentences.length) {
                        grid.destroy()
                        showWin()
                    } else {
                        startSentence()
                    }
                }
                break;
            case GameState.GAME:
                pauseButton.visible = true;

                if (showHintTimer.active() || showHowToTimer.active())
                    pauseButton.visible = false

                let curr = ''
                grid.forEach((value) => {
                    curr += value.word
                })

                if (curr === target) {
                    completed.push(currSentIndex)
                    save()
                    victoryEffect()
                    pauseMenu.visible = false;
                    currentState = GameState.TRANSLATION;
                    grid.destroy()
                    return
                }

                const w = grid.selectedWord
                if (w) {
                    if (keyIsDown(88)) {
                        if (!definition) {
                            sound_info.play()
                        }
                        definition = w.definition
                        w.showReading = true
                        return
                    } else {
                        definition = null
                        w.showReading = false
                    }
                }

                const multiSelect = keyIsDown(90); // 'z' key

                if (keyWasPressed(39)) // right arrow
                    grid.moveSelection('right', multiSelect);
                else if (keyWasPressed(37)) // left arrow
                    grid.moveSelection('left', multiSelect);
                else if (keyWasPressed(40)) // down arrow
                    grid.moveSelection('down', multiSelect);
                else if (keyWasPressed(38)) // up arrow
                    grid.moveSelection('up', multiSelect);
                break;
            case GameState.PAUSED:
                break;
            case GameState.WIN: {
                if (Math.random() < 0.05) {
                    sound_firework.play()
                }
                if (Math.random() < 0.3) {
                    createFireworkParticles(getRandomPosition(cameraPos, levelSize), randColor());
                }
                break;
            }

        }
    },
    () => { },
    () => {
        switch (currentState) {
            case GameState.TITLE:
                titleMenu?.render()
                drawTitleScreen();
                break;
            case GameState.TRANSLATION:
                hpBar?.hide()
                drawTranslationScreen();
                break;
            case GameState.GAME:
                drawCompleted();
                if (showHintTimer.active())
                    drawHint();
                else if (showHowToTimer.active())
                    drawHowTo();
                else
                    drawDefinition();
                break;
            case GameState.PAUSED:
                pauseMenu.render();
                break;
            case GameState.WIN:
                drawWinScreen();
                break;
        }
    },
    () => { }
)

const shader = `
const float cloudscale = 1.1;
const float speed = 0.03;
const float clouddark = 0.5;
const float cloudlight = 0.3;
const float cloudcover = 0.2;
const float cloudalpha = 8.0;
const float skytint = 0.5;
const vec3 skycolour1 = vec3(0.2, 0.4, 0.6);
const vec3 skycolour2 = vec3(0.4, 0.7, 1.0);

const mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );

vec2 hash( vec2 p ) {
	p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise( in vec2 p ) {
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;
	vec2 i = floor(p + (p.x+p.y)*K1);	
    vec2 a = p - i + (i.x+i.y)*K2;
    vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0); //vec2 of = 0.5 + 0.5*vec2(sign(a.x-a.y), sign(a.y-a.x));
    vec2 b = a - o + K2;
	vec2 c = a - 1.0 + 2.0*K2;
    vec3 h = max(0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
	vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
    return dot(n, vec3(70.0));	
}

float fbm(vec2 n) {
	float total = 0.0, amplitude = 0.1;
	for (int i = 0; i < 7; i++) {
		total += noise(n) * amplitude;
		n = m * n;
		amplitude *= 0.4;
	}
	return total;
}

// -----------------------------------------------

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 p = fragCoord.xy / iResolution.xy;
	vec2 uv = p*vec2(iResolution.x/iResolution.y,1.0);    
    float time = iTime * speed;
    float q = fbm(uv * cloudscale * 0.5);
    
    //ridged noise shape
	float r = 0.0;
	uv *= cloudscale;
    uv -= q - time;
    float weight = 0.8;
    for (int i=0; i<8; i++){
		r += abs(weight*noise( uv ));
        uv = m*uv + time;
		weight *= 0.7;
    }
    
    //noise shape
	float f = 0.0;
    uv = p*vec2(iResolution.x/iResolution.y,1.0);
	uv *= cloudscale;
    uv -= q - time;
    weight = 0.7;
    for (int i=0; i<8; i++){
		f += weight*noise( uv );
        uv = m*uv + time;
		weight *= 0.6;
    }
    
    f *= r + f;
    
    //noise colour
    float c = 0.0;
    time = iTime * speed * 2.0;
    uv = p*vec2(iResolution.x/iResolution.y,1.0);
	uv *= cloudscale*2.0;
    uv -= q - time;
    weight = 0.4;
    for (int i=0; i<7; i++){
		c += weight*noise( uv );
        uv = m*uv + time;
		weight *= 0.6;
    }
    
    //noise ridge colour
    float c1 = 0.0;
    time = iTime * speed * 3.0;
    uv = p*vec2(iResolution.x/iResolution.y,1.0);
	uv *= cloudscale*3.0;
    uv -= q - time;
    weight = 0.4;
    for (int i=0; i<7; i++){
		c1 += abs(weight*noise( uv ));
        uv = m*uv + time;
		weight *= 0.6;
    }
	
    c += c1;
    
    vec3 skycolour = mix(skycolour2, skycolour1, p.y);
    vec3 cloudcolour = vec3(1.1, 1.1, 0.9) * clamp((clouddark + cloudlight*c), 0.0, 1.0);
   
    f = cloudcover + cloudalpha*f*r;
    
    vec3 result = mix(skycolour, clamp(skytint * skycolour + cloudcolour, 0.0, 1.0), clamp(f + c, 0.0, 1.0));

    vec4 originalColor = texture(iChannel0, p);
    float threshold = 0.1; 
    float objectMask = step(threshold, max(max(originalColor.r, originalColor.g), originalColor.b));
    result = mix(result, originalColor.rgb, objectMask);
    
	fragColor = vec4( result, 1.0 );
}`


// utils
function wrapText(text, maxWidth, fontSize, seperator = ' ') {
    const words = text.split(seperator);
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = getTextWidth(currentLine + word, fontSize);

        if (width < maxWidth) {
            currentLine += seperator + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);

    return lines.join('\n');
}

// Helper function to estimate text width
function getTextWidth(text, fontSize) {
    // This is a rough estimate. You might need to adjust the multiplier
    // based on your specific font and canvas settings
    return text.length * fontSize * 0.25;
}

function sentenceToJSON(compactSentences) {
    return compactSentences.map(sentence => {
        let result = [];
        for (let i = 0; i < sentence.length - 3; i += 3) {
            result.push({ word: sentence[i], reading: sentence[i + 1], definition: sentence[i + 2] });
        }
        return { words: result, translation: sentence[sentence.length - 1] };
    });
}

// save progress to local storage
function save() {
    if (!currLevel) return
    localStorage.setItem(currLevel, JSON.stringify(completed))
}

function load(level) {
    try {
        return JSON.parse(localStorage.getItem(level) ?? [])
    } catch {
        return []
    }
}

function clearSave() {
    if (!currLevel) return
    localStorage.removeItem(currLevel)
}

// data
const compactSentences = {
    "easy": [
        [
            "明日、", "あした、", "tomorrow,",
            "学校に", "がっこうに", "to school",
            "行って", "いって", "go",
            "ください", "", "please",
            "Please go to school tomorrow."
        ],
        [
            "私は", "わたしは", "I",
            "本が", "ほんが", "books",
            "好きです", "すきです", "like",
            "I like books."
        ],
        [
            "図書館で", "としょかんで", "at the library",
            "勉強", "べんきょう", "study",
            "しましょう", "", "let's do",
            "Let's study at the library."
        ],
        [
            "映画を", "えいがを", "movie",
            "見に", "みに", "to see",
            "行きたい", "いきたい", "want to go",
            "です", "", "is",
            "I want to go see a movie."
        ],
        [
            "この", "", "this",
            "店の", "みせの", "shop's",
            "ラーメンは", "", "ramen",
            "おいしい", "", "delicious",
            "です", "", "is",
            "The ramen at this shop is delicious."
        ],
        [
            "図書館に", "としょかんに", "in the library",
            "本が", "ほんが", "books",
            "あります", "", "exist",
            "There are books in the library."
        ],
        [
            "この", "", "this",
            "公園で", "こうえんで", "in the park",
            "遊ぶのが", "あそぶのが", "playing",
            "好きです", "すきです", "like",
            "I like playing in this park."
        ],
        [
            "今日は", "きょうは", "today",
            "寒い", "さむい", "cold",
            "から、", "", "because,",
            "コートを", "", "coat",
            "着ます", "きます", "wear",
            "It's cold today, so I'll wear a coat."
        ],
        [
            "日本語を", "にほんごを", "Japanese",
            "勉強", "べんきょう", "study",
            "している", "", "doing",
            "人が", "ひとが", "people",
            "多い", "おおい", "many",
            "です", "", "are",
            "There are many people studying Japanese."
        ],
        [
            "猫が", "ねこが", "cats",
            "いる", "", "exist",
            "ので、", "", "so,",
            "アレルギーが", "", "allergy",
            "あります", "", "have",
            "I have an allergy because there are cats."
        ],
        [
            "友達と", "ともだちと", "with a friend",
            "映画を", "えいがを", "movie",
            "見に", "みに", "to see",
            "行きました", "いきました", "went",
            "I went to see a movie with my friend."
        ],
        [
            "図書館で", "としょかんで", "in the library",
            "本を", "ほんを", "books",
            "読むのが", "よむのが", "reading",
            "好きです", "すきです", "like",
            "I like reading books in the library."
        ],
        [
            "コーヒーを", "", "coffee",
            "飲み", "のみ", "drinking",
            "ながら", "", "while",
            "勉強", "べんきょう", "study",
            "します", "", "do",
            "I study while drinking coffee."
        ],
        [
            "お寿司を", "おすしを", "sushi",
            "食べたい", "たべたい", "want to eat",
            "けれども、", "", "but,",
            "高い", "たかい", "expensive",
            "です", "", "is",
            "I want to eat sushi, but it's expensive."
        ],
        [
            "試験が", "しけんが", "exam",
            "ある", "", "exists",
            "から、", "", "because,",
            "今日は", "きょうは", "today",
            "勉強", "べんきょう", "study",
            "します", "", "will do",
            "Because there's an exam, I'll study today."
        ],
        [
            "明日、", "あした、", "tomorrow,",
            "早く", "はやく", "early",
            "起きる", "おきる", "wake up",
            "つもり", "", "intend to",
            "です", "", "is",
            "I plan to wake up early tomorrow."
        ],
        [
            "図書館で", "としょかんで", "at the library",
            "勉強する", "べんきょうする", "to study",
            "のが", "", "doing",
            "いい", "", "good",
            "です", "", "is",
            "It's good to study at the library."
        ],
        [
            "今日は", "きょうは", "today",
            "忙しい", "いそがしい", "busy",
            "ので、", "", "so,",
            "映画に", "えいがに", "to the movies",
            "行きません", "いきません", "won't go",
            "I'm busy today, so I won't go to the movies."
        ],
        [
            "この", "", "this",
            "本は", "ほんは", "book",
            "難しい", "むずかしい", "difficult",
            "ですが、", "", "but,",
            "面白い", "おもしろい", "interesting",
            "です", "", "is",
            "This book is difficult, but interesting."
        ],
        [
            "昨日、", "きのう、", "yesterday,",
            "友達と", "ともだちと", "with a friend",
            "レストランで", "", "at a restaurant",
            "食べました", "たべました", "ate",
            "I ate at a restaurant with my friend yesterday."
        ],
        [
            "もっと", "", "more",
            "野菜を", "やさいを", "vegetables",
            "食べる", "たべる", "eat",
            "ほうが", "", "the way of",
            "いい", "", "good",
            "です", "", "is",
            "It's better to eat more vegetables."
        ],
        [
            "毎日、", "まいにち、", "every day,",
            "日本語を", "にほんごを", "Japanese",
            "勉強した", "べんきょうした", "study",
            "ほうが", "", "the way of",
            "いい", "", "good",
            "です", "", "is",
            "It's better to study Japanese every day."
        ],
        [
            "映画を", "えいがを", "movies",
            "見る", "みる", "watching",
            "のが", "", "doing",
            "好き", "すき", "like",
            "ですが、", "", "but,",
            "高い", "たかい", "expensive",
            "です", "", "is",
            "I like watching movies, but it's expensive."
        ],
        [
            "朝ご飯を", "あさごはんを", "breakfast",
            "食べて", "たべて", "eat",
            "から、", "", "after,",
            "学校に", "がっこうに", "to school",
            "行きます", "いきます", "go",
            "I'll go to school after eating breakfast."
        ],
        [
            "この", "", "this",
            "部屋は", "へやは", "room",
            "静かで", "しずかで", "quiet",
            "勉強", "べんきょう", "study",
            "しやすい", "", "easy to do",
            "です", "", "is",
            "This room is quiet and easy to study in."
        ]
    ],
    "まあまあeasy": [
        [
            "昨日", "きのう", "yesterday",
            "買った", "かった", "bought",
            "ばかり", "", "just",
            "の", "", "of",
            "本を", "ほんを", "book",
            "読んで", "よんで", "read",
            "しまいました", "", "completed",
            "か", "", "?",
            "Did you finish reading the book you just bought yesterday?"
        ],
        [
            "もっと", "", "more",
            "勉強したら", "べんきょうしたら", "if you study",
            "どうか", "", "how about",
            "と", "", "that",
            "思う", "おもう", "think",
            "けど、", "", "but,",
            "どうですか", "", "what do you think?",
            "Why don't you study more? What do you think?"
        ],
        [
            "友達に", "ともだちに", "friends",
            "なさい", "", "become (imperative)",
            "と", "", "that",
            "先生が", "せんせいが", "teacher",
            "言った", "いった", "said",
            "けど、", "", "but,",
            "どうしますか", "", "what will you do?",
            "The teacher said to be friends, but what will you do?"
        ],
        [
            "こちらで", "", "here",
            "しばらく", "", "for a while",
            "待って", "まって", "wait",
            "いただけませんか?", "", "could you please (very polite)",
            "ご", "", "your",
            "協力", "きょうりょく", "cooperation",
            "お願いします", "おねがいします", "please",
            "Could you please wait here for a while? Your cooperation is appreciated."
        ],
        [
            "こんな", "", "such",
            "寒い", "さむい", "cold",
            "日に", "ひに", "day",
            "外に", "そとに", "outside",
            "行ったら", "いったら", "if you go",
            "どうか", "", "how",
            "と", "", "that",
            "思います", "おもいます", "think",
            "か", "", "?",
            "Do you think it's a good idea to go outside on such a cold day?"
        ],
        [
            "彼が", "かれが", "he",
            "手伝って", "てつだって", "help",
            "くれる", "", "give me the favor of doing",
            "ように", "", "in order to",
            "頼んで", "たのんで", "ask",
            "みます", "", "will try",
            "I will try to ask him to help me."
        ],
        [
            "毎日", "まいにち", "every day",
            "漢字を", "かんじを", "kanji",
            "勉強する", "べんきょうする", "study",
            "ように", "", "in such a way",
            "しています", "", "am doing",
            "が、", "", "but,",
            "友達に", "ともだちに", "from a friend",
            "教えて", "おしえて", "teach",
            "もらいました", "", "received",
            "I make sure to study kanji every day, and my friend taught me."
        ],
        [
            "彼に", "かれに", "to him",
            "日本語を", "にほんごを", "Japanese",
            "教えて", "おしえて", "teach",
            "あげる", "", "give (as a favor)",
            "ように", "", "in such a way",
            "なりました", "", "became",
            "I have reached the point where I teach him Japanese."
        ],
        [
            "新しい", "あたらしい", "new",
            "レシピを", "", "recipes",
            "試して", "ためして", "try",
            "みる", "", "try to",
            "ように", "", "in such a way",
            "しました", "", "did",
            "I tried to make sure to try new recipes."
        ],
        [
            "彼女が", "かのじょが", "she",
            "料理を", "りょうりを", "cooking",
            "手伝って", "てつだって", "help",
            "くれる", "", "give me the favor of doing",
            "ように", "", "in order to",
            "頼みました", "たのみました", "asked",
            "I asked her to help with the cooking."
        ],
        [
            "社長が", "しゃちょうが", "president",
            "お話し", "おはなし", "speak (honorific)",
            "なさる", "", "do (honorific)",
            "ので、", "", "so,",
            "皆さん", "みなさん", "everyone",
            "お聞き", "おきき", "listen (honorific)",
            "ください", "", "please",
            "The president will speak, so everyone, please listen."
        ],
        [
            "先生が", "せんせいが", "teacher",
            "おいで", "", "come (honorific)",
            "になる", "", "become (honorific)",
            "まで、", "", "until,",
            "ここで", "", "here",
            "お待ち", "おまち", "wait (honorific)",
            "くださいませ", "", "please (very polite)",
            "Please wait here until the teacher arrives."
        ],
        [
            "ご質問が", "ごしつもんが", "questions (honorific)",
            "ございます", "", "exist (very polite)",
            "場合は、", "ばあいは、", "in case",
            "どうぞ", "", "please",
            "お尋ね", "おたずね", "ask (honorific)",
            "ください", "", "please",
            "If you have any questions, please feel free to ask."
        ],
        [
            "部長が", "ぶちょうが", "manager",
            "お帰り", "おかえり", "return (honorific)",
            "になったら、", "", "when (becomes)",
            "こちらに", "", "here",
            "いらっしゃる", "", "come (honorific)",
            "よう", "", "in order to",
            "お伝え", "おつたえ", "inform (humble)",
            "いたします", "", "will do (humble)",
            "When the manager returns, I will let him know to come here."
        ],
        [
            "お客様", "おきゃくさま", "guest (honorific)",
            "で", "", "be",
            "ございます", "", "exist (very polite)",
            "ので、", "", "so,",
            "どうぞ", "", "please",
            "おかけ", "", "sit (honorific)",
            "になって", "", "become (honorific)",
            "ください", "", "please",
            "Since you are our guest, please have a seat."
        ],
        [
            "彼は", "かれは", "he",
            "もっと", "", "more",
            "運動", "うんどう", "exercise",
            "したがって", "", "want to do",
            "います", "", "is",
            "が、", "", "but,",
            "まだ", "", "still",
            "続ける", "つづける", "continue",
            "ことができません", "", "cannot",
            "He wants to exercise more, but he still can't continue."
        ],
        [
            "この", "", "this",
            "問題を", "もんだいを", "problem",
            "解決する", "かいけつする", "solve",
            "ために、", "", "in order to,",
            "みんなが", "", "everyone",
            "協力して", "きょうりょくして", "cooperate",
            "ほしい", "", "want",
            "です", "", "is",
            "I need everyone to cooperate to solve this problem."
        ],
        [
            "日本語の", "にほんごの", "Japanese",
            "勉強を", "べんきょうを", "study",
            "続けて", "つづけて", "continue",
            "いけば、", "", "if you go on,",
            "もっと", "", "more",
            "上手に", "じょうずに", "skillful",
            "なる", "", "become",
            "ことができます", "", "can",
            "If you continue studying Japanese, you will be able to become better."
        ],
        [
            "彼女は", "かのじょは", "she",
            "その", "", "that",
            "仕事を", "しごとを", "job",
            "もっと", "", "more",
            "続けたがって", "つづけたがって", "want to continue",
            "いる", "", "is",
            "けれど、", "", "but,",
            "他の", "ほかの", "other",
            "仕事を", "しごとを", "job",
            "始める", "はじめる", "start",
            "必要が", "ひつようが", "need",
            "あります", "", "exists",
            "She wants to continue that job more, but she needs to start another job."
        ],
        [
            "あなたが", "", "you",
            "この", "", "this",
            "問題を", "もんだいを", "problem",
            "解決する", "かいけつする", "solve",
            "のを", "", "(nominalizer)",
            "手伝って", "てつだって", "help",
            "くれる", "", "give me the favor of doing",
            "と", "", "if",
            "助かります", "たすかります", "would be helpful",
            "It would help if you could assist in solving this problem."
        ],
        [
            "今、", "いま、", "now,",
            "宿題を", "しゅくだいを", "homework",
            "している", "", "doing",
            "ところ", "", "in the middle of",
            "ですが、", "", "but,",
            "あと", "", "after",
            "30分", "さんじゅっぷん", "30 minutes",
            "で", "", "in",
            "終わる", "おわる", "finish",
            "ごろには", "", "around the time",
            "お手伝いが", "おてつだいが", "help",
            "ほしい", "", "want",
            "です", "", "is",
            "I am currently doing my homework, but I will need help around 30 minutes from now when I finish."
        ],
        [
            "この", "", "this",
            "仕事は", "しごとは", "job",
            "そんなに", "", "that",
            "難しく", "むずかしく", "difficult",
            "ない", "", "not",
            "と", "", "that",
            "思います", "おもいます", "think",
            "が、", "", "but,",
            "全然", "ぜんぜん", "at all",
            "できない", "", "cannot do",
            "わけでは", "", "it's not that",
            "ありません", "", "is not",
            "I think this job is not so difficult, but it's not that I can't do it at all."
        ],
        [
            "私たちは", "わたしたちは", "we",
            "9時", "くじ", "9 o'clock",
            "までに", "", "by",
            "その", "", "that",
            "レポートを", "", "report",
            "終わらせる", "おわらせる", "finish",
            "つもり", "", "intend to",
            "です", "", "is",
            "ので、", "", "so,",
            "今は", "いまは", "now",
            "まだ", "", "still",
            "進めている", "すすめている", "progressing",
            "ところ", "", "in the middle of",
            "です", "", "is",
            "We intend to finish the report by 9 o'clock, so we are still in the process of making progress."
        ],
        [
            "宿題を", "しゅくだいを", "homework",
            "やり始めた", "やりはじめた", "started doing",
            "ところ", "", "just after",
            "で、", "", "and,",
            "もう", "", "already",
            "8時", "はちじ", "8 o'clock",
            "ごろ", "", "around",
            "に", "", "at",
            "なって", "", "become",
            "しまいました", "", "ended up",
            "I had just started doing my homework, and it has already become around 8 o'clock."
        ],
        [
            "彼女は", "かのじょは", "she",
            "その", "", "that",
            "映画を", "えいがを", "movie",
            "見た", "みた", "watched",
            "ところ", "", "just after",
            "です", "", "is",
            "が、", "", "but,",
            "あまり", "", "not very",
            "感動", "かんどう", "moved",
            "しなかった", "", "did not",
            "と", "", "that",
            "言っています", "いっています", "is saying",
            "She has just finished watching that movie and says she was not very moved."
        ]
    ],
    "normal": [
        [
            "日本語を", "にほんごを", "Japanese",
            "毎日", "まいにち", "every day",
            "勉強する", "べんきょうする", "to study",
            "ことにした", "", "decided to",
            "ので", "ので", "so",
            "もっと", "", "more",
            "上手に", "じょうずに", "skillfully",
            "話せる", "はなせる", "to be able to speak",
            "ようになる", "", "to become able to",
            "ことができる", "", "can",
            "と信じています", "としんじています", "believe",
            "Since I decided to study Japanese every day, I believe I will be able to become better at speaking."
        ],
        [
            "英語を", "えいごを", "English",
            "話せる", "はなせる", "to be able to speak",
            "ようにする", "", "to become able to",
            "ために", "", "for the purpose of",
            "毎日", "まいにち", "every day",
            "少しずつ", "すこしずつ", "little by little",
            "練習する", "れんしゅうする", "to practice",
            "ことにしています", "", "make sure to",
            "To be able to speak English, I make sure to practice a little bit every day."
        ],
        [
            "毎週", "まいしゅう", "every week",
            "新しい", "あたらしい", "new",
            "言語を", "げんごを", "language",
            "勉強する", "べんきょうする", "to study",
            "ことになった", "", "has been decided",
            "ので", "", "so",
            "もっと多くの", "もっとおおくの", "more",
            "言語を", "げんごを", "languages",
            "話せる", "はなせる", "to be able to speak",
            "ように", "", "in ordert to",
            "なりたいです", "", "want to become (polite)",
            "Since it has been decided that I will study a new language every week, I want to be able to speak more languages."
        ],
        [
            "健康を", "けんこうを", "health",
            "保つ", "たもつ", "to maintain",
            "ために", "ために", "for the purpose of",
            "毎日", "まいにち", "every day",
            "運動する", "うんどうする", "to exercise",
            "ことにしました", "ことにしました", "decided to",
            "が", "", "but",
            "まだ", "", "still",
            "続ける", "つづける", "to continue",
            "ことができる", "", "able to do",
            "ように", "", "in order to",
            "なっていません", "", "has not become",
            "I decided to exercise every day to maintain my health, but I haven’t yet reached the point where I can continue doing it."
        ],
        [
            "日本語の", "にほんごの", "Japanese",
            "本を", "ほんを", "book",
            "読む", "よむ", "to read",
            "ことにした", "", "decided to",
            "ので", "ので", "so",
            "読むのが", "よむのが", "reading",
            "簡単に", "かんたんに", "easier",
            "なるように", "", "to become",
            "辞書を", "じしょを", "dictionary",
            "使う", "つかう", "to use",
            "ことにしています", "", "make sure to",
            "Since I decided to read Japanese books, I make sure to use a dictionary so that it becomes easier to read."
        ],
        [
            "海外旅行を", "かいがいりょこうを", "travel abroad",
            "する", "", "to do",
            "ことに決めた", "ことにきめた", "decided to",
            "ので", "", "so",
            "準備を", "じゅんびを", "preparations",
            "進める", "すすめる", "to progress",
            "ようにしています", "", "trying to make sure",
            "Since I decided to travel abroad, I am trying to make sure I progress with the preparations."
        ],
        [
            "彼の", "かれの", "his",
            "提案は", "ていあんは", "proposal",
            "とても", "", "very",
            "合理的らしい", "ごうりてきらしい", "seems reasonable",
            "が", "", "but",
            "上司は", "じょうしは", "boss",
            "まだ", "", "still",
            "決めていない", "きめていない", "hasn’t decided",
            "そうだ", "", "heard",
            "His proposal seems very reasonable, but I heard that the boss hasn’t decided yet."
        ],
        [
            "この町は", "このまちは", "this town",
            "歴史的な", "れきしてきな", "historical",
            "価値が高い", "かちがたかい", "high value",
            "という話を", "というはなしを", "story told (object)",
            "聞きました", "ききました", "heard",
            "が", "", "but",
            "観光地に", "かんこうちに", "tourist spot",
            "違いない", "ちがいない", "certainly",
            "ですね", "", "is",
            "I heard that this town has high historical value, and it must certainly be a tourist spot."
        ],
        [
            "彼の", "かれの", "his",
            "発言は", "はつげんは", "statements",
            "かなり", "", "quite",
            "自信がある", "じしんがある", "confident",
            "ように見える", "ようにみえる", "seem",
            "けれども", "", "but",
            "実際のところ", "じっさいのところ", "in reality",
            "どうかはわからない", "", "don't know",
            "ということらしい", "", "seems",
            "His statements seem quite confident, but it seems that we don’t really know how it is."
        ],
        [
            "このレストランの", "", "this restaurant's",
            "料理は", "りょうりは", "food",
            "美味しいそうだ", "おいしいそうだ", "heard it's delicious",
            "が", "", "but",
            "実際に", "じっさいに", "actually",
            "食べてみないと", "たべてみないと", "don't try eating",
            "わからない", "", "don't know",
            "に違いない", "", "certainly",
            "I heard that the food at this restaurant is delicious, but it must certainly be something you need to try yourself to know."
        ],
        [
            "彼女が", "かのじょが", "she",
            "その仕事に", "そのしごとに", "for that job",
            "合う人だ", "あうひとだ", "right person",
            "ということは", "", "that",
            "間違いないらしい", "まちがいないらしい", "seems certain",
            "が", "", "but",
            "選考結果は", "せんこうけっかは", "selection results",
            "まだわからない", "", "still unknown",
            "そうだ", "", "heard",
            "It seems certain that she is the right person for the job, but I heard that the selection results are still unknown."
        ],
        [
            "この新しい", "このあたらしい", "this new",
            "スマートフォンは", "", "smartphone",
            "使いやすい", "つかいやすい", "easy to use",
            "という話を", "というはなしを", "story told (object)",
            "聞きました", "ききました", "heard",
            "が", "", "but",
            "私には", "わたしには", "for me",
            "合わないに違いない", "あわないにちがいない", "certainly doesn't suit",
            "と思います", "とおもいます", "I think",
            "I heard that this new smartphone is easy to use, but I think it certainly won’t suit me."
        ],
        [
            "彼が", "かれが", "he",
            "もっと早く", "もっとはやく", "earlier",
            "来れば", "くれば", "if had come",
            "私たちは", "わたしたちは", "we",
            "早めに", "はやめに", "early",
            "出発できたのに...", "しゅっぱつできたのに", "could have left",
            "If he had come earlier, we could have left earlier."
        ],
        [
            "日本語を", "にほんごを", "Japanese",
            "勉強すれば", "べんきょうすれば", "if study",
            "するほど", "", "the more",
            "会話が", "かいわが", "conversation",
            "上達する", "じょうたつする", "improves",
            "ばかりか", "ばかりか", "not only",
            "自信も", "じしんも", "also confidence",
            "ついてくる", "", "comes (gain)",
            "The more you study Japanese, not only does your conversation improve, but you also gain confidence."
        ],
        [
            "明日", "あした", "tomorrow",
            "雨が降ったら", "あめがふったら", "if it rains",
            "ピクニックは", "", "picnic",
            "中止", "ちゅうし", "cancel",
            "にするなら", "", "if decided",
            "どこか", "", "somewhere",
            "室内で", "しつないで", "indoors",
            "楽しめる", "たのしめる", "can have fun",
            "場所を", "ばしょを", "place (object)",
            "探すべきだ", "さがすべきだ", "should look for",
            "If it rains tomorrow and we decide to cancel the picnic, we should look for a place where we can have fun indoors."
        ],
        [
            "この計画が", "このけいかくが", "this plan",
            "うまくいけば", "", "if goes well",
            "次回は", "じかいは", "next time",
            "もっと大規模", "もっとだいきぼ", "larger scale",
            "にする", "", "make",
            "ばかりか", "", "not only",
            "国際的なイベント", "こくさいてきなイベント", "international event",
            "にする", "", "make",
            "つもりです", "", "intend to (polite)",
            "If this plan goes well, not only will we make it bigger next time, but we also intend to make it an international event."
        ],
        [
            "彼女が", "かのじょが", "she",
            "その試験に", "そのしけんに", "for that exam",
            "合格したら", "ごうかくしたら", "if pass",
            "次のステップ", "つぎのステップ", "next step",
            "に進む", "にすすむ", "move to",
            "ばかりか", "", "not only",
            "新しいプロジェクト", "あたらしいプロジェクト", "new project",
            "にも", "", "also",
            "取り組む", "とりくむ", "work on",
            "ことになる", "", "will become",
            "でしょう", "", "probably (polite)",
            "If she passes that exam, she will not only move on to the next step but also work on a new project."
        ],
        [
            "この本を", "このほんを", "this book",
            "読んでいれば", "よんでいれば", "if read",
            "歴史の知識が", "れきしのちしきが", "knowledge of history",
            "増える", "ふえる", "increase",
            "ばかりか", "", "not only",
            "現代の問題", "げんだいのもんだい", "contemporary issues",
            "にも対する", "にもたいする", "also of",
            "理解が", "りかいが", "understanding",
            "深まるだろう", "ふかまるだろう", "probably deepen",
            "If you read this book, not only will your knowledge of history increase, but your understanding of contemporary issues will also deepen."
        ],
        [
            "彼は", "かれは", "he",
            "兄より", "あにより", "than his older brother",
            "背が高い", "せがたかい", "taller",
            "が", "", "but",
            "兄ほど", "あにほど", "as his older brother",
            "速く", "はやく", "fast",
            "走れない", "はしれない", "cannot run",
            "He is taller than his older brother, but he can't run as fast as his brother."
        ],
        [
            "天気予報", "てんきよほう", "weather forecast",
            "に反して", "にはんして", "contrary to",
            "今日は", "きょうは", "today",
            "晴れた", "はれた", "was sunny",
            "が", "", "but",
            "昨日ほど", "きのうほど", "as yesterday",
            "暖かくない", "あたたかくない", "not warm",
            "Contrary to the weather forecast, it is sunny today, but it is not as warm as yesterday."
        ],
        [
            "日本", "にほん", "Japan",
            "に対して", "にたいして", "compared to",
            "アメリカは", "あめりかは", "America",
            "車が", "くるまが", "cars",
            "大きい", "おおきい", "larger",
            "が", "", "but",
            "日本の車", "にほんのくるま", "Japanese cars",
            "ほど", "", "as much",
            "燃費が", "ねんぴが", "fuel-efficient",
            "良くない", "よくない", "not good (not as)",
            "Compared to Japan, cars in America are larger, but they are not as fuel-efficient as Japanese cars."
        ],
        [
            "私の考え", "わたしのかんがえ", "my thought",
            "に反して", "にはんして", "contrary to",
            "彼の意見は", "かれのいけんは", "his argument",
            "理論的", "りろんてき", "logical",
            "だが", "", "but",
            "実際の問題を", "じっさいのもんだいを", "actual problems",
            "解決するほど", "かいけつするほど", "enough to solve",
            "具体的", "ぐたいてき", "specific",
            "ではない", "", "not",
            "Contrary to my opinion, his argument is logical, but it is not specific enough to solve actual problems."
        ],
        [
            "彼女の成績は", "かのじょのせいせきは", "her grades",
            "クラスで", "", "in the class",
            "一番いい", "いちばんいい", "the best",
            "が", "", "but",
            "友達", "ともだち", "friend",
            "に対して", "にたいして", "towards friends",
            "親切さ", "しんせつさ", "kindness",
            "においては", "においては", "in terms of",
            "兄ほど", "あにほど", "as much as (her) older brother",
            "ではない", "", "not",
            "Her grades are the best in the class, but in terms of kindness towards friends, she is not as good as her older brother."
        ],
        [
            "雨が降ったから", "あめがふったから", "because it rained",
            "試合が", "しあいが", "the game",
            "中止になった", "ちゅうしになった", "was canceled",
            "が", "", "but",
            "おかげで", "おかげで", "thanks to that",
            "家で", "いえで", "at home",
            "休む", "やすむ", "rest",
            "こと", "", "nominalizer",
            "ができた", "", "could rest",
            "Because it rained, the game was canceled, but thanks to that, I could rest at home."
        ],
        [
            "風邪をひいた", "かぜをひいた", "caught a cold",
            "せいで", "せいで", "because (negative nuance)",
            "仕事に行けなかった", "しごとにいけなかった", "could not go to work",
            "ので", "ので", "because",
            "上司に", "じょうしに", "my boss",
            "怒られた", "おこられた", "got angry (at me)",
            "Because I caught a cold, I couldn't go to work, and as a result, my boss got angry."
        ],
        [
            "新しいプロジェクトが", "あたらしいぷろじぇくとが", "the new project",
            "成功した", "せいこうした", "succeeded",
            "おかげで", "おかげで", "thanks to",
            "給料が", "きゅうりょうが", "salary",
            "上がった", "あがった", "raise",
            "から", "", "because",
            "旅行に行く", "りょこうにいく", "go to travel",
            "ことができた", "ことができた", "was able to",
            "Thanks to the success of the new project, my salary increased, so I was able to go on a trip."
        ],
        [
            "電車が遅れた", "でんしゃがおくれた", "train was delayed",
            "せいで", "", "due to (negative nuance)",
            "会議に", "かいぎに", "to the meeting",
            "遅刻したから", "ちこくしたから", "was late",
            "プレゼンテーションが", "", "presentation",
            "できなかった", "", "couldn't do",
            "Because the train was delayed, I was late for the meeting, and therefore couldn't do the presentation."
        ],
        [
            "雨が降っていたのに", "あめがふっていたのに", "although it was raining",
            "彼は", "かれは", "he",
            "傘を持たずに", "かさをもたずに", "went out without an umbrella",
            "出かけたにもかかわらず", "でかけたにもかかわらず", "despite that",
            "全然", "ぜんぜん", "at all",
            "濡れなかった", "ぬれなかった", "didn't get wet",
            "Although it was raining and he went out without an umbrella, he didn't get wet at all."
        ],
        [
            "彼女は", "かのじょは", "she",
            "熱があっても", "ねつがあっても", "even though she had a fever",
            "仕事に行ったのに", "しごとにいったのに", "went to work",
            "上司は", "じょうしは", "her boss",
            "彼女の努力に", "かのじょのどりょくに", "her effort",
            "気づかなかった", "きづかなかった", "didn't notice",
            "Even though she had a fever, she went to work, but her boss didn't notice her effort."
        ],
        [
            "お金が", "おかねが", "money",
            "ないのに", "", "although (there is) none",
            "新しい車を", "あたらしいくるまを", "a new car",
            "買った", "かった", "bought",
            "にもかかわらず", "にもかかわらず", "even though",
            "彼は", "かれは", "he",
            "全然", "ぜんぜん", "at all",
            "後悔していない", "こうかいしていない", "has no regrets",
            "Although he has no money, he bought a new car, and despite that, he has no regrets at all."
        ],
    ],
    "まあまあnormal": [
        [
            "雨が", "あめが", "rain",
            "降っている", "ふっている", "is falling",
            "うちに", "", "while",
            "買い物に", "かいものに", "shopping",
            "行って", "いって", "go",
            "しまう", "", "end up doing",
            "つもりだ", "", "intend to",
            "が", "", "but",
            "その時", "そのとき", "by that time",
            "には", "", "by",
            "もう", "", "already",
            "止んでいる", "やんでいる", "have stopped",
            "かもしれない", "", "might",
            "I plan to go shopping while it is raining, but by the time I go, it might have already stopped."
        ],
        [
            "休みの", "やすみの", "vacation",
            "間に", "あいだに", "during",
            "旅行の", "りょこうの", "travel",
            "計画を", "けいかくを", "plans",
            "立てる", "たてる", "make",
            "つもりだ", "", "intend to",
            "が", "", "but",
            "宿題が", "しゅくだいが", "homework",
            "終わる", "おわる", "finish",
            "時に", "ときに", "when",
            "その計画を", "そのけいかくを", "those plans",
            "変更する", "へんこうする", "change",
            "かもしれない", "", "might",
            "During the vacation, I plan to make travel plans, but I might change those plans when I finish my homework."
        ],
        [
            "新しい", "あたらしい", "new",
            "プロジェクトが", "", "project",
            "始まる", "はじまる", "start",
            "うちに", "", "while",
            "前の", "まえの", "previous",
            "仕事を", "しごとを", "job",
            "終わらせる", "おわらせる", "finish",
            "必要がある", "ひつようがある", "need to",
            "が", "", "but",
            "その間に", "そのあいだに", "during that time",
            "他の", "ほかの", "other",
            "仕事が", "しごとが", "work",
            "入る", "はいる", "come up",
            "かもしれない", "", "might",
            "While the new project is starting, I need to finish the previous job, but other work might come up during that time."
        ],
        [
            "映画が", "えいがが", "movie",
            "始まる", "はじまる", "start",
            "時に", "ときに", "when",
            "駅に", "えきに", "at the station",
            "着く", "つく", "arrive",
            "予定だ", "よていだ", "plan to",
            "が", "", "but",
            "そのうちに", "", "during that time",
            "チケットを", "", "tickets",
            "忘れない", "わすれない", "not forget",
            "ようにしない", "", "make sure",
            "といけない", "", "must",
            "I plan to arrive at the station when the movie starts, but I need to make sure not to forget the tickets during that time."
        ],
        [
            "夕食の", "ゆうしょくの", "dinner",
            "準備を", "じゅんびを", "preparation",
            "している", "", "doing",
            "間に", "あいだに", "while",
            "子どもたちが", "こどもたちが", "children",
            "宿題を", "しゅくだいを", "homework",
            "終わらせる", "おわらせる", "finish",
            "時に", "ときに", "when",
            "手伝う", "てつだう", "help",
            "つもりだ", "", "plan to",
            "While preparing dinner, I plan to help the children with their homework when they finish it."
        ],
        [
            "彼は", "かれは", "he",
            "私のために", "わたしのために", "for me",
            "プレゼントを", "", "gift",
            "買って", "かって", "bought",
            "くれた", "", "gave (for me)",
            "ので", "", "so",
            "私は", "わたしは", "I",
            "そのお礼に", "そのおれいに", "as a thank-you",
            "手紙を", "てがみを", "letter",
            "書いて", "かいて", "wrote",
            "あげた", "", "gave (for him)",
            "He bought a gift for me, so I wrote a thank-you letter for him as a favor."
        ],
        [
            "友達に", "ともだちに", "from a friend",
            "宿題を", "しゅくだいを", "homework",
            "手伝って", "てつだって", "help",
            "もらった", "", "received",
            "から", "", "since",
            "今度は", "こんどは", "next time",
            "彼に", "かれに", "for him",
            "おいしい", "", "delicious",
            "料理を", "りょうりを", "meal",
            "作って", "つくって", "cook",
            "あげよう", "", "give (for him)",
            "と思っている", "とおもっている", "thinking of",
            "Since I received help with my homework from a friend, I'm thinking of cooking a delicious meal for him next time."
        ],
        [
            "先生が", "せんせいが", "teacher",
            "私たちに", "わたしたちに", "for us",
            "特別な", "とくべつな", "special",
            "授業を", "じゅぎょうを", "class",
            "して", "", "did",
            "くれた", "", "gave (for us)",
            "ので", "", "so",
            "その後で", "そのあとで", "afterward",
            "私たちは", "わたしたちは", "we",
            "お礼に", "おれいに", "as a thank-you",
            "お菓子を", "おかしを", "sweets",
            "買って", "かって", "bought",
            "あげた", "", "gave (for them)",
            "Since the teacher gave us a special class, we bought some sweets as a thank-you afterward."
        ],
        [
            "私が", "わたしが", "I",
            "彼女のために", "かのじょのために", "for her",
            "イベントを", "", "event",
            "企画して", "きかくして", "planned",
            "あげた", "", "gave (for her)",
            "おかげで", "", "thanks to",
            "彼女は", "かのじょは", "she",
            "すごく", "", "very",
            "喜んで", "よろこんで", "pleased",
            "くれた", "", "gave (for me)",
            "Thanks to me planning the event for her, she was very pleased."
        ],
        [
            "彼は", "かれは", "he",
            "私に", "わたしに", "to me",
            "資料を", "しりょうを", "materials",
            "送って", "おくって", "sent",
            "くれた", "", "gave (for me)",
            "ので", "", "so",
            "私は", "わたしは", "I",
            "そのお礼に", "そのおれいに", "as a thank-you",
            "メールで", "めーるで", "by email",
            "お礼を", "おれいを", "thank-you",
            "言って", "いって", "say",
            "もらった", "", "received",
            "Since he sent me the materials, I received a thank-you email as a favor in return."
        ],
        [
            "ここで", "", "here",
            "電話を", "でんわを", "phone call",
            "かけて", "", "make",
            "もいい", "", "may",
            "が", "", "but",
            "音を", "おとを", "sound",
            "大きく", "おおきく", "loud",
            "して", "", "make",
            "は", "", "topic marker",
            "いけない", "", "must not",
            "You may make a phone call here, but you must not make loud noises."
        ],
        [
            "今日の", "きょうの", "today's",
            "宿題は", "しゅくだいは", "homework",
            "提出", "ていしゅつ", "submit",
            "しなくて", "", "not do",
            "もいい", "", "may",
            "けれど", "", "but",
            "遅れて", "おくれて", "late",
            "提出して", "ていしゅつして", "submit",
            "は", "", "topic marker",
            "いけない", "", "must not",
            "You don't have to submit today's homework, but you must not submit it late."
        ],
        [
            "この部屋で", "このへやで", "in this room",
            "飲み物を", "のみものを", "beverages",
            "飲んで", "のんで", "drink",
            "もいい", "", "may",
            "ですが", "", "but (polite)",
            "飲み物を", "のみものを", "beverages",
            "こぼして", "", "spill",
            "は", "", "topic marker",
            "いけません", "", "must not (polite)",
            "You may drink beverages in this room, but you must not spill them."
        ],
        [
            "この本を", "このほんを", "this book",
            "持ち帰って", "もちかえって", "take home",
            "もいい", "", "may",
            "ですが", "", "but (polite)",
            "破って", "やぶって", "tear",
            "は", "", "topic marker",
            "いけません", "", "must not (polite)",
            "You may take this book home, but you must not tear it."
        ],
        [
            "早く", "はやく", "early",
            "帰って", "かえって", "leave",
            "もいい", "", "may",
            "けれど", "", "but",
            "遅刻して", "ちこくして", "be late",
            "は", "", "topic marker",
            "いけない", "", "must not",
            "You may leave early, but you must not be late."
        ],
        [
            "明日までに", "あしたまでに", "by tomorrow",
            "このレポートを", "このれぽーとを", "this report",
            "提出しなければ", "ていしゅつしなければ", "must submit",
            "ならない", "ならない", "must",
            "し", "", "and",
            "資料も", "しりょうも", "materials also",
            "準備しなくては", "じゅんびしなくては", "have to prepare",
            "いけない", "いけない", "have to",
            "I must submit this report by tomorrow, and I also have to prepare the materials."
        ],
        [
            "早く", "はやく", "early",
            "帰りたかったら", "かえりたかったら", "if you want to go home",
            "急いで", "いそいで", "quickly",
            "仕事を", "しごとを", "work",
            "終わらせ", "おわらせ", "finish",
            "なきゃいけない", "なきゃいけない", "have to",
            "し", "", "and",
            "会議にも", "かいぎにも", "to the meeting also",
            "出なくては", "でなくては", "have to attend",
            "いけない", "いけない", "have to",
            "If you want to go home early, you have to finish your work quickly, and you also have to attend the meeting."
        ],
        [
            "健康のために", "けんこうのために", "for your health",
            "毎日", "まいにち", "every day",
            "運動し", "うんどうし", "exercise",
            "なきゃいけない", "なきゃいけない", "must",
            "けど", "", "but",
            "仕事が忙しい時でも", "しごとがいそがしいときでも", "even when you're busy with work",
            "ちゃんと", "", "properly",
            "休憩しなくては", "きゅうけいしなくては", "have to take breaks",
            "いけない", "いけない", "have to",
            "For your health, you must exercise every day, but even when you're busy with work, you have to take proper breaks."
        ],
        [
            "新しいプロジェクトのために", "あたらしいぷろじぇくとのために", "for the new project",
            "いろいろな資料を", "いろいろなしりょうを", "various materials",
            "集めなければ", "あつめなければ", "must gather",
            "ならない", "ならない", "must",
            "し", "", "and",
            "チームメンバーとも", "ちーむめんばーとも", "with team members also",
            "話し合わ", "はなしあわ", "discuss",
            "なきゃいけない", "なきゃいけない", "have to",
            "For the new project, I must gather various materials, and I also have to discuss things with the team members."
        ],
        [
            "明日のプレゼンのために", "あしたのぷれぜんのために", "for tomorrow's presentation",
            "スライドを", "すらいどを", "slides",
            "準備しなければ", "じゅんびしなければ", "must prepare",
            "ならない", "ならない", "must",
            "し", "", "and",
            "リハーサルも", "りはーさるも", "rehearsal also",
            "しなきゃ", "しなきゃ", "have to do",
            "ならない", "ならない", "have to",
            "For tomorrow's presentation, I must prepare the slides, and I also have to rehearse."
        ],
        [
            "先生に", "せんせいに", "by the teacher",
            "褒められて", "ほめられて", "was praised",
            "すごく嬉しかった", "すごくうれしかった", "was very happy",
            "ので", "", "so",
            "母に", "ははに", "to my mother",
            "知らせ", "しらせ", "let know",
            "させました", "させました", "made to",
            "I was praised by the teacher, which made me very happy, so I let my mother know."
        ],
        [
            "彼に", "かれに", "by him",
            "嘘をつかれた", "うそをつかれた", "was lied to",
            "ので", "", "so",
            "真実を", "しんじつを", "the truth",
            "話させ", "はなさせ", "make tell",
            "ました", "ました", "did",
            "I was lied to by him, so I made him tell the truth."
        ],
        [
            "犬に", "いぬに", "by the dog",
            "ドアを", "どあを", "the door",
            "開けられて", "あけられて", "was opened",
            "家の中に", "いえのなかに", "inside the house",
            "入らせ", "はいらせ", "let in",
            "られた", "られた", "was forced to",
            "The dog opened the door, and I was forced to let it inside."
        ],
        [
            "事故のために", "じこのために", "due to an accident",
            "電車が", "でんしゃが", "the train",
            "遅れた", "おくれた", "was delayed",
            "ので", "", "so",
            "タクシーで", "たくしーで", "by taxi",
            "行かせ", "いかせ", "make go",
            "られました", "られました", "was made to",
            "The train was delayed due to an accident, so I was made to take a taxi."
        ],
        [
            "友達に", "ともだちに", "by my friend",
            "写真を", "しゃしんを", "photo",
            "撮られた", "とられた", "was taken",
            "ので", "", "so",
            "もう一度", "もういちど", "once again",
            "ポーズを取らせ", "ぽーずをとらせ", "make pose",
            "られました", "られました", "was made to",
            "My friend took a photo of me, so I was made to pose again."
        ],
        [
            "課長に", "かちょうに", "by my boss",
            "急な仕事を", "きゅうなしごとを", "urgent work",
            "頼まれて", "たのまれて", "was asked",
            "残業させ", "ざんぎょうさせ", "make work overtime",
            "られました", "られました", "was made to",
            "I was asked to do urgent work by my boss, so I was made to work overtime."
        ],
        [
            "泥棒に", "どろぼうに", "by a thief",
            "財布を", "さいふを", "wallet",
            "盗まれて", "ぬすまれて", "was stolen",
            "警察に", "けいさつに", "to the police",
            "届けさせ", "とどけさせ", "make report",
            "られました", "られました", "was made to",
            "My wallet was stolen by a thief, so I was made to report it to the police."
        ],
        [
            "妹に", "いもうとに", "by my little sister",
            "部屋を", "へやを", "the room",
            "掃除させ", "そうじさせ", "make clean",
            "られた", "られた", "was made to",
            "が", "", "but",
            "母に", "ははに", "by my mother",
            "褒められ", "ほめられ", "be praised",
            "ました", "ました", "was",
            "My little sister made me clean the room, but I was praised by my mother."
        ],
        [
            "同僚に", "どうりょうに", "by my colleague",
            "書類を", "しょるいを", "documents",
            "なくされた", "なくされた", "were lost",
            "ので", "", "so",
            "新しいコピーを", "あたらしいこぴーを", "new copy",
            "作らせ", "つくらせ", "make make",
            "られました", "られました", "was made to",
            "My colleague lost the documents, so I was made to make a new copy."
        ],
        [
            "友達に", "ともだちに", "by a friend",
            "カラオケに", "からおけに", "to karaoke",
            "誘われた", "さそわれた", "was invited",
            "が", "", "but",
            "歌いたくない", "うたいたくない", "don't want to sing",
            "ので", "", "so",
            "断らせ", "ことわらせ", "make decline",
            "ました", "ました", "did",
            "I was invited to karaoke by a friend, but I didn't want to sing, so I declined."
        ]
    ],
    "hard": [
        [
            "彼の", "かれの", "his",
            "体調は", "たいちょうは", "health",
            "悪くなる", "わるくなる", "get worse",
            "ばかりで", "", "only",
            "回復", "かいふく", "recovery",
            "しつつある", "", "in the process of",
            "様子は", "ようすは", "signs",
            "見られない", "みられない", "cannot be seen",
            "His health is only getting worse, and there is no sign of recovery."
        ],
        [
            "彼が", "かれが", "he",
            "戻って", "もどって", "return",
            "きて", "", "come",
            "からでないと", "", "unless",
            "この", "この", "this",
            "件については", "けんについては", "regarding matter",
            "結論を", "けつろんを", "conclusion",
            "出さざるを", "ださざるを", "have to make",
            "得ない", "えない", "cannot help but",
            "Unless he comes back, we have no choice but to make a decision on this matter."
        ],
        [
            "もう", "", "already",
            "時間が", "じかんが", "time",
            "ないので", "", "because there isn't",
            "ここで", "", "here",
            "立ち止まって", "たちどまって", "stop",
            "はいられない", "", "cannot",
            "上は", "うえは", "now that",
            "全力で", "ぜんりょくで", "with all might",
            "進む", "すすむ", "move forward",
            "しかない", "", "no choice but to",
            "There's no time left, so we can't afford to stop here. Now that it's come to this, we have no choice but to move forward with all our might."
        ],
        [
            "法律を", "ほうりつを", "law",
            "守らなければ", "まもらなければ", "must obey",
            "ならないが", "", "but",
            "緊急", "きんきゅう", "emergency",
            "事態では", "じたいでは", "in situations",
            "ルールを", "るーるを", "rules",
            "破らざるを", "やぶらざるを", "have to break",
            "得ない", "えない", "cannot help but",
            "場合も", "ばあいも", "cases",
            "ある", "", "there are",
            "We must obey the law, but in emergencies, there are times when we have no choice but to break the rules."
        ],
        [
            "この", "この", "this",
            "ペースでは", "", "at pace",
            "間に合わない", "まにあわない", "not make it",
            "ようでは", "", "if",
            "休んで", "やすんで", "rest",
            "はいられない", "", "cannot",
            "If we can't make it at this pace, we can't afford to rest."
        ],
        [
            "彼の", "かれの", "his",
            "努力の", "どりょくの", "efforts",
            "おかげで", "", "thanks to",
            "プロジェクトは", "ぷろじぇくとは", "project",
            "順調に", "じゅんちょうに", "smoothly",
            "進みつつ", "すすみつつ", "progressing",
            "ある", "", "is",
            "成功は", "せいこうは", "success",
            "近づく", "ちかづく", "approaching",
            "ばかりだ", "", "only",
            "Thanks to his efforts, the project is steadily progressing. Success is only getting closer."
        ],
        [
            "社長が", "しゃちょうが", "president",
            "反対", "はんたい", "opposition",
            "している", "", "is doing",
            "上は", "うえは", "now that",
            "この", "この", "this",
            "計画を", "けいかくを", "plan",
            "諦めざるを", "あきらめざるを", "have to give up",
            "得ない", "えない", "cannot help but",
            "Now that the president is against it, we have no choice but to give up on this plan."
        ],
        [
            "この", "この", "this",
            "程度の", "ていどの", "level of",
            "困難で", "こんなんで", "difficulty",
            "諦める", "あきらめる", "give up",
            "ようでは", "", "if",
            "成功を", "せいこうを", "success",
            "目指して", "めざして", "aim for",
            "はいけない", "", "must not",
            "If you give up at this level of difficulty, you must not aim for success."
        ],
        [
            "この", "この", "this",
            "問題を", "もんだいを", "problem",
            "解決", "かいけつ", "solve",
            "してから", "", "after",
            "でないと", "", "unless",
            "新しい", "あたらしい", "new",
            "プロジェクトに", "ぷろじぇくとに", "to project",
            "進め", "すすめ", "proceed",
            "ばかりでは", "", "only",
            "ない", "", "not",
            "Unless we solve this problem, we can't just keep moving on to the new project."
        ],
        [
            "会社の", "かいしゃの", "company's",
            "ルールを", "るーるを", "rules",
            "守らなければ", "まもらなければ", "must follow",
            "ならないが", "", "but",
            "状況は", "じょうきょうは", "situation",
            "急速に", "きゅうそくに", "rapidly",
            "変わりつつ", "かわりつつ", "changing",
            "ある", "", "is",
            "We must follow the company's rules, but the situation is rapidly changing."
        ],
        [
            "この", "この", "this",
            "方法には", "ほうほうには", "method",
            "成功", "せいこう", "success",
            "する", "", "do",
            "可能性が", "かのうせいが", "possibility",
            "あるが", "", "there is but",
            "正確な", "せいかくな", "accurate",
            "データが", "でーたが", "data",
            "必要", "ひつよう", "necessary",
            "である", "", "is",
            "This method has a possibility of success, but accurate data is necessary."
        ],
        [
            "この", "この", "this",
            "機械は", "きかいは", "machine",
            "古すぎて", "ふるすぎて", "too old",
            "修理", "しゅうり", "repair",
            "することは", "", "to do",
            "できないし", "", "can't and",
            "どうにも", "", "by any means",
            "ならない", "", "cannot be done",
            "This machine is too old to be repaired, and there's no way to fix it."
        ],
        [
            "私たちの", "わたしたちの", "our",
            "予算では", "よさんでは", "with budget",
            "その", "その", "that",
            "プロジェクトを", "ぷろじぇくとを", "project",
            "完成", "かんせい", "completion",
            "することは", "", "to do",
            "できかねますが", "", "we can't, but",
            "遅延", "ちえん", "delay",
            "する", "", "do",
            "可能性も", "かのうせいも", "possibility also",
            "あります", "", "there is",
            "With our budget, we can't complete the project, but there is also a possibility of delays."
        ],
        [
            "これ", "これ", "this",
            "以上の", "いじょうの", "further",
            "説明は", "せつめいは", "explanation",
            "できよう", "", "can do",
            "もないし", "", "not even",
            "明確に", "めいかくに", "clearly",
            "するのは", "", "to do",
            "難しい", "むずかしい", "difficult",
            "There's no way to provide further explanation, and it's difficult to clarify."
        ],
        [
            "予算の", "よさんの", "budget",
            "制約が", "せいやくが", "constraints",
            "あるため", "", "because there are",
            "追加の", "ついかの", "additional",
            "設備を", "せつびを", "equipment",
            "購入", "こうにゅう", "purchase",
            "することは", "", "to do",
            "できかねます", "", "we're unable to",
            "Due to budget constraints, we're unable to purchase additional equipment."
        ],
        [
            "この", "この", "this",
            "決定が", "けっていが", "decision",
            "誤り", "あやまり", "mistake",
            "である", "", "is",
            "可能性が", "かのうせいが", "possibility",
            "あるため", "", "because there is",
            "変更", "へんこう", "change",
            "することは", "", "to do",
            "難しい", "むずかしい", "difficult",
            "かもしれない", "", "might be",
            "There is a possibility that this decision is incorrect, so it might be difficult to change it."
        ],
        [
            "情報が", "じょうほうが", "information",
            "不十分で", "ふじゅうぶんで", "insufficient",
            "正確な", "せいかくな", "accurate",
            "結論を", "けつろんを", "conclusion",
            "出すことは", "だすことは", "to draw",
            "できる", "", "can do",
            "ようがない", "", "there is no way",
            "With insufficient information, there is no way to draw an accurate conclusion."
        ],
        [
            "この", "この", "this",
            "問題を", "もんだいを", "problem",
            "放置", "ほうち", "leave unattended",
            "すると", "", "if do",
            "さらに", "", "even",
            "大きな", "おおきな", "big",
            "問題を", "もんだいを", "problems",
            "引き起こし", "ひきおこし", "cause",
            "かねない", "", "might",
            "If we leave this problem unattended, it might lead to even bigger issues."
        ],
        [
            "この", "この", "this",
            "古い", "ふるい", "old",
            "システムでは", "しすてむでは", "with system",
            "最新の", "さいしんの", "latest",
            "ソフトウェアに", "そふとうぇあに", "software",
            "対応", "たいおう", "handle",
            "することは", "", "to do",
            "できないし", "", "can't and",
            "どうする", "", "what to do",
            "こともできない", "", "also cannot do",
            "This old system can't handle the latest software, and there's nothing that can be done about it."
        ],
        [
            "この", "この", "this",
            "状況では", "じょうきょうでは", "in situation",
            "新しい", "あたらしい", "new",
            "提案を", "ていあんを", "proposals",
            "受け入れる", "うけいれる", "accept",
            "ことは", "", "to do",
            "難しく", "むずかしく", "difficult",
            "対応", "たいおう", "address",
            "する", "", "do",
            "方法が", "ほうほうが", "way",
            "ありません", "", "there isn't",
            "In this situation, accepting new proposals is difficult, and there's no way to address it."
        ],
        [
            "彼は", "かれは", "he",
            "プロの選手", "ぷろのせんしゅ", "professional athlete",
            "だけあって", "", "as expected",
            "そのスキルが", "そのすきるが", "those skills",
            "高い", "たかい", "high",
            "のも", "", "also",
            "当然だ", "とうぜんだ", "natural",
            "He's a professional athlete, so it's only natural that his skills are high."
        ],
        [
            "約束を", "やくそくを", "promise",
            "守らなかった", "まもらなかった", "did not keep",
            "ばかりに", "", "precisely because",
            "彼とは", "かれとは", "with him",
            "もう", "", "no longer",
            "連絡を取らない", "れんらくをとらない", "keep in touch",
            "ことになった", "", "decided to",
            "のももっともだ", "", "it's only natural",
            "It's only natural that we no longer keep in touch with him, precisely because he didn't keep his promise."
        ],
        [
            "このレストランは", "", "this restaurant",
            "高級な", "こうきゅうな", "high-end",
            "だけに", "", "being",
            "サービスが", "さーびすが", "service",
            "非常に", "ひじょうに", "extremely",
            "良い", "よい", "good",
            "上に", "うえに", "in addition to",
            "料理も", "りょうりも", "food also",
            "美味しい", "おいしい", "delicious",
            "This restaurant, being high-end, not only has excellent service but also delicious food."
        ],
        [
            "お客様からの", "おきゃくさまからの", "from customers",
            "評価が", "ひょうかが", "ratings",
            "高い", "たかい", "high",
            "からこそ", "", "precisely because",
            "その店舗の", "そのてんぽの", "that store's",
            "成功の", "せいこうの", "success",
            "理由が", "りゆうが", "reason",
            "ここにある", "", "is here",
            "ことから", "", "from this",
            "経営方針を", "けいえいほうしんを", "management policy",
            "見直すべきだ", "みなおすべきだ", "should be reviewed",
            "Precisely because of the high customer ratings, the reason for the store's success is here, and the management policy should be reviewed."
        ],
        [
            "忙しい", "いそがしい", "busy",
            "ことだから", "", "because",
            "遅れる", "おくれる", "to be late",
            "のも", "", "also",
            "仕方がない", "しかたがない", "can't be helped",
            "ばかりに", "", "precisely because",
            "先に", "さきに", "ahead",
            "進めなかった", "すすめなかった", "couldn't proceed",
            "It's only natural to be late due to being busy, which is precisely why we couldn't proceed."
        ],
        [
            "彼の", "かれの", "his",
            "意見が", "いけんが", "opinion",
            "正しい", "ただしい", "correct",
            "のももっともだが", "", "it's only natural, but",
            "実行する", "じっこうする", "to implement",
            "のは", "", "is",
            "難しい", "むずかしい", "difficult",
            "ものの", "", "although",
            "考慮する", "こうりょする", "to consider",
            "必要がある", "ひつようがある", "need to",
            "It's only natural that his opinion is correct, but although implementing it is difficult, it needs to be considered."
        ],
        [
            "要するに", "ようするに", "in short",
            "彼の", "かれの", "his",
            "成功は", "せいこうは", "success",
            "努力の", "どりょくの", "effort's",
            "結果", "けっか", "result",
            "だから", "", "because",
            "それが", "", "that",
            "認められる", "みとめられる", "to be recognized",
            "のも", "", "also",
            "当然だ", "とうぜんだ", "natural",
            "In short, his success is the result of hard work, so it's only natural that it is recognized."
        ],
        [
            "経験を", "けいけんを", "experience",
            "積んだ", "つんだ", "gained",
            "上でこそ", "うえでこそ", "only after",
            "その知識を", "そのちしきを", "that knowledge",
            "活かして", "いかして", "utilizing",
            "プロジェクトを", "ぷろじぇくとを", "project",
            "成功させる", "せいこうさせる", "to make successful",
            "ことができる", "", "can do",
            "Only after gaining experience can you utilize that knowledge to ensure the success of the project."
        ],
        [
            "難しい", "むずかしい", "difficult",
            "試験である", "しけんである", "exam",
            "ものの", "", "although",
            "その内容が", "そのないようが", "its content",
            "実生活で", "じっせいかつで", "in real life",
            "役立つ", "やくだつ", "useful",
            "ことだから", "", "because",
            "勉強する", "べんきょうする", "to study",
            "価値がある", "かちがある", "worth",
            "Although it's a difficult exam, it's worth studying because its content is useful in real life."
        ],
        [
            "果たして", "はたして", "sure enough",
            "彼の", "かれの", "his",
            "提案は", "ていあんは", "proposal",
            "実現した", "じつげんした", "was implemented",
            "だけに", "", "because",
            "期待以上の", "きたいいじょうの", "beyond expectations",
            "結果が", "けっかが", "results",
            "得られた", "えられた", "were obtained",
            "Sure enough, because his proposal was implemented, results beyond expectations were achieved."
        ],
        [
            "彼とは", "かれとは", "with him",
            "高校", "こうこう", "high school",
            "卒業", "そつぎょう", "graduation",
            "ぶりに", "", "for the first time since",
            "再会した", "さいかいした", "reunited",
            "のも", "", "also",
            "長い間", "ながいあいだ", "for a long time",
            "連絡が", "れんらくが", "contact",
            "取れなかった", "とれなかった", "couldn't be made",
            "末に", "すえに", "after",
            "実現した", "じつげんした", "was realized",
            "We reunited after graduating high school for the first time in a long time, as a result of not being in touch for a long period."
        ],
        [
            "電車が", "でんしゃが", "train",
            "駅に", "えきに", "at the station",
            "着いた", "ついた", "arrived",
            "か", "", "or",
            "着かない", "つかない", "not arrived",
            "かのうちに", "", "right after",
            "彼が", "かれが", "he",
            "降りて", "おりて", "got off",
            "からて以来", "", "since then",
            "全く", "まったく", "at all",
            "会っていない", "あっていない", "haven't met",
            "Right after the train arrived at the station, I haven't seen him at all since he got off."
        ],
        [
            "大雨が", "おおあめが", "heavy rain",
            "降りつつ", "ふりつつ", "while falling",
            "道路が", "どうろが", "roads",
            "水浸しに", "みずびしに", "flooded",
            "なってしまった", "", "became",
            "上に", "うえに", "in addition to",
            "交通機関も", "こうつうきかんも", "transportation also",
            "完全に", "かんぜんに", "completely",
            "ストップした", "", "stopped",
            "While heavy rain was falling, not only did the roads become flooded, but the transportation also completely stopped."
        ],
        [
            "彼の", "かれの", "his",
            "誕生日を", "たんじょうびを", "birthday",
            "祝った", "いわった", "celebrated",
            "のは", "", "was",
            "5年ぶりで", "ごねんぶりで", "after 5 years",
            "結婚して", "けっこんして", "got married",
            "からて以来の", "", "since",
            "再会だった", "さいかいだった", "reunion",
            "It had been 5 years since we celebrated his birthday, and it was our first reunion since he got married."
        ],
        [
            "試験が", "しけんが", "exam",
            "始まった", "はじまった", "started",
            "か", "", "or",
            "始まらない", "はじまらない", "not started",
            "かのうちに", "", "right after",
            "学生たちは", "がくせいたちは", "students",
            "緊張の", "きんちょうの", "nervousness",
            "末", "すえ", "after",
            "集中力を", "しゅうちゅうりょくを", "concentration",
            "高めていた", "たかめていた", "increased",
            "Right after the exam started, the students, after much nervousness, increased their concentration."
        ],
        [
            "この地域の", "このちいきの", "this area's",
            "気候は", "きこうは", "climate",
            "隣の", "となりの", "neighboring",
            "地域に", "ちいきに", "area",
            "比べて", "くらべて", "compared to",
            "湿度が", "しつどが", "humidity",
            "高い", "たかい", "high",
            "ように", "", "as if",
            "感じる", "かんじる", "feel",
            "The climate in this area feels more humid compared to the neighboring area."
        ],
        [
            "この問題に", "このもんだいに", "this issue",
            "対しては", "たいしては", "regarding",
            "専門家に", "せんもんかに", "experts",
            "しても", "", "even",
            "意見が", "いけんが", "opinions",
            "分かれる", "わかれる", "be divided",
            "ことがある", "", "there are times",
            "Even experts have differing opinions on this issue."
        ],
        [
            "この映画は", "このえいがは", "this movie",
            "前作に", "ぜんさくに", "previous work",
            "比べて", "くらべて", "compared to",
            "面白い", "おもしろい", "interesting",
            "ように", "", "as if",
            "感じる", "かんじる", "feel",
            "が", "", "but",
            "評価は", "ひょうかは", "evaluations",
            "分かれる", "わかれる", "are divided",
            "This movie feels more interesting compared to the previous one, but opinions are divided."
        ],
        [
            "あなたの", "", "your",
            "提案に", "ていあんに", "proposal",
            "しても", "", "even with",
            "他の", "ほかの", "other",
            "メンバーに", "", "members",
            "対しては", "たいしては", "regarding",
            "異論が", "いろんが", "objections",
            "ある", "", "there are",
            "かもしれない", "", "might be",
            "Even with your proposal, there might be dissenting opinions from other members."
        ],
        [
            "新しい", "あたらしい", "new",
            "モデルは", "", "model",
            "旧モデルに", "きゅうもでるに", "old model",
            "比べて", "くらべて", "compared to",
            "性能が", "せいのうが", "performance",
            "良い", "よい", "good",
            "にしても", "", "even though",
            "価格が", "かかくが", "price",
            "高すぎる", "たかすぎる", "too high",
            "と思う", "とおもう", "I think",
            "Even though the new model has better performance compared to the old model, I think the price is too high."
        ],
        [
            "この映画は", "このえいがは", "this movie",
            "面白い", "おもしろい", "interesting",
            "だけでなく", "", "not only",
            "感動的な", "かんどうてきな", "touching",
            "ところも", "", "parts also",
            "ある", "", "has",
            "This movie is not only interesting but also has touching parts."
        ],
        [
            "この問題の", "このもんだいの", "this problem's",
            "解決には", "かいけつには", "solving",
            "時間が", "じかんが", "time",
            "かかる", "", "takes",
            "だけの", "", "worth",
            "ことはある", "", "it is",
            "It's no wonder that solving this problem takes time."
        ],
        [
            "彼は", "かれは", "he",
            "約束を", "やくそくを", "promises",
            "守る", "まもる", "keep",
            "ことは", "", "nominalizer",
            "もちろん", "", "of course",
            "予定の時間", "よていのじかん", "scheduled time",
            "より早く", "よりはやく", "earlier than",
            "来る", "くる", "come",
            "こともある", "", "sometimes does",
            "He not only keeps promises but also sometimes arrives earlier than the scheduled time."
        ],
        [
            "彼女の", "かのじょの", "her",
            "優しさは", "やさしさは", "kindness",
            "まるで", "", "just like",
            "天使の", "てんしの", "angel's",
            "ようで", "", "like",
            "かえって", "", "surprisingly",
            "周りの", "まわりの", "surrounding",
            "人々を", "ひとびとを", "people",
            "驚かせる", "おどろかせる", "astonish",
            "Her kindness is just like an angel's, which surprisingly astonishes the people around her."
        ],
        [
            "このレストランは", "", "this restaurant",
            "高い", "たかい", "expensive",
            "だけでなく", "", "not only",
            "味も", "あじも", "taste also",
            "悪い", "わるい", "bad",
            "からして", "", "because of that",
            "あまり", "", "not much",
            "お勧めしない", "おすすめしない", "recommend",
            "This restaurant is not only expensive but also has bad taste, so I don't recommend it much."
        ],
    ],
    "まあまあhard": [
        [
            "彼の", "かれの", "his",
            "努力は", "どりょくは", "effort",
            "計り知れないほど", "はかりしれないほど", "immeasurable",
            "で", "", "to the extent",
            "成功する", "せいこうする", "to succeed",
            "ことは", "", "the fact",
            "ほぼ", "", "almost",
            "間違いない", "まちがいない", "certain",
            "His effort is to the extent that it’s immeasurable, and success is almost certain."
        ],
        [
            "彼女は", "かのじょは", "she",
            "自分の", "じぶんの", "her own",
            "意見を", "いけんを", "opinion",
            "通すために", "とおすために", "to get across",
            "どんな手段を", "どんなしゅだんを", "any means",
            "使ったとしても", "つかったとしても", "even if uses",
            "構わないようだ", "かまわないようだ", "seems not to care",
            "She seems to not care about the means she uses to get her opinion across, even to the extent of anything."
        ],
        [
            "あなたが", "", "you",
            "その仕事を", "そのしごとを", "that job",
            "完璧に", "かんぺきに", "perfectly",
            "こなせる", "", "can handle",
            "限り", "かぎり", "as long as",
            "私たちは", "わたしたちは", "we",
            "心配する", "しんぱいする", "worry about",
            "ことはない", "", "don't need to",
            "As long as you can handle the job perfectly, we have nothing to worry about."
        ],
        [
            "彼は", "かれは", "he",
            "毎日", "まいにち", "every day",
            "トレーニングを", "", "training",
            "続けて", "つづけて", "continue",
            "すっかり", "", "completely",
            "体力が", "たいりょくが", "physical strength",
            "ついた", "", "gained",
            "ことにはならない", "", "doesn't mean",
            "Just because he continues training every day doesn't mean he has fully gained physical strength."
        ],
        [
            "試験に", "しけんに", "exam",
            "合格した", "ごうかくした", "passed",
            "彼は", "かれは", "he",
            "努力した", "どりょくした", "made efforts",
            "だけの", "", "worth",
            "ことは", "", "it is",
            "ある", "", "has",
            "と思う", "とおもう", "I think",
            "I think he's no wonder he passed the exam because of his efforts."
        ],
        [
            "あなたが", "", "you",
            "そのプロジェクトに", "そのぷろじぇくとに", "that project",
            "対して", "たいして", "towards",
            "情熱を", "じょうねつを", "passion",
            "持っている", "もっている", "have",
            "限り", "かぎり", "as long as",
            "成功する", "せいこうする", "succeed",
            "ことは", "", "nominalizer",
            "間違いない", "まちがいない", "no doubt",
            "As long as you have passion for that project, there is no doubt you will succeed."
        ],
        [
            "彼の", "かれの", "his",
            "説明は", "せつめいは", "explanation",
            "わかりやすい", "", "easy to understand",
            "反面", "はんめん", "on the other hand",
            "実際の", "じっさいの", "actual",
            "実践には", "じっせんには", "practice",
            "不十分だ", "ふじゅうぶんだ", "insufficient",
            "と感じた", "とかんじた", "felt",
            "His explanation is easy to understand, but on the other hand, I felt it was insufficient for actual practice."
        ],
        [
            "彼は", "かれは", "he",
            "あまりにも", "", "too",
            "忙しい", "いそがしい", "busy",
            "ので", "", "so",
            "いわゆる", "", "so-called",
            "休暇", "きゅうか", "vacation",
            "を取る", "をとる", "take",
            "暇も", "ひまも", "time",
            "少しもない", "すこしもない", "not even a little",
            "He's so busy that he doesn't even have a little time to take what is called a 'vacation'."
        ],
        [
            "このプロジェクトは", "このぷろじぇくとは", "this project",
            "次第に", "しだいに", "gradually",
            "進行しており", "しんこうしており", "progressing",
            "いよいよ", "", "at last",
            "完成が", "かんせいが", "completion",
            "近づいてきた", "ちかづいてきた", "approaching",
            "This project is progressing gradually, and at last, completion is approaching."
        ],
        [
            "新しい", "あたらしい", "new",
            "機械は", "きかいは", "machine",
            "性能が", "せいのうが", "performance",
            "良い", "よい", "good",
            "反面", "はんめん", "on the contrary",
            "価格が", "かかくが", "price",
            "高い", "たかい", "expensive",
            "ため", "", "because",
            "せめて", "", "at least",
            "予算内での", "よさんないでの", "within budget",
            "購入は", "こうにゅうは", "purchase",
            "難しい", "むずかしい", "difficult",
            "The new machine has good performance but, on the contrary, is expensive, so at least purchasing it within the budget is difficult."
        ],
        [
            "彼女の", "かのじょの", "her",
            "説明は", "せつめいは", "explanation",
            "わかりやすい", "", "easy to understand",
            "反面", "はんめん", "on the contrary",
            "逆に", "ぎゃくに", "conversely",
            "さらに", "", "even more",
            "混乱する", "こんらんする", "confuse",
            "こともある", "", "can sometimes",
            "Her explanation is easy to understand; on the contrary, it can sometimes cause even more confusion."
        ],
        [
            "この料理は", "このりょうりは", "this dish",
            "見た目は", "みためは", "appearance",
            "美しい", "うつくしい", "beautiful",
            "が", "", "but",
            "せいぜい", "", "at best",
            "味は", "あじは", "taste",
            "普通だ", "ふつうだ", "average",
            "This dish looks beautiful, but at best, its taste is average."
        ],
        [
            "会議は", "かいぎは", "meeting",
            "明日から", "あしたから", "from tomorrow",
            "始まる", "はじまる", "start",
            "予定ですが", "よていですが", "scheduled but",
            "詳細が", "しょうさいが", "details",
            "決まり次第", "きまりしだい", "as soon as decided",
            "お知らせします", "おしらせします", "will notify",
            "The meeting is scheduled to start from tomorrow, but we will notify you as soon as the details are decided."
        ],
        [
            "彼は", "かれは", "he",
            "プロジェクトを", "ぷろじぇくとを", "project",
            "進める", "すすめる", "advance",
            "ために", "", "in order to",
            "せめて", "", "at least",
            "一週間は", "いっしゅうかんは", "for a week",
            "集中して", "しゅうちゅうして", "focus",
            "作業する", "さぎょうする", "work",
            "つもりでいる", "", "intends to",
            "He intends to work on the project with the intention of focusing for at least a week."
        ],
        [
            "試験の", "しけんの", "exam",
            "合格が", "ごうかくが", "passing",
            "決まった", "きまった", "decided",
            "後は", "あとは", "after",
            "いわゆる", "", "so-called",
            "お祝い", "おいわい", "celebration",
            "をする", "", "do",
            "つもりだ", "", "intend to",
            "After the exam results are confirmed, I plan to have what is called a 'celebration'."
        ],
        [
            "この問題を", "このもんだいを", "this problem",
            "解決する", "かいけつする", "solve",
            "ためには", "ためには", "in order to",
            "次第に", "しだいに", "gradually",
            "情報を", "じょうほうを", "information",
            "集めながら", "あつめながら", "while gathering",
            "進める", "すすめる", "proceed",
            "必要がある", "ひつようがある", "necessary",
            "To solve this problem, it's necessary to proceed while gradually gathering information."
        ],
        [
            "この計画は", "このけいかくは", "this plan",
            "成功する", "せいこうする", "succeed",
            "かどうかは", "", "whether or not",
            "実行してみない", "じっこうしてみない", "try it",
            "ことには", "", "until",
            "わからない", "", "won't know",
            "Whether this plan will succeed or not, we won't know until we try it."
        ],
        [
            "彼は", "かれは", "he",
            "どうせ", "", "anyway",
            "間に合わない", "まにあわない", "won't make it",
            "と思っていた", "とおもっていた", "thought",
            "が", "", "but",
            "どうやら", "", "it seems",
            "急いで", "いそいで", "hurry",
            "準備する", "じゅんびする", "prepare",
            "必要が", "ひつようが", "need",
            "あった", "", "there was",
            "ようだ", "", "seems like",
            "He thought he wouldn't make it anyway, but it seems like there was a need to hurry and prepare."
        ],
        [
            "このプロジェクトが", "このぷろじぇくとが", "this project",
            "成功する", "せいこうする", "succeed",
            "かどうかは", "", "whether or not",
            "結果が", "けっかが", "results",
            "出る", "でる", "come out",
            "まで", "", "until",
            "わからない", "", "cannot be known",
            "というものだ", "", "that's how it is",
            "Whether this project will succeed or not is something that cannot be known until the results come out."
        ],
        [
            "彼女が", "かのじょが", "she",
            "その提案を", "そのていあんを", "that proposal",
            "受け入れた", "うけいれた", "accepted",
            "ということは", "", "the fact that",
            "かなり", "", "quite",
            "積極的な", "せっきょくてきな", "proactive",
            "姿勢を", "しせいを", "attitude",
            "示している", "しめしている", "showing",
            "と言える", "といえる", "can be said",
            "The fact that she accepted the proposal can be said to indicate a very proactive attitude."
        ],
        [
            "彼は", "かれは", "he",
            "どころではない", "", "not even close",
            "もう", "", "already",
            "寝る", "ねる", "sleep",
            "時間を", "じかんを", "time",
            "過ぎてしまった", "すぎてしまった", "has passed",
            "He's not even close; it's already past bedtime."
        ],
        [
            "この問題が", "このもんだいが", "this problem",
            "解決する", "かいけつする", "solve",
            "には", "", "to",
            "少なくとも", "", "at least",
            "1ヶ月は", "いっかげつは", "one month",
            "かかる", "", "take",
            "と考えられる", "とかんがえられる", "it can be thought",
            "To solve this problem, it can be thought that it will take at least a month."
        ],
        [
            "このプロジェクトを", "このぷろじぇくとを", "this project",
            "成功させる", "せいこうさせる", "to make successful",
            "ために", "ために", "for the purpose of",
            "どんなに", "", "no matter how much",
            "努力しても", "どりょくしても", "even if I put effort",
            "価値がある", "かちがある", "worth it",
            "と信じている", "としんじている", "believe",
            "I believe that no matter how much effort I put into making this project successful, it's worth it."
        ],
        [
            "彼は", "かれは", "he",
            "試験に", "しけんに", "for the exam",
            "合格する", "ごうかくする", "to pass",
            "ために", "ために", "for the purpose of",
            "毎日", "まいにち", "every day",
            "勉強する", "べんきょうする", "to study",
            "つもりだ", "つもりだ", "intends to",
            "が", "", "but",
            "なかなか", "", "hardly",
            "時間が", "じかんが", "time",
            "取れない", "とれない", "can't find",
            "He intends to study every day to pass the exam, but he can't seem to find the time."
        ],
        [
            "この問題を", "このもんだいを", "this problem",
            "解決する", "かいけつする", "to solve",
            "ためには", "ためには", "in order to",
            "専門家の", "せんもんかの", "expert's",
            "意見を", "いけんを", "opinion",
            "聞く", "きく", "to listen to",
            "価値がある", "かちがある", "worth it",
            "と思う", "とおもう", "I think",
            "I think it's worth the effort to consult an expert to solve this problem."
        ],
        [
            "たとえ", "", "even if",
            "どんなに", "", "no matter how",
            "難しくても", "むずかしくても", "difficult",
            "最後まで", "さいごまで", "until the end",
            "やり遂げる", "やりとげる", "to accomplish",
            "つもりだ", "つもりだ", "intend to",
            "Even if it's very difficult, I intend to see it through to the end."
        ],
        [
            "彼が", "かれが", "he",
            "この計画を", "このけいかくを", "this plan",
            "実行する", "じっこうする", "to implement",
            "つもりなら", "つもりなら", "if he intends to",
            "サポートを", "さぽーとを", "support",
            "惜しまない", "おしまない", "not hesitate to provide",
            "つもりだ", "つもりだ", "intend to",
            "If he intends to implement this plan, I'm willing to provide support."
        ],
        [
            "努力しても", "どりょくしても", "even if I make an effort",
            "すぐには", "すぐには", "immediately",
            "結果が", "けっかが", "results",
            "出ない", "でない", "don't come out",
            "ことが多い", "ことがおおい", "often",
            "が", "", "but",
            "それでも", "", "still",
            "続ける", "つづける", "continue",
            "つもりだ", "つもりだ", "intend to",
            "Even if effort doesn't produce results immediately, I still intend to continue."
        ],
        [
            "このレシピは", "このれしぴは", "this recipe",
            "手間が", "てまが", "effort",
            "かかる", "かかる", "takes",
            "が", "", "but",
            "作る", "つくる", "to make",
            "価値がある", "かちがある", "worth it",
            "といえる", "といえる", "can be said",
            "This recipe takes a lot of effort, but it can be said that it's worth making."
        ],
        [
            "彼女は", "かのじょは", "she",
            "試合に", "しあいに", "in the match",
            "勝つ", "かつ", "to win",
            "ために", "ために", "for the purpose of",
            "毎晩", "まいばん", "every night",
            "練習する", "れんしゅうする", "to practice",
            "つもりでいる", "つもりでいる", "intends to",
            "が", "", "but",
            "体調が", "たいちょうが", "health condition",
            "心配だ", "しんぱいだ", "is worrying",
            "She intends to practice every night to win the match, but I'm worried about her health."
        ],
        [
            "この新しい", "このあたらしい", "this new",
            "プログラムを", "ぷろぐらむを", "program",
            "使う", "つかう", "to use",
            "ことで", "ことで", "by",
            "作業が", "さぎょうが", "work",
            "効率的に", "こうりつてきに", "efficient",
            "なる", "なる", "become",
            "つもりだ", "つもりだ", "intend to",
            "By using this new program, I intend for the work to become more efficient."
        ],
        [
            "一生懸命", "いっしょうけんめい", "hard",
            "働いても", "はたらいても", "even if I work",
            "成果が", "せいかが", "results",
            "出ない", "でない", "don't come out",
            "こともある", "こともある", "there are times",
            "が", "", "but",
            "それでも", "", "still",
            "続ける", "つづける", "continue",
            "つもりだ", "つもりだ", "intend to",
            "Even if working hard doesn't always produce results, I still intend to continue."
        ],
        [
            "この問題は", "このもんだいは", "this problem",
            "解決しなければならない", "かいけつしなければならない", "must be solved",
            "が", "", "but",
            "非常に", "ひじょうに", "extremely",
            "難しい", "むずかしい", "difficult",
            "と感じて", "とかんじて", "feel",
            "ならない", "ならない", "can't help",
            "This problem must be solved, but I can't help feeling that it's extremely difficult."
        ],
        [
            "彼の", "かれの", "his",
            "プレゼンテーションは", "ぷれぜんてーしょんは", "presentation",
            "面白い", "おもしろい", "interesting",
            "し", "", "and",
            "聴衆の", "ちょうしゅうの", "audience's",
            "反応も", "はんのうも", "reaction also",
            "良い", "よい", "good",
            "そんな中で", "そんななかで", "in that context",
            "もう少し", "もうすこし", "a bit more",
            "話し続けて", "はなしつづけて", "continue talking",
            "ほしい", "ほしい", "want",
            "気がする", "きがする", "feel like",
            "His presentation is interesting, and the audience's reaction is good. In that context, I feel like he should continue talking a bit more."
        ],
        [
            "この映画は", "このえいがは", "this movie",
            "期待外れ", "きたいはずれ", "disappointing",
            "で", "", "and",
            "観るのが", "みるのが", "watching",
            "非常に", "ひじょうに", "extremely",
            "面倒だ", "めんどうだ", "troublesome",
            "と思う", "とおもう", "I think",
            "This movie is disappointing, and I feel it's extremely troublesome to watch."
        ],
        [
            "彼が", "かれが", "he",
            "その提案を", "そのていあんを", "that proposal",
            "受け入れる", "うけいれる", "accept",
            "気配が", "けはいが", "signs",
            "全く", "まったく", "at all",
            "見られない", "みられない", "can't be seen",
            "ので", "ので", "so",
            "成功する", "せいこうする", "succeed",
            "とは思えない", "とはおもえない", "don't think",
            "Since there are no signs at all that he is willing to accept the proposal, I don't think it's likely to succeed."
        ],
        [
            "試験の", "しけんの", "exam",
            "結果が", "けっかが", "results",
            "気になって", "きになって", "worried about",
            "しょうがない", "しょうがない", "can't help",
            "が", "", "but",
            "まだ", "", "yet",
            "通知が", "つうちが", "notification",
            "来ていない", "きていない", "hasn't come",
            "I'm extremely anxious about the exam results, but I haven't received the notification yet."
        ],
        [
            "このプロジェクトは", "このぷろじぇくとは", "this project",
            "時間が", "じかんが", "time",
            "かかりすぎて", "かかりすぎて", "taking too long",
            "完成する", "かんせいする", "complete",
            "とは思えない", "とはおもえない", "don't think",
            "This project is taking too long, and I don't think it's likely to be completed."
        ],
        [
            "彼女の", "かのじょの", "her",
            "提案には", "ていあんには", "proposal",
            "賛成せざるを得ない", "さんせいせざるをえない", "have no choice but to agree",
            "が", "", "but",
            "どこかで", "", "somehow",
            "納得できない", "なっとくできない", "can't be satisfied",
            "気がする", "きがする", "feel",
            "I have no choice but to agree with her proposal, but I feel somewhat unsatisfied."
        ],
        [
            "彼は", "かれは", "he",
            "仕事を", "しごとを", "work",
            "やらなければならない", "やらなければならない", "must do",
            "と分かっている", "とわかっている", "knows",
            "が", "", "but",
            "まったく", "", "at all",
            "やる気が", "やるきが", "motivation",
            "ない", "ない", "doesn't have",
            "ようだ", "ようだ", "seems",
            "He knows he must do the work, but it seems he has no motivation at all."
        ],
        [
            "そのニュースを", "そのにゅーすを", "that news",
            "聞いて", "きいて", "upon hearing",
            "驚きで", "おどろきで", "surprise",
            "たまらない", "たまらない", "overwhelming",
            "気持ちに", "きもちに", "feeling",
            "なった", "なった", "became",
            "Upon hearing that news, I felt an overwhelming sense of surprise."
        ],
        [
            "彼女の", "かのじょの", "her",
            "言葉には", "ことばには", "words",
            "感動して", "かんどうして", "moved by",
            "たまらない", "たまらない", "deeply",
            "が", "", "but",
            "どう", "", "how",
            "反応していいか", "はんのうしていいか", "to respond",
            "わからない", "わからない", "don't know",
            "I'm deeply moved by her words, but I don't know how to respond."
        ],
        [
            "彼は", "かれは", "he",
            "一晩中", "ひとばんじゅう", "all night",
            "働いた", "はたらいた", "worked",
            "ばかりでなく", "ばかりでなく", "not only",
            "休日も", "きゅうじつも", "days off",
            "返上して", "へんじょうして", "giving up",
            "仕事を", "しごとを", "work",
            "続けた", "つづけた", "continued",
            "He not only worked all night but also continued working on his days off."
        ],
        [
            "この料理は", "このりょうりは", "this dish",
            "美味しい", "おいしい", "delicious",
            "ばかりでなく", "ばかりでなく", "not only",
            "見た目も", "みためも", "appearance also",
            "素晴らしい", "すばらしい", "fantastic",
            "This dish is not only delicious but also looks fantastic."
        ],
        [
            "彼女は", "かのじょは", "she",
            "試験に", "しけんに", "exam",
            "合格する", "ごうかくする", "to pass",
            "ために", "ために", "for the purpose of",
            "毎日", "まいにち", "every day",
            "何時間も", "なんじかんも", "for several hours",
            "勉強した", "べんきょうした", "studied",
            "その努力は", "そのどりょくは", "that effort",
            "まさに", "", "truly",
            "尊敬に値する", "そんけいにあたいする", "deserves respect",
            "ほどだ", "ほどだ", "to the extent that",
            "She studied for several hours every day to pass the exam. Her effort is truly to the extent that it deserves respect."
        ]
    ],
    "まあまあ上手": [
        [
            "私は", "わたしは", "I",
            "成功するべく", "", "in order to succeed",
            "努力していますが", "どりょくしていますが", "am making an effort, but",
            "失敗するべからず", "", "must not fail",
            "と心がけています", "とこころがけています", "keep in mind",
            "I am making an effort in order to succeed, but I keep in mind that I must not fail."
        ],
        [
            "この問題を", "このもんだいを", "this problem",
            "解決するべく", "", "in order to solve",
            "試みたが", "こころみたが", "tried, but",
            "どうしても", "", "no matter what",
            "解決するべくもない", "", "can't be solved",
            "I tried to solve this problem, but no matter what, it can't be solved."
        ],
        [
            "彼は", "かれは", "he",
            "遅刻するべからず", "ちこくするべからず", "must not be late",
            "と言われたが", "といわれたが", "was told, but",
            "電車が", "でんしゃが", "train",
            "遅れてきてしまった", "おくれてきてしまった", "was delayed",
            "He was told that he must not be late, but the train was delayed."
        ],
        [
            "この計画は", "このけいかくは", "this plan",
            "成功するべくもない", "せいこうするべくもない", "can't succeed",
            "ので", "", "so",
            "新しい", "あたらしい", "new",
            "アイデアを", "", "idea",
            "考えなければならない", "かんがえなければならない", "need to come up with",
            "This plan can't succeed, so we need to come up with a new idea."
        ],
        [
            "真実を", "しんじつを", "truth",
            "隠すべからず", "かくすべからず", "must not hide",
            "という", "", "that",
            "規則が", "きそくが", "rule",
            "あるが", "", "there is, but",
            "彼は", "かれは", "he",
            "それを", "", "it",
            "守らなかった", "まもらなかった", "did not follow",
            "There is a rule that one must not hide the truth, but he did not follow it."
        ],
        [
            "彼が", "かれが", "he",
            "失敗すれば", "しっぱいすれば", "if fails",
            "それまでだが", "", "then it's over, but",
            "その結果では", "そのけっかでは", "with those results",
            "すまないこと", "", "doesn't end",
            "が多い", "がおおい", "often",
            "If he fails, then it's over, but the results often don't end with just that."
        ],
        [
            "仕事を", "しごとを", "work",
            "怠けたら", "なまけたら", "if slack off",
            "遅刻する", "ちこくする", "be late",
            "羽目になるし", "はめになるし", "will end up, and",
            "最終的には", "さいしゅうてきには", "eventually",
            "解雇されれば", "かいこされれば", "if fired",
            "それまでだ", "", "it's over",
            "If you slack off at work, you'll end up being late, and eventually, it's over if you get fired."
        ],
        [
            "ルールを", "", "rules",
            "破ったら", "やぶったら", "if break",
            "罰金では", "ばっきんでは", "with a fine",
            "すまないし", "", "doesn't end, and",
            "最悪の場合", "さいあくのばあい", "in the worst case",
            "訴訟になる", "そしょうになる", "become a lawsuit",
            "羽目になる", "はめになる", "end up",
            "If you break the rules, it doesn't end with just a fine; in the worst case, you'll end up with a lawsuit."
        ],
        [
            "事故を", "じこを", "accident",
            "起こせば", "おこせば", "if cause",
            "それまでだが", "", "then it's over, but",
            "保険で", "ほけんで", "by insurance",
            "カバーできない", "", "can't cover",
            "費用では", "ひようでは", "with costs",
            "すまない", "", "doesn't end",
            "If you cause an accident, then it's over, but the costs that aren't covered by insurance don't end with just that."
        ],
        [
            "約束を", "やくそくを", "promises",
            "守らなければ", "まもらなければ", "if don't keep",
            "羽目になるし", "はめになるし", "will end up, and",
            "友達との", "ともだちとの", "with friends",
            "関係では", "かんけいでは", "relationship",
            "すまない", "", "doesn't end",
            "問題が", "もんだいが", "problems",
            "起きるかもしれない", "おきるかもしれない", "might arise",
            "If you don't keep your promises, you'll end up with issues, and problems might arise that don't just affect your relationship with friends."
        ],
        [
            "彼が", "かれが", "he",
            "医者であれ", "いしゃであれ", "whether a doctor",
            "エンジニアであれ", "", "or an engineer",
            "知識を", "ちしきを", "knowledge",
            "持っていることは", "もっていることは", "having",
            "変わりないが", "かわりないが", "doesn't change, but",
            "問題の", "もんだいの", "problem's",
            "解決方法では", "かいけつほうほうでは", "solution",
            "あるまいか", "", "I wonder if it's not",
            "Whether he is a doctor or an engineer, it doesn't change that he has knowledge, but I wonder if it's not the solution to the problem."
        ],
        [
            "どんな状況であれ", "", "in any situation",
            "誠実で", "せいじつで", "sincere",
            "あろうとしなければならない", "", "must try to be",
            "が", "", "but",
            "君の", "きみの", "your",
            "努力では", "どりょくでは", "efforts",
            "あるまいし", "", "I wonder if it isn't that",
            "結果が", "けっかが", "results",
            "出ないこともある", "でないこともある", "might not show",
            "In any situation, you must try to be sincere, but I wonder if it isn't that your efforts aren't showing results."
        ],
        [
            "この計画が", "このけいかくが", "this plan",
            "成功するか", "せいこうするか", "succeeds",
            "失敗するか", "しっぱいするか", "fails",
            "ではあるまいか", "", "I wonder if it isn't that",
            "全ての", "すべての", "all",
            "リスクを", "", "risks",
            "考慮しなければならない", "こうりょしなければならない", "must consider",
            "Whether this plan succeeds or fails, we must consider all the risks."
        ],
        [
            "親であれ", "おやであれ", "whether parents",
            "教師であれ", "きょうしであれ", "or teachers",
            "子供に", "こどもに", "to children",
            "良い", "よい", "good",
            "教育を", "きょういくを", "education",
            "提供する", "ていきょうする", "provide",
            "責任が", "せきにんが", "responsibility",
            "あるが", "", "have, but",
            "彼らが", "かれらが", "they",
            "不注意では", "ふちゅういでは", "careless",
            "あるまいし", "", "I wonder if it's not that",
            "問題が", "もんだいが", "problems",
            "起こることはない", "おこることはない", "won't arise",
            "だろう", "", "probably",
            "Whether they are parents or teachers, they have a responsibility to provide good education, but I wonder if it's not that problems will arise if they are not careful."
        ],
        [
            "彼の", "かれの", "his",
            "発言が", "はつげんが", "statements",
            "正しいか", "ただしいか", "right",
            "間違っているか", "まちがっているか", "wrong",
            "ではあるまいし", "", "I wonder if it isn't that",
            "意見を", "いけんを", "opinion",
            "尊重しなければならない", "そんちょうしなければならない", "must respect",
            "Whether his statements are right or wrong, we must respect his opinion."
        ],
        [
            "彼の", "かれの", "his",
            "プレゼンテーションは", "", "presentation",
            "案の定", "あんのじょう", "just as expected",
            "期待以上の", "きたいいじょうの", "beyond expectations",
            "成果を", "せいかを", "results",
            "上げ", "あげ", "achieved",
            "プロジェクト", "", "project",
            "成功に", "せいこうに", "success",
            "貢献した", "こうけんした", "contributed",
            "でなくてなんだろう", "", "must be",
            "His presentation, just as expected, achieved results beyond our expectations and must be a key contribution to the project's success."
        ],
        [
            "彼が", "かれが", "he",
            "遅刻することは", "ちこくすることは", "being late",
            "案の定で", "あんのじょうで", "just as expected",
            "約束の", "やくそくの", "promised",
            "時間に", "じかんに", "time",
            "来ること", "くること", "coming",
            "などだに", "", "even",
            "考えられない", "かんがえられない", "can't be thought",
            "It was just as expected that he would be late, and it's hard to even think he would come on time."
        ],
        [
            "その新しい", "そのあたらしい", "that new",
            "レストランは", "", "restaurant",
            "案の定", "あんのじょう", "as expected",
            "長い", "ながい", "long",
            "行列が", "ぎょうれつが", "line",
            "できており", "", "has formed",
            "予約なしでは", "よやくなしでは", "without reservation",
            "入れない", "はいれない", "can't enter",
            "でなくてなんだろう", "", "must be",
            "As expected, there was a long line at the new restaurant, and it must be that you can't get in without a reservation."
        ],
        [
            "彼女が", "かのじょが", "she",
            "その試験に", "そのしけんに", "that exam",
            "合格することは", "ごうかくすることは", "passing",
            "案の定で", "あんのじょうで", "just as expected",
            "努力が", "どりょくが", "efforts",
            "実を結んだ", "みをむすんだ", "bore fruit",
            "ということだに", "", "that",
            "間違いない", "まちがいない", "no doubt",
            "It was just as expected that she would pass the exam; there is no doubt that her efforts paid off."
        ],
        [
            "この製品の", "このせいひんの", "this product's",
            "価格が", "かかくが", "price",
            "高いことは", "たかいことは", "being high",
            "案の定", "あんのじょう", "just as expected",
            "品質が", "ひんしつが", "quality",
            "良いので", "よいので", "is good, so",
            "安いものでは", "やすいものでは", "cheap thing",
            "ない", "", "not",
            "でなくてなんだろう", "", "must be",
            "It was just as expected that the product's price is high; given its quality, it must be that it's not cheap."
        ],
        [
            "プロジェクトの", "", "project's",
            "成功に向けて", "せいこうにむけて", "towards success",
            "あくまでも", "", "to the utmost degree",
            "努力し続ける", "どりょくしつづける", "continue making efforts",
            "つもりだが", "", "intend to, but",
            "あえて", "", "dare to",
            "リスクを", "", "risks",
            "取るべき", "とるべき", "should take",
            "かもしれない", "", "might",
            "I intend to continue making efforts to the utmost degree for the success of the project, but I might dare to take risks."
        ],
        [
            "会議の", "かいぎの", "meeting's",
            "準備を", "じゅんびを", "preparation",
            "あらかじめ", "", "in advance",
            "整えておくのは", "ととのえておくのは", "getting ready",
            "重要で", "じゅうようで", "important",
            "あくまでも", "", "to the utmost degree",
            "計画通りに", "けいかくどおりに", "according to plan",
            "進めるべきだ", "すすめるべきだ", "should proceed",
            "It's important to prepare for the meeting in advance, and it should be done to the utmost degree according to the plan."
        ],
        [
            "新しい機能の", "あたらしいきのうの", "new feature's",
            "テストを", "てすとを", "test",
            "あらかじめ", "", "in advance",
            "行っておくべきで", "おこなっておくべきで", "should conduct",
            "あくまでも", "", "to the utmost degree",
            "エラーが", "えらーが", "errors",
            "発生しない", "はっせいしない", "not occur",
            "ようにしたい", "", "want to ensure",
            "You should conduct the test for the new feature in advance, and to the utmost degree, we want to ensure that no errors occur."
        ],
        [
            "彼が", "かれが", "he",
            "あくまでも", "", "to the utmost degree",
            "正義を", "せいぎを", "justice",
            "貫こうとしているのは", "つらぬこうとしているのは", "is trying to uphold",
            "あえて", "", "deliberately",
            "困難な", "こんなんな", "difficult",
            "状況に", "じょうきょうに", "situations",
            "立ち向かう", "たちむかう", "face",
            "姿勢を", "しせいを", "attitude",
            "見せたい", "みせたい", "want to show",
            "からだ", "", "because",
            "He is trying to uphold justice to the utmost degree because he wants to show a willingness to face difficult situations."
        ],
        [
            "この問題に対して", "このもんだいにたいして", "for this issue",
            "あらかじめ", "", "in advance",
            "準備を", "じゅんびを", "preparation",
            "整えたが", "ととのえたが", "prepared but",
            "あくまでも", "", "to the utmost degree",
            "詳細な", "しょうさいな", "detailed",
            "対策を", "たいさくを", "measures",
            "講じる", "こうじる", "take",
            "必要がある", "ひつようがある", "necessary",
            "I prepared in advance for this issue, but it is still necessary to take detailed measures to the utmost degree."
        ],
        [
            "彼は", "かれは", "he",
            "天才ごとく", "てんさいごとく", "like a genius",
            "問題を", "もんだいを", "problems",
            "解決するが", "かいけつするが", "solves but",
            "まるで", "", "as if",
            "完璧ぶりを", "かんぺきぶりを", "perfect style",
            "見せる", "みせる", "shows",
            "He solves problems like a genius and shows a perfect style as if."
        ],
        [
            "彼女は", "かのじょは", "she",
            "歌手ぶるが", "かしゅぶるが", "acts like a singer but",
            "実際には", "じっさいには", "in reality",
            "ただの", "", "just",
            "アマチュアに", "あまちゅあに", "amateur",
            "過ぎない", "すぎない", "nothing more than",
            "She behaves like a singer, but in reality, she is just an amateur."
        ],
        [
            "新しい", "あたらしい", "new",
            "企画が", "きかくが", "project",
            "成功するが", "せいこうするが", "succeeds",
            "早いか", "はやいか", "as soon as",
            "上司は", "じょうしは", "boss",
            "すぐに", "", "quickly",
            "その結果を", "そのけっかを", "its results",
            "評価するだろう", "ひょうかするだろう", "will evaluate",
            "As soon as the new project succeeds, the boss will quickly evaluate its results."
        ],
        [
            "その料理は", "そのりょうりは", "that dish",
            "フランス料理ごとき", "ふらんすりょうりごとき", "like French cuisine",
            "洗練された", "せんれんされた", "sophisticated",
            "味がするが", "あじがするが", "tastes but",
            "家庭料理の", "かていりょうりの", "home cooking",
            "ぶりを", "", "style",
            "感じさせる", "かんじさせる", "gives off",
            "The dish tastes as sophisticated as French cuisine but gives off the style of home cooking."
        ],
        [
            "彼の", "かれの", "his",
            "表情は", "ひょうじょうは", "expression",
            "驚きの", "おどろきの", "surprise",
            "色を", "いろを", "color",
            "見せるが", "みせるが", "shows but",
            "冷静さを", "れいせいさを", "calmness",
            "装った", "よそおった", "feigned",
            "ぶりが", "", "style",
            "気に入らない", "きにいらない", "don't like",
            "His expression shows a color of surprise, but I don't like the style of feigned calmness."
        ],
        [
            "彼女は", "かのじょは", "she",
            "プロのように", "ぷろのように", "like a professional",
            "振る舞いながらも", "ふるまいながらも", "while behaving",
            "素人の", "しろうとの", "amateur",
            "ごとく", "", "as if",
            "失敗してしまった", "しっぱいしてしまった", "failed",
            "She behaved like a professional but failed as if she were an amateur."
        ],
        [
            "彼の", "かれの", "his",
            "指示が", "しじが", "instructions",
            "終わるが", "おわるが", "end",
            "早いか", "はやいか", "as soon as",
            "チームは", "ちーむは", "team",
            "すぐに", "", "immediately",
            "作業を", "さぎょうを", "work",
            "始めた", "はじめた", "started",
            "As soon as his instructions ended, the team immediately started the work."
        ],
        [
            "このドレスは", "このどれすは", "this dress",
            "高級ブランドごとく", "こうきゅうぶらんどごとく", "like a high-end brand",
            "見えるが", "みえるが", "looks but",
            "実は", "じつは", "in reality",
            "リーズナブルな", "りーずなぶるな", "reasonable",
            "価格の", "かかくの", "priced",
            "ものだ", "", "is",
            "This dress looks like a high-end brand, but in reality, it is reasonably priced."
        ],
        [
            "子供たちは", "こどもたちは", "children",
            "遊ぶが", "あそぶが", "play",
            "早いか", "はやいか", "as soon as",
            "庭に", "にわに", "to the garden",
            "飛び出していった", "とびだしていった", "dashed out",
            "As soon as the children started playing, they dashed out into the garden."
        ],
        [
            "彼の", "かれの", "his",
            "新しい", "あたらしい", "new",
            "発明は", "はつめいは", "invention",
            "まるで", "", "as if",
            "未来の", "みらいの", "future",
            "技術ごとく", "ぎじゅつごとく", "technology",
            "素晴らしいが", "すばらしいが", "amazing but",
            "使い方には", "つかいかたには", "usage",
            "まだ", "", "still",
            "課題がある", "かだいがある", "has issues",
            "His new invention is as amazing as future technology, but there are still issues with its usage."
        ],
        [
            "彼は", "かれは", "he",
            "プロジェクトが", "ぷろじぇくとが", "project",
            "うまくいく", "", "succeeds",
            "場合によっては", "ばあいによっては", "depending on the situation",
            "全員の", "ぜんいんの", "everyone's",
            "努力が", "どりょくが", "effort",
            "必要だと", "ひつようだと", "is necessary",
            "考えている", "かんがえている", "believes",
            "Depending on the situation, he believes that the success of the project requires everyone's effort."
        ],
        [
            "この成功は", "このせいこうは", "this success",
            "努力だの", "どりょくだの", "effort",
            "チームワークだの", "ちーむわーくだの", "teamwork",
            "全ての", "すべての", "all",
            "要素が", "ようそが", "elements",
            "揃ってこその", "そろってこその", "only because are in place",
            "結果だ", "けっかだ", "is the result",
            "This success is the result only because all elements such as effort and teamwork are in place."
        ],
        [
            "彼女は", "かのじょは", "she",
            "仕事の", "しごとの", "work",
            "ストレスが", "すとれすが", "stress",
            "たまると", "", "accumulates",
            "友達ぐるみで", "ともだちぐるみで", "together with friends",
            "リラックスする", "りらっくすする", "relax",
            "方法を", "ほうほうを", "ways",
            "見つける", "みつける", "finds",
            "When she accumulates work stress, she finds ways to relax together with her friends."
        ],
        [
            "試験の", "しけんの", "exam",
            "準備が", "じゅんびが", "preparation",
            "間に合わなかった", "まにあわなかった", "didn't manage in time",
            "場合によっては", "ばあいによっては", "depending on the situation",
            "再試験を", "さいしけんを", "retest",
            "受けることになるだろう", "うけることになるだろう", "will likely have to take",
            "Depending on the situation, if you don't manage to prepare for the exam in time, you'll likely have to take a retest."
        ],
        [
            "どんなに", "", "no matter how",
            "頑張っても", "がんばっても", "try hard",
            "この問題は", "このもんだいは", "this problem",
            "どうにも", "", "by any means",
            "解決しない", "かいけつしない", "cannot be solved",
            "No matter how hard I try, this problem cannot be solved by any means."
        ],
        [
            "このプロジェクトが", "このぷろじぇくとが", "this project",
            "成功するか", "せいこうするか", "succeeds",
            "否かは", "いなかは", "or not",
            "チームの", "ちーむの", "team's",
            "努力いかんでは", "どりょくいかんでは", "depends on the effort",
            "決まるだろう", "きまるだろう", "will be determined",
            "Whether or not this project succeeds will depend on the team's effort."
        ],
        [
            "この計画は", "このけいかくは", "this plan",
            "予算によっては", "よさんによっては", "depending on the budget",
            "実現可能性が", "じつげんかのうせいが", "possibility of being realized",
            "あるかもしれない", "", "might have",
            "Depending on the budget, this plan might have a possibility of being realized."
        ],
        [
            "問題が", "もんだいが", "problem",
            "解決するか", "かいけつするか", "is resolved",
            "否かに", "いなかに", "or not",
            "かかわらず", "", "regardless of",
            "全員の", "ぜんいんの", "everyone's",
            "協力が", "きょうりょくが", "cooperation",
            "極めて", "きわめて", "extremely",
            "重要だ", "じゅうようだ", "important",
            "Regardless of whether the problem is resolved or not, everyone's cooperation is extremely important."
        ],
        [
            "この商品が", "このしょうひんが", "this product",
            "売れるか", "うれるか", "sells",
            "否かは", "いなかは", "or not",
            "マーケティング戦略", "まーけてぃんぐせんりゃく", "marketing strategy",
            "いかんによっては", "", "depending on",
            "変わる", "かわる", "change",
            "可能性がある", "かのうせいがある", "possibility",
            "Whether or not this product sells might change depending on the marketing strategy."
        ],
        [
            "彼の", "かれの", "his",
            "提案が", "ていあんが", "proposal",
            "受け入れられるか", "うけいれられるか", "is accepted",
            "否かは", "いなかは", "or not",
            "会議の", "かいぎの", "meeting's",
            "内容に", "ないように", "contents",
            "極めて", "きわめて", "extremely",
            "依存している", "いぞんしている", "dependent",
            "Whether or not his proposal is accepted is extremely dependent on the contents of the meeting."
        ],
    ],
    "上手": [
        [
            "どんなに", "どんなに", "no matter how",
            "努力しても", "どりょくしても", "try hard",
            "この問題が", "このもんだいが", "this problem",
            "解決する", "かいけつする", "to solve",
            "可能性は", "かのうせいは", "possibility",
            "限りだ", "かぎりだ", "is limited",
            "No matter how hard we try, the possibility of solving this problem is minimal."
        ],
        [
            "試験の", "しけんの", "exam's",
            "合格は", "ごうかくは", "passing",
            "努力いかんによっては", "どりょくいかんによっては", "depends on effort",
            "決まるが", "きまるが", "is determined, but",
            "いかんにかかわらず", "いかんにかかわらず", "regardless",
            "準備は", "じゅんびは", "preparation",
            "怠らない", "おこたらない", "not neglect",
            "方が良い", "ほうがよい", "better to",
            "Passing the exam depends on one's effort, but regardless of that, it's better not to neglect preparation."
        ],
        [
            "プロジェクトの", "プロジェクトの", "project's",
            "成功には", "せいこうには", "for success",
            "予算の", "よさんの", "budget",
            "増額が", "ぞうがくが", "increase",
            "極まる", "きわまる", "extreme",
            "必要がある", "ひつようがある", "is necessary",
            "The success of the project requires an exceedingly increased budget."
        ],
        [
            "プロジェクトが", "プロジェクトが", "project",
            "予定通り", "よていどおり", "as scheduled",
            "進むか", "すすむか", "progresses",
            "否かは", "いなかは", "or not",
            "状況いかんによっては", "じょうきょういかんによっては", "depending on situation",
            "変わることがある", "かわることがある", "can change",
            "Whether or not the project progresses as scheduled can change depending on the situation."
        ],
        [
            "彼の", "かれの", "his",
            "態度は", "たいどは", "attitude",
            "極まりないほど", "きわまりないほど", "extremely",
            "冷淡で", "れいたんで", "cold",
            "協力する", "きょうりょくする", "to cooperate",
            "気が", "きが", "intention",
            "全くない", "まったくない", "not at all",
            "ように見える", "ようにみえる", "seems",
            "His attitude is extremely cold, and he seems to have no intention of cooperating."
        ],
        [
            "彼は", "かれは", "he",
            "いまだに", "いまだに", "still",
            "以前のように", "いぜんのように", "as before",
            "その問題について", "そのもんだいについて", "about that problem",
            "考えている", "かんがえている", "thinking",
            "かたわら", "かたわら", "while",
            "新しい", "あたらしい", "new",
            "プロジェクトに", "プロジェクトに", "project",
            "取り組んでいる", "とりくんでいる", "working on",
            "Even now, he still thinks about that problem in the same way as before, while at the same time working on a new project."
        ],
        [
            "かつての", "かつての", "former",
            "友人と", "ゆうじんと", "friends",
            "再会するのは", "さいかいするのは", "reuniting",
            "嬉しいが", "うれしいが", "delightful, but",
            "そのために", "そのために", "for that",
            "わざわざ", "わざわざ", "purposely",
            "遠くまで", "とおくまで", "far away",
            "行くくらいなら", "いくくらいなら", "rather than going",
            "手紙で", "てがみで", "by letter",
            "済ませたほうが", "すませたほうが", "settling would be",
            "ましだ", "ましだ", "better",
            "Reuniting with old friends is delightful, but rather than going all the way just for that, it would be better to settle with a letter."
        ],
        [
            "彼女は", "かのじょは", "she",
            "かつては", "かつては", "before",
            "すごく", "すごく", "extremely",
            "忙しかったが", "いそがしかったが", "was busy, but",
            "今は", "いまは", "now",
            "いまだに", "いまだに", "still",
            "同じ", "おなじ", "same",
            "忙しさを", "いそがしさを", "busyness",
            "続けている", "つづけている", "continues",
            "She was extremely busy before, but even now, she continues with the same level of busyness."
        ],
        [
            "その会議に", "そのかいぎに", "that meeting",
            "参加するのは", "さんかするのは", "attending",
            "いいかもしれないが", "いいかもしれないが", "might be good, but",
            "かつての", "かつての", "previous",
            "問題を", "もんだいを", "issues",
            "解決するのが", "かいけつするのが", "solving",
            "先だと", "さきだと", "first",
            "考えるほうが", "かんがえるほうが", "thinking",
            "ましだ", "ましだ", "would be better",
            "Attending that meeting might be good, but it would be better to prioritize solving the previous issues first."
        ],
        [
            "旅行の", "りょこうの", "trip's",
            "計画を", "けいかくを", "plan",
            "立てるのと", "たてるのと", "making",
            "宿泊先を", "しゅくはくさきを", "accommodation",
            "決めるのと", "きめるのと", "deciding",
            "どちらも", "どちらも", "both",
            "大変だが", "たいへんだが", "difficult, but",
            "いまだに", "いまだに", "still",
            "宿泊先が", "しゅくはくさきが", "accommodation",
            "決まっていない", "きまっていない", "not decided",
            "ほうが", "ほうが", "rather",
            "心配だ", "しんぱいだ", "worrying",
            "Planning the trip and deciding on accommodations are both difficult, but it's more worrying that the accommodation has still not been decided."
        ],
        [
            "彼の", "かれの", "his",
            "意見は", "いけんは", "opinions",
            "かたがた", "かたがた", "while",
            "参考にしながら", "さんこうにしながら", "referring to",
            "自分の", "じぶんの", "own",
            "考えを", "かんがえを", "thoughts",
            "固めるべきだ", "かためるべきだ", "should solidify",
            "While taking his opinions into consideration, you should solidify your own thoughts."
        ],
        [
            "新しい", "あたらしい", "new",
            "プロジェクトを", "プロジェクトを", "project",
            "始めるか", "はじめるか", "to start",
            "否かは", "いなかは", "or not",
            "いまだに", "いまだに", "still",
            "決まっていないが", "きまっていないが", "undecided, but",
            "準備を", "じゅんびを", "preparations",
            "進める", "すすめる", "proceed with",
            "かたわら", "かたわら", "while",
            "可能性を", "かのうせいを", "possibilities",
            "探るべきだ", "さぐるべきだ", "should explore",
            "Whether or not to start the new project is still undecided, but you should proceed with preparations while exploring possibilities."
        ],
        [
            "かつての", "かつての", "former",
            "仕事仲間と", "しごとなかまと", "colleagues",
            "連絡を", "れんらくを", "contact",
            "取りながら", "とりながら", "while keeping",
            "今後の", "こんごの", "future",
            "キャリアについても", "キャリアについても", "career also",
            "考えるほうが", "かんがえるほうが", "thinking about",
            "ましだ", "ましだ", "would be better",
            "While staying in touch with former colleagues, it would be better to also think about your future career."
        ],
        [
            "デザインの", "デザインの", "design",
            "変更をするか", "へんこうをするか", "to make changes",
            "否かは", "いなかは", "or not",
            "いまだに", "いまだに", "still",
            "決まっていないが", "きまっていないが", "undecided, but",
            "かれの", "かれの", "his",
            "提案を", "ていあんを", "suggestions",
            "聞く", "きく", "listen to",
            "価値はある", "かちはある", "worth",
            "Whether or not to make changes to the design is still undecided, but it's worth listening to his suggestions."
        ],
        [
            "この書類を", "このしょるいを", "this document",
            "急いで", "いそいで", "hurriedly",
            "提出する", "ていしゅつする", "submit",
            "くらいなら", "くらいなら", "rather than",
            "きちんと", "きちんと", "properly",
            "確認してから", "かくにんしてから", "after checking",
            "提出したほうが", "ていしゅつしたほうが", "submitting would be",
            "ましだ", "ましだ", "better",
            "Rather than rushing to submit this document, it would be better to check it thoroughly before submission."
        ],
        [
            "この博物館には", "このはくぶつかんには", "in this museum",
            "世界で", "せかいで", "in the world",
            "最も", "もっとも", "most",
            "価値のある", "かちのある", "valuable",
            "絵画が", "かいがが", "paintings",
            "きっての", "きっての", "finest",
            "コレクションとして", "コレクションとして", "as a collection",
            "展示されている", "てんじされている", "are displayed",
            "In this museum, paintings of the highest value in the world are displayed as the most unique collection."
        ],
        [
            "彼の", "かれの", "his",
            "作品は", "さくひんは", "work",
            "いかに", "いかに", "how",
            "才能があるかを", "さいのうがあるかを", "talented he is",
            "証明しているが", "しょうめいしているが", "proves, but",
            "実際には", "じっさいには", "in reality",
            "数少ない", "かずすくない", "few",
            "成功の中の", "せいこうのなかの", "among successes",
            "一つに過ぎない", "ひとつにすぎない", "is just one",
            "His work proves how talented he is, but in reality, it is just one of the few successes."
        ],
        [
            "このレストランは", "このレストランは", "this restaurant",
            "料理の", "りょうりの", "dishes'",
            "美味しさから", "おいしさから", "due to deliciousness",
            "ある", "ある", "certain",
            "数多くの", "かずおおくの", "numerous",
            "賞を", "しょうを", "awards",
            "受賞しており", "じゅしょうしており", "has received",
            "いかにも", "いかにも", "indeed",
            "名店の", "めいてんの", "famous restaurant's",
            "名に", "なに", "name",
            "ふさわしい", "ふさわしい", "worthy of",
            "This restaurant has received numerous awards due to the excellence of its dishes and indeed lives up to its reputation as a top establishment."
        ],
        [
            "彼女の", "かのじょの", "her",
            "デザインは", "デザインは", "designs",
            "いかにも", "いかにも", "indeed",
            "洗練された", "せんれんされた", "refined",
            "美しさを", "うつくしさを", "beauty",
            "持っているが", "もっているが", "have, but",
            "他の", "ほかの", "other",
            "デザインと", "デザインと", "designs",
            "比べて", "くらべて", "compared to",
            "きっての", "きっての", "most",
            "独特さがある", "どくとくさがある", "unique quality",
            "Her designs indeed have an elegant beauty, but compared to other designs, they have the most unique quality."
        ],
        [
            "彼は", "かれは", "he",
            "全力を", "ぜんりょくを", "all efforts",
            "尽くして", "つくして", "giving",
            "プロジェクトに", "プロジェクトに", "to the project",
            "取り組んだが", "とりくんだが", "worked on, but",
            "ひとつの", "ひとつの", "one",
            "小さな", "ちいさな", "small",
            "ミスで", "ミスで", "mistake",
            "失敗してしまった", "しっぱいしてしまった", "ended up failing",
            "He gave it his all for the project, but he failed due to one small mistake."
        ],
        [
            "この問題を", "このもんだいを", "this problem",
            "解決するために", "かいけつするために", "to solve",
            "全てを", "すべてを", "everything",
            "試してみたが", "ためしてみたが", "tried, but",
            "結果として", "けっかとして", "as a result",
            "何も", "なにも", "nothing",
            "変わらなかった", "かわらなかった", "did not change",
            "I tried everything to solve this problem, but as a result, nothing changed."
        ],
        [
            "彼女は", "かのじょは", "she",
            "努力を", "どりょくを", "effort",
            "することなしに", "することなしに", "without doing",
            "成功を", "せいこうを", "success",
            "手に入れた", "てにいれた", "obtained",
            "わけではない", "わけではない", "it is not that",
            "She did not achieve success without making efforts."
        ],
        [
            "この計画を", "このけいかくを", "this plan",
            "実行する際には", "じっこうするさいには", "when implementing",
            "十分な", "じゅうぶんな", "sufficient",
            "準備を", "じゅんびを", "preparation",
            "整えること", "ととのえること", "to arrange",
            "のないよう", "のないよう", "so as not to",
            "注意してください", "ちゅういしてください", "please be careful",
            "When implementing this plan, be careful not to proceed without adequate preparation."
        ],
        [
            "あの事故は", "あのじこは", "that accident",
            "彼の", "かれの", "his",
            "警告を", "けいこくを", "warnings",
            "無視したこと", "むししたこと", "ignoring",
            "の結果として", "のけっかとして", "as a result of",
            "起こった", "おこった", "occurred",
            "That accident occurred as a result of ignoring his warnings."
        ],
        [
            "彼の", "かれの", "his",
            "提案は", "ていあんは", "proposal",
            "一度", "いちど", "once",
            "試してみる", "ためしてみる", "to try",
            "価値があるが", "かちがあるが", "is worth, but",
            "結果に", "けっかに", "for the result",
            "過度に", "かどに", "excessively",
            "期待することは", "きたいすることは", "to expect",
            "ない", "ない", "not",
            "His proposal is worth trying once, but don't have excessive expectations for the outcome."
        ],
        [
            "努力したにも", "どりょくしたにも", "even though made an effort",
            "かかわらず", "かかわらず", "despite",
            "結果は", "けっかは", "the result",
            "期待外れ", "きたいはずれ", "disappointing",
            "であった", "であった", "was",
            "Even though he made an effort, the outcome was disappointing."
        ],
        [
            "重要な", "じゅうような", "important",
            "試験に", "しけんに", "exam",
            "合格するためには", "ごうかくするためには", "to pass",
            "基礎を", "きそを", "basics",
            "固めること", "かためること", "solidifying",
            "と同時に", "とどうじに", "at the same time",
            "新しい", "あたらしい", "new",
            "問題にも", "もんだいにも", "problems also",
            "取り組む", "とりくむ", "tackle",
            "必要がある", "ひつようがある", "is necessary",
            "To pass the important exam, it is necessary to solidify the basics while also tackling new problems."
        ],
        [
            "彼の", "かれの", "his",
            "成功は", "せいこうは", "success",
            "過去の", "かこの", "past",
            "失敗から", "しっぱいから", "from failures",
            "学び取った", "まなびとった", "learned",
            "結果であり", "けっかであり", "is the result",
            "無駄な", "むだな", "wasteful",
            "努力ではなかった", "どりょくではなかった", "was not an effort",
            "His success is the result of learning from past failures, and not a wasteful effort."
        ],
        [
            "そのプレゼンテーションは", "そのプレゼンテーションは", "that presentation",
            "事前に", "じぜんに", "beforehand",
            "準備を", "じゅんびを", "preparation",
            "怠ったこともあり", "おこたったこともあり", "due to neglecting",
            "結果として", "けっかとして", "as a result",
            "あまり良い", "あまりよい", "not very good",
            "評価を", "ひょうかを", "evaluation",
            "受けなかった", "うけなかった", "did not receive",
            "The presentation did not receive a good evaluation as a result of neglecting preparation beforehand."
        ],
        [
            "このプロジェクトは", "このプロジェクトは", "this project",
            "全ての", "すべての", "all",
            "手続きを", "てつづきを", "procedures",
            "ひとつずつ", "ひとつずつ", "one by one",
            "試した", "ためした", "tried",
            "結果", "けっか", "result",
            "期待外れの", "きたいはずれの", "disappointing",
            "結果に", "けっかに", "to a result",
            "終わった", "おわった", "ended up",
            "The project, after trying each procedure one by one, ended up with disappointing results."
        ],
        [
            "彼女は", "かのじょは", "she",
            "全力を", "ぜんりょくを", "all her effort",
            "尽くして", "つくして", "gave",
            "試みたが", "こころみたが", "attempted, but",
            "その努力が", "そのどりょくが", "that effort",
            "かいもなく", "かいもなく", "in vain",
            "失敗してしまった", "しっぱいしてしまった", "ended up failing",
            "She gave it her all in her attempt, but despite her efforts, she failed."
        ],
        [
            "ミスを", "ミスを", "mistakes",
            "しないように", "しないように", "so as not to make",
            "注意すること", "ちゅういすること", "paying attention",
            "と", "と", "and",
            "しっかり", "しっかり", "thoroughly",
            "準備をすること", "じゅんびをすること", "preparing",
            "なしに", "なしに", "without",
            "成功は", "せいこうは", "success",
            "ありえない", "ありえない", "cannot be achieved",
            "Success cannot be achieved without paying attention to avoid mistakes and preparing thoroughly."
        ],
        [
            "新しい", "あたらしい", "new",
            "プロジェクトを", "プロジェクトを", "project",
            "進める際には", "すすめるさいには", "when advancing",
            "計画を", "けいかくを", "plan",
            "十分に", "じゅうぶんに", "thoroughly",
            "練ること", "ねること", "to work out",
            "のないよう", "のないよう", "so as not to",
            "心がけてください", "こころがけてください", "please make sure",
            "When advancing a new project, make sure to avoid proceeding without thoroughly planning."
        ],
        [
            "彼の", "かれの", "his",
            "アドバイスを", "アドバイスを", "advice",
            "全て", "すべて", "all",
            "受け入れたが", "うけいれたが", "accepted, but",
            "結果として", "けっかとして", "as a result",
            "改善が", "かいぜんが", "improvement",
            "見られなかった", "みられなかった", "was not observed",
            "I accepted all of his advice, but as a result, no improvement was observed."
        ],
        [
            "彼が", "かれが", "he",
            "全力で", "ぜんりょくで", "with all his might",
            "取り組んだ", "とりくんだ", "worked on",
            "こととて", "こととて", "even though",
            "成功に", "せいこうに", "to success",
            "至る", "いたる", "lead to",
            "わけではない", "わけではない", "does not necessarily",
            "Even though he put in his utmost effort, it does not necessarily lead to success."
        ],
        [
            "試験の", "しけんの", "exam",
            "準備を", "じゅんびを", "preparation",
            "怠ること", "おこたること", "neglecting",
            "のないよう", "のないよう", "so as not to",
            "毎日", "まいにち", "every day",
            "勉強を", "べんきょうを", "study",
            "続けた", "つづけた", "continued",
            "結果", "けっか", "result",
            "合格する", "ごうかくする", "to pass",
            "ことができた", "ことができた", "was able to",
            "By continuing to study every day to avoid neglecting exam preparation, I was able to pass."
        ],
        [
            "たとえ", "たとえ", "even if",
            "一生懸命", "いっしょうけんめい", "hard",
            "努力しても", "どりょくしても", "make an effort",
            "成功する", "せいこうする", "to succeed",
            "ほどの", "ほどの", "worth",
            "ことはない", "ことはない", "is not",
            "という", "という", "that",
            "現実に", "げんじつに", "reality",
            "直面した", "ちょくめんした", "faced",
            "Even though I tried hard, I faced the reality that it was not worth achieving success."
        ],
        [
            "彼女の", "かのじょの", "her",
            "提案を", "ていあんを", "suggestion",
            "ひとつ", "ひとつ", "one",
            "試してみたが", "ためしてみたが", "tried, but",
            "それが", "それが", "it",
            "うまくいく", "うまくいく", "to work well",
            "かいもなく", "かいもなく", "without success",
            "別の", "べつの", "different",
            "方法を", "ほうほうを", "method",
            "考える", "かんがえる", "to consider",
            "必要がある", "ひつようがある", "need to",
            "I tried one of her suggestions, but since it did not work, I need to consider other methods."
        ],
        [
            "無理をして", "むりをして", "pushing oneself",
            "でも", "でも", "even",
            "その目標を", "そのもくひょうを", "that goal",
            "達成する", "たっせいする", "to achieve",
            "ことのないように", "ことのないように", "so as not to",
            "計画的に", "けいかくてきに", "systematically",
            "進める", "すすめる", "to advance",
            "ことが", "ことが", "that",
            "重要だ", "じゅうようだ", "is important",
            "It is important to advance systematically so as not to push yourself to achieve the goal."
        ],
        [
            "いかなる", "いかなる", "any",
            "状況で", "じょうきょうで", "situation",
            "あっても", "あっても", "even if",
            "彼は", "かれは", "he",
            "ほかに", "ほかに", "other",
            "方法が", "ほうほうが", "method",
            "ないと", "ないと", "there is no",
            "言い続ける", "いいつづける", "continue to say",
            "傾向がある", "けいこうがある", "has a tendency",
            "In any situation, he has a tendency to insist that there is no other method."
        ],
        [
            "この問題には", "このもんだいには", "for this problem",
            "いかなる", "いかなる", "any",
            "解決策も", "かいけつさくも", "solution",
            "見つからないまま", "みつからないまま", "without finding",
            "きりがない", "きりがない", "endless",
            "議論が", "ぎろんが", "debate",
            "続いている", "つづいている", "continues",
            "There are no solutions found for this problem, and the endless debate continues."
        ],
        [
            "いずれにせよ", "いずれにせよ", "in any case",
            "解決策は", "かいけつさくは", "solution",
            "彼の", "かれの", "his",
            "提案", "ていあん", "proposal",
            "くらいのもの", "くらいのもの", "only about",
            "だと", "だと", "to be",
            "考えられている", "かんがえられている", "is considered",
            "In any case, the solution is considered to be only about his proposal."
        ],
        [
            "彼女の", "かのじょの", "her",
            "習慣は", "しゅうかんは", "habits",
            "いかなる", "いかなる", "any",
            "場面でも", "ばめんでも", "situation",
            "ほかに", "ほかに", "other",
            "代わりが", "かわりが", "alternative",
            "ないほど", "ないほど", "to the extent that there is no",
            "固執している", "こしつしている", "are stubborn",
            "Her habits are so stubborn that there is no alternative in any situation."
        ],
        [
            "このプロジェクトの", "このプロジェクトの", "this project's",
            "修正には", "しゅうせいには", "for revisions",
            "いかなる", "いかなる", "any",
            "変更も", "へんこうも", "changes",
            "きりがなく", "きりがなく", "endlessly",
            "続ける", "つづける", "continue",
            "必要がある", "ひつようがある", "need to",
            "For the revisions of this project, any kind of changes need to continue endlessly."
        ],
        [
            "いかなる", "いかなる", "any kind of",
            "困難にも", "こんなんにも", "difficulties",
            "かかわらず", "かかわらず", "despite",
            "きりがない", "きりがない", "endless",
            "挑戦を", "ちょうせんを", "challenges",
            "続けること", "つづけること", "continuing",
            "が", "が", "is",
            "大切だ", "たいせつだ", "important",
            "No matter the kind of difficulties, it's important to continue facing challenges that seem endless."
        ],
        [
            "彼は", "かれは", "he",
            "嫌いがある", "きらいがある", "has a tendency to dislike",
            "タイプの", "タイプの", "type of",
            "人間で", "にんげんで", "person",
            "ほかに", "ほかに", "other",
            "～ない", "～ない", "not",
            "友達を", "ともだちを", "friends",
            "持っていない", "もっていない", "does not have",
            "He is the type of person who has a tendency to dislike, and he has no other friends."
        ],
        [
            "この問題には", "このもんだいには", "for this problem",
            "いずれにせよ", "いずれにせよ", "in any case",
            "いかなる", "いかなる", "any kind of",
            "解決策も", "かいけつさくも", "solution",
            "限界が", "げんかいが", "limits",
            "あると", "あると", "has",
            "思う", "おもう", "I think",
            "In any case, I think that any kind of solution to this problem has its limits."
        ],
        [
            "きりがない", "きりがない", "endless",
            "ほどの", "ほどの", "to the extent",
            "仕事が", "しごとが", "work",
            "あり", "あり", "there is",
            "くらいのもの", "くらいのもの", "only like that",
            "だと", "だと", "is",
            "感じている", "かんじている", "feeling",
            "There is work to the extent that there's no end to it, and I feel it's only like that."
        ],
        [
            "いかなる", "いかなる", "any kind of",
            "努力を", "どりょくを", "effort",
            "しても", "しても", "even if make",
            "嫌いがある", "きらいがある", "has a tendency to be disliked",
            "状況には", "じょうきょうには", "situation",
            "いずれにせよ", "いずれにせよ", "in any case",
            "限界が", "げんかいが", "limits",
            "あるだろう", "あるだろう", "there will be",
            "No matter what kind of effort you make, there will be limits to a situation that has a tendency to be disliked, in any case."
        ],
        [
            "この規則を", "このきそくを", "this rule",
            "破るのは", "やぶるのは", "breaking",
            "まじき", "", "should not be done",
            "行為であり", "こういであり", "act",
            "誰もが", "だれもが", "everyone",
            "それを", "それを", "it",
            "ないではすまない", "", "must not be done",
            "と理解している", "とりかいしている", "understands",
            "Breaking this rule is an act that should not be done, and everyone understands that it must not be done."
        ]
    ],
    "expert": [
        [
            "彼の行動は", "かれのこうどうは", "his actions",
            "職場の倫理に", "しょくばのりんりに", "workplace ethics",
            "反しており", "はんしており", "against",
            "にたえない", "", "cannot be tolerated",
            "状態で", "じょうたいで", "in a state",
            "上司は", "じょうしは", "the boss",
            "それを", "それを", "it",
            "ないではおかない", "", "will definitely address",
            "だろう", "", "probably",
            "His actions are against workplace ethics, in a state that cannot be tolerated, and the boss will definitely address it."
        ],
        [
            "この計画は", "このけいかくは", "this plan",
            "緊急であり", "きんきゅうであり", "urgent",
            "まじき", "", "should not be done",
            "ことに", "", "in a situation where",
            "ないではおかない", "", "definitely necessary",
            "変更が", "へんこうが", "changes",
            "必要だ", "ひつようだ", "necessary",
            "This plan is urgent, and in a situation where it should not be done, changes are definitely necessary."
        ],
        [
            "その問題が", "そのもんだいが", "that issue",
            "放置されるのは", "ほうちされるのは", "being left unresolved",
            "にたえない", "", "intolerable",
            "ことで", "", "is",
            "我々は", "われわれは", "we",
            "ないではおかない", "", "must take",
            "対応を", "たいおうを", "action",
            "しなければならない", "", "must do",
            "Allowing that issue to remain unresolved is intolerable, and we must take action to address it."
        ],
        [
            "この仕事の質は", "このしごとのしつは", "the quality of this work",
            "最低限の基準を", "さいていげんのきじゅんを", "minimum standards",
            "にたえない", "", "not meet",
            "とされ", "", "is considered to",
            "まじき", "", "should not be done",
            "怠慢があれば", "たいまんがあれば", "if there is negligent behavior",
            "ないではすまない", "", "must be addressed",
            "The quality of this work is considered to not meet the minimum standards, and if there is negligent behavior, it must be addressed."
        ],
        [
            "彼は", "かれは", "he",
            "遅刻をしたが", "ちこくをしたが", "was late, but",
            "もので", "", "because",
            "交通渋滞が", "こうつうじゅうたいが", "traffic congestion",
            "あったためであり", "あったためであり", "because there was",
            "まるっきり", "", "totally",
            "不注意だったわけではない", "ふちゅういだったわけではない", "wasn't due to carelessness",
            "He was late, but because of traffic congestion, it wasn't totally due to carelessness."
        ],
        [
            "にもほどがある", "", "goes too far",
            "ほどの", "", "to the extent that",
            "難題を", "なんだいを", "difficult problem",
            "抱えているのに", "かかえているのに", "even though he has",
            "彼は", "かれは", "he",
            "その問題を", "そのもんだいを", "that problem",
            "軽視することとて", "けいしすることとて", "to disregard",
            "ありえない", "", "unthinkable",
            "Even though he has a problem that goes too far in difficulty, it's unthinkable for him to disregard it."
        ],
        [
            "このプロジェクトの成功は", "このプロジェクトのせいこうは", "the success of this project",
            "全員の協力が", "ぜんいんのきょうりょくが", "everyone's cooperation",
            "あった", "あった", "was",
            "ものを", "", "due to",
            "計画が", "けいかくが", "the plan",
            "十分でなかったために", "じゅうぶんでなかったために", "because it was insufficient",
            "成果が", "せいかが", "results",
            "出なかった", "でなかった", "did not come out",
            "The success of this project was due to everyone's cooperation, but the results did not come out because the plan was insufficient."
        ],
        [
            "彼女の成功は", "かのじょのせいこうは", "her success",
            "努力による", "どりょくによる", "due to efforts",
            "もので", "", "is",
            "にもまして", "", "more than that",
            "その才能が", "そのさいのうが", "her talent",
            "光った", "ひかった", "shone",
            "結果だ", "けっかだ", "is the result",
            "Her success is due to her efforts, and more than that, it's the result of her shining talent."
        ],
        [
            "この映画のレビューが", "このえいがのレビューが", "the reviews of this movie",
            "低いのは", "ひくいのは", "are low",
            "こととて", "", "because",
            "ストーリーが", "ストーリーが", "the story",
            "まるっきり", "", "totally",
            "面白くないからだ", "おもしろくないからだ", "uninteresting",
            "The low reviews of this movie are because the story is totally uninteresting."
        ],
        [
            "にもほどがある", "", "went too far",
            "発言を", "はつげんを", "comment",
            "してしまった後", "してしまったあと", "after making",
            "彼は", "かれは", "he",
            "謝罪する", "しゃざいする", "apologize",
            "こととて", "", "even though",
            "周りの", "まわりの", "surrounding",
            "反感を", "はんかんを", "resentment",
            "買うことになった", "かうことになった", "ended up earning",
            "After making a comment that went too far, he ended up earning resentment from others, even though he apologized."
        ],
        [
            "に言わせれば", "", "if you ask him",
            "この問題は", "このもんだいは", "this problem",
            "にもまして", "", "even more",
            "重要だと", "じゅうようだと", "important",
            "言われている", "いわれている", "is said to be",
            "If you ask him, this problem is said to be even more important."
        ],
        [
            "彼が", "かれが", "he",
            "参加しなかったのは", "さんかしなかったのは", "didn't participate",
            "もので", "", "because",
            "その日", "そのひ", "that day",
            "他の重要な", "ほかのじゅうような", "other important",
            "予定が", "よていが", "plans",
            "あったからだ", "あったからだ", "had",
            "The reason he didn't participate was because he had other important plans on that day."
        ],
        [
            "まるっきり", "", "completely",
            "無関心な", "むかんしんな", "indifferent",
            "態度は", "たいどは", "attitude",
            "にもほどがある", "", "goes too far",
            "と感じられた", "とかんじられた", "was felt to",
            "A completely indifferent attitude was felt to go too far."
        ],
        [
            "この報告書が", "このほうこくしょが", "this report",
            "提出できなかったのは", "ていしゅつできなかったのは", "couldn't be submitted",
            "こととて", "", "because",
            "データの準備が", "データのじゅんびが", "data preparation",
            "間に合わなかった", "まにあわなかった", "didn't meet the deadline",
            "ためである", "", "because of",
            "The reason the report couldn't be submitted is because the data preparation didn't meet the deadline."
        ],
        [
            "そんな困難な状況においても", "そんなこんなんなじょうきょうにおいても", "even in such a difficult situation",
            "ないものか", "", "can't we find",
            "と考えてみたが", "とかんがえてみたが", "I wondered",
            "解決策が", "かいけつさくが", "a solution",
            "ないとも限らない", "", "might not be entirely impossible",
            "と思う", "とおもう", "I think",
            "Even in such a difficult situation, I wondered if we can't find a solution, but it might not be entirely impossible."
        ],
        [
            "昨日の試合結果が", "きのうのしあいけっかが", "yesterday's match results",
            "不満だったが", "ふまんだったが", "were unsatisfactory, but",
            "ならいざしらず", "", "I don't know about that",
            "選手たちの", "せんしゅたちの", "the players'",
            "努力は", "どりょくは", "efforts",
            "評価すべきだ", "ひょうかすべきだ", "should be appreciated",
            "I don't know about the results of yesterday's match, but the players' efforts should be appreciated."
        ],
        [
            "この問題が", "このもんだいが", "this problem",
            "解決するのは", "かいけつするのは", "to solve",
            "ないとも限らない", "", "might not be impossible",
            "が", "", "but",
            "すぐに", "すぐに", "immediately",
            "結果が", "けっかが", "results",
            "出るわけではない", "でるわけではない", "won't come",
            "ことを", "", "that",
            "理解する", "りかいする", "understand",
            "必要がある", "ひつようがある", "need to",
            "It might be possible to solve this problem, but it's necessary to understand that results won't come immediately."
        ],
        [
            "このアイデアが", "このアイデアが", "this idea",
            "実現するのは", "じつげんするのは", "to be realized",
            "ないものでもない", "", "not entirely impossible",
            "が", "", "but",
            "資金が", "しきんが", "funding",
            "足りないのが", "たりないのが", "isn't enough",
            "現実だ", "げんじつだ", "is the reality",
            "It's not entirely impossible for this idea to be realized, but the reality is that there isn't enough funding."
        ],
        [
            "あのプロジェクトの", "あのプロジェクトの", "that project's",
            "成功は", "せいこうは", "success",
            "ないとも限らない", "", "might not be impossible",
            "が", "", "but",
            "現状では", "げんじょうでは", "in the current situation",
            "非常に", "ひじょうに", "very",
            "厳しいと", "きびしいと", "tough",
            "感じる", "かんじる", "feels",
            "The success of that project might not be impossible, but it feels very tough in the current situation."
        ],
        [
            "にひきかえ", "", "in contrast",
            "彼のやり方は", "かれのやりかたは", "his approach",
            "とても", "", "very",
            "効率的であり", "こうりつてきであり", "efficient",
            "対照的に", "たいしょうてきに", "in contrast",
            "私たちの方法は", "わたしたちのほうほうは", "our methods",
            "まだ", "", "still",
            "未熟だ", "みじゅくだ", "immature",
            "In contrast, his approach is very efficient, while our methods are still immature."
        ],
        [
            "成功する", "せいこうする", "to succeed",
            "可能性が", "かのうせいが", "possibility",
            "ないとも限らない", "", "might not be impossible",
            "が", "", "but",
            "ならいざしらず", "", "I don't know about that",
            "それには", "それには", "it",
            "多くの", "おおくの", "many",
            "困難が", "こんなんが", "difficulties",
            "伴うだろう", "ともなうだろう", "will likely involve",
            "There might be a possibility of success, but I don't know about that; it will likely involve many difficulties."
        ],
        [
            "この課題を", "このかだいを", "this problem",
            "解決するための", "かいけつするための", "to solve",
            "方法が", "ほうほうが", "way",
            "ないものか", "", "if there isn't",
            "と模索しているが", "とたんさくしているが", "I'm searching",
            "ないものでもない", "", "not entirely impossible",
            "と感じている", "とかんじている", "I feel that",
            "I'm searching for a way to solve this problem, and I feel that it's not entirely impossible."
        ],
        [
            "ないものでもない", "", "not entirely impossible",
            "が", "", "but",
            "適切な", "てきせつな", "appropriate",
            "条件が", "じょうけんが", "conditions",
            "整わなければ", "ととのわなければ", "unless are met",
            "実現は", "じつげんは", "realization",
            "難しいだろう", "むずかしいだろう", "will be difficult",
            "と考えている", "とかんがえている", "I think",
            "It's not entirely impossible, but I think it will be difficult to realize unless the right conditions are met."
        ],
        [
            "彼が", "かれが", "he",
            "新しいアプローチを", "あたらしいアプローチを", "new approach",
            "提案したが", "ていあんしたが", "proposed, but",
            "にひきかえ", "", "in contrast",
            "実現可能性は", "じつげんかのうせいは", "feasibility",
            "低いと", "ひくいと", "low",
            "見ている", "みている", "I see",
            "He proposed a new approach, but in contrast, I see that its feasibility is low."
        ],
        [
            "まみれ", "", "covered in",
            "になった", "", "became",
            "手で", "てで", "with hands",
            "仕事を", "しごとを", "work",
            "続けるのは", "つづけるのは", "to continue",
            "大変だが", "たいへんだが", "tough, but",
            "ままに", "", "as is",
            "その状態で", "そのじょうたいで", "in that state",
            "やるしかない", "", "no choice but to do",
            "It's tough to continue working with hands covered in dirt, but you have no choice but to do it as is."
        ],
        [
            "彼女の部屋は", "かのじょのへやは", "her room",
            "まみれ", "", "covered in",
            "の状態で", "のじょうたいで", "in a state",
            "掃除が", "そうじが", "cleaning",
            "必要だが", "ひつようだが", "is needed, but",
            "もさることながら", "", "not only that",
            "物が", "ものが", "things",
            "どこにあるか", "どこにあるか", "where they are",
            "わからないのも", "わからないのも", "not knowing",
            "困る", "こまる", "troublesome",
            "Her room is in a state covered in clutter and needs cleaning, but not only that, it's also troublesome not knowing where things are."
        ],
        [
            "彼は", "かれは", "he",
            "新しいアイデアを", "あたらしいアイデアを", "new ideas",
            "持っているが", "もっているが", "has, but",
            "その実現は", "そのじつげんは", "their realization",
            "ないまでも", "", "even if not certain",
            "めく", "", "signs of",
            "進展が", "しんてんが", "progress",
            "あることを", "あることを", "there is",
            "期待している", "きたいしている", "hope for",
            "He has new ideas, and even if their realization isn't certain, I hope for some signs of progress."
        ],
        [
            "このレポートは", "このレポートは", "this report",
            "ままに", "", "as is",
            "提出されてしまったが", "ていしゅつされてしまったが", "was submitted, but",
            "内容が", "ないようが", "content",
            "もさることながら", "", "not only",
            "形式も", "けいしきも", "format also",
            "整っていない", "ととのっていない", "not organized",
            "This report was submitted as is, and not only is the content lacking, but the format is also not organized."
        ],
        [
            "彼女は", "かのじょは", "she",
            "困難な", "こんなんな", "difficult",
            "状況に", "じょうきょうに", "circumstances",
            "まみれ", "", "covered in",
            "ているが", "", "is, but",
            "めく", "", "signs of",
            "希望の", "きぼうの", "hope",
            "兆しを", "きざしを", "signs",
            "見せることができる", "みせることができる", "can show",
            "と信じている", "としんじている", "I believe",
            "She is covered in difficult circumstances, but I believe she can show signs of hope."
        ],
        [
            "に先駆けて", "", "ahead of others",
            "新しいプロジェクトを", "あたらしいプロジェクトを", "new project",
            "開始し", "かいしし", "start",
            "にして", "", "within",
            "数週間で", "すうしゅうかんで", "a few weeks",
            "成果を", "せいかを", "results",
            "出すことが", "だすことが", "achieve",
            "期待されている", "きたいされている", "are expected",
            "We are expected to start the new project ahead of others and achieve results within a few weeks."
        ],
        [
            "彼の提案は", "かれのていあんは", "his proposal",
            "なり", "", "as soon as",
            "問題が", "もんだいが", "problems",
            "発生するやいなや", "はっせいするやいなや", "arise",
            "に至っては", "", "when it comes to",
            "全ての", "すべての", "all",
            "プロジェクトが", "プロジェクトが", "projects",
            "見直されるべきだ", "みなおされるべきだ", "should be reviewed",
            "と述べている", "とのべている", "suggests",
            "His proposal suggests that as soon as problems arise, everything should be reviewed when it comes to all projects."
        ],
        [
            "この技術は", "このぎじゅつは", "this technology",
            "に至るまで", "", "until this point",
            "の進化を", "のしんかを", "evolution",
            "遂げ", "とげ", "has achieved",
            "にして", "", "only after",
            "初めて", "はじめて", "for the first time",
            "この段階に", "このだんかいに", "this stage",
            "達した", "たっした", "has reached",
            "This technology has evolved until this point and has reached this stage only after significant progress."
        ],
        [
            "に先駆けて", "", "first",
            "新しい市場に", "あたらしいしじょうに", "new market",
            "進出し", "しんしゅつし", "entered",
            "なり", "", "as soon as",
            "競争が", "きょうそうが", "competition",
            "激化してきた", "げきかしてきた", "intensified",
            "We entered the new market first, and as soon as we did, the competition intensified."
        ],
        [
            "彼女は", "かのじょは", "she",
            "にして", "", "in the short time",
            "若干の", "じゃっかんの", "a little",
            "経験を", "けいけんを", "experience",
            "積んだだけで", "つんだだけで", "having only gained",
            "すぐに", "すぐに", "immediately",
            "リーダーシップを", "リーダーシップを", "leadership",
            "発揮した", "はっきした", "demonstrated",
            "She demonstrated leadership immediately, having only gained a little experience in the short time."
        ],
        [
            "彼は", "かれは", "he",
            "なり", "", "both as",
            "スポーツ選手", "スポーツせんしゅ", "athlete",
            "なり", "", "and as",
            "ビジネスマンとしても", "ビジネスマンとしても", "businessman",
            "成功しており", "せいこうしており", "has succeeded",
            "その成功は", "そのせいこうは", "his success",
            "彼なりの", "かれなりの", "his own",
            "方法で", "ほうほうで", "way",
            "成し遂げられた", "なしとげられた", "was achieved",
            "He has succeeded both as an athlete and as a businessman, and his success was achieved in his own way."
        ],
        [
            "このアート作品は", "このアートさくひんは", "this artwork",
            "ならでは", "", "unique quality",
            "の独自性を", "のどくじせいを", "uniqueness",
            "持っており", "もっており", "has",
            "なり", "", "either",
            "現代的な", "げんだいてきな", "modern",
            "技法", "ぎほう", "techniques",
            "なり", "", "or",
            "伝統的な", "でんとうてきな", "traditional",
            "技法で", "ぎほうで", "techniques",
            "作られている", "つくられている", "is made",
            "This artwork has a unique quality, made either with modern techniques or traditional techniques."
        ],
        [
            "彼女の料理は", "かのじょのりょうりは", "her cooking",
            "なり", "", "whether",
            "家庭料理", "かていりょうり", "home-cooked",
            "なり", "", "or",
            "レストランの料理としても", "レストランのりょうりとしても", "restaurant-style",
            "彼女なりに", "かのじょなりに", "her own",
            "工夫が", "くふうが", "unique touch",
            "施されている", "ほどこされている", "is prepared with",
            "Her cooking, whether it's home-cooked or restaurant-style, is prepared with her own unique touch."
        ],
        [
            "この旅行プランは", "このりょこうプランは", "this travel plan",
            "ならでは", "", "unique",
            "の体験を", "のたいけんを", "experiences",
            "提供しており", "ていきょうしており", "offers",
            "なり", "", "either",
            "文化的な", "ぶんかてきな", "cultural",
            "観光地", "かんこうち", "landmarks",
            "なり", "", "or",
            "自然の", "しぜんの", "natural",
            "美しい", "うつくしい", "beautiful",
            "景観が", "けいかんが", "landscapes",
            "楽しめる", "たのしめる", "can be enjoyed",
            "This travel plan offers unique experiences, including either cultural landmarks or beautiful natural landscapes."
        ],
        [
            "その企業は", "そのきぎょうは", "the company",
            "なり", "", "either",
            "伝統的な", "でんとうてきな", "traditional",
            "手法", "しゅほう", "methods",
            "なり", "", "or",
            "最新の", "さいしんの", "the latest",
            "技術を", "ぎじゅつを", "technologies",
            "駆使して", "くしして", "using",
            "独自の", "どくじの", "unique",
            "製品を", "せいひんを", "products",
            "開発している", "かいはつしている", "develops",
            "The company develops unique products using either traditional methods or the latest technologies."
        ],
        [
            "このプロジェクトは", "このプロジェクトは", "this project",
            "全ての", "すべての", "all",
            "詳細を", "しょうさいを", "details",
            "考慮する", "こうりょする", "consider",
            "までもない", "", "not necessary",
            "が", "", "but",
            "基本的な", "きほんてきな", "basic",
            "計画を", "けいかくを", "plan",
            "立てるだけで", "たてるだけで", "only to make",
            "までだ", "", "it's only necessary",
            "It's not necessary to consider all the details for this project, but it's only necessary to make a basic plan."
        ],
        [
            "チームの", "チームの", "team's",
            "協力を", "きょうりょくを", "cooperation",
            "得る", "える", "obtain",
            "なくして", "", "without",
            "この目標を", "このもくひょうを", "this goal",
            "達成するのは", "たっせいするのは", "achieving",
            "難しいだろう", "むずかしいだろう", "would be difficult",
            "までもない", "", "not necessary to say",
            "とは言え", "とはいえ", "although",
            "努力は", "どりょくは", "effort",
            "必要だ", "ひつようだ", "is needed",
            "Without the cooperation of the team, achieving this goal would be difficult. Although it's not necessary to say, effort is needed."
        ],
        [
            "この問題を", "このもんだいを", "this problem",
            "解決するためには", "かいけつするためには", "to solve",
            "すべての", "すべての", "all",
            "リソースを", "リソースを", "resources",
            "使う", "つかう", "use",
            "までだ", "", "will use",
            "が", "", "but",
            "専門家の", "せんもんかの", "experts'",
            "助け", "たすけ", "help",
            "なくして", "", "without",
            "は無理だ", "はむりだ", "is impossible",
            "To solve this problem, we will use all available resources, but it is impossible without the help of experts."
        ],
        [
            "その提案は", "そのていあんは", "the proposal",
            "最初に", "さいしょに", "at first",
            "見た限りでは", "みたかぎりでは", "at first glance",
            "良さそうだったが", "よさそうだったが", "seemed good, but",
            "までもない", "", "necessary",
            "詳細を", "しょうさいを", "details",
            "深く", "ふかく", "deeply",
            "掘り下げる", "ほりさげる", "delve into",
            "必要がある", "ひつようがある", "need to",
            "The proposal seemed good at first glance, but it's necessary to delve deeper into the details."
        ],
        [
            "この技術を", "このぎじゅつを", "this technology",
            "導入するには", "どうにゅうするには", "to introduce",
            "資金や", "しきんや", "funding",
            "時間が", "じかんが", "time",
            "必要だ", "ひつようだ", "necessary",
            "なしに", "", "without",
            "は実現できない", "はじつげんできない", "cannot be realized",
            "までだ", "", "although only",
            "が", "", "but",
            "最小限の", "さいしょうげんの", "minimal",
            "投資は", "とうしは", "investment",
            "必要だ", "ひつようだ", "is needed",
            "Introducing this technology cannot be realized without funding and time. Although only minimal investment is needed, it's still necessary."
        ],
        [
            "このプロジェクトの", "このプロジェクトの", "this project's",
            "成功は", "せいこうは", "success",
            "にかかっている", "", "depends on",
            "すべての", "すべての", "all",
            "メンバーの", "メンバーの", "members'",
            "努力と", "どりょくと", "efforts and",
            "に則って", "", "in accordance with",
            "計画通りに", "けいかくどおりに", "as planned",
            "進めることに", "すすめることに", "proceeding",
            "依存している", "いぞんしている", "depends on",
            "The success of this project depends on the efforts of all members and on proceeding in accordance with the plan."
        ],
        [
            "新しい", "あたらしい", "new",
            "ポリシーの", "ポリシーの", "policy",
            "実施は", "じっしは", "implementation",
            "にまつわる", "", "related to",
            "規則や", "きそくや", "rules and",
            "法律を", "ほうりつを", "laws",
            "理解することに加え", "りかいすることにくわえ", "in addition to understanding",
            "に即して", "", "in keeping with",
            "変更を", "へんこうを", "changes",
            "行う", "おこなう", "make",
            "必要がある", "ひつようがある", "need to",
            "The implementation of the new policy requires understanding the related rules and laws, and making changes in keeping with them."
        ],
        [
            "イベントの", "イベントの", "event's",
            "進行は", "しんこうは", "progress",
            "にあって", "", "at hand",
            "の状況や", "のじょうきょうや", "circumstances",
            "にかかっている", "", "depends on",
            "サポートスタッフの", "サポートスタッフの", "support staff's",
            "協力に", "きょうりょくに", "cooperation",
            "大きく", "おおきく", "greatly",
            "依存する", "いぞんする", "depends",
            "The progress of the event greatly depends on the circumstances at hand and on the cooperation of the support staff."
        ],
        [
            "この報告書の", "このほうこくしょの", "this report's",
            "内容は", "ないようは", "content",
            "に則って", "", "in accordance with",
            "書かれるべきであり", "かかれるべきであり", "should be written",
            "にまつわる", "", "related to",
            "すべての", "すべての", "all",
            "データを", "データを", "data",
            "含める", "ふくめる", "include",
            "必要がある", "ひつようがある", "need to",
            "The content of this report should be written in accordance with the guidelines and include all data related to it."
        ],
        [
            "労働条件の", "ろうどうじょうけんの", "working conditions'",
            "改善は", "かいぜんは", "improvement",
            "に即して", "", "in keeping with",
            "提案された", "ていあんされた", "proposed",
            "変更が", "へんこうが", "changes",
            "実施されるかどうか", "じっしされるかどうか", "whether implemented",
            "に", "", "on",
            "にかかっている", "", "depends",
            "The improvement of working conditions depends on whether the proposed changes are implemented in keeping with the suggestions."
        ],
        [
            "いかなる", "", "no matter what kind of",
            "困難が", "こんなんが", "difficulty",
            "あっても", "", "even if there is",
            "いずれにせよ", "", "at any rate",
            "最善を", "さいぜんを", "best",
            "尽くす", "つくす", "do one's",
            "必要がある", "ひつようがある", "it is necessary",
            "No matter the kind of difficulty, at any rate, it is necessary to do your best."
        ],
        [
            "彼の", "かれの", "his",
            "提案が", "ていあんが", "proposal",
            "いかなる", "", "whatever kind of",
            "ものであれ", "", "it may be",
            "何しろ", "", "in any case",
            "全員が", "ぜんいんが", "everyone",
            "納得するまで", "なっとくするまで", "until convinced",
            "議論するべきだ", "ぎろんするべきだ", "should be discussed",
            "Whatever kind of proposal it is, in any case, it should be discussed until everyone is convinced."
        ],
        [
            "いずれにせよ", "", "at any rate",
            "この問題に対する", "このもんだいにたいする", "against this problem",
            "いかなる", "", "any kind of",
            "対策も", "たいさくも", "measure",
            "実施することが", "じっしすることが", "to implement",
            "求められている", "もとめられている", "is required",
            "At any rate, any kind of measure against this problem needs to be implemented."
        ],
        [
            "何しろ", "", "in any case",
            "この計画は", "このけいかくは", "this plan",
            "いかなる", "", "any kind of",
            "状況にも", "じょうきょうにも", "situation",
            "対応できるように", "たいおうできるように", "to handle",
            "設計されている", "せっけいされている", "is designed",
            "In any case, this plan is designed to handle any kind of situation."
        ],
        [
            "いかなる", "", "any kind of",
            "意見であっても", "いけんであっても", "opinion",
            "いずれにせよ", "", "in any case",
            "最終的な", "さいしゅうてきな", "final",
            "決定には", "けっていには", "decision",
            "影響を与える", "えいきょうをあたえる", "will affect",
            "だろう", "", "probably",
            "Any kind of opinion will, in any case, affect the final decision."
        ],
        [
            "このプロジェクトの", "このプロジェクトの", "this project's",
            "成功は", "せいこうは", "success",
            "すべての", "すべての", "all",
            "メンバーの", "メンバーの", "members'",
            "努力に", "どりょくに", "efforts",
            "かかっている", "", "depends on",
            "が", "", "but",
            "その成果は", "そのせいかは", "its outcome",
            "確実に", "かくじつに", "definitely",
            "に足る", "", "worthy of",
            "ものでなければならない", "", "must be",
            "The success of this project depends on the efforts of all members, but its outcome must definitely be worthy of it."
        ],
        [
            "その提案は", "そのていあんは", "the proposal",
            "に足りない", "", "not worth it",
            "内容であり", "ないようであり", "content",
            "ないではおかない", "", "must definitely",
            "改善を", "かいぜんを", "improvements",
            "施す", "ほどこす", "make",
            "必要がある", "ひつようがある", "need to",
            "The proposal is not worth it, and improvements must definitely be made."
        ],
        [
            "このレポートの", "このレポートの", "this report's",
            "品質は", "ひんしつは", "quality",
            "専門家による", "せんもんかによる", "by experts",
            "レビューに", "レビューに", "review",
            "かかっている", "", "depends on",
            "それが", "それが", "if it",
            "に足りる", "", "worthy",
            "ものでなければ", "", "isn't",
            "修正は", "しゅうせいは", "revisions",
            "ないではすまない", "", "must be made",
            "The quality of this report depends on a review by experts. If it isn't worthy, revisions must be made."
        ],
        [
            "問題が", "もんだいが", "problems",
            "発生した場合には", "はっせいしたばあいには", "in case of",
            "迅速な", "じんそくな", "prompt",
            "対応が", "たいおうが", "action",
            "にあたらない", "", "is necessary",
            "といけないが", "", "but",
            "にかかっている", "", "depends on",
            "具体的な", "ぐたいてきな", "specific",
            "手順を", "てじゅんを", "procedures",
            "踏む", "ふむ", "following",
            "必要がある", "ひつようがある", "need to",
            "In case of problems, prompt action is necessary, but it depends on following specific procedures."
        ],
        [
            "この計画が", "このけいかくが", "this plan",
            "成功するかどうかは", "せいこうするかどうかは", "whether it succeeds",
            "チームの", "チームの", "team's",
            "協力に", "きょうりょくに", "cooperation",
            "かかっている", "", "depends on",
            "成功しなければ", "せいこうしなければ", "if it fails",
            "その努力が", "そのどりょくが", "their efforts",
            "に足りない", "", "not worth it",
            "と見なされるだろう", "とみなされるだろう", "will be seen as",
            "The success of this plan depends on the team's cooperation. If it fails, their efforts will be seen as not worth it."
        ],
        [
            "その問題に", "そのもんだいに", "the issue",
            "対処するためには", "たいしょするためには", "to address",
            "適切な", "てきせつな", "appropriate",
            "対策を", "たいさくを", "measures",
            "講じることが", "こうじることが", "taking",
            "にあたらない", "", "is necessary",
            "が", "", "but",
            "ないではすまない", "", "essential",
            "と考えている", "とかんがえている", "is considered",
            "Addressing the issue requires appropriate measures, and it is considered essential to take action."
        ]
    ],
    "master": [
        [
            "この新しい", "このあたらしい", "this new",
            "ルールは", "ルールは", "rule",
            "に足る", "", "worthy",
            "理由があって", "りゆうがあって", "for reasons",
            "制定されたが", "せいていされたが", "was established, but",
            "実施しなければ", "じっししなければ", "if not implemented",
            "その効果が", "そのこうかが", "its effects",
            "に足りない", "", "insufficient",
            "とされる", "", "will be deemed",
            "The new rule was established for worthy reasons, but if not implemented, its effects will be deemed insufficient."
        ],
        [
            "彼の", "かれの", "his",
            "言動が", "げんどうが", "actions",
            "にかかっている", "", "depend on",
            "が", "", "but",
            "その結果が", "そのけっかが", "the results",
            "に足りない", "", "insufficient",
            "場合は", "ばあいは", "in case",
            "改善の", "かいぜんの", "improvements",
            "必要がある", "ひつようがある", "will be necessary",
            "だろう", "", "probably",
            "His actions depend on his behavior, but if the results are insufficient, improvements will be necessary."
        ],
        [
            "そのプロジェクトが", "そのプロジェクトが", "the project",
            "完了するには", "かんりょうするには", "to be completed",
            "十分な", "じゅうぶんな", "sufficient",
            "資源が", "しげんが", "resources",
            "必要だが", "ひつようだが", "are needed, but",
            "現状では", "げんじょうでは", "currently",
            "に足りない", "", "lacking",
            "ので", "", "so",
            "追加の", "ついかの", "additional",
            "予算が", "よさんが", "budget",
            "ないではおかない", "", "must be allocated",
            "The project requires sufficient resources to be completed, but currently, it is lacking, so additional budget must be allocated."
        ],
        [
            "法律に", "ほうりつに", "law",
            "違反する", "いはんする", "violate",
            "行為は", "こういは", "acts",
            "ないではすまない", "", "must be addressed",
            "が", "", "but",
            "その対処方法が", "そのたいしょほうほうが", "the methods of handling them",
            "にあたらない", "", "must be appropriate",
            "といけない", "", "must be",
            "Acts that violate the law must be addressed, and the methods of handling them must be appropriate."
        ],
        [
            "この料理の", "このりょうりの", "this dish's",
            "美味しさは", "おいしさは", "deliciousness",
            "の極み", "", "the utmost",
            "で", "", "is",
            "まるっきり", "", "completely",
            "すべての", "すべての", "every",
            "要素が", "ようそが", "element",
            "絶妙だ", "ぜつみょうだ", "is exquisite",
            "The deliciousness of this dish is the utmost, with every element being completely exquisite."
        ],
        [
            "彼の", "かれの", "his",
            "演技は", "えんぎは", "performance",
            "の至り", "", "the utmost",
            "で", "", "is",
            "感動すること", "かんどうすること", "moving",
            "のなんのって", "", "extremely",
            "His performance is the utmost, and it is extremely moving."
        ],
        [
            "この映画の", "このえいがの", "this movie's",
            "ストーリーは", "ストーリーは", "story",
            "さも", "", "truly",
            "素晴らしく", "すばらしく", "wonderful",
            "の極み", "", "the utmost",
            "と言っても", "といっても", "to say",
            "過言ではない", "かごんではない", "not an exaggeration",
            "The story of this movie is truly wonderful, and it is not an exaggeration to say it is the utmost."
        ],
        [
            "彼女の", "かのじょの", "her",
            "仕事に対する", "しごとにたいする", "for work",
            "熱心さは", "ねっしんさは", "enthusiasm",
            "といったらない", "", "extremely high",
            "のなんのって", "", "extremely",
            "真剣", "しんけん", "serious",
            "そのものだ", "", "itself",
            "Her enthusiasm for her work is extremely high. It is extremely serious."
        ],
        [
            "この景色は", "このけしきは", "this scenery",
            "まるっきり", "", "completely",
            "素晴らしく", "すばらしく", "wonderful",
            "の至り", "", "the utmost",
            "と言える", "といえる", "can be said",
            "だろう", "", "probably",
            "This scenery is completely wonderful and can be said to be the utmost."
        ],
        [
            "その演奏会は", "そのえんそうかいは", "the concert",
            "のなんのって", "", "extremely",
            "華やかで", "はなやかで", "splendid",
            "ずくめ", "", "entirely",
            "の成功だった", "のせいこうだった", "was a success",
            "The concert was extremely splendid and was entirely a success."
        ],
        [
            "彼の", "かれの", "his",
            "アート作品は", "アートさくひんは", "art",
            "の極み", "", "the utmost",
            "であり", "", "is",
            "さも", "", "truly",
            "独創的だ", "どくそうてきだ", "original",
            "His art is the utmost and truly original."
        ],
        [
            "このイベントの", "このイベントの", "this event's",
            "準備は", "じゅんびは", "preparation",
            "ずくめ", "", "thoroughly",
            "で", "", "was",
            "まるっきり", "", "totally",
            "完璧だった", "かんぺきだった", "perfect",
            "The preparation for this event was completely thorough and totally perfect."
        ],
        [
            "彼の", "かれの", "his",
            "知識の", "ちしきの", "knowledge",
            "深さは", "ふかさは", "depth",
            "の至り", "", "the utmost",
            "で", "", "is",
            "さも", "", "truly",
            "感心する", "かんしんする", "impressive",
            "The depth of his knowledge is the utmost and is truly impressive."
        ],
        [
            "そのパフォーマンスは", "そのパフォーマンスは", "the performance",
            "のなんのって", "", "extremely",
            "素晴らしく", "すばらしく", "wonderful",
            "の極み", "", "the utmost",
            "と言える", "といえる", "can be said",
            "The performance was extremely wonderful and can be said to be the utmost."
        ],
        [
            "この仕事が", "このしごとが", "this job",
            "大変だった", "たいへんだった", "was difficult",
            "もので", "", "because",
            "完成に", "かんせいに", "to complete",
            "からある", "", "as much as it did",
            "時間が", "じかんが", "time",
            "かかってしまった", "かかってしまった", "took",
            "ゆえに", "", "therefore",
            "納期に", "のうきに", "deadline",
            "間に合わなかった", "まにあわなかった", "missed",
            "This job was difficult, and it took as much time as it did to complete. Therefore, we missed the deadline."
        ],
        [
            "彼が", "かれが", "he",
            "成功したのは", "せいこうしたのは", "succeeded",
            "努力を", "どりょくを", "effort",
            "惜しまなかった", "おしまなかった", "spared no",
            "こととて", "", "because",
            "才能が", "さいのうが", "talent",
            "あった", "あった", "had",
            "からある", "", "as much as he did",
            "からだ", "", "because",
            "というわけだ", "", "this means",
            "彼の", "かれの", "his",
            "成果は", "せいかは", "achievements",
            "素晴らしい", "すばらしい", "remarkable",
            "His success is because he spared no effort and had as much talent as he did. This means his achievements are remarkable."
        ],
        [
            "このプロジェクトの", "このプロジェクトの", "this project's",
            "遅れは", "おくれは", "delay",
            "予期しない", "よきしない", "unexpected",
            "問題が", "もんだいが", "problems",
            "発生した", "はっせいした", "arose",
            "もので", "", "because",
            "ゆえに", "", "consequently",
            "追加の", "ついかの", "additional",
            "時間が", "じかんが", "time",
            "必要だ", "ひつようだ", "is needed",
            "The delay in this project is because unexpected problems arose, and consequently, additional time is needed."
        ],
        [
            "この研究が", "このけんきゅうが", "this research",
            "進んだのは", "すすんだのは", "progressed",
            "多くの", "おおくの", "many",
            "研究者が", "けんきゅうしゃが", "researchers",
            "協力した", "きょうりょくした", "collaborated",
            "からある", "", "as a result of",
            "成果であり", "せいかであり", "result",
            "もので", "", "for that reason",
            "その貢献が", "そのこうけんが", "contributions",
            "大きい", "おおきい", "significant",
            "The progress in this research is the result of the collaboration of many researchers, and for that reason, their contributions are significant."
        ],
        [
            "彼が", "かれが", "he",
            "その決定を", "そのけっていを", "that decision",
            "下したのは", "くだしたのは", "made",
            "慎重な", "しんちょうな", "careful",
            "検討を", "けんとうを", "consideration",
            "行った", "おこなった", "conducted",
            "こととて", "", "because",
            "確信が", "かくしんが", "confidence",
            "持てる", "もてる", "could have",
            "結果が", "けっかが", "result",
            "得られた", "えられた", "was obtained",
            "ゆえに", "", "therefore",
            "だ", "", "is",
            "The reason he made that decision is that careful consideration was given, and therefore, a confident result was obtained."
        ],
        [
            "このプロジェクトが", "このプロジェクトが", "this project",
            "成功した", "せいこうした", "succeeded",
            "もので", "", "due to",
            "チーム全体の", "チームぜんたいの", "entire team's",
            "努力が", "どりょくが", "effort",
            "あった", "あった", "was",
            "からある", "", "because of",
            "というわけだ", "", "that's why",
            "みんなの", "みんなの", "everyone's",
            "協力が", "きょうりょくが", "cooperation",
            "重要だった", "じゅうようだった", "was crucial",
            "The success of this project is due to the entire team's effort, and that's why everyone's cooperation was crucial."
        ],
        [
            "経済の", "けいざいの", "economic",
            "変動が", "へんどうが", "fluctuations",
            "激しかった", "はげしかった", "were intense",
            "からある", "", "because",
            "ため", "", "so",
            "計画が", "けいかくが", "plans",
            "変更された", "へんこうされた", "were changed",
            "こととて", "", "thus",
            "予想以上の", "よそういじょうの", "more than anticipated",
            "対応が", "たいおうが", "response",
            "必要だった", "ひつようだった", "was needed",
            "The economic fluctuations were intense, and thus, plans were changed, and more response was needed than anticipated."
        ],
        [
            "この問題が", "このもんだいが", "this problem",
            "解決できたのは", "かいけつできたのは", "was solved",
            "専門家の", "せんもんかの", "expert",
            "助言が", "じょげんが", "advice",
            "あった", "あった", "was",
            "もので", "", "because",
            "ゆえに", "", "consequently",
            "迅速に", "じんそくに", "promptly",
            "対処することが", "たいしょすることが", "address it",
            "できた", "できた", "could",
            "The problem was solved because there was expert advice, and consequently, we could address it promptly."
        ],
        [
            "このイベントの", "このイベントの", "this event's",
            "成功は", "せいこうは", "success",
            "予算が", "よさんが", "budget",
            "十分だった", "じゅうぶんだった", "was sufficient",
            "からある", "", "due to",
            "からであり", "", "because",
            "もので", "", "for that reason",
            "そのために", "そのために", "for that",
            "細部にまで", "さいぶにまで", "to every detail",
            "気を配った", "きをくばった", "attention was paid",
            "The success of this event is due to having a sufficient budget, and for that reason, attention was paid to every detail."
        ],
        [
            "彼が", "かれが", "he",
            "選ばれたのは", "えらばれたのは", "was chosen",
            "能力が", "のうりょくが", "ability",
            "高かった", "たかかった", "was high",
            "こととて", "", "because",
            "経験も", "けいけんも", "experience also",
            "豊富だった", "ほうふだった", "was rich",
            "ゆえに", "", "therefore",
            "だ", "", "is",
            "The reason he was chosen is because he had high ability and also rich experience."
        ],
        [
            "この地域の", "このちいきの", "this region's",
            "夏は", "なつは", "summer",
            "非常に", "ひじょうに", "extremely",
            "暑い", "あつい", "hot",
            "にひきかえ", "", "in contrast",
            "北部の", "ほくぶの", "north's",
            "夏は", "なつは", "summer",
            "とはいえ", "", "although",
            "比較的", "ひかくてき", "relatively",
            "涼しい", "すずしい", "cool",
            "In contrast to the extremely hot summer in this region, the summer in the north, although still warm, is relatively cool."
        ],
        [
            "彼の", "かれの", "his",
            "提案は", "ていあんは", "proposal",
            "素晴らしい", "すばらしい", "excellent",
            "とはいえ", "", "nonetheless",
            "予算の", "よさんの", "budget",
            "制約が", "せいやくが", "constraints",
            "あるため", "あるため", "due to",
            "にとどまらず", "", "not limited to",
            "現実的な", "げんじつてきな", "realistic",
            "アプローチが", "アプローチが", "approach",
            "必要だ", "ひつようだ", "is needed",
            "His proposal is excellent, nonetheless, due to budget constraints, not limited to just that, a realistic approach is needed."
        ],
        [
            "この新技術は", "このしんぎじゅつは", "this new technology",
            "にひきかえ", "", "in contrast",
            "以前の", "いぜんの", "previous",
            "技術に", "ぎじゅつに", "technology",
            "比べて", "くらべて", "compared to",
            "飛躍的な", "ひやくてきな", "remarkable",
            "進歩を", "しんぽを", "progress",
            "遂げている", "とげている", "has made",
            "とはいえ", "", "even so",
            "まだ", "まだ", "still",
            "改善の", "かいぜんの", "improvement",
            "余地が", "よちが", "room for",
            "ある", "ある", "there is",
            "In contrast to this new technology, which has made remarkable progress compared to the previous technology, there is still room for improvement."
        ],
        [
            "彼の", "かれの", "his",
            "成功は", "せいこうは", "success",
            "努力による", "どりょくによる", "due to efforts",
            "もの", "もの", "thing",
            "にとどまらず", "", "not limited to",
            "ネットワーキングの", "ネットワーキングの", "networking",
            "スキルも", "スキルも", "skills also",
            "大きい", "おおきい", "significant",
            "とはいえ", "", "even so",
            "基本的な", "きほんてきな", "basic",
            "能力が", "のうりょくが", "abilities",
            "欠けていると", "かけていると", "lacking",
            "成功は", "せいこうは", "success",
            "難しい", "むずかしい", "difficult",
            "His success is not limited to just his efforts; networking skills also play a significant role. Even so, success is difficult without basic abilities."
        ],
        [
            "この商品の", "このしょうひんの", "this product's",
            "デザインは", "デザインは", "design",
            "非常に", "ひじょうに", "very",
            "現代的である", "げんだいてきである", "modern",
            "にひきかえ", "", "in contrast",
            "機能性は", "きのうせいは", "functionality",
            "とはいえ", "", "although",
            "伝統的な", "でんとうてきな", "traditional",
            "ものが", "ものが", "elements",
            "多い", "おおい", "many",
            "In contrast to the very modern design of this product, its functionality, although good, still features many traditional elements."
        ],
        [
            "この学問の", "このがくもんの", "this field of",
            "分野は", "ぶんやは", "study",
            "にとどまらず", "", "not limited to",
            "実用的な", "じつようてきな", "practical",
            "応用も", "おうようも", "applications also",
            "されている", "されている", "are done",
            "といえども", "", "even so",
            "理論的な", "りろんてきな", "theoretical",
            "研究が", "けんきゅうが", "research",
            "基本となる", "きほんとなる", "remains fundamental",
            "This field of study is not limited to just theoretical research; it is also applied practically, even so, theoretical research remains fundamental."
        ],
        [
            "彼の", "かれの", "his",
            "説明は", "せつめいは", "explanation",
            "詳細で", "しょうさいで", "detailed",
            "わかりやすい", "わかりやすい", "easy to understand",
            "とはいえ", "", "nonetheless",
            "全ての", "すべての", "all",
            "質問に", "しつもんに", "questions",
            "答えられているわけではない", "こたえられているわけではない", "are not answered",
            "にひきかえ", "", "in contrast",
            "彼女の", "かのじょの", "her",
            "説明は", "せつめいは", "explanation",
            "簡潔であった", "かんけつであった", "was concise",
            "His explanation is detailed and clear; nonetheless, not all questions are answered. In contrast, her explanation was concise."
        ],
        [
            "映画の", "えいがの", "movie's",
            "ストーリーは", "ストーリーは", "story",
            "感動的である", "かんどうてきである", "emotional",
            "にひきかえ", "", "in contrast",
            "キャスティングの", "キャスティングの", "casting",
            "選択は", "せんたくは", "choices",
            "とはいえ", "", "although",
            "少し", "すこし", "a bit",
            "不自然に", "ふしぜんに", "unnatural",
            "感じられることも", "かんじられることも", "can feel",
            "ある", "ある", "there is",
            "In contrast to the emotional story of the movie, the casting choices, although acceptable, can sometimes feel a bit unnatural."
        ],
        [
            "彼の", "かれの", "his",
            "提案は", "ていあんは", "proposal",
            "革新的である", "かくしんてきである", "innovative",
            "にとどまらず", "", "not only",
            "実行可能な", "じっこうかのうな", "feasible",
            "プランも", "プランも", "plans also",
            "提供している", "ていきょうしている", "provides",
            "とはいえ", "", "even so",
            "リスクを", "リスクを", "risks",
            "完全に", "かんぜんに", "completely",
            "排除することは", "はいじょすることは", "eliminate",
            "難しい", "むずかしい", "difficult",
            "His proposal is not only innovative but also provides feasible plans. Even so, it is difficult to completely eliminate risks."
        ],
        [
            "この商品の", "このしょうひんの", "this product's",
            "価格は", "かかくは", "price",
            "高い", "たかい", "high",
            "とはいうものの", "", "although",
            "品質が", "ひんしつが", "quality",
            "それに見合う", "それにみあう", "commensurate with",
            "ものである", "", "is",
            "にひきかえ", "", "in contrast",
            "同様の", "どうようの", "similar",
            "商品が", "しょうひんが", "products",
            "他では", "ほかでは", "elsewhere",
            "安価に", "あんかに", "cheaper",
            "販売されている", "はんばいされている", "are sold",
            "Although the price of this product is high, its quality is commensurate with it. In contrast, similar products are sold cheaper elsewhere."
        ],
        [
            "この問題が", "このもんだいが", "this problem",
            "解決できる", "かいけつできる", "can solve",
            "ないものか", "", "can't we",
            "専門家の", "せんもんかの", "experts'",
            "助けを", "たすけを", "help",
            "借りても", "かりても", "even with",
            "そうにもない", "", "unlikely",
            "かもしれない", "かもしれない", "might be",
            "Can't we solve this problem? Even with the help of experts, it might be unlikely."
        ],
        [
            "このプロジェクトが", "このプロジェクトが", "this project",
            "成功する", "せいこうする", "succeed",
            "ないものでもない", "", "not entirely impossible",
            "が", "", "but",
            "や否や", "", "the moment",
            "すぐに", "すぐに", "immediately",
            "資金が", "しきんが", "funding",
            "必要に", "ひつように", "necessary",
            "なるだろう", "なるだろう", "will become",
            "It's not entirely impossible for this project to succeed, but the moment it does, we will need funding immediately."
        ],
        [
            "新しい", "あたらしい", "new",
            "提案が", "ていあんが", "proposal",
            "採用される", "さいようされる", "be adopted",
            "ないものか", "", "can't we have",
            "リーダーシップの", "リーダーシップの", "leadership",
            "変更が", "へんこうが", "change",
            "あるかもしれない", "あるかもしれない", "might be",
            "とはいえ", "", "although",
            "確実ではない", "かくじつではない", "not certain",
            "Can't we have the new proposal adopted? Although there might be a change in leadership, it's not certain."
        ],
        [
            "彼が", "かれが", "he",
            "その問題を", "そのもんだいを", "that problem",
            "解決する", "かいけつする", "solve",
            "ないとも限らない", "", "it's possible",
            "が", "", "but",
            "時間が", "じかんが", "time",
            "かかるだろうし", "かかるだろうし", "will likely take",
            "そうにもない", "", "unlikely",
            "It's possible that he might solve the problem, but it will likely take time and is unlikely."
        ],
        [
            "この計画が", "このけいかくが", "this plan",
            "成功する", "せいこうする", "succeed",
            "そうにもない", "", "unlikely",
            "としても", "", "even if",
            "や否や", "", "as soon as possible",
            "準備を", "じゅんびを", "preparations",
            "進めるべきだ", "すすめるべきだ", "should proceed",
            "Even if the success of this plan seems unlikely, we should proceed with preparations as soon as possible."
        ],
        [
            "新しい", "あたらしい", "new",
            "技術が", "ぎじゅつが", "technology",
            "導入される", "どうにゅうされる", "be introduced",
            "ないものか", "", "can't we",
            "それに伴う", "それにともなう", "accompanying",
            "リスクも", "リスクも", "risks also",
            "考慮する", "こうりょする", "consider",
            "必要がある", "ひつようがある", "need to",
            "が", "", "but",
            "ないものでもない", "", "not entirely impossible",
            "Can't we introduce the new technology? It's not entirely impossible, but we need to consider the accompanying risks."
        ],
        [
            "この結果が", "このけっかが", "this result",
            "良いものである", "よいものである", "is favorable",
            "や否や", "", "as soon as",
            "次の", "つぎの", "next",
            "ステップを", "ステップを", "steps",
            "計画する", "けいかくする", "plan",
            "必要がある", "ひつようがある", "need to",
            "が", "", "though",
            "ないとも限らない", "", "might not be guaranteed",
            "As soon as the result is favorable, we need to plan the next steps, though it might not be guaranteed."
        ],
        [
            "このプロジェクトが", "このプロジェクトが", "this project",
            "成功する", "せいこうする", "succeed",
            "可能性は", "かのうせいは", "possibility",
            "ないとも限らない", "", "might not be entirely impossible",
            "が", "", "but",
            "予算が", "よさんが", "budget",
            "不足している", "ふそくしている", "insufficient",
            "そうにもない", "", "unlikely",
            "The possibility of success for this project might not be entirely impossible, but the budget is unlikely to be sufficient."
        ],
        [
            "あなたの", "あなたの", "your",
            "提案が", "ていあんが", "proposal",
            "受け入れられる", "うけいれられる", "be accepted",
            "ないものか", "", "can't",
            "たとえ", "たとえ", "even if",
            "それが", "それが", "it",
            "難しくても", "むずかしくても", "difficult",
            "や否や", "", "as soon as possible",
            "再度", "さいど", "again",
            "検討する", "けんとうする", "consider",
            "価値がある", "かちがある", "worth",
            "Can't your proposal be accepted? Even if it is difficult, it is worth reconsidering as soon as possible."
        ],
        [
            "新しい", "あたらしい", "new",
            "アイデアが", "アイデアが", "idea",
            "実現する", "じつげんする", "become a reality",
            "ないとも限らない", "", "might",
            "が", "", "but",
            "実際には", "じっさいには", "in reality",
            "そうにもない", "", "unlikely",
            "状況が", "じょうきょうが", "situation",
            "続いている", "つづいている", "continues",
            "The new idea might become a reality, but in reality, the situation continues to be unlikely."
        ],
        [
            "このプロジェクトは", "このプロジェクトは", "this project",
            "計画通りに", "けいかくどおりに", "according to plan",
            "進めるべきで", "すすめるべきで", "should proceed",
            "ままに", "", "as is",
            "作業を", "さぎょうを", "work",
            "進める", "すすめる", "continue",
            "とりわけ", "", "especially",
            "重要だ", "じゅうようだ", "important",
            "The project should proceed according to plan, and it is especially important to continue the work as is."
        ],
        [
            "彼は", "かれは", "he",
            "疲れているようで", "つかれているようで", "looks tired",
            "まみれ", "", "covered in",
            "の汗を", "のあせを", "sweat",
            "かきながら", "かきながら", "while",
            "めく", "", "showing signs of",
            "疲労の", "ひろうの", "fatigue",
            "兆しが", "きざしが", "signs",
            "見える", "みえる", "can be seen",
            "He looks tired, showing signs of fatigue while being covered in sweat."
        ],
        [
            "この問題が", "このもんだいが", "this problem",
            "解決できる", "かいけつできる", "can be solved",
            "ためしがない", "", "there is never a case",
            "が", "", "but",
            "もさることながら", "", "not only that",
            "新しい", "あたらしい", "new",
            "方法も", "ほうほうも", "methods also",
            "試してみる", "ためしてみる", "try",
            "価値がある", "かちがある", "worth it",
            "There is never a case where this problem can be solved, but not only that, trying new methods is also worth it."
        ],
        [
            "彼の", "かれの", "his",
            "表情は", "ひょうじょうは", "expression",
            "明らかに", "あきらかに", "clearly",
            "めく", "", "shows signs of",
            "ストレスの", "ストレスの", "stress",
            "兆しが", "きざしが", "signs",
            "あり", "あり", "there are",
            "とりわけ", "", "especially",
            "プレッシャーを", "プレッシャーを", "pressure",
            "感じている", "かんじている", "feeling",
            "ようだ", "ようだ", "seems",
            "His expression clearly shows signs of stress, especially as if he is feeling pressure."
        ],
        [
            "この地域の", "このちいきの", "this area's",
            "生活環境は", "せいかつかんきょうは", "living environment",
            "清潔であり", "せいけつであり", "clean",
            "ままに", "", "as is",
            "過ごす", "すごす", "live",
            "とりわけ", "", "especially",
            "快適だ", "かいてきだ", "comfortable",
            "The living environment in this area is clean and especially comfortable to live in as is."
        ],
        [
            "その提案は", "そのていあんは", "that proposal",
            "実行する", "じっこうする", "implement",
            "価値が", "かちが", "worth",
            "ためしがない", "", "there is no case",
            "が", "", "but",
            "もさることながら", "", "not only that",
            "事前の", "じぜんの", "prior",
            "準備が", "じゅんびが", "preparation",
            "不足している", "ふそくしている", "lacking",
            "There is no case where the proposal is worth implementing, but not only that, there is a lack of preparation."
        ],
        [
            "この本は", "このほんは", "this book",
            "古いが", "ふるいが", "is old but",
            "内容が", "ないようが", "content",
            "めく", "", "shows signs of",
            "現代的な", "げんだいてきな", "modern",
            "視点を", "してんを", "perspectives",
            "持っており", "もっており", "has",
            "とりわけ", "", "especially",
            "興味深い", "きょうみぶかい", "interesting",
            "Although this book is old, its content shows signs of modern perspectives and is especially interesting."
        ],
        [
            "彼女の", "かのじょの", "her",
            "部屋は", "へやは", "room",
            "まみれ", "", "covered in",
            "の本で", "のほんで", "books",
            "いっぱいで", "いっぱいで", "full of",
            "整理が", "せいりが", "organizing",
            "必要だが", "ひつようだが", "needs, but",
            "思いをする", "", "feels",
            "ストレスも", "ストレスも", "stress also",
            "感じる", "かんじる", "feels",
            "Her room is covered in books and needs organizing, but she also feels stressed."
        ],
        [
            "彼は", "かれは", "he",
            "プロジェクトを", "プロジェクトを", "project",
            "ままに", "", "as is",
            "進める", "すすめる", "proceed",
            "ことができる", "ことができる", "can",
            "が", "", "but",
            "めく", "", "visible",
            "成果が", "せいかが", "results",
            "見えないと", "みえないと", "if not",
            "とりわけ", "", "especially",
            "難しい", "むずかしい", "difficult",
            "He can proceed with the project as is, but it is especially difficult if results are not visible."
        ],
        [
            "彼の", "かれの", "his",
            "言動には", "げんどうには", "behavior",
            "まみれ", "", "covered in",
            "の自信と", "のじしんと", "confidence",
            "もさることながら", "", "not only that",
            "少しの", "すこしの", "a bit of",
            "不安も", "ふあんも", "anxiety also",
            "感じられる", "かんじられる", "can be felt",
            "His behavior is covered in confidence, and not only that, but also shows a bit of anxiety."
        ],
        [
            "日本に来てからというもの", "", "since I came to Japan",
            "毎日", "まいにち", "every day",
            "新しい", "あたらしい", "new",
            "発見が", "はっけんが", "discoveries",
            "あり", "あり", "are",
            "美味しい食べ物に至るまで", "おいしいたべものにいたるまで", "everything from delicious food to",
            "楽しんでいます", "たのしんでいます", "enjoying",
            "Since I came to Japan, I've been making new discoveries every day, enjoying everything from delicious food to..."
        ],
        [
            "彼は", "かれは", "he",
            "プロジェクトのリーダーに先駆けて", "", "being the first to become the project leader",
            "新しい", "あたらしい", "new",
            "提案を", "ていあんを", "proposal",
            "して", "して", "made",
            "ミーティングの開始から瞬間に", "", "immediately from the start of the meeting",
            "チームの", "チームの", "team's",
            "関心を", "かんしんを", "interest",
            "引きました", "ひきました", "captured",
            "He, being the first to become the project leader, made a new proposal and immediately captured the team's interest from the start of the meeting."
        ],
        [
            "連絡を受けてからというもの", "", "since receiving the message",
            "彼は", "かれは", "he",
            "毎日", "まいにち", "every day",
            "状況を", "じょうきょうを", "situation",
            "確認し", "かくにんし", "checking",
            "報告書を提出するまで", "", "until he submits the report",
            "気を抜かずに", "きをぬかずに", "without a break",
            "頑張っています", "がんばっています", "working hard",
            "Since receiving the message, he has been checking the situation every day and working hard without a break until he submits the report."
        ],
        [
            "彼の", "かれの", "his",
            "提案に至っては", "", "as for his proposal",
            "みんなが", "みんなが", "everyone",
            "賛成すると", "さんせいすると", "would agree",
            "思いましたが", "おもいましたが", "thought, but",
            "その瞬間に", "", "the moment",
            "意見が", "いけんが", "opinions",
            "分かれました", "わかれました", "diverged",
            "As for his proposal, I thought everyone would agree, but opinions diverged the moment it was mentioned."
        ],
        [
            "新しいルールが適用されてからというもの", "", "since the new rules were applied",
            "全員が", "ぜんいんが", "everyone",
            "そのルールに", "そのルールに", "those rules",
            "従うようにし", "したがうようにし", "has been following",
            "その後の会議では", "", "since then in the meetings",
            "スムーズに", "スムーズに", "smoothly",
            "進行しました", "しんこうしました", "proceeded",
            "Since the new rules were applied, everyone has been following them, and the meetings have been running smoothly since then."
        ],
        [
            "大会が始まってからというもの", "", "since the tournament started",
            "彼は", "かれは", "he",
            "トップの座を", "トップのざを", "top position",
            "守り続け", "まもりつづけ", "continued to hold",
            "優勝に至るまで", "", "until he won",
            "決して", "けっして", "never",
            "負けませんでした", "まけませんでした", "lost",
            "Since the tournament started, he has continued to hold the top position and never lost until he won."
        ],
    ],
    "(╯°□°）╯︵ ┻━┻": [
        [
            "彼女が", "かのじょが", "she",
            "プロジェクトを開始するに先駆けて", "", "before she started the project",
            "チーム全員が", "チームぜんいんが", "entire team",
            "準備を", "じゅんびを", "preparations",
            "整え", "ととのえ", "prepared",
            "その直後に", "", "immediately after",
            "第一回の", "だいいっかいの", "first",
            "ミーティングが", "ミーティングが", "meeting",
            "開かれました", "ひらかれました", "was held",
            "Before she started the project, the entire team prepared, and immediately after, the first meeting was held."
        ],
        [
            "日本に到着してからというもの", "", "since arriving in Japan",
            "毎日", "まいにち", "every day",
            "観光をし", "かんこうをし", "sightseeing",
            "各地の名所に至るまで", "", "throughout various regions",
            "見て回りました", "みてまわりました", "visited",
            "Since arriving in Japan, I've been sightseeing every day and visiting famous spots throughout various regions."
        ],
        [
            "その問題が発生してからというもの", "", "since the problem occurred",
            "対策を", "たいさくを", "measures",
            "講じるために", "こうじるために", "to take",
            "全員が", "ぜんいんが", "everyone",
            "努力し", "どりょくし", "has been working",
            "数週間後に", "", "after a few weeks",
            "ようやく", "ようやく", "finally",
            "解決しました", "かいけつしました", "resolved",
            "Since the problem occurred, everyone has been working to take measures, and it was finally resolved after a few weeks."
        ],
        [
            "新しいシステムが導入されてからというもの", "", "since the new system was introduced",
            "業務が", "ぎょうむが", "operations",
            "効率化され", "こうりつかされ", "have become more efficient",
            "毎日の作業が始まると瞬間に", "", "the moment the daily tasks begin",
            "成果が", "せいかが", "results",
            "見える", "みえる", "visible",
            "ようになりました", "ようになりました", "have become",
            "Since the new system was introduced, operations have become more efficient, and results are visible the moment the daily tasks begin."
        ],
        [
            "このイベントは", "このイベントは", "this event",
            "観光を兼ねて", "かんこうをかねて", "also serving as",
            "地元の", "じもとの", "local",
            "文化に", "ぶんかに", "culture",
            "触れる", "ふれる", "experience",
            "機会を", "きかいを", "opportunity",
            "提供します", "ていきょうします", "provides",
            "参加者は", "さんかしゃは", "participants",
            "伝統的な祭りなり", "", "traditional festivals",
            "現代アートなり", "", "modern art",
            "どちらも", "どちらも", "both",
            "楽しめます", "たのしめます", "can enjoy",
            "This event, also serving as a chance to experience local culture, provides participants with opportunities to enjoy both traditional festivals and modern art."
        ],
        [
            "彼の", "かれの", "his",
            "料理は", "りょうりは", "cooking",
            "家庭的な", "かていてきな", "homely",
            "味を", "あじを", "taste",
            "追求するなり", "", "whether pursuing",
            "プロフェッショナルな", "プロフェッショナルな", "professional",
            "技術を", "ぎじゅつを", "techniques",
            "駆使するなり", "", "or utilizing",
            "どちらも", "どちらも", "both",
            "一流です", "いちりゅうです", "is top-notch",
            "His cooking, whether pursuing a homely taste or utilizing professional techniques, is top-notch in both respects."
        ],
        [
            "このプロジェクトは", "このプロジェクトは", "this project",
            "学びながら", "まなびながら", "while learning",
            "経験を", "けいけんを", "experience",
            "積むことを", "つむことを", "to gain",
            "目的に", "もくてきに", "aims",
            "仕事の", "しごとの", "work",
            "スキルを", "スキルを", "skills",
            "磨くとともに", "みがくとともに", "to refine",
            "新しい", "あたらしい", "new",
            "挑戦を", "ちょうせんを", "challenges",
            "経験する", "けいけんする", "to experience",
            "機会も", "きかいも", "opportunities also",
            "提供します", "ていきょうします", "provides",
            "This project aims to gain experience while learning, providing opportunities to both refine work skills and face new challenges."
        ],
        [
            "彼の", "かれの", "his",
            "デザインは", "デザインは", "designs",
            "シンプルなものから", "シンプルなものから", "from simple",
            "複雑なものまで", "ふくざつなものまで", "to complex",
            "個性的な", "こせいてきな", "personal",
            "スタイル", "スタイル", "style",
            "ならではの", "ならではの", "unique to",
            "特徴が", "とくちょうが", "characteristics",
            "あります", "あります", "have",
            "His designs have characteristics unique to his personal style, ranging from simple to complex."
        ],
        [
            "新しい", "あたらしい", "new",
            "キャンペーンを", "キャンペーンを", "campaign",
            "皮切りに", "かわきりに", "starting with",
            "各種の", "かくしゅの", "various",
            "広告手法を", "こうこくしゅほうを", "advertising methods",
            "試すなり", "", "whether trying",
            "従来のものを", "じゅうらいのものを", "traditional ones",
            "改良するなり", "", "or improving",
            "さまざまな", "さまざまな", "various",
            "戦略を", "せんりゃくを", "strategies",
            "展開する", "てんかいする", "implement",
            "予定です", "よていです", "plan to",
            "Starting with the new campaign, we plan to implement various strategies, whether trying different advertising methods or improving traditional ones."
        ],
        [
            "彼の", "かれの", "his",
            "仕事は", "しごとは", "work",
            "経験を", "けいけんを", "experience",
            "積むとともに", "つむとともに", "by gaining",
            "スキルを", "スキルを", "skills",
            "磨くなり", "", "whether refining",
            "多様な", "たような", "various",
            "プロジェクトに", "プロジェクトに", "projects",
            "挑戦するなり", "", "or challenging",
            "とにかく", "とにかく", "anyway",
            "常に", "つねに", "constantly",
            "進化しています", "しんかしています", "evolves",
            "His work constantly evolves, whether by gaining experience, refining skills, or challenging various projects."
        ],
        [
            "この講座は", "このこうざは", "this course",
            "理論を", "りろんを", "theory",
            "学ぶことを", "まなぶことを", "to learn",
            "目的とし", "もくてきとし", "aims",
            "実践的な", "じっせんてきな", "practical",
            "スキルを", "スキルを", "skills",
            "習得するための", "しゅうとくするための", "to acquire",
            "機会を", "きかいを", "opportunities",
            "提供します", "ていきょうします", "provides",
            "受講者は", "じゅこうしゃは", "participants",
            "書籍なり", "", "books",
            "オンラインリソースなり", "", "online resources",
            "どちらも", "どちらも", "either",
            "利用できます", "りようできます", "can use",
            "This course aims to teach theory while providing opportunities to acquire practical skills. Participants can use either books or online resources."
        ],
        [
            "この展覧会は", "このてんらんかいは", "this exhibition",
            "現代アートの", "げんだいアートの", "contemporary art",
            "代表的な", "だいひょうてきな", "representative",
            "作品を", "さくひんを", "works",
            "紹介するだけでなく", "しょうかいするだけでなく", "not only introduces",
            "地元アーティストの", "じもとアーティストの", "local artists'",
            "作品を", "さくひんを", "works",
            "展示するなり", "", "displays",
            "多様な", "たような", "diverse",
            "アートスタイルを", "アートスタイルを", "art styles",
            "体験できます", "たいけんできます", "can experience",
            "This exhibition not only introduces representative works of contemporary art but also displays local artists' works, allowing for an experience of diverse art styles."
        ],
        [
            "イベントを", "イベントを", "event",
            "開催するにあたり", "", "in hosting",
            "観客の", "かんきゃくの", "audience's",
            "ニーズに", "ニーズに", "needs",
            "応えるとともに", "こたえるとともに", "to meet",
            "新しい", "あたらしい", "new",
            "アイデアを", "アイデアを", "ideas",
            "取り入れる", "とりいれる", "incorporate",
            "機会を", "きかいを", "opportunities",
            "提供します", "ていきょうします", "provide",
            "参加者は", "さんかしゃは", "participants",
            "フォーラムなり", "", "forums",
            "ワークショップなり", "", "workshops",
            "どちらにも", "どちらにも", "either",
            "参加できます", "さんかできます", "can join",
            "In hosting the event, we provide opportunities to meet the audience's needs and incorporate new ideas. Participants can join either forums or workshops."
        ],
        [
            "この新しい", "このあたらしい", "this new",
            "システムは", "システムは", "system",
            "業務効率を", "ぎょうむこうりつを", "work efficiency",
            "向上させるための", "こうじょうさせるための", "to improve",
            "ものです", "", "is for",
            "操作が", "そうさが", "operation",
            "簡単な", "かんたんな", "easy",
            "インターフェースを", "インターフェースを", "interface",
            "提供するとともに", "ていきょうするとともに", "provides",
            "技術", "ぎじゅつ", "technical",
            "サポートも", "サポートも", "support also",
            "充実しています", "じゅうじつしています", "is well-equipped",
            "This new system is for improving work efficiency. It provides an easy-to-use interface and is well-equipped with technical support."
        ],
        [
            "どんなに", "どんなに", "no matter how",
            "困難な", "こんなんな", "difficult",
            "状況であっても", "じょうきょうであっても", "situation may be",
            "いずれにせよ", "", "in any case",
            "成功を", "せいこうを", "success",
            "収めるためには", "おさめるためには", "to achieve",
            "努力が", "どりょくが", "effort",
            "必要です", "ひつようです", "is required",
            "何しろ", "", "after all",
            "成功には", "せいこうには", "success",
            "時間が", "じかんが", "time",
            "かかります", "かかります", "takes",
            "No matter how difficult the situation may be, in any case, effort is required to achieve success. After all, success takes time."
        ],
        [
            "いかなる", "", "no matter what",
            "問題であっても", "もんだいであっても", "problem it is",
            "何しろ", "", "in any case",
            "解決策を", "かいけつさくを", "solution",
            "見つけなければなりません", "みつけなければなりません", "must be found",
            "というのは", "", "or rather",
            "問題解決は", "もんだいかいけつは", "problem-solving",
            "進歩の", "しんぽの", "progress's",
            "鍵だからです", "かぎだからです", "is the key",
            "No matter what problem it is, in any case, a solution must be found. Or rather, solving problems is the key to progress."
        ],
        [
            "このプロジェクトは", "このプロジェクトは", "this project",
            "様々な", "さまざまな", "various",
            "リスクを", "リスクを", "risks",
            "含むというもの", "", "which includes",
            "いかなる", "", "no matter what",
            "手段を", "しゅだんを", "measures",
            "講じても", "こうじても", "are taken",
            "成功する", "せいこうする", "succeed",
            "可能性が", "かのうせいが", "possibility",
            "高いです", "たかいです", "is high",
            "というか", "", "or rather",
            "リスクを", "リスクを", "risks",
            "管理することで", "かんりすることで", "by managing",
            "より良い", "よりよい", "better",
            "結果が", "けっかが", "results",
            "得られます", "えられます", "can be obtained",
            "This project, which includes various risks, has a high chance of success no matter what measures are taken. Or rather, managing risks leads to better results."
        ],
        [
            "いずれにせよ", "", "in any case",
            "この提案を", "このていあんを", "this proposal",
            "受け入れるかどうかは", "うけいれるかどうかは", "whether to accept",
            "何しろ", "", "after all",
            "最終的には", "さいしゅうてきには", "ultimately",
            "関係者全員の", "かんけいしゃぜんいんの", "all stakeholders'",
            "意見に", "いけんに", "opinions",
            "依存します", "いぞんします", "depends on",
            "というもの", "", "in other words",
            "決定には", "けっていには", "decision",
            "合意が", "ごういが", "consensus",
            "必要です", "ひつようです", "is required",
            "In any case, whether to accept this proposal or not depends on the opinions of all stakeholders. In other words, consensus is required for a decision."
        ],
        [
            "いかなる", "", "no matter what",
            "方法を", "ほうほうを", "method",
            "用いても", "もちいても", "is used",
            "というのは", "", "that is",
            "効果的な", "こうかてきな", "effective",
            "結果を", "けっかを", "results",
            "得るためには", "えるためには", "to achieve",
            "最適な", "さいてきな", "optimal",
            "アプローチが", "アプローチが", "approach",
            "必要です", "ひつようです", "is necessary",
            "何しろ", "", "after all",
            "アプローチの", "アプローチの", "approach's",
            "選択は", "せんたくは", "choice",
            "結果に", "けっかに", "outcome",
            "大きく", "おおきく", "greatly",
            "影響します", "えいきょうします", "impacts",
            "No matter what method is used, that is, an optimal approach is necessary to achieve effective results. After all, the choice of approach greatly impacts the outcome."
        ],
        [
            "何しろ", "", "in any case",
            "このプロジェクトの", "このプロジェクトの", "this project's",
            "成功には", "せいこうには", "success",
            "いかなる", "", "any",
            "努力も", "どりょくも", "effort",
            "惜しまず", "おしまず", "spare no",
            "全力を", "ぜんりょくを", "all",
            "尽くさなければなりません", "つくさなければなりません", "must give",
            "というか", "", "or rather",
            "努力なしでは", "どりょくなしでは", "without effort",
            "成功は", "せいこうは", "success",
            "あり得ません", "ありえません", "is impossible",
            "In any case, achieving success in this project requires spare no effort and give it your all. Or rather, success is impossible without effort."
        ],
        [
            "いずれにせよ", "", "in any case",
            "この問題を", "このもんだいを", "this problem",
            "解決するためには", "かいけつするためには", "to solve",
            "何しろ", "", "after all",
            "全ての", "すべての", "all",
            "可能性を", "かのうせいを", "possibilities",
            "検討する", "けんとうする", "consider",
            "必要があります", "ひつようがあります", "need to",
            "というもの", "", "or rather",
            "全ての", "すべての", "all",
            "選択肢を", "せんたくしを", "options",
            "考慮することで", "こうりょすることで", "by considering",
            "最良の", "さいりょうの", "best",
            "解決策が", "かいけつさくが", "solution",
            "見つかります", "みつかります", "will be found",
            "In any case, to solve this problem, it is necessary to consider all possibilities. Or rather, considering all options will find the best solution."
        ],
        [
            "いかなる", "", "no matter what",
            "困難な", "こんなんな", "difficult",
            "状況に", "じょうきょうに", "situation",
            "直面しても", "ちょくめんしても", "you face",
            "というもの", "", "you must",
            "冷静に", "れいせいに", "calmly",
            "対処しなければなりません", "たいしょしなければなりません", "handle",
            "何しろ", "", "after all",
            "冷静さが", "れいせいさが", "calmness",
            "解決策を", "かいけつさくを", "solutions",
            "見つける", "みつける", "finding",
            "鍵です", "かぎです", "is the key",
            "No matter what difficult situation you face, you must handle it calmly. After all, calmness is the key to finding solutions."
        ],
        [
            "いずれにせよ", "", "in any case",
            "プロジェクトの", "プロジェクトの", "project's",
            "成果は", "せいかは", "results",
            "何しろ", "", "after all",
            "時間をかけて", "じかんをかけて", "over time",
            "慎重に", "しんちょうに", "carefully",
            "評価しなければなりません", "ひょうかしなければなりません", "must be evaluated",
            "というもの", "", "or rather",
            "早急な", "そうきゅうな", "hasty",
            "判断は", "はんだんは", "judgments",
            "誤解を", "ごかいを", "misunderstandings",
            "招く", "まねく", "lead to",
            "可能性があります", "かのうせいがあります", "can",
            "In any case, the project's results must be carefully evaluated over time. Or rather, hasty judgments can lead to misunderstandings."
        ],
        [
            "いかなる", "", "no matter what",
            "問題に対しても", "もんだいにたいしても", "problem",
            "何しろ", "", "in any case",
            "冷静な", "れいせいな", "calm",
            "分析が", "ぶんせきが", "analysis",
            "不可欠です", "ふかけつです", "is essential",
            "というか", "", "or rather",
            "感情的な", "かんじょうてきな", "emotional",
            "判断は", "はんだんは", "judgments",
            "避けるべきです", "さけるべきです", "should be avoided",
            "No matter what problem it is, in any case, calm analysis is essential. Or rather, emotional judgments should be avoided."
        ],
        [
            "彼は", "かれは", "he",
            "忙しいのはおろか", "", "not just busy",
            "休む", "やすむ", "rest",
            "暇さえもない", "ひまさえもない", "has no time to",
            "ただ", "", "nothing but",
            "仕事に", "しごとに", "work",
            "追われるのみだ", "おわれるのみだ", "be overwhelmed with",
            "He is not just busy, but he has no time to rest at all. He can do nothing but be overwhelmed with work."
        ],
        [
            "このプロジェクトが", "このプロジェクトが", "this project",
            "難しいのはさておき", "", "setting aside how difficult",
            "時間の", "じかんの", "time",
            "制約が", "せいやくが", "constraints",
            "大きな", "おおきな", "major",
            "問題だ", "もんだいだ", "issue",
            "とりあえず", "", "for now",
            "計画を", "けいかくを", "plan",
            "見直さなければならない", "みなおさなければならない", "need to review",
            "Setting aside how difficult this project is, the time constraints are a major issue. For now, we need to review the plan."
        ],
        [
            "彼の", "かれの", "his",
            "演説は", "えんぜつは", "speech",
            "感動的だったが", "かんどうてきだったが", "was moving, but",
            "内容が", "ないようが", "content",
            "浅いのはさておき", "", "setting aside the shallow",
            "といわず", "", "not to mention",
            "論理的な", "ろんりてきな", "logical",
            "説明も", "せつめいも", "explanation",
            "不足していた", "ふそくしていた", "lacked",
            "His speech was moving, but setting aside the shallow content, it lacked logical explanation, not to mention."
        ],
        [
            "この問題は", "このもんだいは", "this problem",
            "非常に", "ひじょうに", "extremely",
            "複雑で", "ふくざつで", "complex",
            "解決するのは", "かいけつするのは", "to solve",
            "難しい", "むずかしい", "difficult",
            "といわず", "", "not just",
            "達成するのは", "たっせいするのは", "to achieve",
            "ほぼ", "ほぼ", "almost",
            "不可能だ", "ふかのうだ", "impossible",
            "と言えます", "といえます", "can say",
            "ただの", "", "just",
            "問題ではありません", "もんだいではありません", "is not a problem",
            "This problem is extremely complex; not just 'difficult to solve,' but 'almost impossible to achieve.' It's not just a problem."
        ],
        [
            "彼は", "かれは", "he",
            "言葉を", "ことばを", "words",
            "失うこともなく", "うしなうこともなく", "without losing",
            "冷静に", "れいせいに", "calmly",
            "対処したが", "たいしょしたが", "dealt with it, but",
            "それでも", "それでも", "still",
            "解決できなかった", "かいけつできなかった", "couldn't solve",
            "といわず", "", "not just",
            "誰も", "だれも", "no one",
            "この問題には", "このもんだいには", "for this problem",
            "手をこまねく", "てをこまねく", "seems to have a solution",
            "ばかりだ", "", "only",
            "He dealt with it calmly, without losing his words, but still couldn't solve it. Not just him, but no one seems to have a solution for this problem."
        ],
        [
            "予算の", "よさんの", "budget",
            "制約は", "せいやくは", "constraints",
            "わかるが", "わかるが", "understand, but",
            "機材の", "きざいの", "equipment",
            "不足は", "ふそくは", "lack of",
            "さておき", "", "setting aside",
            "人手が", "ひとでが", "staff",
            "足りないのは", "たりないのは", "shortage of",
            "問題だ", "もんだいだ", "is a problem",
            "ただ", "", "nothing but",
            "追加の", "ついかの", "additional",
            "スタッフを", "スタッフを", "staff",
            "雇うのみだ", "やとうのみだ", "hire",
            "I understand the budget constraints, but setting aside the lack of equipment, the shortage of staff is a problem. We can do nothing but hire additional staff."
        ],
        [
            "この計画が", "このけいかくが", "this plan",
            "成功するかどうかは", "せいこうするかどうかは", "whether succeeds or not",
            "今後の", "こんごの", "future",
            "努力", "どりょく", "efforts",
            "次第だ", "しだいだ", "depends on",
            "はおろか", "", "let alone",
            "実行に", "じっこうに", "implementing",
            "移すのも", "うつすのも", "to",
            "難しい", "むずかしい", "difficult",
            "Whether this plan succeeds or not depends on future efforts. Let alone implementing it, it's even difficult to start."
        ],
        [
            "仕事の", "しごとの", "work",
            "進捗が", "しんちょくが", "progress",
            "遅いのは", "おそいのは", "is slow",
            "とても", "とても", "very",
            "悔しいが", "くやしいが", "frustrating, but",
            "チームの", "チームの", "team",
            "協力が", "きょうりょくが", "cooperation",
            "欠けているのは", "かけているのは", "lacking",
            "さておき", "", "setting aside",
            "個々の", "ここの", "individual",
            "努力が", "どりょくが", "efforts",
            "不足している", "ふそくしている", "insufficient",
            "ただの", "", "nothing but",
            "言い訳に過ぎない", "いいわけにすぎない", "an excuse",
            "The slow progress of work is very frustrating, but setting aside the lack of team cooperation, individual efforts are insufficient. It's nothing but an excuse."
        ],
        [
            "彼女は", "かのじょは", "she",
            "すべての", "すべての", "all",
            "意見に", "いけんに", "opinions",
            "耳を傾けるが", "みみをかたむけるが", "listens to, but",
            "反対意見を", "はんたいいけんを", "opposing views",
            "受け入れるのは", "うけいれるのは", "accepting",
            "難しい", "むずかしい", "difficult",
            "はさておき", "", "setting that aside",
            "自分の", "じぶんの", "her own",
            "考えを", "かんがえを", "thoughts",
            "押し通すのみだ", "おしとおすのみだ", "push through",
            "She listens to all opinions, but accepting opposing views is difficult. Setting that aside, she can do nothing but push through her own thoughts."
        ],
        [
            "プロジェクトの", "プロジェクトの", "project's",
            "成功は", "せいこうは", "success",
            "見込めないが", "みこめないが", "not expected, but",
            "努力する", "どりょくする", "to make effort",
            "価値が", "かちが", "worth",
            "ないわけではない", "", "doesn't mean it's not",
            "といわず", "", "not just that",
            "何しろ", "", "after all",
            "最後まで", "さいごまで", "until the end",
            "頑張るべきだ", "がんばるべきだ", "should strive",
            "The project's success is not expected, but that doesn't mean it's not worth the effort. Not just that, but after all, we should strive until the end."
        ],
        [
            "この結果は", "このけっかは", "this result",
            "過去の", "かこの", "past",
            "データに", "データに", "data",
            "照らして", "てらして", "in comparison with",
            "およそ", "", "totally",
            "予想外だった", "よそうがいだった", "unexpected",
            "ただ", "", "however",
            "次の", "つぎの", "next",
            "ステップに", "ステップに", "step",
            "進むには", "すすむには", "to move on",
            "新しい", "あたらしい", "new",
            "戦略を", "せんりゃくを", "strategy",
            "取り入れる", "とりいれる", "incorporate",
            "必要がある", "ひつようがある", "necessary",
            "This result, in comparison with past data, was totally unexpected. However, to move on to the next step, it's necessary to incorporate a new strategy."
        ],
        [
            "彼は", "かれは", "he",
            "試練を", "しれんを", "trials",
            "ものともせず", "", "in defiance of",
            "困難を", "こんなんを", "difficulties",
            "乗り越えて", "のりこえて", "overcoming",
            "成功を", "せいこうを", "success",
            "手にしました", "てにしました", "achieved",
            "これをおいて", "", "other than this",
            "彼の", "かれの", "his",
            "努力に", "どりょくに", "efforts",
            "敬意を表します", "けいいをひょうします", "pay respect",
            "He, in defiance of trials and overcoming difficulties, achieved success. Other than this, we pay respect to his efforts."
        ],
        [
            "プロジェクトは", "プロジェクトは", "project",
            "大きな", "おおきな", "major",
            "変更を", "へんこうを", "changes",
            "経て", "へて", "having gone through",
            "新しい", "あたらしい", "new",
            "目標に", "もくひょうに", "goals",
            "向かって", "むかって", "towards",
            "進行中です", "しんこうちゅうです", "is progressing",
            "を踏まえて", "", "based on this",
            "現在の", "げんざいの", "current",
            "計画を", "けいかくを", "plan",
            "見直さなければなりません", "みなおさなければなりません", "must review",
            "The project, having gone through major changes, is now progressing towards new goals. Based on this, we must review the current plan."
        ],
        [
            "会社の", "かいしゃの", "company's",
            "方針を", "ほうしんを", "policy",
            "おいて", "", "setting aside",
            "従業員の", "じゅうぎょういんの", "employees'",
            "意見を", "いけんを", "opinions",
            "踏まえて", "ふまえて", "based on",
            "新しい", "あたらしい", "new",
            "ルールを", "ルールを", "rules",
            "制定する", "せいていする", "establish",
            "必要があります", "ひつようがあります", "necessary",
            "これをいいことに", "", "taking advantage of this",
            "効率を", "こうりつを", "efficiency",
            "改善する", "かいぜんする", "improve",
            "チャンスです", "チャンスです", "opportunity",
            "Setting aside the company's policy, based on employees' opinions, it is necessary to establish new rules. Taking advantage of this, it's an opportunity to improve efficiency."
        ],
        [
            "彼の", "かれの", "his",
            "提案は", "ていあんは", "proposal",
            "実現が", "じつげんが", "implementing",
            "難しい", "むずかしい", "difficult",
            "といわれていたが", "", "was said to be, but",
            "その困難を", "そのこんなんを", "that difficulty",
            "ものともせず", "", "in defiance of",
            "努力の末に", "どりょくのすえに", "through effort",
            "成功を", "せいこうを", "success",
            "収めました", "おさめました", "achieved",
            "これをもって", "", "at the time",
            "新しい", "あたらしい", "new",
            "方向性が", "ほうこうせいが", "direction",
            "見えてきました", "みえてきました", "has emerged",
            "His proposal was said to be difficult to implement, but in defiance of that difficulty and through effort, he achieved success. At the time, a new direction has emerged."
        ],
        [
            "私たちは", "わたしたちは", "we",
            "厳しい", "きびしい", "strict",
            "条件を", "じょうけんを", "conditions",
            "経て", "へて", "after going through",
            "最終的に", "さいしゅうてきに", "finally",
            "この契約を", "このけいやくを", "this contract",
            "締結しました", "ていけつしました", "concluded",
            "これをおいて", "", "other than this",
            "他の", "ほかの", "other",
            "オプションを", "オプションを", "options",
            "検討する", "けんとうする", "consider",
            "余地が", "よちが", "room",
            "ありません", "ありません", "there is no",
            "After going through strict conditions, we finally concluded this contract. Other than this, there is no room to consider other options."
        ],
        [
            "彼女は", "かのじょは", "she",
            "周囲の", "しゅういの", "surrounding",
            "批判を", "ひはんを", "criticism",
            "ものともせず", "", "in defiance of",
            "自分の", "じぶんの", "her",
            "信念を", "しんねんを", "beliefs",
            "貫いた", "つらぬいた", "adhered to",
            "その結果として", "", "as a result",
            "プロジェクトが", "プロジェクトが", "project",
            "成功しました", "せいこうしました", "succeeded",
            "およそ", "", "totally",
            "彼女の", "かのじょの", "her",
            "努力が", "どりょくが", "efforts",
            "実を結びました", "みをむすびました", "bore fruit",
            "She, in defiance of the surrounding criticism, adhered to her beliefs. As a result, the project succeeded. Totally, her efforts bore fruit."
        ],
        [
            "この方法は", "このほうほうは", "this method",
            "過去の", "かこの", "past",
            "実績を", "じっせきを", "achievements",
            "踏まえて", "ふまえて", "based on",
            "最も", "もっとも", "most",
            "効果的である", "こうかてきである", "effective",
            "とされています", "", "is considered",
            "これをもって", "", "by means of this",
            "次の", "つぎの", "next",
            "プロジェクトを", "プロジェクトを", "project",
            "進めるべきです", "すすめるべきです", "should proceed",
            "Based on past achievements, this method is considered the most effective. By means of this, we should proceed with the next project."
        ],
        [
            "この方法は", "このほうほうは", "this method",
            "過去の実績を", "かこのじっせきを", "past achievements",
            "踏まえて", "ふまえて", "based on",
            "最も効果的である", "もっともこうかてきである", "is the most effective",
            "とされています", "", "is considered to be",
            "これをもって", "", "by means of this",
            "次のプロジェクトを", "つぎのぷろじぇくとを", "next project",
            "進めるべきです", "すすめるべきです", "should proceed with",
            "Based on past achievements, this method is considered the most effective. By means of this, we should proceed with the next project."
        ],
        [
            "規制の変更を", "きせいのへんこうを", "regulatory changes",
            "経て", "へて", "after",
            "企業の運営方針も", "きぎょうのうんえいほうしんも", "company's operational policies",
            "見直されました", "みなおされました", "have been reviewed",
            "これをいいことに", "", "taking advantage of this",
            "新しいビジネスモデルを", "あたらしいびじねすもでるを", "new business model",
            "導入する", "どうにゅうする", "to introduce",
            "予定です", "よていです", "plan to",
            "After the regulatory changes, the company's operational policies have also been reviewed. Taking advantage of this, we plan to introduce a new business model."
        ],
        [
            "外部の意見に", "がいぶのいけんに", "external opinions",
            "照らして", "てらして", "in light of",
            "内部の方針を", "ないぶのほうしんを", "internal policies",
            "見直す", "みなおす", "to review",
            "必要があります", "ひつようがあります", "it is necessary",
            "これを踏まえて", "これをふまえて", "based on this",
            "新しい戦略を", "あたらしいせんりゃくを", "new strategy",
            "立てるべきです", "たてるべきです", "should formulate",
            "In light of external opinions, it is necessary to review the internal policies. Based on this, we should formulate a new strategy."
        ],
        [
            "この問題が", "このもんだいが", "this problem",
            "解決できる", "かいけつできる", "can solve",
            "と思っていたが", "とおもっていたが", "I thought",
            "てっきり", "", "surely",
            "それなりに", "", "some",
            "試行錯誤しても", "しこうさくごしても", "even with trial and error",
            "どうにもならない", "", "it's no use",
            "と気づきました", "ときづきました", "I realized",
            "I thought I could solve this problem, but I surely realized that, even with some trial and error, it's no use."
        ],
        [
            "新しいプロジェクトが", "あたらしいぷろじぇくとが", "new project",
            "順調に進むか", "じゅんちょうにすすむか", "would progress smoothly",
            "と思いきや", "とおもいきや", "I thought",
            "てっきり", "", "certainly",
            "それなりに", "", "some",
            "努力しても", "どりょくしても", "even with effort",
            "始まらない", "はじまらない", "it's no use",
            "と分かりました", "とわかりました", "I realized",
            "I thought the new project would progress smoothly, but I certainly realized that, even with some effort, it's no use."
        ],
        [
            "結果を", "けっかを", "results",
            "待つのは", "まつのは", "waiting for",
            "いいとしても", "", "is fine",
            "てっきり", "", "surely",
            "時間が経てば", "じかんがたてば", "as time passes",
            "状況が変わる", "じょうきょうがかわる", "situation would change",
            "と思ったが", "とおもったが", "I thought",
            "でも差し支えない", "でもさしつかえない", "it's okay if it doesn't",
            "Waiting for the results is fine, but I surely thought that as time passes the situation would change, and it's okay if it doesn't."
        ],
        [
            "この計画が", "このけいかくが", "this plan",
            "うまくいかないのは", "うまくいかないのは", "won't work out",
            "それなりに", "", "some",
            "努力しても", "どりょくしても", "even with effort",
            "どうにもならない", "", "it's no use",
            "と理解しました", "とりかいしました", "I understood",
            "It's understood that this plan won't work out, even with some effort, and I realized it's no use."
        ],
        [
            "彼の意見は", "かれのいけんは", "his opinion",
            "参考になる", "さんこうになる", "would be useful",
            "と思っていたが", "とおもっていたが", "I thought",
            "てっきり", "", "surely",
            "それなりに", "", "some",
            "話し合っても", "はなしあっても", "even with discussion",
            "始まらない", "はじまらない", "it's no use",
            "と分かりました", "とわかりました", "I realized",
            "I thought his opinion would be useful, but I surely realized that, even with some discussion, it's no use."
        ],
        [
            "提案を", "ていあんを", "proposal",
            "受け入れるかどうか", "うけいれるかどうか", "whether to accept",
            "悩んでいたが", "なやんでいたが", "I was struggling",
            "てっきり", "", "certainly",
            "それなりに", "", "some",
            "考えても", "かんがえても", "even after thinking",
            "決められない", "きめられない", "can't decide",
            "と気づきました", "ときづきました", "I realized",
            "I was struggling with whether to accept the proposal, but I certainly realized that, even after thinking about it, I can't decide."
        ],
        [
            "このプロジェクトを", "このぷろじぇくとを", "this project",
            "成功させるためには", "せいこうさせるためには", "to make successful",
            "それなりに", "", "some",
            "努力しなければならない", "どりょくしなければならない", "it is necessary to make effort",
            "が", "", "but",
            "できなければ", "", "if it can't be done",
            "どうにもならない", "", "it's no use",
            "To make this project successful, it is necessary to make some effort, but if it can't be done, it's no use."
        ],
        [
            "問題が", "もんだいが", "issue",
            "解決しないままでは", "かいけつしないままでは", "without resolving",
            "てっきり", "", "surely",
            "それなりに", "", "some",
            "時間をかけても", "じかんをかけても", "even with time invested",
            "始まらない", "はじまらない", "it's no use",
            "と考えました", "とかんがえました", "I thought",
            "Without resolving the issue, I surely thought that, even with some time invested, it's no use."
        ],
        [
            "彼女の提案が", "かのじょのていあんが", "her proposal",
            "不可能だと", "ふかのうだと", "was impossible",
            "わかったが", "わかったが", "I found that",
            "それなりに", "", "some",
            "やってみても", "やってみても", "to try it out",
            "差し支えない", "さしつかえない", "it's okay",
            "と思いました", "とおもいました", "I thought",
            "I found that her proposal was impossible, but I thought that it's okay to try it out anyway."
        ],
        [
            "この計画は", "このけいかくは", "this plan",
            "進展しない", "しんてんしない", "wouldn't make progress",
            "と思っていたが", "とおもっていたが", "I thought",
            "てっきり", "", "certainly",
            "それなりに", "", "some",
            "試しても", "ためしても", "even with attempts",
            "どうにもならない", "", "it's no use",
            "と気づきました", "ときづきました", "I realized",
            "I thought this plan wouldn't make progress, but I certainly realized that, even with some attempts, it's no use."
        ],
        [
            "彼の提案は", "かれのていあんは", "his proposal",
            "革新的だ", "かくしんてきだ", "is innovative",
            "とみられるが", "", "is regarded as",
            "とみるや", "", "upon seeing it",
            "その実行に移すのは", "そのじっこうにうつすのは", "putting it into action",
            "難しい", "むずかしい", "is difficult",
            "とわかりました", "", "I realized",
            "His proposal is regarded as innovative, but upon seeing it, I realized that putting it into action is difficult."
        ],
        [
            "新しい政策が", "あたらしいせいさくが", "new policy",
            "発表された", "はっぴょうされた", "was announced",
            "とき", "", "when",
            "とみられる", "", "it was expected",
            "全てがスムーズに進む", "すべてがすむーずにすすむ", "everything would go smoothly",
            "と思いきや", "とおもいきや", "I thought",
            "問題が次々と", "もんだいがつぎつぎと", "problems one after another",
            "発生しました", "はっせいしました", "emerged",
            "When the new policy was announced, it was expected that everything would go smoothly, but I thought that, in reality, problems emerged one after another."
        ],
        [
            "彼が", "かれが", "he",
            "その役割を", "そのやくわりを", "that role",
            "引き受ける", "ひきうける", "to take on",
            "とみられる", "", "was expected",
            "とみるや", "", "upon seeing it",
            "実際には", "じっさいには", "actually",
            "辞退する", "じたいする", "to decline",
            "ことになった", "", "ended up",
            "とわかりました", "", "I realized",
            "He was expected to take on that role, but upon seeing it, I realized that he actually ended up declining."
        ],
        [
            "イベントが", "いべんとが", "event",
            "成功する", "せいこうする", "would be successful",
            "と思いきや", "とおもいきや", "I thought",
            "とみられる", "", "it was regarded as",
            "予想以上の", "よそういじょうの", "unforeseen",
            "課題が", "かだいが", "challenges",
            "発生しました", "はっせいしました", "emerged",
            "I thought the event would be successful, but it was regarded as having unforeseen challenges that emerged."
        ],
        [
            "彼の計画は", "かれのけいかくは", "his plan",
            "完璧だ", "かんぺきだ", "is perfect",
            "とみられるが", "", "is regarded as",
            "とみるや", "", "upon seeing it",
            "実際には", "じっさいには", "actually",
            "実行不可能である", "じっこうふかのうである", "is impractical",
            "とわかりました", "", "I realized",
            "His plan is regarded as perfect, but upon seeing it, I realized that it is actually impractical."
        ]
    ]
}