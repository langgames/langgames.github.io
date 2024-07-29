'use strict';

// Game objects
let gameState = 'menu'
let words = [];
let currentWord = '';
let lastCorrectWord = null
let score = 0;
let gameOver = false;
let levelSize;
let failedWords = [];
const maxFailedWords = 3;
let flashingWord = null;
let flashStartTime = 0;
const flashDuration = 3; // seconds

let hpBar = null
let mainMenu = null
let pauseMenu = null

// Game settings
const wordSpeed = 0.02;
const spawnInterval = 3; // seconds
let lastSpawnTime = 0;

const sound_correct = new Sound([.5, .5]);
const sound_wrong = new Sound([1, .5, .1], 0, .1, 1, .1, .4);
const sound_spawn = new Sound([.2, .2]);
const sound_victory = new Sound([.5, .5, 110, , , .7, 1, 1.5, , , , , .5, , , , , .5, .1]);
const sound_zoom = new Sound([, , 512, 0.01, 0.09, 0.17, , 1.13, , , , , , 1.1, , 0.1, , , 1]);

const textLineWidth = 0.2
const lineColor = new Color().setHex('#222222')
const primary = new Color().setHex('#f0d0b0')
const danger = new Color().setHex('#f87858')

///////////////////////////////////////////////////////////////////////////////
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
        drawText(this.text, this.pos, textSize, hsl(0, 0, 1), .1);

        // Button border
        drawRect(this.pos, this.size, hsl(0.6, 0.3, 0.4), .1);
    }
}

///////////////////////////////////////////////////////////////////////////////
const MAX_WORDS_AT_A_TIME = 5
function getUnusedWords() {
    // first 5
    return kanjiWordList.filter(word => !word.used).slice(0, MAX_WORDS_AT_A_TIME);
}

///////////////////////////////////////////////////////////////////////////////
class Word extends EngineObject {
    constructor(wordObj) {
        const minX = 10;
        const maxX = levelSize.x - 10;
        const pos = vec2(rand(minX, maxX), levelSize.y + 1);
        super(pos);

        this.kanji = wordObj.kanji;
        this.reading = wordObj.reading;
        this.definition = wordObj.definition;
        this.color = primary;

        this.paused = false

        sound_spawn.play(this.pos);
    }

    update() {
        if (!this.paused) {
            this.pos.y -= wordSpeed;
        }

        if (this.pos.y < 0) {
            this.destroy();
            loseLife(this);
            createParticles(this.pos, danger);
        }
    }

