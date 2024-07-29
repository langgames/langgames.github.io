
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