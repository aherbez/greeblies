import * as THREE from 'three';
import { QuadBase } from './quad_base';
import { HoleQuad } from './hole_quad';
import { ParamTypes, ParamItem } from '../params/param';

export class DialPanel extends QuadBase {
    constructor(app, pts) {
        super(app, pts);
    }

    init() {
        this.params = {
            facets: 16,
            width1: 0.8,
            width2: 0.6,
            height1: 0.7,
            height2: 0.1,
            depth: 1,
            needleThick: 0.8,
            needleWidth: 0.4,
            needlePos: 0.5
        }

        this.paramList = [
            new ParamItem('facets', 16, '', ParamTypes.TYPE_INT, 4),
            new ParamItem('depth', 1, '', ParamTypes.TYPE_FLOAT),
            new ParamItem('width1', 0.8, '', ParamTypes.TYPE_FLOAT, 0, 1),
            new ParamItem('width2', 0.6, '', ParamTypes.TYPE_FLOAT, 0, 1),
            new ParamItem('needleThick', 0.8, '', ParamTypes.TYPE_FLOAT, 0),
        ];
    }

    static listParams() {
        return [
            new ParamItem('facets', 16, '', ParamTypes.TYPE_INT, 4),
            new ParamItem('depth', 1, '', ParamTypes.TYPE_FLOAT),
            new ParamItem('width1', 0.8, '', ParamTypes.TYPE_FLOAT, 0, 1),
            new ParamItem('width2', 0.6, '', ParamTypes.TYPE_FLOAT, 0, 1),
            new ParamItem('needleThick', 0.8, '', ParamTypes.TYPE_FLOAT, 0),
        ];
    }

    _addFrontFaces() {
        const { facets } = this.params;

        let tl = 4;
        let tr = tl + facets;
        let br = tr + 1;
        let bl = br + 1;

        this.addQuad([0,tl,bl,3]);
        this.addQuad([tr,1,2,br]);
        this.addQuad([bl,br,2,3]);
        for (let i=1; i <= facets; i++) {
            let extInd = (i <= facets/2) ? 0 : 1;
            this.addFace([4+i-1, 4+i, extInd]);
        }
        this.addFace([1, 0, 4 + (facets/2)]);
    }

    _addInteriorFaces() {
        const { facets } = this.params;

        let total = 4 + facets - 1;
        let topStart = 4;
        let botStart = topStart + total;

        for (let i=0; i < total; i++) {

            if (i === total-2) continue;

            this.addQuad([
                topStart + i,
                topStart + ((i+1) % total),
                botStart + ((i+1) % total),
                botStart + i
            ]);
        }
    }

    _addBottomArcVerts() {
        const { facets, width2, height2, depth, needleThick } = this.params;
        
        let radX = (this.bounds[0] * (width2 * 0.8))/2;
        let radY = (this.bounds[1] * (height2 * 0.8));

        let newVerts = [];
        let sliceAmt = Math.PI / facets;
        for (let i=0; i <= facets; i++) {
            newVerts.push(this.movePoint(this.geo.vertices[3], [
                this.bounds[0]/2 + (Math.cos(i * sliceAmt) * radX),
                (this.bounds[1] * height2) + (Math.sin(i * sliceAmt) * radY),
                -depth
            ]));
        }
        this.addVerts(newVerts);

        this.addVerts(newVerts.map(v => this.movePoint(v, [
            0,0, (depth * needleThick)
        ])));
    }

    _addBottomArcFaces() {
        const { facets } = this.params;

        let frameTotal = 4 + facets - 1;
        let arcStart1 = 4 + (frameTotal * 2);
        let arcStart2 = arcStart1 + (facets + 1);

        let frameBottom = [
            4 + frameTotal + facets + 2,
            4 + frameTotal + facets + 1,
            4 + facets + 1,
            4 + facets + 2
        ];

        for (let i=1; i <= facets; i++) {

            if (i === facets/2) continue;
            if (i === (facets/2)+1) continue;

            this.addQuad([
                arcStart1 + i,
                arcStart1 + i - 1,
                arcStart2 + i - 1,
                arcStart2 + i 
            ]);
        }
        this.addQuad([
            frameBottom[0],
            arcStart1 + facets,
            arcStart2 + facets,
            frameBottom[3]
        ]);
    
        this.addQuad([
            arcStart1,
            frameBottom[1],
            frameBottom[2],
            arcStart2
        ]);

        this.addQuad([
            arcStart2 + facets,
            arcStart2,
            frameBottom[2],
            frameBottom[3]
        ]);

        for (let i=1; i < facets; i++) {
            this.addFace([
                arcStart2 + i - 1,
                arcStart2 + i,
                arcStart2 + facets
            ]);
        }
    }

    _addNeedleVerts() {
        const { facets, height1, width1, needleWidth, depth, needleThick } = this.params;

        let needlePos = Math.random();
        let needleRad = needleWidth/2;
        let needleTipX = ((this.bounds[0] * width1) - (needleWidth * 4)) * needlePos;
        let needleCent = new THREE.Vector2(
            (this.bounds[0] * (1 - width1)/2 ) + needleTipX + (needleWidth * 2),
            this.bounds[1] * height1
        );

        let sliceTheta = (Math.PI * 0.8)  / facets;
        let thetaOffset = Math.PI * 0.1;
        let newVerts = [];
        
        for (let i=0; i <= facets; i++) {
            let angle = (i * sliceTheta) + thetaOffset;
            newVerts.push(this.movePoint(this.geo.vertices[3], [
                needleCent.x + (Math.cos(Math.PI - angle) * needleRad),
                needleCent.y + (Math.sin(Math.PI - angle) * needleRad),
                -depth
            ]));
        }
        this.addVerts(newVerts);
        this.addVerts(newVerts.map(v => this.movePoint(v, [0, 0, depth * needleThick])));
    }

