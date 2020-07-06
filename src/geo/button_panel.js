import * as THREE from 'three';
import { QuadBase } from './quad_base';
import { ParamTypes, ParamItem } from '../params/param';

export class ButtonPanel extends QuadBase {

    constructor(app, pts, params) {
        super(app, pts, 'buttons', false);
        
        this.updateGeometry();
    }

    init() {
        this.params = {
            numX: 1,
            numY: 1,
            segments: 32,
            buttonHeight: 0.2,
            radius: 0.4,
        }

        this.paramList = [
            new ParamItem('radius', 0.4, '', ParamTypes.TYPE_FLOAT, 0.2),
            new ParamItem('segments', 32, '', ParamTypes.TYPE_INT, 4),
            new ParamItem('buttonHeight', 0.2, '', ParamTypes.TYPE_FLOAT)
        ];
    }

    static listParams() {
        return [
            new ParamItem('radius', 0.4, '', ParamTypes.TYPE_FLOAT, 0.2),
            new ParamItem('segments', 32, '', ParamTypes.TYPE_INT, 4),
            new ParamItem('buttonHeight', 0.2, '', ParamTypes.TYPE_FLOAT)
        ];
    }

    _startIndexForButton(x, y) {
        return (((y * this.params.numX) + x) * this.params.segments) + 4;
    }

    updateParams() {
        super.updateParams();

        let buttonAndSpacing = (this.params.radius*2) * 1.8;

        this.params.numX = Math.max(1, Math.floor(this.bounds[0] / (buttonAndSpacing)));
        this.params.numY = Math.max(1, Math.floor(this.bounds[1] / (buttonAndSpacing)));
    
        this.indexOffsets = [0,
            this.params.segments/4,
            this.params.segments/2,
            this.params.segments/4*3
        ];
    }

    _addFacesForButtons() {
        const {numX, numY, segments } = this.params;
        const buttonNum = numX * numY;
        
        // add faces for the buttons
        for (let i=0; i < buttonNum; i++) {
            let buttonVerts = (buttonNum * segments);
            let startIndex = buttonVerts + 4;
            let buttonOffset = i * segments;
            let first = startIndex + buttonOffset;
            
            for (let j=0; j < segments; j++) {
                // button tops
                if (j >= 2) this.addFace([first, first + j - 1, first + j]);
            
                // button sides
                this.addFace([
                    first+j, (first - buttonVerts) + j, (first - buttonVerts + ((j+1) % segments) )
                ]);
                this.addFace([
                    first+j, (first - buttonVerts + ((j+1) % segments) ), (first + ((j+1) % segments) )
                ]);
            }
        }
    }

    _addCornerFanFaces() {
        const {numX, numY, segments } = this.params;

        let starts = [
            this._startIndexForButton(numX-1, numY-1), // 1
            this._startIndexForButton(0, numY-1), // 
            this._startIndexForButton(0, 0),
            this._startIndexForButton(numX-1, 0)
        ];

        let externalVerts = [
            1, 0, 3, 2
        ];

        for (let i=0; i < 4; i++) {
            let start = starts[i];
            let external = externalVerts[i];
            let offset = start + this.indexOffsets[i];

            for (let j=0; j < segments/4; j++) {
                let curr = (this.indexOffsets[i] + j) % segments;
                let next = (this.indexOffsets[i] + j + 1) % segments;
                
                this.addFace([start+curr, external, start+next]);
            }
        }     
    }

    _addExteriorEdgeFaces() {
        const {numX, numY } = this.params;

        // top, right, bottom, left
        let indexOffsetLookup = [1,0,3,2];

        for (let i=0; i < 4; i++) {
            let num = ((i % 2) === 0) ? numX : numY;

            let corner1 = i;
            let corner2 = (i + 1) % 4;
        
            for (let j=0; j < num; j++) {
                let ioLookup = indexOffsetLookup[i]
                let currPoint = this.indexOffsets[ioLookup];
                let nextPoint = this.indexOffsets[ioLookup];
                let lastPoint = this.indexOffsets[ioLookup];

                let buttonCent1 = 0;
                let buttonCent2 = 0;
                switch (i) {
                    case 0:
                        // top    
                        buttonCent1 = this._startIndexForButton(j-1, numY-1);
                        buttonCent2 = this._startIndexForButton(j, numY-1);
                        break
                    case 1:
                        // right
                        buttonCent1 = this._startIndexForButton(numX-1, j - 1);
                        buttonCent2 = this._startIndexForButton(numX-1, j);
                        lastPoint += this._startIndexForButton(numX-1, numY-1);
                        break;
                    case 2:
                        // bottom
                        buttonCent1 = this._startIndexForButton(j-1, 0);
                        buttonCent2 = this._startIndexForButton(j, 0);
                        lastPoint += this._startIndexForButton(numX-1, 0);
                        break;
                    case 3:
                        // left
                        buttonCent1 = this._startIndexForButton(0, j-1);
                        buttonCent2 = this._startIndexForButton(0, j);
                        break;
                }

                currPoint += buttonCent1;
                nextPoint += buttonCent2;

                if (j === 0) {
                    if ((i===0) || (i===3)) {
                        this.addFace([nextPoint, corner2, corner1]);
                    } else {
                        this.addFace([lastPoint, corner2, corner1]);
                    }
                } else {
                    if ((i===0) || (i===3)) {
                        this.addFace([currPoint, nextPoint, corner2]);
                    } else {
                        this.addFace([nextPoint, currPoint, corner2]);
                    }
                }
            }
        }
    }