    render() {
        if (!this.paused) {
            drawText(this.kanji, this.pos, 1.5, this.color, textLineWidth, lineColor);
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
function startGame() {
    mainMenu.hide();
    restartGame()
}

function pauseGame() {
    gameState = 'paused';

    words.forEach(w => w.paused = true)

    pauseMenu.show();
}

function resumeGame() {
    gameState = 'playing';

    words.forEach(w => w.paused = false)

    pauseMenu.hide();
}

function restartGame() {
    // Implement restart logic
    gameState = 'playing';
    pauseMenu.hide();

    words.forEach(w => w.destroy());
    words = [];
    currentWord = '';
    score = 0;
    lastCorrectWord = null;
    gameOver = false;
    lastSpawnTime = time;
    kanjiWordList.forEach(word => word.used = false);
    failedWords = [];
    flashingWord = null;
}

function showMainMenu() {
    gameState = 'menu';
    pauseMenu.hide();
    mainMenu.show();
    // Implement any necessary game reset logic
}

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
    canvasFixedSize = vec2(1280, 720); // 720p
    levelSize = vec2(38, 20);
    cameraPos = levelSize.scale(.5);

    hpBar = new HPBar(vec2(levelSize.x - 5, levelSize.y - 1), vec2(10, 1), 100);

    // Create main menu
    mainMenu = new Menu(cameraPos, vec2(20, 14), 'FUJI DROP');
    for (const key of Object.keys(kanjiListObj)) {
        mainMenu.addButton(key.replace('_', ' ').toUpperCase(), () => {
            kanjiWordList = kanjiListObj[key]
            startGame()
        });
    }

    // Create pause menu
    pauseMenu = new Menu(cameraPos, vec2(16, 12));
    pauseMenu.columns = 1
    pauseMenu.addButton('Resume', resumeGame);
    pauseMenu.addButton('Restart', restartGame);
    pauseMenu.addButton('Main Menu', showMainMenu);
    pauseMenu.hide();  // Start with pause menu hidden

    initPostProcess()
}
///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
    if (gameState === 'menu') {
        mainMenu.update()
    } else if (gameState === 'playing') {
        gameInputUpdate()
        if (gameOver) return;

        // Spawn new words
        if (words.length === 0 || time - lastSpawnTime > spawnInterval) {
            spawnWord();
            lastSpawnTime = time;
        }

        // Check for completed words
        if (currentWord) {
            const matchedWord = words.find(w => w.reading === currentWord);
            if (matchedWord) {
                const kanjiWord = kanjiWordList.find(k => k.kanji === matchedWord.kanji && k.reading === matchedWord.reading)
                if (kanjiWord) {
                    lastCorrectWord = kanjiWord
                }

                matchedWord.destroy();
                words = words.filter(w => w !== matchedWord);
                score += matchedWord.reading.length;
                currentWord = '';

                hpBar.addHP(10)

                wordRemovedEffect(matchedWord.pos);
            }
        }
    } else if (gameState === 'paused') {
        pauseMenu.update()
    }
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {
    if (gameState === 'playing') {
        // Remove destroyed words from the array
        words = words.filter(w => {
            if (w.destroyed) {
                // Reset the 'used' property for missed words
                const kanjiWord = kanjiWordList.find(kw => kw.kanji === w.kanji);
                if (kanjiWord) kanjiWord.used = false;
                return false;
            }
            return true;
        });

        // Clear flashing word after duration
        if (flashingWord && time - flashStartTime >= flashDuration) {
            flashingWord = null;
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
function gameRender() {
    // Draw background
    drawRect(cameraPos, levelSize.scale(2), new Color(.1, .1, .1));
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
    if (gameState === 'menu') {
        mainMenu.render()
    }
    else if (gameState === 'playing') {
        // ... (existing game render code)
        // Render UI
        drawText('Score: ' + score, vec2(5, levelSize.y - 1), undefined, primary);
        drawText(currentWord, vec2(levelSize.x / 2, 1), 1.2, primary, textLineWidth, lineColor);

        // Display remaining words
        const unusedWords = getUnusedWords();
        unusedWords.forEach((word, index) => {
            drawText(word.kanji, vec2(levelSize.x - 5, levelSize.y - 3 - index * 2.0), 1.5, primary, textLineWidth, lineColor);
        });

        // Display failed words list
        failedWords.forEach((word, index) => {
            const pos = vec2(5, levelSize.y - 3 - index * 5);
            drawText(word.kanji, pos, 1.0, primary, textLineWidth, lineColor);
            drawText(word.reading, pos.add(vec2(0, -1.0)), 0.8, primary, textLineWidth, lineColor);
            drawText(word.definition, pos.add(vec2(0, -2.0)), 0.8, primary, textLineWidth, lineColor);
        });

        if (lastCorrectWord) {
            const len = lastCorrectWord.kanji.length + lastCorrectWord.definition.length
            drawText(lastCorrectWord.kanji, vec2(5, 2), 0.8, primary, textLineWidth)
            drawText(lastCorrectWord.definition, vec2(5, 1), 0.8, primary, textLineWidth)
        }


        if (gameOver) {
            if (unusedWords.length === 0) {
                drawText('You Win!', cameraPos, 1.5, primary);
            } else {
                drawText('Game Over!', cameraPos, 1.5, primary);
            }
            drawText('Press Space to Restart', cameraPos.add(vec2(0, -2)), 0.75, primary);
        }

        if (flashingWord && time - flashStartTime < flashDuration) {
            const progress = (time - flashStartTime) / flashDuration;
            const size = lerp(0.5, 5, progress);
            drawText(flashingWord.reading, cameraPos, size, danger, 0.5);
        }

        new Button(vec2(levelSize.x - 5, 1), vec2(3, 1), 'Pause', pauseGame)
    } else if (gameState === 'paused') {
        pauseMenu.render()
    }
}

function randElement(list) {
    return list[Math.floor(Math.random() * list.length)]
}

///////////////////////////////////////////////////////////////////////////////
function spawnWord() {
    const unusedWords = getUnusedWords();
    if (unusedWords.length === 0) {
        // no words are falling
        if (words.length === 0) {
            victoryEffect();
            gameOver = true;
        }
        return;
    }
    const wordObj = randElement(unusedWords);
    wordObj.used = true;
    words.push(new Word(wordObj));
}

///////////////////////////////////////////////////////////////////////////////
function loseLife(missedWord) {
    words.forEach(w => {
        createParticles(w.pos, danger);
        w.destroy();
    });

    hpBar.removeHP(20)

    flashingWord = missedWord;
    flashStartTime = time;
    sound_wrong.play();
    sound_zoom.play();

    if (!failedWords.some(w => w.kanji === missedWord.kanji)) {
        failedWords.unshift({
            kanji: missedWord.kanji,
            reading: missedWord.reading,
            definition: missedWord.definition
        });
        if (failedWords.length > maxFailedWords) {
            failedWords.pop()
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
// Input handling
function gameInputUpdate() {
    if (gameOver) {
        if (keyWasPressed(32)) { // Space key
            restartGame();
        }
        return;
    }

    for (let i = 65; i <= 90; i++) { // A-Z keys
        if (keyWasPressed(i)) {
            const char = String.fromCharCode(i).toLowerCase();
            currentWord += char;
            convertToKana();
        }
    }

    if (keyWasPressed(189)) { // -
        const char = '-';
        currentWord += char;
        convertToKana();
    }

    if (keyWasPressed(8)) { // Backspace
        currentWord = currentWord.slice(0, -1);
    }
}

///////////////////////////////////////////////////////////////////////////////
function convertToKana() {
    let result = '';
    let buffer = '';
    for (let i = 0; i < currentWord.length; i++) {
        buffer += currentWord[i];

        // Check for small tsu (っ)
        if (buffer.length === 2 &&
            buffer[0] === buffer[1] &&
            consonantStarts.includes(buffer[0])) {
            result += 'っ';
            buffer = buffer[1];
        }

        if (asciiToKana[buffer]) {
            result += asciiToKana[buffer];
            buffer = '';
        } else if (buffer.length === 3) {
            if (asciiToKana[buffer.slice(0, 2)]) {
                result += asciiToKana[buffer.slice(0, 2)];
                buffer = buffer[2];
            } else {
                result += buffer[0];
                buffer = buffer.slice(1);
            }
        } else if (buffer.length === 2 && !twoKanaStarts.includes(buffer)) {
            result += buffer[0];
            buffer = buffer[1];
        }
    }

    if (asciiToKana[buffer]) {
        result += asciiToKana[buffer];
    } else {
        result += buffer;
    }

    currentWord = result;
}

///////////////////////////////////////////////////////////////////////////////
function wordRemovedEffect(pos) {
    sound_correct.play(pos);
    createParticles(pos, visibleRandBlue());
}

///////////////////////////////////////////////////////////////////////////////
function initPostProcess() {
    const shader = `
    #define SPEED_FACTOR 0.5 // Adjust this value to control overall speed

    float dot2(in vec2 v ) { return dot(v,v); }

    float sdTrapezoid( in vec2 p, in float r1, float r2, float he )
    {
        vec2 k1 = vec2(r2,he);
        vec2 k2 = vec2(r2-r1,2.0*he);
        p.x = abs(p.x);
        vec2 ca = vec2(p.x-min(p.x,(p.y<0.0)?r1:r2), abs(p.y)-he);
        vec2 cb = p - k1 + k2*clamp( dot(k1-p,k2)/dot2(k2), 0.0, 1.0 );
        float s = (cb.x<0.0 && ca.y<0.0) ? -1.0 : 1.0;
        return s*sqrt( min(dot2(ca),dot2(cb)) );
    }

    float sdLine( in vec2 p, in vec2 a, in vec2 b )
    {
        vec2 pa = p-a, ba = b-a;
        float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
        return length( pa - ba*h );
    }

    float sdBox( in vec2 p, in vec2 b )
    {
        vec2 d = abs(p)-b;
        return length(max(d,vec2(0))) + min(max(d.x,d.y),0.0);
    }

    float opSmoothUnion(float d1, float d2, float k){
        float h = clamp(0.5 + 0.5 * (d2 - d1) /k,0.0,1.0);
        return mix(d2, d1 , h) - k * h * ( 1.0 - h);
    }

    float sdCloud(in vec2 p, in vec2 a1, in vec2 b1, in vec2 a2, in vec2 b2, float w)
    {
        //float lineVal1 = smoothstep(w - 0.0001, w, sdLine(p, a1, b1));
        float lineVal1 = sdLine(p, a1, b1);
        float lineVal2 = sdLine(p, a2, b2);
        vec2 ww = vec2(w*1.5, 0.0);
        vec2 left = max(a1 + ww, a2 + ww);
        vec2 right = min(b1 - ww, b2 - ww);
        vec2 boxCenter = (left + right) * 0.5;
        //float boxW = right.x - left.x;
        float boxH = abs(a2.y - a1.y) * 0.5;
        //float boxVal = sdBox(p - boxCenter, vec2(boxW, boxH)) + w;
        float boxVal = sdBox(p - boxCenter, vec2(0.04, boxH)) + w;
        
        float uniVal1 = opSmoothUnion(lineVal1, boxVal, 0.05);
        float uniVal2 = opSmoothUnion(lineVal2, boxVal, 0.05);
        
        return min(uniVal1, uniVal2);
    }

    float sun(vec2 uv, float battery)
    {
        float val = smoothstep(0.3, 0.29, length(uv));
        float bloom = smoothstep(0.7, 0.0, length(uv));
        float cut = 3.0 * sin((uv.y + iTime * 0.1 * SPEED_FACTOR * (battery + 0.02)) * 100.0) 
                    + clamp(uv.y * 14.0 + 1.0, -6.0, 6.0);
        cut = clamp(cut, 0.0, 1.0);
        return clamp(val * cut, 0.0, 1.0) + bloom * 0.6;
    }

    float grid(vec2 uv, float battery)
    {
        vec2 size = vec2(uv.y, uv.y * uv.y * 0.2) * 0.01;
        uv += vec2(0.0, iTime * 2.0 * SPEED_FACTOR * (battery + 0.05));
        uv = abs(fract(uv) - 0.5);
        vec2 lines = smoothstep(size, vec2(0.0), uv);
        lines += smoothstep(size * 5.0, vec2(0.0), uv) * 0.4 * battery;
        return clamp(lines.x + lines.y, 0.0, 3.0);
    }

    void mainImage(out vec4 fragColor, in vec2 fragCoord)
    {
        vec2 uv = fragCoord / iResolution.xy;

        vec4 originalColor = texture(iChannel0, uv);

        vec2 p = (2.0 * uv - 1.0) * iResolution.xy / iResolution.y;
        float battery = 1.0;
        
        // Grid
        float fog = smoothstep(0.1, -0.02, abs(p.y + 0.2));
        vec3 col = vec3(0.0, 0.05, 0.1); // Darker blue base color
        if (p.y < -0.2)
        {
            p.y = 3.0 / (abs(p.y + 0.2) + 0.05);
            p.x *= p.y * 1.0;
            float gridVal = grid(p, battery);
            col = mix(col, vec3(0.0, 0.2, 0.4), gridVal); // Darker blue for grid
        }
        else
        {
            float fujiD = min(p.y * 4.5 - 0.5, 1.0);
            p.y -= battery * 1.1 - 0.51;
            
            vec2 sunUV = p;
            vec2 fujiUV = p;
            
            // Sun
            sunUV += vec2(0.75, 0.2);
            col = vec3(0.0, 0.1, 0.2); // Darker blue for sky
            float sunVal = sun(sunUV, battery);
            
            col = mix(col, vec3(0.0, 0.2, 0.4), sunUV.y * 2.0 + 0.2); // Gradient to slightly lighter blue
            col = mix(vec3(0.0, 0.05, 0.1), col, sunVal); // Mix with very dark blue
            
            // fuji
            float fujiVal = sdTrapezoid(p + vec2(-0.75+sunUV.y * 0.0, 0.5), 1.75 + pow(p.y * p.y, 2.1), 0.2, 0.5);
            float waveVal = p.y + sin(p.x * 20.0 + iTime * 0.5 * SPEED_FACTOR) * 0.05 + 0.2;
            float wave_width = smoothstep(0.0, 0.01, waveVal);
            
            col = mix(col, mix(vec3(0.0, 0.05, 0.1), vec3(0.0, 0.1, 0.2), fujiD), step(fujiVal, 0.0)); // Darker blue shades for Fuji
            col = mix(col, vec3(0.0, 0.15, 0.3), wave_width * step(fujiVal, 0.0)); // Slightly lighter blue for wave
            col = mix(col, vec3(0.0, 0.2, 0.4), 1.0 - smoothstep(0.0, 0.01, abs(fujiVal))); // Light blue for Fuji outline
            
            col += mix(col, mix(vec3(0.0, 0.1, 0.2), vec3(0.0, 0.05, 0.1), clamp(p.y * 3.5 + 3.0, 0.0, 1.0)), step(0.0, fujiVal)); // Gradient for sky
            
            // cloud
            vec2 cloudUV = p;
            cloudUV.x = mod(cloudUV.x + iTime * 0.02 * SPEED_FACTOR, 4.0) - 2.0;
            float cloudTime = iTime * 0.1 * SPEED_FACTOR;
            float cloudY = -0.5;
            float cloudVal1 = sdCloud(cloudUV, 
                                    vec2(0.1 + sin(cloudTime + 140.5)*0.1, cloudY), 
                                    vec2(1.05 + cos(cloudTime * 0.9 - 36.56) * 0.1, cloudY), 
                                    vec2(0.2 + cos(cloudTime * 0.867 + 387.165) * 0.1, 0.25+cloudY), 
                                    vec2(0.5 + cos(cloudTime * 0.9675 - 15.162) * 0.09, 0.25+cloudY), 0.075);
            cloudY = -0.6;
            float cloudVal2 = sdCloud(cloudUV, 
                                    vec2(-0.9 + cos(cloudTime * 1.02 + 541.75) * 0.1, cloudY), 
                                    vec2(-0.5 + sin(cloudTime * 0.9 - 316.56) * 0.1, cloudY), 
                                    vec2(-1.5 + cos(cloudTime * 0.867 + 37.165) * 0.1, 0.25+cloudY), 
                                    vec2(-0.6 + sin(cloudTime * 0.9675 + 665.162) * 0.09, 0.25+cloudY), 0.075);
            
            float cloudVal = min(cloudVal1, cloudVal2);
            
            col = mix(col, vec3(0.0, 0.05, 0.1), 1.0 - smoothstep(0.075 - 0.0001, 0.075, cloudVal)); // Darker blue for cloud interior
            col += vec3(0.0, 0.2, 0.4) * (1.0 - smoothstep(0.0, 0.01, abs(cloudVal - 0.075))); // Light blue for cloud edges
        }

        // Overlay original color (game objects) on top of shader effects
        // Adjust this threshold to match your background color/alpha
        float threshold = 0.1; // Example threshold, adjust as needed
        float objectMask = step(threshold, max(max(originalColor.r, originalColor.g), originalColor.b));
        
        // Blend the original color over the shader effect where objects are present
        col = mix(col, originalColor.rgb, objectMask);

        fragColor = vec4(col, 0.1);
    }
    `
    glInitPostProcess(shader, true);
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);

// ASCII to kana mapping (hiragana, including dakuten, handakuten, and compounds)
const asciiToKana = {
    'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
    'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
    'sa': 'さ', 'si': 'し', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
    'ta': 'た', 'ti': 'ち', 'tu': 'つ', 'te': 'て', 'to': 'と',
    'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
    'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'hu': 'ふ', 'he': 'へ', 'ho': 'ほ',
    'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
    'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
    'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
    'wa': 'わ', 'wo': 'を', 'nn': 'ん',
    'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
    'za': 'ざ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
    'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
    'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
    'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
    'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
    'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
    'sya': 'しゃ', 'syu': 'しゅ', 'syo': 'しょ',
    'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
    'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
    'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
    'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
    'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
    'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
    'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
    'jya': 'じゃ', 'jyu': 'じゅ', 'jyo': 'じょ',
    'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
    'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
    'ltu': 'っ',
    'chi': 'ち', 'tsu': 'つ',
    'ua': 'うぁ', 'ui': 'うぃ', 'ue': 'うぇ', 'uo': 'うぉ',
    'va': 'ゔぁ', 'vi': 'ゔぃ', 've': 'ゔぇ', 'vo': 'ゔぉ',
    'fa': 'ふぁ', 'fi': 'ふぃ', 'fe': 'ふぇ', 'fo': 'ふぉ',
    'la': 'ぁ', 'li': 'ぃ', 'lu': 'ぅ', 'le': 'ぇ', 'lo': 'ぉ',
    '-': 'ー',
};
const twoKanaStarts = ['ky', 'sh', 'sy', 'ch', 'ny', 'hy', 'my', 'ry', 'gy', 'jy', 'by', 'py', 'lt', 'ch', 'ts']
const consonantStarts = 'ksthmywgzdbp'

let kanjiWordList = null

const hiragana = [['あ', '"a"'], ['い', '"i"'], ['う', '"u"'], ['え', '"e"'], ['お', '"o"'], ['か', '"ka"'], ['き', '"ki"'], ['く', '"ku"'], ['け', '"ke"'], ['こ', '"ko"'], ['さ', '"sa"'], ['し', '"shi"'], ['す', '"su"'], ['せ', '"se"'], ['そ', '"so"'], ['た', '"ta"'], ['ち', '"chi"'], ['つ', '"tsu"'], ['て', '"te"'], ['と', '"to"'], ['な', '"na"'], ['に', '"ni"'], ['ぬ', '"nu"'], ['ね', '"ne"'], ['の', '"no"'], ['は', '"ha"'], ['ひ', '"hi"'], ['ふ', '"fu"'], ['へ', '"he"'], ['ほ', '"ho"'], ['ま', '"ma"'], ['み', '"mi"'], ['む', '"mu"'], ['め', '"me"'], ['も', '"mo"'], ['や', '"ya"'], ['ゆ', '"yu"'], ['よ', '"yo"'], ['ら', '"ra"'], ['り', '"ri"'], ['る', '"ru"'], ['れ', '"re"'], ['ろ', '"ro"'], ['わ', '"wa"'], ['を', '"wo"'], ['ん', '"n"'], ['が', '"ga"'], ['ぎ', '"gi"'], ['ぐ', '"gu"'], ['げ', '"ge"'], ['ご', '"go"'], ['ざ', '"za"'], ['じ', '"ji"'], ['ず', '"zu"'], ['ぜ', '"ze"'], ['ぞ', '"zo"'], ['だ', '"da"'], ['ぢ', '"ji"'], ['づ', '"zu"'], ['で', '"de"'], ['ど', '"do"'], ['ば', '"ba"'], ['び', '"bi"'], ['ぶ', '"bu"'], ['べ', '"be"'], ['ぼ', '"bo"'], ['ぱ', '"pa"'], ['ぴ', '"pi"'], ['ぷ', '"pu"'], ['ぺ', '"pe"'], ['ぽ', '"po"'], ['きゃ', '"kya"'], ['きゅ', '"kyu"'], ['きょ', '"kyo"'], ['しゃ', '"sha"'], ['しゅ', '"shu"'], ['しょ', '"sho"'], ['ちゃ', '"cha"'], ['ちゅ', '"chu"'], ['ちょ', '"cho"'], ['にゃ', '"nya"'], ['にゅ', '"nyu"'], ['にょ', '"nyo"'], ['ひゃ', '"hya"'], ['ひゅ', '"hyu"'], ['ひょ', '"hyo"'], ['みゃ', '"mya"'], ['みゅ', '"myu"'], ['みょ', '"myo"'], ['りゃ', '"rya"'], ['りゅ', '"ryu"'], ['りょ', '"ryo"'], ['ぎゃ', '"gya"'], ['ぎゅ', '"gyu"'], ['ぎょ', '"gyo"'], ['じゃ', '"ja"'], ['じゅ', '"ju"'], ['じょ', '"jo"'], ['びゃ', '"bya"'], ['びゅ', '"byu"'], ['びょ', '"byo"'], ['ぴゃ', '"pya"'], ['ぴゅ', '"pyu"'], ['ぴょ', '"pyo"'],
].map(([kana, pronunciation]) => ({ kanji: kana, reading: kana, definition: pronunciation, used: false }));

const katakana = [['ア', 'あ', 'a'], ['イ', 'い', 'i'], ['ウ', 'う', 'u'], ['エ', 'え', 'e'], ['オ', 'お', 'o'], ['カ', 'か', 'ka'], ['キ', 'き', 'ki'], ['ク', 'く', 'ku'], ['ケ', 'け', 'ke'], ['コ', 'こ', 'ko'], ['サ', 'さ', 'sa'], ['シ', 'し', 'shi'], ['ス', 'す', 'su'], ['セ', 'せ', 'se'], ['ソ', 'そ', 'so'], ['タ', 'た', 'ta'], ['チ', 'ち', 'chi'], ['ツ', 'つ', 'tsu'], ['テ', 'て', 'te'], ['ト', 'と', 'to'], ['ナ', 'な', 'na'], ['ニ', 'に', 'ni'], ['ヌ', 'ぬ', 'nu'], ['ネ', 'ね', 'ne'], ['ノ', 'の', 'no'], ['ハ', 'は', 'ha'], ['ヒ', 'ひ', 'hi'], ['フ', 'ふ', 'fu'], ['ヘ', 'へ', 'he'], ['ホ', 'ほ', 'ho'], ['マ', 'ま', 'ma'], ['ミ', 'み', 'mi'], ['ム', 'む', 'mu'], ['メ', 'め', 'me'], ['モ', 'も', 'mo'], ['ヤ', 'や', 'ya'], ['ユ', 'ゆ', 'yu'], ['ヨ', 'よ', 'yo'], ['ラ', 'ら', 'ra'], ['リ', 'り', 'ri'], ['ル', 'る', 'ru'], ['レ', 'れ', 're'], ['ロ', 'ろ', 'ro'], ['ワ', 'わ', 'wa'], ['ヲ', 'を', 'wo'], ['ン', 'ん', 'n'], ['ガ', 'が', 'ga'], ['ギ', 'ぎ', 'gi'], ['グ', 'ぐ', 'gu'], ['ゲ', 'げ', 'ge'], ['ゴ', 'ご', 'go'], ['ザ', 'ざ', 'za'], ['ジ', 'じ', 'ji'], ['ズ', 'ず', 'zu'], ['ゼ', 'ぜ', 'ze'], ['ゾ', 'ぞ', 'zo'], ['ダ', 'だ', 'da'], ['ヂ', 'ぢ', 'ji'], ['ヅ', 'づ', 'zu'], ['デ', 'で', 'de'], ['ド', 'ど', 'do'], ['バ', 'ば', 'ba'], ['ビ', 'び', 'bi'], ['ブ', 'ぶ', 'bu'], ['ベ', 'べ', 'be'], ['ボ', 'ぼ', 'bo'], ['パ', 'ぱ', 'pa'], ['ピ', 'ぴ', 'pi'], ['プ', 'ぷ', 'pu'], ['ペ', 'ぺ', 'pe'], ['ポ', 'ぽ', 'po'], ['キャ', 'きゃ', 'kya'], ['キュ', 'きゅ', 'kyu'], ['キョ', 'きょ', 'kyo'], ['シャ', 'しゃ', 'sha'], ['シュ', 'しゅ', 'shu'], ['ショ', 'しょ', 'sho'], ['チャ', 'ちゃ', 'cha'], ['チュ', 'ちゅ', 'chu'], ['チョ', 'ちょ', 'cho'], ['ニャ', 'にゃ', 'nya'], ['ニュ', 'にゅ', 'nyu'], ['ニョ', 'にょ', 'nyo'], ['ヒャ', 'ひゃ', 'hya'], ['ヒュ', 'ひゅ', 'hyu'], ['ヒョ', 'ひょ', 'hyo'], ['ミャ', 'みゃ', 'mya'], ['ミュ', 'みゅ', 'myu'], ['ミョ', 'みょ', 'myo'], ['リャ', 'りゃ', 'rya'], ['リュ', 'りゅ', 'ryu'], ['リョ', 'りょ', 'ryo'], ['ギャ', 'ぎゃ', 'gya'], ['ギュ', 'ぎゅ', 'gyu'], ['ギョ', 'ぎょ', 'gyo'], ['ジャ', 'じゃ', 'ja'], ['ジュ', 'じゅ', 'ju'], ['ジョ', 'じょ', 'jo'], ['ビャ', 'びゃ', 'bya'], ['ビュ', 'びゅ', 'byu'], ['ビョ', 'びょ', 'byo'], ['ピャ', 'ぴゃ', 'pya'], ['ピュ', 'ぴゅ', 'pyu'], ['ピョ', 'ぴょ', 'pyo'], ['ウァ', 'うぁ', 'ua'], ['ウィ', 'うぃ', 'ui'], ['ウェ', 'うぇ', 'ue'], ['ウォ', 'うぉ', 'uo'], ['ヴァ', 'ゔぁ', 'va'], ['ヴィ', 'ゔぃ', 'vi'], ['ヴェ', 'ゔぇ', 've'], ['ヴォ', 'ゔぉ', 'vo']
].map(([kana, reading, pronunciation]) => ({ kanji: kana, reading, definition: pronunciation, used: false }));

const animals = [['犬', 'いぬ', 'dog'], ['猫', 'ねこ', 'cat'], ['鳥', 'とり', 'bird'], ['魚', 'さかな', 'fish'], ['馬', 'うま', 'horse'], ['牛', 'うし', 'cow'], ['豚', 'ぶた', 'pig'], ['羊', 'ひつじ', 'sheep'], ['鹿', 'しか', 'deer'], ['熊', 'くま', 'bear'], ['猿', 'さる', 'monkey'], ['兎', 'うさぎ', 'rabbit'], ['狼', 'おおかみ', 'wolf'], ['狐', 'きつね', 'fox'], ['象', 'ぞう', 'elephant'], ['虎', 'とら', 'tiger'], ['ライオン', 'らいおん', 'lion'], ['チーター', 'ちーたー', 'cheetah'], ['キリン', 'きりん', 'giraffe'], ['カンガルー', 'かんがるー', 'kangaroo'], ['パンダ', 'ぱんだ', 'panda'], ['コアラ', 'こあら', 'koala'], ['ワニ', 'わに', 'crocodile'], ['亀', 'かめ', 'turtle'], ['カエル', 'かえる', 'frog'], ['蛇', 'へび', 'snake'], ['リス', 'りす', 'squirrel'], ['ハムスター', 'はむすたー', 'hamster'], ['モルモット', 'もるもっと', 'guinea pig'], ['ペンギン', 'ぺんぎん', 'penguin'], ['イルカ', 'いるか', 'dolphin'], ['クジラ', 'くじら', 'whale'], ['サメ', 'さめ', 'shark'], ['エビ', 'えび', 'shrimp'], ['カニ', 'かに', 'crab'], ['クラゲ', 'くらげ', 'jellyfish'], ['タコ', 'たこ', 'octopus'], ['イカ', 'いか', 'squid'], ['ホタテ', 'ほたて', 'scallop'], ['カモメ', 'かもめ', 'seagull'], ['ハヤブサ', 'はやぶさ', 'falcon'], ['フクロウ', 'ふくろう', 'owl'], ['コウモリ', 'こうもり', 'bat'], ['アリ', 'あり', 'ant'], ['ハチ', 'はち', 'bee'], ['カ', 'か', 'mosquito'], ['チョウ', 'ちょう', 'butterfly'], ['ガ', 'が', 'moth'], ['バッタ', 'ばった', 'grasshopper'], ['クモ', 'くも', 'spider'], ['ミツバチ', 'みつばち', 'honeybee'], ['ホタル', 'ほたる', 'firefly']
].map(([kanji, reading, definition]) => ({ kanji, reading, definition, used: false }));

const food = [['寿司', 'すし', 'sushi'], ['天ぷら', 'てんぷら', 'tempura'], ['焼き鳥', 'やきとり', 'yakitori'], ['刺身', 'さしみ', 'sashimi'], ['蕎麦', 'そば', 'soba (buckwheat noodles)'], ['うどん', 'うどん', 'udon (thick wheat noodles)'], ['ラーメン', 'らーめん', 'ramen'], ['餃子', 'ぎょうざ', 'gyoza (dumplings)'], ['お好み焼き', 'おこのみやき', 'okonomiyaki (savory pancake)'], ['たこ焼き', 'たこやき', 'takoyaki (octopus balls)'], ['味噌汁', 'みそしる', 'miso soup'], ['白ご飯', 'しろごはん', 'white rice'], ['梅干し', 'うめぼし', 'pickled plum'], ['おにぎり', 'おにぎり', 'rice ball'], ['漬物', 'つけもの', 'pickles'], ['納豆', 'なっとう', 'natto (fermented soybeans)'], ['豆腐', 'とうふ', 'tofu'], ['焼き肉', 'やきにく', 'yakiniku (grilled meat)'], ['カレーライス', 'かれーらいす', 'curry rice'], ['すき焼き', 'すきやき', 'sukiyaki'], ['しゃぶしゃぶ', 'しゃぶしゃぶ', 'shabu-shabu'], ['たまご焼き', 'たまごやき', 'rolled omelette'], ['茶碗蒸し', 'ちゃわんむし', 'savory egg custard'], ['生姜焼き', 'しょうがやき', 'ginger pork'], ['鰻丼', 'うなぎどん', 'unadon (eel bowl)'], ['親子丼', 'おやこどん', 'oyakodon (chicken and egg bowl)'], ['天丼', 'てんどん', 'tendon (tempura bowl)'], ['かつ丼', 'かつどん', 'katsudon (pork cutlet bowl)'], ['海鮮丼', 'かいせんどん', 'kaisen-don (seafood bowl)'], ['焼き魚', 'やきざかな', 'grilled fish'], ['煮魚', 'にざかな', 'simmered fish'], ['唐揚げ', 'からあげ', 'karaage (fried chicken)'], ['おでん', 'おでん', 'oden (hot pot)'], ['お粥', 'おかゆ', 'okayu (rice porridge)'], ['赤飯', 'せきはん', 'sekihan (red rice)'], ['羊羹', 'ようかん', 'yokan (sweet bean jelly)'], ['団子', 'だんご', 'dango (rice dumpling)'], ['餅', 'もち', 'mochi (rice cake)'], ['どら焼き', 'どらやき', 'dorayaki (red bean pancake)'], ['カステラ', 'かすてら', 'castella (sponge cake)'], ['抹茶', 'まっちゃ', 'matcha (green tea)'], ['煎茶', 'せんちゃ', 'sencha (roasted green tea)'], ['昆布', 'こんぶ', 'kombu (kelp)'], ['鰹節', 'かつおぶし', 'katsuobushi (bonito flakes)'], ['ハンバーガー', 'はんばーがー', 'hamburger'], ['ピザ', 'ぴざ', 'pizza'], ['パスタ', 'ぱすた', 'pasta'], ['サンドイッチ', 'さんどいっち', 'sandwich'], ['ステーキ', 'すてーき', 'steak'], ['フライドチキン', 'ふらいどちきん', 'fried chicken'], ['サラダ', 'さらだ', 'salad'], ['スープ', 'すーぷ', 'soup'], ['チーズ', 'ちーず', 'cheese'], ['アイスクリーム', 'あいすくりーむ', 'ice cream'], ['ケーキ', 'けーき', 'cake'], ['チョコレート', 'ちょこれーと', 'chocolate'], ['パン', 'ぱん', 'bread'], ['クッキー', 'くっきー', 'cookie'], ['ドーナツ', 'どーなつ', 'doughnut'], ['ホットドッグ', 'ほっとどっぐ', 'hot dog'], ['シリアル', 'しりある', 'cereal'], ['オムレツ', 'おむれつ', 'omelet'], ['ヨーグルト', 'よーぐると', 'yogurt'], ['ポテトチップス', 'ぽてとちっぷす', 'potato chips'], ['フレンチフライ', 'ふれんちふらい', 'french fries'], ['タコス', 'たこす', 'tacos'], ['ナチョス', 'なちょす', 'nachos'], ['カレー', 'かれー', 'curry'], ['カプチーノ', 'かぷちーの', 'cappuccino'], ['エスプレッソ', 'えすぷれっそ', 'espresso'], ['スムージー', 'すむーじー', 'smoothie'], ['コーラ', 'こーら', 'cola'], ['オレンジジュース', 'おれんじじゅーす', 'orange juice'], ['レモネード', 'れもねーど', 'lemonade'], ['ワイン', 'わいん', 'wine'], ['ビール', 'びーる', 'beer'], ['ウイスキー', 'ういすきー', 'whiskey'], ['シャンパン', 'しゃんぱん', 'champagne'], ['リゾット', 'りぞっと', 'risotto'], ['ガーリックトースト', 'がーりっくとーすと', 'garlic toast'], ['クリームシチュー', 'くりーむしちゅー', 'cream stew'], ['ベーグル', 'べーぐる', 'bagel'], ['ホットケーキ', 'ほっとけーき', 'hotcake (pancake)'], ['ワッフル', 'わっふる', 'waffle'], ['パンケーキ', 'ぱんけーき', 'pancake'], ['チリコンカン', 'ちりこんかん', 'chili con carne'], ['カルボナーラ', 'かるぼなーら', 'carbonara'], ['ミートボール', 'みーとぼーる', 'meatball'], ['キッシュ', 'きっしゅ', 'quiche'], ['ブルーベリーマフィン', 'ぶるーべりーまふぃん', 'blueberry muffin']
].map(([kanji, reading, definition]) => ({ kanji, reading, definition, used: false }));

const household = [['家具', 'かぐ', 'furniture'], ['机', 'つくえ', 'desk'], ['椅子', 'いす', 'chair'], ['テーブル', 'てーぶる', 'table'], ['ソファー', 'そふぁー', 'sofa'], ['ベッド', 'べっど', 'bed'], ['タンス', 'たんす', 'dresser'], ['鏡', 'かがみ', 'mirror'], ['本棚', 'ほんだな', 'bookshelf'], ['カーペット', 'かーぺっと', 'carpet'], ['カーテン', 'かーてん', 'curtain'], ['窓', 'まど', 'window'], ['ドア', 'どあ', 'door'], ['電灯', 'でんとう', 'lamp'], ['エアコン', 'えあこん', 'air conditioner'], ['ヒーター', 'ひーたー', 'heater'], ['掃除機', 'そうじき', 'vacuum cleaner'], ['洗濯機', 'せんたくき', 'washing machine'], ['冷蔵庫', 'れいぞうこ', 'refrigerator'], ['電子レンジ', 'でんしれんじ', 'microwave oven'], ['オーブン', 'おーぶん', 'oven'], ['トースター', 'とーすたー', 'toaster'], ['炊飯器', 'すいはんき', 'rice cooker'], ['電気ポット', 'でんきぽっと', 'electric kettle'], ['食器洗い機', 'しょっきあらいき', 'dishwasher'], ['包丁', 'ほうちょう', 'kitchen knife'], ['まな板', 'まないた', 'cutting board'], ['鍋', 'なべ', 'pot'], ['フライパン', 'ふらいぱん', 'frying pan'], ['やかん', 'やかん', 'kettle'], ['食器', 'しょっき', 'tableware'], ['皿', 'さら', 'plate'], ['茶碗', 'ちゃわん', 'rice bowl'], ['コップ', 'こっぷ', 'cup'], ['グラス', 'ぐらす', 'glass'], ['フォーク', 'ふぉーく', 'fork'], ['ナイフ', 'ないふ', 'knife'], ['スプーン', 'すぷーん', 'spoon'], ['箸', 'はし', 'chopsticks'], ['タオル', 'たおる', 'towel'], ['石鹸', 'せっけん', 'soap'], ['歯ブラシ', 'はぶらし', 'toothbrush'], ['歯磨き粉', 'はみがきこ', 'toothpaste'], ['シャンプー', 'しゃんぷー', 'shampoo'], ['リンス', 'りんす', 'conditioner'], ['シャワー', 'しゃわー', 'shower'], ['浴槽', 'よくそう', 'bathtub'], ['トイレ', 'といれ', 'toilet'], ['洗面台', 'せんめんだい', 'sink'], ['時計', 'とけい', 'clock'], ['電話', 'でんわ', 'telephone'], ['テレビ', 'てれび', 'television'], ['リモコン', 'りもこん', 'remote control'], ['パソコン', 'ぱそこん', 'computer'], ['プリンター', 'ぷりんたー', 'printer'], ['書類', 'しょるい', 'documents'], ['封筒', 'ふうとう', 'envelope'], ['鉛筆', 'えんぴつ', 'pencil'], ['消しゴム', 'けしごむ', 'eraser'], ['ペン', 'ぺん', 'pen'], ['ノート', 'のーと', 'notebook'], ['本', 'ほん', 'book'], ['雑誌', 'ざっし', 'magazine'], ['新聞', 'しんぶん', 'newspaper'], ['カレンダー', 'かれんだー', 'calendar']
].map(([kanji, reading, definition]) => ({ kanji, reading, definition, used: false }));

const colors = [['赤', 'あか', 'red'], ['青', 'あお', 'blue'], ['黄色', 'きいろ', 'yellow'], ['緑', 'みどり', 'green'], ['黒', 'くろ', 'black'], ['白', 'しろ', 'white'], ['紫', 'むらさき', 'purple'], ['橙', 'だいだい', 'orange'], ['茶色', 'ちゃいろ', 'brown'], ['灰色', 'はいいろ', 'gray'], ['桃色', 'ももいろ', 'pink'], ['金色', 'きんいろ', 'gold'], ['銀色', 'ぎんいろ', 'silver'], ['水色', 'みずいろ', 'light blue'], ['藍色', 'あいいろ', 'indigo'], ['赤紫', 'あかむらさき', 'magenta'], ['青緑', 'あおみどり', 'cyan'], ['黄緑', 'きみどり', 'lime green'], ['薄紫', 'うすむらさき', 'lavender'], ['黄土色', 'おうどいろ', 'ochre'], ['紺色', 'こんいろ', 'navy blue'], ['真珠色', 'しんじゅいろ', 'pearl'], ['桜色', 'さくらいろ', 'cherry blossom pink'], ['赤茶色', 'あかちゃいろ', 'maroon'], ['濃紺', 'のうこん', 'deep navy']
].map(([kanji, reading, definition]) => ({ kanji, reading, definition, used: false }));

const numbers = [['一', 'いち', 'one'], ['二', 'に', 'two'], ['三', 'さん', 'three'], ['四', 'し / よん', 'four'], ['五', 'ご', 'five'], ['六', 'ろく', 'six'], ['七', 'しち / なな', 'seven'], ['八', 'はち', 'eight'], ['九', 'きゅう / く', 'nine'], ['十', 'じゅう', 'ten'], ['十一', 'じゅういち', 'eleven'], ['十二', 'じゅうに', 'twelve'], ['十三', 'じゅうさん', 'thirteen'], ['十四', 'じゅうし / じゅうよん', 'fourteen'], ['十五', 'じゅうご', 'fifteen'], ['十六', 'じゅうろく', 'sixteen'], ['十七', 'じゅうしち / じゅうなな', 'seventeen'], ['十八', 'じゅうはち', 'eighteen'], ['十九', 'じゅうきゅう / じゅうく', 'nineteen'], ['二十', 'にじゅう', 'twenty'], ['三十', 'さんじゅう', 'thirty'], ['四十', 'しじゅう / よんじゅう', 'forty'], ['五十', 'ごじゅう', 'fifty'], ['六十', 'ろくじゅう', 'sixty'], ['七十', 'しちじゅう / ななじゅう', 'seventy'], ['八十', 'はちじゅう', 'eighty'], ['九十', 'きゅうじゅう', 'ninety'], ['百', 'ひゃく', 'hundred'], ['二百', 'にひゃく', 'two hundred'], ['三百', 'さんびゃく', 'three hundred'], ['四百', 'よんひゃく', 'four hundred'], ['五百', 'ごひゃく', 'five hundred'], ['六百', 'ろっぴゃく', 'six hundred'], ['七百', 'ななひゃく', 'seven hundred'], ['八百', 'はっぴゃく', 'eight hundred'], ['九百', 'きゅうひゃく', 'nine hundred'], ['千', 'せん', 'thousand'], ['二千', 'にせん', 'two thousand'], ['三千', 'さんぜん', 'three thousand'], ['四千', 'よんせん', 'four thousand'], ['五千', 'ごせん', 'five thousand'], ['六千', 'ろくせん', 'six thousand'], ['七千', 'ななせん', 'seven thousand'], ['八千', 'はっせん', 'eight thousand'], ['九千', 'きゅうせん', 'nine thousand'], ['一万', 'いちまん', 'ten thousand']
].map(([kanji, reading, definition]) => ({ kanji, reading, definition, used: false }));

const calendar = [['月曜日', 'げつようび', 'Monday'], ['火曜日', 'かようび', 'Tuesday'], ['水曜日', 'すいようび', 'Wednesday'], ['木曜日', 'もくようび', 'Thursday'], ['金曜日', 'きんようび', 'Friday'], ['土曜日', 'どようび', 'Saturday'], ['日曜日', 'にちようび', 'Sunday'], ['一月', 'いちがつ', 'January'], ['二月', 'にがつ', 'February'], ['三月', 'さんがつ', 'March'], ['四月', 'しがつ', 'April'], ['五月', 'ごがつ', 'May'], ['六月', 'ろくがつ', 'June'], ['七月', 'しちがつ', 'July'], ['八月', 'はちがつ', 'August'], ['九月', 'くがつ', 'September'], ['十月', 'じゅうがつ', 'October'], ['十一月', 'じゅういちがつ', 'November'], ['十二月', 'じゅうにがつ', 'December'], ['年', 'ねん', 'year'], ['月', 'つき', 'month'], ['週', 'しゅう', 'week'], ['日', 'ひ', 'day'], ['今日', 'きょう', 'today'], ['明日', 'あした', 'tomorrow'], ['昨日', 'きのう', 'yesterday'], ['曜日', 'ようび', 'day of the week'], ['週末', 'しゅうまつ', 'weekend'], ['休日', 'きゅうじつ', 'holiday'], ['祝日', 'しゅくじつ', 'public holiday'], ['平日', 'へいじつ', 'weekday'], ['午前', 'ごぜん', 'morning (AM)'], ['午後', 'ごご', 'afternoon (PM)'], ['今週', 'こんしゅう', 'this week'], ['来週', 'らいしゅう', 'next week'], ['先週', 'せんしゅう', 'last week'], ['今月', 'こんげつ', 'this month'], ['来月', 'らいげつ', 'next month'], ['先月', 'せんげつ', 'last month'], ['今年', 'ことし', 'this year'], ['来年', 'らいねん', 'next year'], ['去年', 'きょねん', 'last year'], ['春', 'はる', 'spring'], ['夏', 'なつ', 'summer'], ['秋', 'あき', 'autumn'], ['冬', 'ふゆ', 'winter']
].map(([kanji, reading, definition]) => ({ kanji, reading, definition, used: false }));

const weather = [['晴れ', 'はれ', 'clear weather'], ['曇り', 'くもり', 'cloudy weather'], ['雨', 'あめ', 'rain'], ['雪', 'ゆき', 'snow'], ['風', 'かぜ', 'wind'], ['台風', 'たいふう', 'typhoon'], ['霧', 'きり', 'fog'], ['雷', 'かみなり', 'thunder'], ['雲', 'くも', 'cloud'], ['太陽', 'たいよう', 'sun'], ['月', 'つき', 'moon'], ['星', 'ほし', 'star'], ['虹', 'にじ', 'rainbow'], ['気温', 'きおん', 'temperature'], ['湿度', 'しつど', 'humidity'], ['天気予報', 'てんきよほう', 'weather forecast'], ['晴れる', 'はれる', 'to be sunny'], ['曇る', 'くもる', 'to become cloudy'], ['雨が降る', 'あめがふる', 'to rain'], ['雪が降る', 'ゆきがふる', 'to snow'], ['風が吹く', 'かぜがふく', 'to blow (wind)'], ['暑い', 'あつい', 'hot'], ['寒い', 'さむい', 'cold'], ['涼しい', 'すずしい', 'cool'], ['暖かい', 'あたたかい', 'warm']
].map(([kanji, reading, definition]) => ({ kanji, reading, definition, used: false }));

const family = [
    ['家族', 'かぞく', 'family'],
    ['父', 'ちち', 'father'],
    ['母', 'はは', 'mother'],
    ['両親', 'りょうしん', 'parents'],
    ['兄', 'あに', 'older brother'],
    ['姉', 'あね', 'older sister'],
    ["長男", "ちょうなん", "eldest son"],
    ["長女", "ちょうじょ", "eldest daughter"],
    ["次男", "じなん", "second son"],
    ["次女", "じじょ", "second daughter"],
    ["三男", "さんなん", "third son"],
    ["三女", "さんじょ", "third daughter"],
    ["末っ子", "すえっこ", "youngest child"],
    ["一人っ子", "ひとりっこ", "only child"],
    ["双子", "ふたご", "twins"],
    ['弟', 'おとうと', 'younger brother'],
    ['妹', 'いもうと', 'younger sister'],
    ['祖父', 'そふ', 'grandfather'],
    ['祖母', 'そぼ', 'grandmother'],
    ['孫', 'まご', 'grandchild'],
    ['叔父', 'おじ', 'uncle (father\'s younger brother)'],
    ['叔母', 'おば', 'aunt (father\'s younger sister)'],
    ['伯父', 'おじ', 'uncle (father\'s older brother)'],
    ['伯母', 'おば', 'aunt (father\'s older sister)'],
    ['舅', 'しゅうと', 'father-in-law'],
    ['姑', 'しゅうとめ', 'mother-in-law'],
    ['義理の父', 'ぎりのちち', 'stepfather'],
    ['義理の母', 'ぎりのはは', 'stepmother'],
    ['息子', 'むすこ', 'son'],
    ['娘', 'むすめ', 'daughter'],
    ['親戚', 'しんせき', 'relatives'],
    ['子供', 'こども', 'child'],
    ['孤児', 'こじ', 'orphan'],
    ['姉妹', 'しまい', 'sisters'],
    ['兄弟', 'きょうだい', 'siblings'],
    ['妻', 'つま', 'wife'],
    ['夫', 'おっと', 'husband'],
    ['一家', 'いっか', 'household'],
    ['家長', 'かちょう', 'head of the family'],
    ['親友', 'しんゆう', 'best friend'],
].map(([kanji, reading, definition]) => ({ kanji, reading, definition, used: false }));

const work = [['仕事', 'しごと', 'work, job'], ['会社', 'かいしゃ', 'company, corporation'], ['社員', 'しゃいん', 'employee'], ['部長', 'ぶちょう', 'department manager'], ['課長', 'かちょう', 'section manager'], ['係長', 'かかりちょう', 'team leader'], ['社長', 'しゃちょう', 'president (of a company)'], ['役員', 'やくいん', 'executive, officer'], ['給料', 'きゅうりょう', 'salary, wages'], ['昇給', 'しょうきゅう', 'raise, salary increase'], ['退職', 'たいしょく', 'retirement'], ['出勤', 'しゅっきん', 'going to work, attendance'], ['退勤', 'たいきん', 'leaving work, end of work'], ['勤務時間', 'きんむじかん', 'working hours'], ['残業', 'ざんぎょう', 'overtime work'], ['休憩', 'きゅうけい', 'break, rest'], ['有給休暇', 'ゆうきゅうきゅうか', 'paid leave'], ['無給', 'むきゅう', 'unpaid'], ['転職', 'てんしょく', 'job change, changing jobs'], ['仕事中', 'しごとちゅう', 'during work, while working'], ['仕事場', 'しごとば', 'workplace'], ['上司', 'じょうし', 'boss, superior'], ['同僚', 'どうりょう', 'colleague, coworker'], ['雇用', 'こよう', 'employment'], ['求人', 'きゅうじん', 'job vacancy, help wanted'], ['応募', 'おうぼ', 'application (for a job)'], ['試用期間', 'しようきかん', 'probation period'], ['正社員', 'せいしゃいん', 'full-time employee'], ['契約社員', 'けいやくしゃいん', 'contract employee'], ['アルバイト', 'あるばいと', 'part-time job, part-time work'], ['インターンシップ', 'いんたーんしっぷ', 'internship'], ['ボーナス', 'ぼーなす', 'bonus'], ['給与', 'きゅうよ', 'salary, wage'], ['賃金', 'ちんぎん', 'wages, pay'], ['労働', 'ろうどう', 'labor, work'], ['業務', 'ぎょうむ', 'business, task']
].map(([kanji, reading, definition]) => ({ kanji, reading, definition, used: false }));

const culture = [['文化', 'ぶんか', 'culture'], ['伝統', 'でんとう', 'tradition'], ['芸術', 'げいじゅつ', 'art'], ['美術', 'びじゅつ', 'fine arts'], ['音楽', 'おんがく', 'music'], ['演劇', 'えんげき', 'theater, drama'], ['映画', 'えいが', 'movie, film'], ['文学', 'ぶんがく', 'literature'], ['詩', 'し', 'poetry'], ['小説', 'しょうせつ', 'novel'], ['歴史', 'れきし', 'history'], ['民俗', 'みんぞく', 'folklore'], ['伝説', 'でんせつ', 'legend'], ['神話', 'しんわ', 'mythology'], ['宗教', 'しゅうきょう', 'religion'], ['哲学', 'てつがく', 'philosophy'], ['教育', 'きょういく', 'education'], ['風習', 'ふうしゅう', 'custom'], ['習慣', 'しゅうかん', 'habit, custom'], ['祭り', 'まつり', 'festival'], ['日本文化', 'にほんぶんか', 'Japanese culture'], ['和食', 'わしょく', 'Japanese cuisine'], ['茶道', 'さどう', 'tea ceremony'], ['華道', 'かどう', 'flower arrangement'], ['武道', 'ぶどう', 'martial arts'], ['相撲', 'すもう', 'sumo wrestling'], ['日本庭園', 'にほんていえん', 'Japanese garden'], ['浮世絵', 'うきよえ', 'ukiyo-e (Japanese woodblock prints)'], ['着物', 'きもの', 'kimono'], ['武士', 'ぶし', 'samurai'], ['忍者', 'にんじゃ', 'ninja'], ['礼儀', 'れいぎ', 'manners, etiquette']
].map(([kanji, reading, definition]) => ({ kanji, reading, definition, used: false }));

const school = [['学校', 'がっこう', 'school'], ['教室', 'きょうしつ', 'classroom'], ['先生', 'せんせい', 'teacher'], ['生徒', 'せいと', 'student'], ['学生', 'がくせい', 'student'], ['校長', 'こうちょう', 'principal'], ['教師', 'きょうし', 'teacher'], ['教科', 'きょうか', 'subject (school)'], ['授業', 'じゅぎょう', 'class, lesson'], ['試験', 'しけん', 'exam, test'], ['成績', 'せいせき', 'grades, academic record'], ['学期', 'がっき', 'semester, term'], ['進学', 'しんがく', 'going on to higher education'], ['卒業', 'そつぎょう', 'graduation'], ['入学', 'にゅうがく', 'enrollment, admission'], ['修学旅行', 'しゅうがくりょこう', 'school trip'], ['クラス', 'くらす', 'class'], ['友達', 'ともだち', 'friend'], ['図書館', 'としょかん', 'library'], ['体育', 'たいいく', 'physical education, gym class'], ['理科', 'りか', 'science (school subject)'], ['算数', 'さんすう', 'mathematics, arithmetic'], ['国語', 'こくご', 'Japanese language'], ['社会', 'しゃかい', 'social studies'], ['音楽', 'おんがく', 'music'], ['美術', 'びじゅつ', 'art'], ['家庭科', 'かていか', 'home economics'], ['英語', 'えいご', 'English language'], ['情報技術', 'じょうほうぎじゅつ', 'information technology'], ['課題', 'かだい', 'assignment, task'], ['クラブ活動', 'くらぶかつどう', 'club activities'], ['校舎', 'こうしゃ', 'school building'], ['部活動', 'ぶかつどう', 'club activities (at school)'], ['給食', 'きゅうしょく', 'school lunch'], ['学校祭', 'がっこうさい', 'school festival'], ['運動会', 'うんどうかい', 'sports day'], ['修了証書', 'しゅうりょうしょうしょ', 'diploma, certificate of completion']
].map(([kanji, reading, definition]) => ({ kanji, reading, definition, used: false }));

const body = [['体', 'からだ', 'body'], ['頭', 'あたま', 'head'], ['顔', 'かお', 'face'], ['目', 'め', 'eye'], ['耳', 'みみ', 'ear'], ['鼻', 'はな', 'nose'], ['口', 'くち', 'mouth'], ['歯', 'は', 'tooth'], ['舌', 'した', 'tongue'], ['首', 'くび', 'neck'], ['肩', 'かた', 'shoulder'], ['胸', 'むね', 'chest'], ['背中', 'せなか', 'back'], ['腕', 'うで', 'arm'], ['手', 'て', 'hand'], ['指', 'ゆび', 'finger'], ['親指', 'おやゆび', 'thumb'], ['人差し指', 'ひとさしゆび', 'index finger'], ['中指', 'なかゆび', 'middle finger'], ['薬指', 'くすりゆび', 'ring finger'], ['小指', 'こゆび', 'little finger'], ['腰', 'こし', 'waist'], ['お腹', 'おなか', 'stomach'], ['胃', 'い', 'stomach (organ)'], ['肝臓', 'かんぞう', 'liver'], ['腎臓', 'じんぞう', 'kidney'], ['腸', 'ちょう', 'intestine'], ['足', 'あし', 'leg, foot'], ['太もも', 'ふともも', 'thigh'], ['膝', 'ひざ', 'knee'], ['ひざ小僧', 'ひざこぞう', 'kneecap'], ['足首', 'あしくび', 'ankle'], ['かかと', 'かかと', 'heel'], ['つま先', 'つまさき', 'toe'], ['皮膚', 'ひふ', 'skin'], ['骨', 'ほね', 'bone'], ['血液', 'けつえき', 'blood'], ['心臓', 'しんぞう', 'heart'], ['動脈', 'どうみゃく', 'artery'], ['静脈', 'じょうみゃく', 'vein'], ['脳', 'のう', 'brain'], ['神経', 'しんけい', 'nerve'], ['筋肉', 'きんにく', 'muscle'], ['関節', 'かんせつ', 'joint'], ['背骨', 'せぼね', 'spine, backbone'], ['尾骨', 'おこつ', 'tailbone'], ['肋骨', 'ろっこつ', 'rib'], ['頭蓋骨', 'ずがいこつ', 'skull'], ['鼓膜', 'こまく', 'eardrum'], ['声帯', 'せいたい', 'vocal cords'], ['気管', 'きかん', 'windpipe, trachea'], ['食道', 'しょくどう', 'esophagus'], ['大腸', 'だいちょう', 'large intestine'], ['小腸', 'しょうちょう', 'small intestine'], ['臍', 'へそ', 'navel, belly button']
].map(([kanji, reading, definition]) => ({ kanji, reading, definition, used: false }));

const transitive_verb = [['開ける', 'あける', 'to open'], ['閉める', 'しめる', 'to close'], ['付ける', 'つける', 'to turn on'], ['消す', 'けす', 'to turn off, to erase'], ['作る', 'つくる', 'to make, to create'], ['食べる', 'たべる', 'to eat'], ['飲む', 'のむ', 'to drink'], ['読む', 'よむ', 'to read'], ['書く', 'かく', 'to write'], ['聞く', 'きく', 'to listen, to hear'], ['見る', 'みる', 'to see, to watch'], ['買う', 'かう', 'to buy'], ['売る', 'うる', 'to sell'], ['洗う', 'あらう', 'to wash'], ['使う', 'つかう', 'to use'], ['持つ', 'もつ', 'to hold, to have'], ['知る', 'しる', 'to know'], ['習う', 'ならう', 'to learn'], ['教える', 'おしえる', 'to teach, to tell'], ['与える', 'あたえる', 'to give'], ['取る', 'とる', 'to take'], ['運ぶ', 'はこぶ', 'to carry'], ['伝える', 'つたえる', 'to convey, to communicate'], ['見せる', 'みせる', 'to show'], ['探す', 'さがす', 'to search, to look for'], ['愛する', 'あいする', 'to love'], ['信じる', 'しんじる', 'to believe'], ['計る', 'はかる', 'to measure'], ['払う', 'はらう', 'to pay'], ['待つ', 'まつ', 'to wait'], ['借りる', 'かりる', 'to borrow'], ['貸す', 'かす', 'to lend'], ['助ける', 'たすける', 'to help, to save'], ['呼ぶ', 'よぶ', 'to call (someone)'], ['訪れる', 'おとずれる', 'to visit'], ['運転する', 'うんてんする', 'to drive'], ['掃除する', 'そうじする', 'to clean'], ['料理する', 'りょうりする', 'to cook'], ['勉強する', 'べんきょうする', 'to study'], ['持ってくる', 'もってくる', 'to bring'], ['持っていく', 'もっていく', 'to take'], ['返す', 'かえす', 'to return (something)'], ['届ける', 'とどける', 'to deliver'], ['貸す', 'かす', 'to lend'], ['借りる', 'かりる', 'to borrow'], ['受け取る', 'うけとる', 'to receive'], ['渡す', 'わたす', 'to hand over'], ['運ぶ', 'はこぶ', 'to carry'], ['向ける', 'むける', 'to turn towards'], ['壊す', 'こわす', 'to break'], ['立てる', 'たてる', 'to stand up (something)'], ['積む', 'つむ', 'to stack, to pile up'], ['載せる', 'のせる', 'to place on, to load onto'], ['掘る', 'ほる', 'to dig'], ['曲げる', 'まげる', 'to bend'], ['伸ばす', 'のばす', 'to extend, to stretch'], ['飛ばす', 'とばす', 'to fly (something)'], ['見つける', 'みつける', 'to find'], ['試す', 'ためす', 'to try, to test'], ['揺らす', 'ゆらす', 'to shake'], ['磨く', 'みがく', 'to polish, to brush (teeth)'], ['測る', 'はかる', 'to measure'], ['救う', 'すくう', 'to save, to rescue'], ['攻撃する', 'こうげきする', 'to attack'], ['治す', 'なおす', 'to heal, to cure'], ['直す', 'なおす', 'to fix, to repair'], ['投げる', 'なげる', 'to throw'], ['受ける', 'うける', 'to receive, to take (a test)'], ['守る', 'まもる', 'to protect, to guard'], ['選ぶ', 'えらぶ', 'to choose, to select'], ['建てる', 'たてる', 'to build'], ['入れる', 'いれる', 'to put in, to insert'], ['求める', 'もとめる', 'to seek, to request'], ['作成する', 'さくせいする', 'to create, to draw up'], ['生む', 'うむ', 'to give birth, to produce'], ['引き起こす', 'ひきおこす', 'to cause, to provoke'], ['促す', 'うながす', 'to urge, to encourage'], ['広げる', 'ひろげる', 'to spread, to expand'], ['用いる', 'もちいる', 'to use, to employ'], ['捨てる', 'すてる', 'to throw away'], ['探る', 'さぐる', 'to probe, to explore'], ['検討する', 'けんとうする', 'to examine, to consider'], ['準備する', 'じゅんびする', 'to prepare'], ['示す', 'しめす', 'to show, to indicate']
].map(([kanji, reading, definition]) => ({ kanji, reading, definition, used: false }));

const intransitive_verbs = [['開く', 'あく', 'to open'], ['閉まる', 'しまる', 'to close'], ['つく', 'つく', 'to be turned on'], ['消える', 'きえる', 'to disappear, to go out'], ['起きる', 'おきる', 'to wake up, to occur'], ['寝る', 'ねる', 'to sleep'], ['降る', 'ふる', 'to fall (rain, snow)'], ['止まる', 'とまる', 'to stop'], ['行く', 'いく', 'to go'], ['来る', 'くる', 'to come'], ['帰る', 'かえる', 'to return (home)'], ['入る', 'はいる', 'to enter'], ['出る', 'でる', 'to exit, to leave'], ['登る', 'のぼる', 'to climb'], ['飛ぶ', 'とぶ', 'to fly'], ['走る', 'はしる', 'to run'], ['歩く', 'あるく', 'to walk'], ['笑う', 'わらう', 'to laugh'], ['泣く', 'なく', 'to cry'], ['怒る', 'おこる', 'to get angry'], ['座る', 'すわる', 'to sit'], ['立つ', 'たつ', 'to stand'], ['倒れる', 'たおれる', 'to fall over, to collapse'], ['消える', 'きえる', 'to disappear'], ['壊れる', 'こわれる', 'to break'], ['治る', 'なおる', 'to heal, to be cured'], ['曲がる', 'まがる', 'to turn, to bend'], ['止まる', 'とまる', 'to stop'], ['始まる', 'はじまる', 'to begin'], ['終わる', 'おわる', 'to end'], ['帰る', 'かえる', 'to return (home)'], ['泊まる', 'とまる', 'to stay (overnight)'], ['集まる', 'あつまる', 'to gather'], ['降りる', 'おりる', 'to get off, to descend'], ['進む', 'すすむ', 'to advance, to proceed'], ['減る', 'へる', 'to decrease'], ['増える', 'ふえる', 'to increase'], ['落ちる', 'おちる', 'to fall, to drop'], ['入る', 'はいる', 'to enter'], ['出る', 'でる', 'to exit, to leave'], ['動く', 'うごく', 'to move'], ['残る', 'のこる', 'to remain'], ['揺れる', 'ゆれる', 'to shake, to sway'], ['浮かぶ', 'うかぶ', 'to float, to come to mind'], ['回る', 'まわる', 'to turn, to revolve'], ['暮れる', 'くれる', 'to get dark, to end (the day)'], ['晴れる', 'はれる', 'to clear up (weather)'], ['曇る', 'くもる', 'to become cloudy'], ['起こる', 'おこる', 'to happen, to occur'], ['落ちる', 'おちる', 'to fall, to drop'], ['泣く', 'なく', 'to cry'], ['立つ', 'たつ', 'to stand up'], ['座る', 'すわる', 'to sit down'], ['起きる', 'おきる', 'to get up, to wake up'], ['降りる', 'おりる', 'to get off, to go down'], ['歩く', 'あるく', 'to walk'], ['走る', 'はしる', 'to run'], ['泳ぐ', 'およぐ', 'to swim'], ['飛ぶ', 'とぶ', 'to fly'], ['消える', 'きえる', 'to disappear, to go out'], ['落ちる', 'おちる', 'to fall, to drop'], ['壊れる', 'こわれる', 'to break (down)'], ['裂ける', 'さける', 'to tear, to split'], ['割れる', 'われる', 'to break, to crack'], ['見える', 'みえる', 'to be visible, to be seen'], ['聞こえる', 'きこえる', 'to be audible, to be heard'], ['入る', 'はいる', 'to enter'], ['出る', 'でる', 'to leave, to exit'], ['集まる', 'あつまる', 'to gather, to assemble'], ['離れる', 'はなれる', 'to separate, to leave'], ['倒れる', 'たおれる', 'to fall over, to collapse'], ['昇る', 'のぼる', 'to rise, to ascend'], ['沈む', 'しずむ', 'to sink, to go down (sun)'], ['痩せる', 'やせる', 'to lose weight'], ['太る', 'ふとる', 'to gain weight'], ['流れる', 'ながれる', 'to flow'], ['乾く', 'かわく', 'to dry'], ['濡れる', 'ぬれる', 'to get wet'], ['燃える', 'もえる', 'to burn'], ['冷える', 'ひえる', 'to get cold'], ['温まる', 'あたたまる', 'to get warm'], ['強くなる', 'つよくなる', 'to get strong'], ['弱くなる', 'よわくなる', 'to get weak'], ['長くなる', 'ながくなる', 'to get longer'], ['短くなる', 'みじかくなる', 'to get shorter'], ['広がる', 'ひろがる', 'to spread out'], ['深まる', 'ふかまる', 'to deepen'], ['軽くなる', 'かるくなる', 'to become lighter'], ['重くなる', 'おもくなる', 'to become heavier'], ['明るくなる', 'あかるくなる', 'to become brighter'], ['暗くなる', 'くらくなる', 'to become darker'], ['暖まる', 'あたたまる', 'to warm up (something warms up)'], ['冷える', 'ひえる', 'to get chilly, to cool down'], ['落ち着く', 'おちつく', 'to calm down'], ['回る', 'まわる', 'to turn, to revolve'], ['揺れる', 'ゆれる', 'to shake, to sway'], ['裂ける', 'さける', 'to split, to tear'], ['咲く', 'さく', 'to bloom'], ['溶ける', 'とける', 'to melt'], ['腐る', 'くさる', 'to rot, to go bad']
].map(([kanji, reading, definition]) => ({ kanji, reading, definition, used: false }));

const adjectives = [['大きい', 'おおきい', 'big, large'], ['小さい', 'ちいさい', 'small, little'], ['新しい', 'あたらしい', 'new'], ['古い', 'ふるい', 'old (not for people)'], ['良い', 'よい', 'good'], ['悪い', 'わるい', 'bad'], ['高い', 'たかい', 'high, expensive'], ['安い', 'やすい', 'cheap, inexpensive'], ['長い', 'ながい', 'long'], ['短い', 'みじかい', 'short'], ['速い', 'はやい', 'fast'], ['遅い', 'おそい', 'slow, late'], ['暑い', 'あつい', 'hot (weather)'], ['寒い', 'さむい', 'cold (weather)'], ['熱い', 'あつい', 'hot (object)'], ['冷たい', 'つめたい', 'cold (object)'], ['重い', 'おもい', 'heavy'], ['軽い', 'かるい', 'light (weight)'], ['広い', 'ひろい', 'wide, spacious'], ['狭い', 'せまい', 'narrow, cramped'], ['強い', 'つよい', 'strong'], ['弱い', 'よわい', 'weak'], ['美しい', 'うつくしい', 'beautiful'], ['醜い', 'みにくい', 'ugly'], ['うるさい', 'うるさい', 'noisy, annoying'], ['静か', 'しずか', 'quiet'], ['明るい', 'あかるい', 'bright, cheerful'], ['暗い', 'くらい', 'dark, gloomy'], ['楽しい', 'たのしい', 'fun, enjoyable'], ['悲しい', 'かなしい', 'sad'], ['嬉しい', 'うれしい', 'happy, glad'], ['怖い', 'こわい', 'scary, frightening'], ['優しい', 'やさしい', 'kind, gentle'], ['厳しい', 'きびしい', 'strict, harsh'], ['面白い', 'おもしろい', 'interesting, funny'], ['つまらない', 'つまらない', 'boring'], ['甘い', 'あまい', 'sweet'], ['辛い', 'からい', 'spicy'], ['苦い', 'にがい', 'bitter'], ['酸っぱい', 'すっぱい', 'sour'], ['塩辛い', 'しおからい', 'salty'], ['広い', 'ひろい', 'wide, spacious'], ['狭い', 'せまい', 'narrow, cramped'], ['古い', 'ふるい', 'old (not used for people)'], ['新しい', 'あたらしい', 'new'], ['元気', 'げんき', 'healthy, energetic'], ['疲れた', 'つかれた', 'tired'], ['有名', 'ゆうめい', 'famous'], ['便利', 'べんり', 'convenient'], ['不便', 'ふべん', 'inconvenient'], ['大切', 'たいせつ', 'important'], ['簡単', 'かんたん', 'simple, easy'], ['複雑', 'ふくざつ', 'complex'], ['同じ', 'おなじ', 'same'], ['違う', 'ちがう', 'different'], ['嬉しい', 'うれしい', 'happy'], ['悲しい', 'かなしい', 'sad'], ['好き', 'すき', 'liked, favorite'], ['嫌い', 'きらい', 'disliked'], ['楽しい', 'たのしい', 'fun, enjoyable'], ['つまらない', 'つまらない', 'boring'], ['忙しい', 'いそがしい', 'busy'], ['暇', 'ひま', 'free (not busy)'], ['大事', 'だいじ', 'important'], ['簡単', 'かんたん', 'easy'], ['難しい', 'むずかしい', 'difficult'], ['低い', 'ひくい', 'low'], ['高い', 'たかい', 'tall, high, expensive'], ['古い', 'ふるい', 'old (not for people)'], ['新しい', 'あたらしい', 'new'], ['白い', 'しろい', 'white'], ['黒い', 'くろい', 'black'], ['赤い', 'あかい', 'red'], ['青い', 'あおい', 'blue'], ['黄色い', 'きいろい', 'yellow'], ['緑', 'みどり', 'green'], ['灰色', 'はいいろ', 'gray'], ['紫', 'むらさき', 'purple'], ['茶色', 'ちゃいろ', 'brown'], ['金色', 'きんいろ', 'golden'], ['銀色', 'ぎんいろ', 'silver'], ['危ない', 'あぶない', 'dangerous'], ['安全', 'あんぜん', 'safe'], ['痛い', 'いたい', 'painful'], ['美味しい', 'おいしい', 'delicious'], ['不味い', 'まずい', 'unappetizing'], ['柔らかい', 'やわらかい', 'soft'], ['硬い', 'かたい', 'hard'], ['賢い', 'かしこい', 'wise, clever'], ['若い', 'わかい', 'young'], ['老い', 'おい', 'old (people)'], ['偉い', 'えらい', 'great, admirable'], ['太い', 'ふとい', 'thick'], ['細い', 'ほそい', 'thin, slender'], ['丸い', 'まるい', 'round'], ['四角い', 'しかくい', 'square, rectangular'], ['優しい', 'やさしい', 'gentle, kind'], ['厳しい', 'きびしい', 'strict'], ['甘い', 'あまい', 'sweet'], ['辛い', 'からい', 'spicy'], ['苦い', 'にがい', 'bitter'], ['酸っぱい', 'すっぱい', 'sour'], ['塩辛い', 'しおからい', 'salty'], ['臭い', 'くさい', 'smelly'], ['香ばしい', 'こうばしい', 'fragrant'], ['便利', 'べんり', 'convenient'], ['不便', 'ふべん', 'inconvenient'], ['明るい', 'あかるい', 'bright'], ['暗い', 'くらい', 'dark'], ['忙しい', 'いそがしい', 'busy'], ['暇', 'ひま', 'free (time)'], ['大事', 'だいじ', 'important'], ['元気', 'げんき', 'healthy, energetic'], ['疲れた', 'つかれた', 'tired'], ['怖い', 'こわい', 'scary'], ['楽しい', 'たのしい', 'enjoyable'], ['悲しい', 'かなしい', 'sad'], ['うるさい', 'うるさい', 'noisy, annoying'], ['静か', 'しずか', 'quiet'], ['重い', 'おもい', 'heavy'], ['軽い', 'かるい', 'light (weight)'], ['厚い', 'あつい', 'thick (objects)'], ['薄い', 'うすい', 'thin (objects)'], ['強い', 'つよい', 'strong'], ['弱い', 'よわい', 'weak'], ['高い', 'たかい', 'high, expensive'], ['低い', 'ひくい', 'low'], ['速い', 'はやい', 'fast'], ['遅い', 'おそい', 'slow'], ['広い', 'ひろい', 'wide, spacious'], ['狭い', 'せまい', 'narrow, cramped'], ['深い', 'ふかい', 'deep'], ['浅い', 'あさい', 'shallow'], ['難しい', 'むずかしい', 'difficult'], ['易しい', 'やさしい', 'easy'], ['近い', 'ちかい', 'near, close'], ['遠い', 'とおい', 'far'], ['明らか', 'あきらか', 'clear, obvious'], ['有名', 'ゆうめい', 'famous'], ['短い', 'みじかい', 'short'], ['長い', 'ながい', 'long'], ['温かい', 'あたたかい', 'warm (temperature)'], ['冷たい', 'つめたい', 'cold (temperature)'], ['大きい', 'おおきい', 'big, large'], ['小さい', 'ちいさい', 'small, little'], ['汚い', 'きたない', 'dirty'], ['綺麗', 'きれい', 'clean, beautiful'], ['美しい', 'うつくしい', 'beautiful'], ['醜い', 'みにくい', 'ugly'], ['熱い', 'あつい', 'hot (temperature)'], ['冷たい', 'つめたい', 'cold (temperature)'], ['速い', 'はやい', 'fast'], ['遅い', 'おそい', 'slow'], ['簡単', 'かんたん', 'simple, easy'], ['複雑', 'ふくざつ', 'complex'], ['優秀', 'ゆうしゅう', 'excellent'], ['劣る', 'おとる', 'inferior'], ['柔軟', 'じゅうなん', 'flexible'], ['硬直', 'こうちょく', 'stiff, rigid']
].map(([kanji, reading, definition]) => ({ kanji, reading, definition, used: false }));



const kanjiListObj = {
    hiragana,
    katakana,
    animals,
    food,
    household,
    colors,
    numbers,
    calendar,
    weather,
    family,
    work,
    culture,
    school,
    body,
    transitive_verb,
    intransitive_verbs,
    adjectives
}