// ==UserScript==
// @name         Fpuzzles-FogOfWarLights
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Makes it a bit easier to place Fog of War lightsources for puzzles exported to CTC/Sudokupad
// @author       Dathan
// @match        https://*.f-puzzles.com/*
// @match        https://f-puzzles.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const doShim = function() {
        // Update cage functionality to add Fog of War cages
        cage = function(cell){
            this.cells = [cell];

            this.outlineC = cosmetics[cID('Cage')].outlineC;
            this.fontC = 	cosmetics[cID('Cage')].fontC;

            this.value = '';

            this.show = function(){
                ctx.lineWidth = lineWT;
                ctx.strokeStyle = this.outlineC;
                ctx.setLineDash([(cellSL * 0.44) / 3.5, (cellSL * 0.44) / 3.5]);

                for(var a = 0; a < this.cells.length; a++){
                    for(var b = 0; b < 4; b++){
                        ctx.save();
                        ctx.translate(this.cells[a].x + cellSL/2, this.cells[a].y + cellSL/2);
                        ctx.rotate(b * Math.PI/2);

                        if((b === 0 && (!grid[this.cells[a].i - 1]                  || !this.cells.includes(grid[this.cells[a].i - 1][this.cells[a].j]))) ||
                           (b === 1 && (!grid[this.cells[a].i][this.cells[a].j + 1] || !this.cells.includes(grid[this.cells[a].i][this.cells[a].j + 1]))) ||
                           (b === 2 && (!grid[this.cells[a].i + 1]                  || !this.cells.includes(grid[this.cells[a].i + 1][this.cells[a].j]))) ||
                           (b === 3 && (!grid[this.cells[a].i][this.cells[a].j - 1] || !this.cells.includes(grid[this.cells[a].i][this.cells[a].j - 1]))) ){
                            ctx.beginPath();
                            ctx.moveTo(-cellSL * 0.44 - ctx.lineWidth/2 + 1, -cellSL * 0.44);
                            ctx.lineTo( cellSL * 0.44 + ctx.lineWidth/2 - 1, -cellSL * 0.44);
                            ctx.stroke();
                        }

                        ctx.restore();
                    }
                }

                ctx.fillStyle = boolSettings['Dark Mode'] ? invertBrightnessFromHex(this.fontC) : this.fontC;
                ctx.font = (cellSL * 0.18) + 'px Verdana';
                ctx.textAlign = 'left';
                ctx.fillText(this.value, this.cells[0].x + (cellSL * 0.111), this.cells[0].y + (cellSL * 0.2468));
                ctx.textAlign = 'center';

                ctx.setLineDash([]);
            }

            this.addCellToRegion = function(cell){
                this.cells.push(cell);
                this.sortCells();
            }

            this.sortCells = function(){
                this.cells.sort((a, b) => a.j - b.j);
                this.cells.sort((a, b) => a.i - b.i);
            }

            this.type = function(ch){
                if(this.value.length < 8){
                    this.value += ch;
                    // If 'FOW' is entered into a one cell cage, it should become transparent
                    if(this.value === 'FOW' && this.cells.length === 1){
                        this.outlineC = '#FF00';
                        this.fontC = '#FF00';
                    }else{
                        this.outlineC = cosmetics[cID('Cage')].outlineC;
                        this.fontC = 	cosmetics[cID('Cage')].fontC;
                    }
                }
            }

        }

        // Update text functionality to add Fog of War lightbulbs
        text = function(cells){
            this.cells = cells;

            this.fontC = cosmetics[cID('Text')].fontC;
            this.size =  cosmetics[cID('Text')].size;
            this.angle = cosmetics[cID('Text')].angle;

            this.value = '';

            this.x = function(){
                return this.cells.map(a => a.x + cellSL/2).reduce((a, b) => a + b) / this.cells.length;
            }

            this.y = function(){
                return this.cells.map(a => a.y + cellSL/2).reduce((a, b) => a + b) / this.cells.length;
            }

            this.show = function(){
                ctx.save();
                ctx.translate(this.x(), this.y());
                ctx.rotate(this.angle * (Math.PI/180));

                ctx.fillStyle = boolSettings['Dark Mode'] ? invertBrightnessFromHex(this.fontC) : this.fontC;
                ctx.font = (cellSL * 0.8 * this.size) + 'px Arial';
                ctx.fillText(this.value.length ? this.value : '-', 0, cellSL * 0.3 * this.size);

                ctx.restore();
            }

            this.type = function(ch){
                if(this.value.length < 8 && this.value !== '💡')
                    this.value += ch;
                    // If 'FOW' is entered, it should become a lightbulb
                    if(this.value === 'FOW' || this.value === '💡'){
                        this.value = '💡'
                        this.size = '0.75';
                        this.fontC = '#FF0';
                    }else{
                        this.size =  cosmetics[cID('Text')].size;
                        this.fontC = cosmetics[cID('Text')].fontC;
                    }
            }
        }

        // Puzzle title
        // Unfortunately, there's no way to shim this so it's duplicated in full.
        getPuzzleTitle = function() {
            var title = '';

            ctx.font = titleLSize + 'px Arial';

            if (customTitle.length) {
                title = customTitle;
            } else {
                if (size !== 9)
                    title += size + 'x' + size + ' ';
                if (getCells().some(a => a.region !== (Math.floor(a.i / regionH) * regionH) + Math.floor(a.j / regionW)))
                    title += 'Irregular ';
                if (constraints[cID('Extra Region')].length)
                    title += 'Extra-Region ';
                if (constraints[cID('Odd')].length && !constraints[cID('Even')].length)
                    title += 'Odd ';
                if (!constraints[cID('Odd')].length && constraints[cID('Even')].length)
                    title += 'Even ';
                if (constraints[cID('Odd')].length && constraints[cID('Even')].length)
                    title += 'Odd-Even ';
                if (constraints[cID('Diagonal +')] !== constraints[cID('Diagonal -')])
                    title += 'Single-Diagonal ';
                if (constraints[cID('Nonconsecutive')] && !(constraints[cID('Difference')].length && constraints[cID('Difference')].some(a => ['', '1'].includes(a.value))) && !constraints[cID('Ratio')].negative)
                    title += 'Nonconsecutive ';
                if (constraints[cID('Nonconsecutive')] && constraints[cID('Difference')].length && constraints[cID('Difference')].some(a => ['', '1'].includes(a.value)) && !constraints[cID('Ratio')].negative)
                    title += 'Consecutive ';
                if (!constraints[cID('Nonconsecutive')] && constraints[cID('Difference')].length && constraints[cID('Difference')].every(a => ['', '1'].includes(a.value)))
                    title += 'Consecutive-Pairs ';
                if (constraints[cID('Antiknight')])
                    title += 'Antiknight ';
                if (constraints[cID('Antiking')])
                    title += 'Antiking ';
                if (constraints[cID('Disjoint Groups')])
                    title += 'Disjoint-Group ';
                if (constraints[cID('XV')].length || constraints[cID('XV')].negative)
                    title += 'XV ' + (constraints[cID('XV')].negative ? '(-) ' : '');
                if (constraints[cID('Little Killer Sum')].length)
                    title += 'Little Killer ';
                if (constraints[cID('Sandwich Sum')].length)
                    title += 'Sandwich ';
                if (constraints[cID('Thermometer')].length)
                    title += 'Thermo ';
                if (constraints[cID('Palindrome')].length)
                    title += 'Palindrome ';
                if (constraints[cID('Difference')].length && constraints[cID('Difference')].some(a => !['', '1'].includes(a.value)) && !(constraints[cID('Nonconsecutive')] && constraints[cID('Ratio')].negative))
                    title += 'Difference ';
                if ((constraints[cID('Ratio')].length || constraints[cID('Ratio')].negative) && !(constraints[cID('Nonconsecutive')] && constraints[cID('Ratio')].negative))
                    title += 'Ratio ' + (constraints[cID('Ratio')].negative ? '(-) ' : '');;
                if (constraints[cID('Nonconsecutive')] && constraints[cID('Ratio')].negative)
                    title += 'Kropki ';
                if (constraints[cID('Killer Cage')].length)
                    title += 'Killer ';
                if (constraints[cID('Clone')].length)
                    title += 'Clone ';
                if (constraints[cID('Arrow')].length)
                    title += 'Arrow ';
                if (constraints[cID('Between Line')].length)
                    title += 'Between ';
                if (constraints[cID('Quadruple')].length)
                    title += 'Quadruples '
                if (constraints[cID('Minimum')].length || constraints[cID('Maximum')].length)
                    title += 'Extremes '

                title += 'Sudoku';

                if (constraints[cID('Diagonal +')] && constraints[cID('Diagonal -')])
                    title += ' X';

                if (title === 'Sudoku')
                    title = 'Classic Sudoku';

                if (ctx.measureText(title).width > (canvas.width - 711))
                    title = 'Extreme Variant Sudoku';
            }

            buttons[buttons.findIndex(a => a.id === 'EditInfo')].x = canvas.width / 2 + ctx.measureText(title).width / 2 + 40;

            return title;
        }

        if (window.boolConstraints) {
            let prevButtons = buttons.splice(0, buttons.length);
            window.onload();
            buttons.splice(0, buttons.length);
            for (let i = 0; i < prevButtons.length; i++) {
                buttons.push(prevButtons[i]);
            }
        }
    }

    let intervalId = setInterval(() => {
        if (typeof grid === 'undefined' ||
            typeof exportPuzzle === 'undefined' ||
            typeof importPuzzle === 'undefined' ||
            typeof drawConstraints === 'undefined' ||
            typeof candidatePossibleInCell === 'undefined' ||
            typeof categorizeTools === 'undefined' ||
            typeof drawPopups === 'undefined') {
            return;
        }

        clearInterval(intervalId);
        doShim();
    }, 16);
})();