    _addInteriorFaces() {
        const {numX, numY, segments } = this.params;

        let i0, i1, i2, i3;

        for (let i=0; i < numX; i++) {
            for (let j=0; j < numY; j++) {

                let currStart = this._startIndexForButton(i, j);

                if (i < numX-1) {
                    // connect left to right
                    let nextX = this._startIndexForButton(i+1, j);

                    for (let k=0; k < segments/2; k++) {
                        i0 = this.indexOffsets[1] - k;   // top-left
                        i1 = nextX + this.indexOffsets[1] + k;     // top-right
                        i2 = nextX + this.indexOffsets[1] + ((k+1) % segments);     // bottom-right
                        i3 = this.indexOffsets[1] - k - 1;     // bottom-left

                        if (i0 < 0) i0 += segments;
                        if (i3 < 0) i3 += segments;
                        i0 += currStart;
                        i3 += currStart; 
                        
                        this.addQuad([i0, i1, i2, i3]);
                    }

                    // central panels
                    if (j < numY - 1) {
                        i0 = this._startIndexForButton(i, j+1) + this.indexOffsets[3];
                        i1 = this._startIndexForButton(i+1, j+1) + this.indexOffsets[3];
                        i2 = this._startIndexForButton(i+1, j) + this.indexOffsets[1];
                        i3 = this._startIndexForButton(i, j) + this.indexOffsets[1];

                        this.addQuad([i0, i1, i2, i3]);
                    }
                    
                }

                if (j < numY-1) {
                    let nextY = this._startIndexForButton(i, j+1);

                    if (i === 0) {
                        // connect up on the left
                        for (let k=0; k< segments/4; k++) {
                            i0 = nextY + this.indexOffsets[2] + k;
                            i1 = nextY + this.indexOffsets[2] + k + 1;
                            i2 = currStart + this.indexOffsets[2] - k - 1;
                            i3 = currStart + this.indexOffsets[2] - k;

                            this.addQuad([i0, i1, i2, i3]);
                        }
                    }

                    if (i === numX-1) {
                        // connect up on the right
                        for (let k=0; k < segments/4; k++) {
                            i0 = nextY + ((this.indexOffsets[3] + k) % segments);
                            i1 = nextY + ((this.indexOffsets[3] + (k + 1)) % segments);
                            i2 = currStart + this.indexOffsets[1] - k - 1;
                            i3 = currStart + this.indexOffsets[1] - k;

                            this.addQuad([i0, i1, i2, i3]);
                        }
                    }
                    
                }

            }
        }
    }

    updateGeometry() {
        this.clearGeo();
        this.updateParams();

        let p = this.geo.vertices;
        let f = this.geo.faces;

        const {numX, numY, segments, buttonHeight, radius } = this.params;

        /*
        let buttonAndSpacing = (radius*2) + 0.2;
        let numX = Math.max(1, Math.floor(this.bounds[0] / (buttonAndSpacing)));
        let numY = Math.max(1, Math.floor(this.bounds[1] / (buttonAndSpacing)));
        */
       
        let buttonNum = numX * numY;

        let spacing = new THREE.Vector2();
        spacing.x = this.bounds[0] / numX;
        spacing.y = this.bounds[1] / numY;

        let sliceAngle = (Math.PI * 2) / segments;
        let offsets = [];
        for (let i=0; i < segments; i++) {
            let theta = (i * sliceAngle); //  + Math.PI/2;
            let x = Math.cos(theta) * radius;
            let y = Math.sin(theta) * radius;
            offsets.push({
                x: x,
                y: y
            });
        }

        // add verts for the button bases
        for (let i=0; i < (numX * numY); i++) {
            let x = i % numX;
            let y = Math.floor(i / numX);
            
            let cX = spacing.x * (x + 0.5);
            let cY = spacing.y * (y + 0.5); 
            
            let center = new THREE.Vector3();
            center.copy(this.basePoints[3]);
            center = this.movePoint(center, [cX, cY, 0]);

            for (let j=0; j < segments; j++) {
                this.geo.vertices.push(this.movePoint(center, [offsets[j].x, offsets[j].y, 0]));
            }
        }

        // add verts for the button tops
        for (let i=0; i < (numX * numY * segments); i++) {
            this.geo.vertices.push(
                this.movePoint(this.geo.vertices[i+4], [0,0,buttonHeight])
            );
        }

        this._addFacesForButtons();
        this._addCornerFanFaces();
        this._addExteriorEdgeFaces();
        this._addInteriorFaces();

        this.finalizeGeo();
    }
}