const UI_PALETTE = {
    white: new Color(0.9, 0.9, 0.9),
    lightGray: new Color(0.8, 0.8, 0.8),
    gray: new Color(0.5, 0.5, 0.5),
    darkGray: new Color(0.2, 0.2, 0.2),
    blue: new Color(0.4, 0.5, 0.9),
};

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
    constructor(pos, size, title, colors = {}, buttonClass = Button) {
        super(pos, size);
        this.title = title;
        this.elements = [];
        this.visible = true;
        this.columns = 4;
        this.buttonSize = vec2(6, 1.5);
        this.elementSpacing = vec2(0.5);
        this.buttonClass = buttonClass
        this.titleSize = 3

        // Color assignments with defaults
        this.titleColor = colors.titleColor ?? UI_PALETTE.white;
        this.titleOutlineColor = colors.titleOutlineColor ?? lineColor;
        this.defaultTextColor = colors.defaultTextColor ?? UI_PALETTE.white;

        // Button color assignments
        this.buttonColors = {
            normalColor: colors.buttonNormalColor ?? hsl(0, 0, 0.5),
            hoverColor: colors.buttonHoverColor ?? hsl(0, 0, 0.6),
            pressedColor: colors.buttonPressedColor ?? hsl(0, 0, 0.4),
            textColor: colors.buttonTextColor ?? hsl(0, 0, 1),
            borderColor: colors.buttonBorderColor ?? hsl(0.6, 0.4, 0.5)
        };
    }

    addButton(text, onClick, icon, colors = {}) {
        const button = new this.buttonClass(vec2(0, 0), this.buttonSize, text, onClick, icon, { ...this.buttonColors, ...colors });
        this.elements.push({ type: 'button', element: button });
        this.updateElementPositions();
        return button;
    }

    addTextBlock(text, fontSize = 1, color, align = 'center') {
        const textColor = color ?? this.defaultTextColor;
        const textBlock = new TextBlock(text, fontSize, textColor, align);
        this.elements.push({ type: 'text', element: textBlock });
        this.updateElementPositions();
        return textBlock;
    }

    updateElementPositions() {
        // layouts with text are one column only
        const ignoreColumns = this.elements.some(e => e.type === 'text')
        const columns = ignoreColumns ? 1 : this.columns
        let totalWidth, startX, startY
        if (columns === 1) {
            totalWidth = Math.max(...this.elements.map(e => e.element.size.x))
            startX = this.pos.x;
        } else {
            totalWidth = this.columns * (this.buttonSize.x + this.elementSpacing.x) - this.elementSpacing.x;
            startX = this.pos.x - totalWidth / 2 + this.buttonSize.x / 2;
        }
        startY = this.pos.y + this.size.y / 2 - (this.title ?? '').split('\n').length * 3 - this.elementSpacing.y;
        let currentY = startY;
        let currentColumn = 0;
        this.elements.forEach((element) => {
            if (element.type === 'button') {
                const col = currentColumn % columns;
                element.element.pos = vec2(
                    startX + col * (element.element.size.x + this.elementSpacing.x),
                    currentY
                );
                currentColumn++;
                if (currentColumn % columns === 0) {
                    currentY -= element.element.size.y + this.elementSpacing.y;
                }
            } else if (element.type === 'text') {
                element.element.pos = vec2(this.pos.x, currentY);
                currentY -= element.element.size.y + 2 * this.elementSpacing.y;
            }
        });
    }

    update() {
        if (!this.visible) return;
        super.update();
        this.elements.forEach(element => element.element.update());
    }

    render() {
        if (!this.visible) return;
        // Render menu title
        if (this.title) {
            const titlePos = vec2(this.pos.x, this.pos.y + this.size.y / 2 - 0.5);
            drawText(this.title, titlePos, this.titleSize, this.titleColor, textLineWidth, this.titleOutlineColor);
        }
        // Render elements
        this.elements.forEach(element => element.element.render());
    }

    destroy() {
        this.elements.forEach(e => e.element.destroy())
        super.destroy()
    }

    show() {
        this.visible = true;
        this.elements.forEach(e => e.element.visible = true);
    }

    hide() {
        this.visible = false;
        this.elements.forEach(e => e.element.visible = false);
    }

    toggle() { this.visible ? this.hide() : this.show() }
}

