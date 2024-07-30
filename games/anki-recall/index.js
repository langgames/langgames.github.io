'use strict';

let levelSize;

const GameState = {
    TITLE: 0,
    MEMORIZE: 1,
    TYPE: 2,
    RESULT: 3,
    WIN: 4,
};

let currentState = GameState.TITLE;
let currentSentence = '';
let currentReading = '';
let currentTranslation = ''
let titleMenu, resultMenu;
let currSentIndex, completed = [];
let currentLevel = '';
let grid;
let sentences;
let sentDefinition;

// Color palette
const PALETTE = {
    white: new Color(0.9, 0.9, 0.9),
    lightGray: new Color(0.8, 0.8, 0.8),
    gray: new Color(0.5, 0.5, 0.5),
    darkGray: new Color(0.2, 0.2, 0.2),
    green: new Color().setHex('#6BBF59'),
};

const sound_start = new Sound([1.7, , 454, .01, .08, .13, 1, 3.7, , , 255, .08, , , , , , .83, .02, , 496]);
const sound_success = new Sound([2.4, , 95, .03, .07, .33, 2, 3.9, , , , , , .3, , 1, .07, .4, .26, .3]);
const sound_fail = new Sound([, , 493, , .02, .03, 1, 1.5, , , 41, , , , , , , .63, .01, .36, -1030]);

const ColorMenu = (pos, size, title) => new Menu(pos, size, title, {
    titleColor: PALETTE.green,
    titleOutlineColor: PALETTE.darkGray,
    defaultTextColor: PALETTE.green,
    buttonNormalColor: PALETTE.darkGray,
    buttonHoverColor: PALETTE.darkGray,
    buttonPressedColor: PALETTE.darkGray,
    buttonTextColor: PALETTE.darkGray,
    buttonBorderColor: PALETTE.green
})

function startGame() {
    currentState = GameState.MEMORIZE;
    currSentIndex = nextSentenceIndex(sentences, completed);
    if (currSentIndex === -1) {
        showWin();
        return;
    }

    const sent = sentences[currSentIndex]
    currentSentence = sent.words.map(s => s.word).join('');
    currentReading = sent.words.map(s => s.reading).join('');
    currentTranslation = sent.translation

    grid = new SelectableGrid(sent.words, {
        selectedColor: PALETTE.green,
        backgroundColor: PALETTE.darkGray,
        selectedTextColor: PALETTE.darkGray,
    })
    grid.reflow()
    grid.select(0)

    currentInput = '';
    sound_start.play();
    hideTitleMenu();
}

function showResult() {
    grid.destroy()
    completed.push(currSentIndex);
    save();
    startGame();
}

function showWin() {
    hideTitleMenu()
    currentState = GameState.WIN;
    const menu = ColorMenu(cameraPos.add(vec2(0, -7)), vec2(16, 12));
    menu.columns = 1;
    menu.addButton('Main menu', () => {
        menu.hide()
        menu.destroy()
        showTitleMenu()
    });

    sound_success.play();
}

function showTitleMenu() {
    initTitleMenu();
    currentState = GameState.TITLE;
}

function initTitleMenu() {
    if (titleMenu) titleMenu.destroy();
    titleMenu = ColorMenu(cameraPos, vec2(20, 14), '暗記RECALL');
    titleMenu.addButton('How to Play', showHowTo);

    for (const level in compactSentences) {
        const nextIndex = nextSentenceIndex(compactSentences[level], load(level))
        titleMenu.addButton(level, () => {
            currentLevel = level;
            sentences = sentenceToJSON(compactSentences[currentLevel])
            completed = load(level);
            startGame();
        }, nextIndex === -1 ? '🏆' : undefined)

    }
}

function hideTitleMenu() {
    titleMenu?.hide();
    titleMenu?.destroy();
}

function showHowTo() {
    hideTitleMenu()
    const instructions = [
        "1. Memorize the Japanese sentence shown on the screen.",
        "2. Press z to view the sentence's translation.",
        "3. Press the arrow keys to select words",
        "4. Press x to view a word's reading and definition.",
        "5. When ready, press SPACE to start typing.",
        "6. Type the sentence in hiragana/katakana.",
        "7. Press SPACE to skip the sentence if you get stuck",
        "8. Progress through all sentences in a level to win!",
    ].join('\n');

    const howToMenu = ColorMenu(cameraPos, vec2(20, 14), 'How to Play');
    howToMenu.columns = 1;
    howToMenu.addTextBlock(instructions, 1.2);
    howToMenu.addButton('Back', () => {
        howToMenu.hide()
        howToMenu.destroy()
        showTitleMenu()
        currentState = GameState.TITLE
    });
}