    _addBackFaces() {
        const { facets } = this.params;

        let frameTotal = 4 + facets - 1;

        let tipVertStart = 4 + (frameTotal * 2) + (facets * 2 + 2);

        // connect top edge to needle tip
        for (let i=0; i < facets; i++ ) {
            this.addQuad([
                4 + frameTotal + i,
                4 + frameTotal + i + 1,
                tipVertStart + i + 1,
                tipVertStart + i
            ]);
        }

        let botArcStart = 4 + (frameTotal * 2);
        
        let tl = 4 + frameTotal;
        let tr = 4 + frameTotal + facets;

        // connect side edges
        for (let i=0; i < facets; i++) {

            if (i === facets/2 || i === (facets/2 - 1)) continue;

            let frameIndex = (i < facets/2) ? tr : tl;
            this.addFace([
                botArcStart + i + 1,
                botArcStart + i,
                frameIndex
            ]);
        }

        this.addFace([
            tr,
            botArcStart,
            tr + 1
        ]);

        this.addFace([
            tl,
            4 + frameTotal * 2 - 1,
            botArcStart + facets,
        ]);

        let needleStartIndex = 4 + (frameTotal * 2) + (facets*2+2);

        this.addFace([
            tr,
            needleStartIndex + facets,
            botArcStart + (facets/2) - 1
        ]);

        
        this.addFace([
            needleStartIndex,
            tl,
            botArcStart + (facets/2) + 1
        ]);
        
    }

    _addNeedleFaces() {
        const { facets } = this.params;

        let frameTotal = 4 + facets - 1;
        let needleStartIndex = 4 + (frameTotal * 2) + (facets*2+2);
        let bottomArcStart = 4 + (frameTotal * 2);

        // needle tip risers
        for (let i=1; i <= facets; i++) {
            this.addQuad([
                needleStartIndex + i - 1,
                needleStartIndex + i,
                needleStartIndex + facets + i + 1,
                needleStartIndex + facets + i,
            ]);
        }

        // needle tip fan
        for (let i=1; i < facets; i++) {
            this.addFace([
                needleStartIndex + facets + i + 1,
                needleStartIndex + facets + i,
                needleStartIndex + facets*2+1
            ]);
        }

        let bottomQuad = [
            bottomArcStart + (facets/2) + 1,
            bottomArcStart + (facets/2) - 1,
            bottomArcStart + facets + 1 + (facets/2) - 1,
            bottomArcStart + facets + 1 + (facets/2) + 1,            
        ];

        let topQuad = [
            needleStartIndex,
            needleStartIndex + facets,
            needleStartIndex + facets*2 + 1,
            needleStartIndex + facets + 1,
        ];

        let frontArcMiddle = bottomArcStart + facets + 1 + (facets/2);

        // sides
        this.addQuad([
            bottomQuad[0],
            topQuad[0],
            topQuad[3],
            bottomQuad[3]
        ]);

        this.addQuad([
            topQuad[2],
            topQuad[1],
            bottomQuad[1],
            bottomQuad[2]
        ]);

        // front
        this.addFace([
            frontArcMiddle,
            topQuad[3],
            bottomQuad[3]
        ]);

        this.addFace([
            topQuad[2],
            frontArcMiddle,
            bottomQuad[2]
        ]);

        this.addFace([
            topQuad[2],
            topQuad[3],
            frontArcMiddle
        ]);
    }

    updateGeometry() {
        this.clearGeo();
        this.updateParams();

        const {
            facets,
            height1,
            height2,
            width1,
            width2,
            depth
        } = this.params;

        let topCent = new THREE.Vector2(this.bounds[0]/2, this.bounds[1] * height1);
        let botCent = new THREE.Vector2(this.bounds[0]/2, this.bounds[1] * height2);

        let topOffsetX = this.bounds[0] * (0.5 - (width1/2));
        let botOffsetX = this.bounds[0] * (0.5 - (width2/2));

        // add the cutout verts
        let newVerts = [];
        newVerts.push(this.movePoint(this.geo.vertices[3], [
            topOffsetX,
            topCent.y,
            0
        ]));
        // add arc here
        let sliceAmt = Math.PI / facets;
        let radX = (this.bounds[0] * width1) / 2;
        let radY = this.bounds[1] * ((1 - height1) * 0.8);
        for (let i=1; i < facets; i++) {
            let angle = Math.PI - (i * sliceAmt);
            newVerts.push(this.movePoint(this.geo.vertices[3], [
                this.bounds[0]/2 + (Math.cos(angle) * radX),
                topCent.y + (Math.sin(angle) * radY),
                0
            ]));
        }
        
        newVerts.push(this.movePoint(this.geo.vertices[2], [
            -topOffsetX,
            topCent.y,
            0
        ]));
        newVerts.push(this.movePoint(this.geo.vertices[2], [
            -botOffsetX,
            botCent.y,
            0
        ]));
        newVerts.push(this.movePoint(this.geo.vertices[3], [
            botOffsetX,
            botCent.y,
            0
        ]));

        this.addVerts(newVerts);

        let offsetVerts = newVerts.map(v => this.movePoint(v, [
            0,0, -depth
        ]));
        this.addVerts(offsetVerts);

        this._addBottomArcVerts();
        this._addNeedleVerts();

        this._addFrontFaces();
        this._addInteriorFaces();
        this._addBottomArcFaces();
        
        this._addBackFaces();
        this._addNeedleFaces();

        this.finalizeGeo();
    }
}