///////////////////////////////////////////////////////////////////////////////
class TextBlock extends EngineObject {
    constructor(text, fontSize = 1, color = PALETTE.white, align = 'center') {
        super();
        const lines = text.split('\n')
        this.size = vec2(Math.max(...lines.map(l => l.length)) * 0.5, lines.length).scale(fontSize)
        this.text = text;
        this.fontSize = fontSize;
        this.color = color;
        this.align = align;
        this.visible = true;
    }

    setText(newText) {
        this.text = newText;
    }

    setFontSize(newSize) {
        this.fontSize = newSize;
    }

    setColor(newColor) {
        this.color = newColor;
    }

    setAlign(newAlign) {
        this.align = newAlign;
    }

    render() {
        if (!this.visible) return;
        drawText(this.text, this.pos, this.fontSize, this.color, 0.2, PALETTE.darkGray)
    }
}

///////////////////////////////////////////////////////////////////////////////
class Button extends EngineObject {
    constructor(pos, size, text, onClick, icon, colors = {}) {
        super(pos, size);
        this.text = text;
        this.onClick = onClick;
        this.icon = icon
        this.hovered = false;
        this.pressed = false;
        this.visible = true;

        // Color assignments with defaults
        this.normalColor = colors.normalColor ?? hsl(0, 0, 0.5);
        this.hoverColor = colors.hoverColor ?? hsl(0, 0, 0.6);
        this.pressedColor = colors.pressedColor ?? hsl(0, 0, 0.4);
        this.textColor = colors.textColor ?? hsl(0, 0, 1);
        this.borderColor = colors.borderColor ?? hsl(0.6, 0.4, 0.5);

        this.enabled = true;
        this.disabledOnClickMessage = ''
        this.disabledMessageTimer = new Timer
        this.disabledMessagePos = this.pos
    }

    update() {
        if (!this.visible) return;
        super.update();
        // Check if mouse is over the button
        this.hovered = isOverlapping(mousePos, vec2(0.1, 0.1), this.pos, this.size);
        // Handle click
        if (this.hovered && mouseWasPressed(0)) {
            this.pressed = true;
            if (!this.enabled) {
                this.disabledMessageTimer.set(3)
            }
        }
        else if (this.pressed && mouseWasReleased(0)) {
            this.pressed = false;
            if (this.hovered && this.onClick) {
                if (this.enabled)
                    this.onClick();
            }
        }
    }