function nextSentenceIndex(list, completedIndices) {
    if (completedIndices.includes("all")) return -1;
    const arr = [...Array(list.length).keys()].filter((i) => !completedIndices.includes(i));
    return arr.length ? arr[Math.floor(Math.random() * arr.length)] : -1;
}

function drawMemorizeScreen() {
    drawCompleted()
    drawSentDefinition()
    drawDefinition()
    drawText('Press SPACE to recall', cameraPos.add(vec2(0, -9)), 1, PALETTE.lightGray, 0.1, PALETTE.darkGray);
}

function drawTypeScreen() {
    drawCompleted()
    const wrappedInput = wrapText(currentInput, 8, 2, '');
    drawText(wrappedInput, cameraPos.add(vec2(0, -5)), 2, PALETTE.white, 0.2, PALETTE.darkGray);
    drawText('Press SPACE to skip', cameraPos.add(vec2(-10, 10)), 1, PALETTE.lightGray, 0.1, PALETTE.darkGray);
}

function drawWinScreen() {
    drawText(`上手くできたぞ！`, cameraPos.add(vec2(0, 3)), 3, PALETTE.white, 0.2, PALETTE.darkGray);
}

function drawDefinition() {
    if (!scrambleGridWordDefinition) return
    const maxWidth = levelSize.x * 0.8
    const fontSize = 2
    const wrappedDefinition = wrapText(scrambleGridWordDefinition, maxWidth, fontSize);
    drawText(wrappedDefinition, cameraPos.add(vec2(0, -7)), 2, PALETTE.white, 0.2, PALETTE.darkGray);
}

function drawSentDefinition() {
    if (!sentDefinition) return
    const maxWidth = levelSize.x * 0.8
    const fontSize = 2
    const wrappedDefinition = wrapText(sentDefinition, maxWidth, fontSize);
    drawText(wrappedDefinition, cameraPos.add(vec2(0, -2)), 1, PALETTE.white, 0.2, PALETTE.darkGray);
}

function drawCompleted() {
    drawText(`${completed.length} / ${sentences.length}`, cameraPos.add(vec2(9, 10)), 1, new Color(0.9, 0.9, 0.9), 0.2, new Color(0.2, 0.2, 0.2))
}

engineInit(
    () => {
        canvasFixedSize = vec2(1280, 720);
        levelSize = vec2(20, 38);
        cameraPos = levelSize.scale(0.5);
        initTitleMenu();
        drawShader();
    },
    () => {
        switch (currentState) {
            case GameState.TITLE:
                break;
            case GameState.MEMORIZE: {
                if (keyWasPressed(32)) { // 32 is the keycode for SPACE
                    grid.select(0)
                    grid.forEach(w => {
                        w._word = w.word
                        if (w.data.mask) {
                            w.word = '●'
                        }
                    })
                    currentState = GameState.TYPE;
                }

                if (keyIsDown(90)) {
                    if (!sentDefinition) {
                        selectable_grid_sound_info.play()
                    }
                    sentDefinition = currentTranslation
                    return
                } else {
                    sentDefinition = null
                }
                handleDefinitionInput()
                handleSelectableGridInput(false)
                break;
            }
            case GameState.TYPE: {
                if (keyWasPressed(32)) { // 32 is the keycode for SPACE
                    currentState = GameState.MEMORIZE;
                    grid.destroy()
                    startGame()
                }

                const w = grid.selectedWord

                if (!w.data.mask) {
                    grid.moveSelection('right', false, false)
                }

                const reading = w.reading.length ? w.reading : w._word
                if (currentInput === reading) {
                    currentInput = ''
                    w.word = w._word

                    let curr = ''
                    grid.forEach((value) => {
                        curr += value.word
                    })

                    if (curr === currentSentence) {
                        showResult();
                    } else {
                        grid.moveSelection('right')
                    }
                }
                break;
            }
            case GameState.RESULT:
                break;
            case GameState.WIN:
                break;
        }
    },
    () => {
        if (currentState === GameState.TYPE) {
            gameInputUpdate();
        }
    },
    () => {
        switch (currentState) {
            case GameState.TITLE:
                titleMenu?.render();
                break;
            case GameState.MEMORIZE:
                drawMemorizeScreen();
                break;
            case GameState.TYPE:
                drawTypeScreen();
                break;
            case GameState.RESULT:
                resultMenu?.render();
                break;
            case GameState.WIN:
                drawWinScreen();
                break;
        }
    },
    () => { },
);

function save() {
    localStorage.setItem(`completed_${currentLevel}`, JSON.stringify(completed));
}

function load(level) {
    try {
        return JSON.parse(localStorage.getItem(`completed_${level}`) || '[]');
    } catch {
        return [];
    }
}
