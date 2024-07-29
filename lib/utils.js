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

function shuffle(array) {
    const cpy = structuredClone(array)
    for (let i = cpy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cpy[i], cpy[j]] = [cpy[j], cpy[i]];
    }
    return cpy
}