    render() {
        if (!this.visible) return;
        // Button background
        const color = this.pressed ? this.pressedColor : (this.hovered ? this.hoverColor : this.normalColor);
        drawRect(this.pos, this.size, color);
        // Button text
        const textSize = min(this.size.x, this.size.y) * 0.4;
        drawText(this.text, this.pos, textSize, this.textColor);
        // Button border
        drawRect(this.pos, this.size, this.borderColor, .1);

        if (this.icon) {
            const starPos = this.pos.add(vec2(-2, 0))
            drawText(this.icon, starPos, 2)
        }

        if (this.disabledMessageTimer.active()) {
            drawText(this.disabledOnClickMessage, this.disabledMessagePos, 1, this.borderColor, 0.1, this.textColor)
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
class Word extends EngineObject {
    constructor(pos, data, textColor, backgroundColor, selectedColor, selectedTextColor) {
        super(pos)
        this.word = data?.word
        this.size.y = 2
        this.size.x = Math.max(this.word.length + 0.5, this.size.y)
        this.showReading = false
        this.reading = data?.reading
        this.definition = data?.definition
        this.data = data
        this.wordSize = 1
        this.readingSize = this.wordSize * 0.5
        this.selected = false
        this.textColor = textColor ?? new Color(1, 1, 1)
        this.backgroundColor = backgroundColor ?? hsl(0.6, 0.4, 0.5)
        this.selectedColor = selectedColor ?? hsl(0.1, 0.7, 0.6)
        this.selectedTextColor = selectedTextColor ?? this.textColor
    }

    render() {
        const textColor = this.selected ? this.selectedTextColor : this.textColor
        drawRect(this.pos, this.size, this.selected ? this.selectedColor : this.backgroundColor)

        if (this.showReading)
            drawText(this.reading, this.pos.add(vec2(0, this.readingSize)), this.readingSize, textColor)

        drawText(this.word, this.pos.add(vec2(0, - this.wordSize / 4.5)), this.wordSize, textColor)
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

///////////////////////////////////////////////////////////////////////////////
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

///////////////////////////////////////////////////////////////////////////////
const selectable_grid_sound_select = new Sound([2.1, , 247, , .03, .05, 1, 2.3, , , 78, .29, .17, , , , .24, .83, .01]);
const selectable_grid_sound_move = new Sound([, , 493, , .02, .03, 1, 1.5, , , 41, , , , , , , .63, .01, .36, -1030])
const selectable_grid_sound_info = new Sound([, , 230, .01, .09, .08, 1, 1.9, -1, 15, , , , , , , , .66, .12, , -1480]);
class SelectableGrid extends Grid {
    constructor(arr, wordProps) {
        super();
        this.index = 0
        this.lastIndex = 0;
        this.arr = arr
        this.wordProps = wordProps ?? {}
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

    moveSelection(direction, shouldMove = false, sound = true) {
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
            if (sound)
                selectable_grid_sound_move.play()
            this.swap(currentIndex, newIndex)
        } else {
            if (sound)
                selectable_grid_sound_select.play()
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
            const { textColor, backgroundColor, selectedColor, selectedTextColor } = this.wordProps
            const w = new Word(vec2(0, cameraPos.y), word, textColor, backgroundColor, selectedColor, selectedTextColor)
            row.addChild(w)
            if ((word.word.length > 7 || (row.width + word.word.length * 2) > this.width - 2) && word != this.arr[this.arr.length - 1]) {
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

function handleSelectableGridInput(multi = true) {
    const multiSelect = multi && keyIsDown(90); // 'z' key

    if (keyWasPressed(39)) // right arrow
        grid.moveSelection('right', multiSelect);
    else if (keyWasPressed(37)) // left arrow
        grid.moveSelection('left', multiSelect);
    else if (keyWasPressed(40)) // down arrow
        grid.moveSelection('down', multiSelect);
    else if (keyWasPressed(38)) // up arrow
        grid.moveSelection('up', multiSelect);
}

let scrambleGridWordDefinition
function handleDefinitionInput() {
    const w = grid.selectedWord
    if (w) {
        if (keyIsDown(88)) {
            if (!scrambleGridWordDefinition) {
                selectable_grid_sound_info.play()
            }
            scrambleGridWordDefinition = w.definition
            w.showReading = true
            return
        } else {
            scrambleGridWordDefinition = null
            w.showReading = false
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
class StaticGrid extends EngineObject {
    constructor(rows, cols, words, margin, onMouseDown, onMouseUp, colors = {}) {
        super(cameraPos)
        this.rows = rows;
        this.cols = cols;
        this.words = structuredClone(words);
        this.masked = new Array(rows * cols).fill(false);
        this.marked = new Array(rows * cols).fill(false);
        this.margin = margin ?? 0;
        this.showReading = new Array(rows * cols).fill(false);
        this.maskIcon = '●'
        this.selectedIndex = 0

        this.fontSize = 0.7
        this.readingSize = 0.5

        this.onMouseDown = onMouseDown // (index: number) => void
        this.onMouseUp = onMouseUp
        this.cellSize = vec2(4, 4);
        this.hovered = -1;
        this.isMobile = checkIsMobile()
        this.pressed = false;

        this.textColor = colors.textColor ?? UI_PALETTE.white
        this.selectedTextColor = colors.selectedTextColor ?? UI_PALETTE.darkGray
        this.readingTextColor = colors.readingTextColor ?? this.textColor
        this.selectedReadingTextColor = colors.selectedReadingTextColor ?? this.selectedTextColor
        this.cellColor = colors.cellColor ?? UI_PALETTE.darkGray
        this.selectedCellColor = colors.selectedCellColor ?? UI_PALETTE.white
        this.maskColor = colors.maskColor ?? this.textColor
        this.selectedMaskColor = colors.selectedMaskColor ?? this.selectedTextColor
    }

    get totalSize() {
        return vec2(
            this.cols * (this.cellSize.x + this.margin) - this.margin,
            this.rows * (this.cellSize.y + this.margin) - this.margin
        );
    }

    setShowReading(index, show) {
        this.showReading.fill(false)
        if (show)
            this.showReading[index] = show;
    }

    clearShowReading() {
        this.showReading = new Array(this.rows * this.cols).fill(false)
    }

    update() {
        const startPos = this.pos.subtract(this.totalSize.scale(0.5)).add(vec2(this.cellSize.x, -this.cellSize.y).scale(0.5));

        // Check which cell is being hovered
        this.hovered = -1;
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const index = i * this.cols + j;
                const pos = startPos.add(vec2(
                    j * (this.cellSize.x + this.margin),
                    this.totalSize.y - i * (this.cellSize.y + this.margin)
                ));
                if (isOverlapping(mousePos, vec2(0.1, 0.1), pos, this.cellSize)) {
                    this.hovered = index;
                    break;
                }
            }
            if (this.hovered !== -1) break;
        }

        // Handle click
        if (this.hovered !== -1 && mouseWasPressed(0)) {
            this.pressed = true;
            if (this.onMouseDown)
                this.onMouseDown(this.hovered);
        }
        else if (this.pressed && mouseWasReleased(0)) {
            this.pressed = false;
            if (this.hovered !== -1) {
                this.selectedIndex = this.hovered;
                if (this.onMouseUp)
                    this.onMouseUp(this.hovered);
            }
        }

        // arrow keys 
        if (!this.pressed) {
            const size = this.rows * this.cols
            if (keyWasPressed(37)) this.selectedIndex = (this.selectedIndex - 1 + size) % size; // Left
            if (keyWasPressed(39)) this.selectedIndex = (this.selectedIndex + 1) % size; // Right
            if (keyWasPressed(38)) this.selectedIndex = (this.selectedIndex - this.cols + size) % size; // Up 
            if (keyWasPressed(40)) this.selectedIndex = (this.selectedIndex + this.cols) % size; // Down
        }
    }

    render() {
        const startPos = this.pos.subtract(this.totalSize.scale(0.5)).add(vec2(this.cellSize.x, -this.cellSize.y).scale(0.5));
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const index = i * this.cols + j;
                const pos = startPos.add(vec2(
                    j * (this.cellSize.x + this.margin),
                    this.totalSize.y - i * (this.cellSize.y + this.margin)
                ));
                const isSelected = index === this.selectedIndex;
                const isHovered = index === this.hovered;
                drawRect(pos, this.cellSize, isSelected ? this.selectedCellColor : ((isHovered && !this.isMobile) ? this.selectedCellColor.lerp(this.cellColor, 0.5) : this.cellColor));
                if (!this.masked[index]) {
                    if (this.showReading[index]) {
                        const word = this.words[index].reading
                        const wrappedWord = wrapText(word, this.cellSize.x, 3, '')
                        const lines = wrappedWord.split('\n').length
                        drawText(
                            wrappedWord,
                            pos.add(vec2(0, (this.cellSize.y * 0.25) + (this.readingSize / 2 * (lines - 1)))),
                            this.readingSize,
                            isSelected ? this.selectedReadingTextColor : this.readingTextColor
                        );
                    }

                    const word = this.words[index].word
                    const wrappedWord = wrapText(word, this.cellSize.x, 3, '')
                    const lines = wrappedWord.split('\n').length
                    drawText(wrappedWord, pos, this.fontSize - (lines - 1) * 0.1, isSelected ? this.selectedTextColor : this.textColor);
                } else {
                    drawText(this.maskIcon, pos, this.fontSize, isSelected ? this.selectedMaskColor : this.maskColor);
                }

                if (this.marked[index]) {
                    this.mark(index)
                }
            }
        }
    }

    setSelected(index) {
        this.selectedIndex = index
    }

    get selectedWord() {
        return this.words[this.selectedIndex]
    }

    mask() {
        this.masked.fill(true);
    }

    unmask(index) {
        this.masked[index] = false;
    }

    unmark() {
        this.marked.fill(false)
    }

    get numMarked() {
        return this.marked.filter(m => m).length
    }

    mark(index) {
        if (index === -1) return
        const col = index % this.cols;
        const row = Math.floor((index - col) / this.cols);
        const cellSize = grid.cellSize;
        const margin = grid.margin;

        const cellPos = this.pos.add(
            vec2(
                col * (cellSize.x + margin) - this.totalSize.x / 2 + cellSize.x / 2,
                this.totalSize.y / 2 - row * (cellSize.y + margin) - cellSize.y / 2
            )
        )

        drawCanvas2D(
            cellPos,
            cellSize,
            0,
            false,
            (context) => {
                context.strokeStyle = (this.selectedIndex === index ? this.cellColor : this.selectedCellColor).toString();
                context.lineWidth = 0.1; // Increased for visibility
                context.beginPath();
                context.arc(0, 0, 0.45, 0, 2 * Math.PI);
                context.stroke();
            },
            false,
            overlayContext // Use the overlay context
        );
    }
}

////////////////////////////////////////////////////////////////
class Box extends EngineObject {
    constructor(pos, size) {
        super(pos, size, undefined, 0, new Color(0, 0, 0, 0))
        this.setCollision()
        this.mass = 0
        this.gravityScale = 0
        this.renderOrder = -1
    }
}

class ElementBox extends Box {
    constructor(element, boundaryPos, color) {
        super()
        this.element = element
        this.boundaryPos = boundaryPos ?? 'bottom'
        this.color = color ?? (boundaryPos === 'full' ? new Color(0, 0, 0, 0) : getColor('ground'))
        this.isVisible = true

        this.onFullCollision = () => false

        this.setupIntersectionObserver()
    }


    setupIntersectionObserver() {
        let threshold, targetElement = this.element;

        switch (this.boundaryPos) {
            case 'full':
                threshold = [0, 1]
                break;
            case 'top':
                threshold = 1;
                break;
            case 'bottom':
                threshold = 0;
                break;
            case 'left':
                threshold = 1;
                break;
            case 'right':
                threshold = 1;
                break;
            case 'middle':
            default:
                threshold = 0.5;
                break;
        }

        const options = {
            root: null,
            rootMargin: '0px',
            threshold: threshold
        }

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const isVisible = entry.isIntersecting &&
                    entry.intersectionRect.width > 0 &&
                    entry.intersectionRect.height > 0;

                if (this.isVisible !== isVisible) {
                    this.isVisible = isVisible;
                }
            });
        }, options);

        this.observer.observe(targetElement);
    }

    collideWithObject(object) {
        if (!this.isVisible) return
        if (this.boundaryPos === 'full')
            return this.onFullCollision(object)
        if (keyWasPressed(40) || object.velocity.y > 0) {
            return false
        }

        return true
    }

    render() {
        if (!this.isVisible) return
        const { x, y, width, height } = this.element.getBoundingClientRect();

        switch (this.boundaryPos) {
            case 'top':
                this.pos = screenToWorld(vec2(x + width / 2, y));
                break;
            case 'bottom':
                this.pos = screenToWorld(vec2(x + width / 2, y + height));
                break;
            case 'left':
                this.pos = screenToWorld(vec2(x, y + height / 2));
                break;
            case 'right':
                this.pos = screenToWorld(vec2(x + width, y + height / 2));
                break;
            case 'full':
            case 'middle':
            default:
                this.pos = screenToWorld(vec2(x + width / 2, y + height / 2));
        }

        this.size = screenToWorld(vec2(x + width, y + height)).subtract(screenToWorld(vec2(x, y)))
        if (this.boundaryPos !== 'full')
            this.size = vec2(this.size.x, 4)
        else
            this.size = vec2(this.size.x, -this.size.y)

        drawRect(this.pos, this.size, this.color)
    }

    destroy() {
        super.destroy();
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}
