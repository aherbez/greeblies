import { QuadBase } from './quad_base';
import { HoleQuad } from './hole_quad';
import { ParamTypes, ParamItem } from '../params/param';

export class BevelPanel extends QuadBase {

    constructor(app, pts) {
        super(app, pts);
    }

    init() {
        let extrudeAmt = parseFloat(document.getElementById('param-extrude').value);
        let bevelAmt = parseFloat(document.getElementById('param-bevel').value);

        this.params = {
            extrude: extrudeAmt,
            bevel: bevelAmt,
            inset: 0.01,
            bevelFacets: 8, // CANNOT be less than 2
        };

        this.paramList = [
            new ParamItem('extrude', 1, '', ParamTypes.TYPE_FLOAT),
            new ParamItem('bevel', 0.4, '', ParamTypes.TYPE_FLOAT, 0.1),
            new ParamItem('bevelFacets', 8, '', ParamTypes.TYPE_INT, 2)
        ];
    }

    static listParams() {
        return [
            new ParamItem('extrude', 1, '', ParamTypes.TYPE_FLOAT),
            new ParamItem('bevel', 0.4, '', ParamTypes.TYPE_FLOAT, 0.1),
            new ParamItem('bevelFacets', 8, '', ParamTypes.TYPE_INT, 1)
        ];
    }

    addBevelFaces() {
        let p = this.geo.vertices;
        let f = this.geo.faces;

        const { bevel, bevelFacets, extrude, inset } = this.params;

        let sliceAmt = (Math.PI / 2) / (bevelFacets-1);
        
        let offsets = [];
        for (let i=0; i < bevelFacets; i++) {
            offsets.push({
                x: Math.cos(sliceAmt * i) * (bevel - inset),
                y: Math.sin(sliceAmt * i) * (bevel - inset)
            });
        }

        let topLeft = [];
        let topRight = [];
        let botRight = [];
        let botLeft = [];

        for (let i=0; i < bevelFacets; i++) {
            let tl = this.movePoint(p[0], [
                 bevel - offsets[i].x,
                -bevel + offsets[i].y,
                0 
            ]);

            let tr = this.movePoint(p[1], [
                -bevel + offsets[i].y,
                -bevel + offsets[i].x,
                0 
            ]);

            let br = this.movePoint(p[2], [
                -bevel + offsets[i].x,
                 bevel - offsets[i].y,
                0 
            ]);

            let bl = this.movePoint(p[3], [
                bevel - offsets[i].y,
                bevel - offsets[i].x,
                0 
            ]);
            
            topLeft.push(tl);
            topRight.push(tr);
            botRight.push(br);
            botLeft.push(bl);
        }

        let newVerts = topLeft.concat(topRight).concat(botRight).concat(botLeft);

        this.addVerts(newVerts);
        newVerts = newVerts.map(v => 
            this.movePoint(v, [0,0,extrude])
        );
        this.addVerts(newVerts);

        // add four more verts for the extruded bit
        for (let i=0; i < 4; i++) {
            let p1 = 4 + (bevelFacets * i) + (bevelFacets * 4);
            let p2 = 4 + (bevelFacets * i) + (bevelFacets - 1) + (bevelFacets * 4);

            let newVert = this.geo.vertices[p1].clone().add(this.geo.vertices[p2]).divideScalar(2);

            this.geo.vertices.push(newVert);
        }

        // add the faces
        for (let i=0; i < 4; i++) {
            for (let j=1; j < bevelFacets; j++) {
                // corner fan for base
                this.addFace([
                    i,
                    4 + (i * bevelFacets) + j - 1,
                    4 + (i * bevelFacets) + j
                ]);

                // corner fan for extrusion
                {
                    let cent = 4 + (bevelFacets * 8) + i;
                    this.addFace([
                        cent,
                        4 + (i * bevelFacets) + j + (bevelFacets * 4),
                        4 + (i * bevelFacets) + j - 1 + (bevelFacets * 4)
                    ]);
                }

                // join to extruded surface
                {
                    let p0 = 4 + (i * bevelFacets) + j - 1;
                    let p1 = 4 + (i * bevelFacets) + j;
                    let p2 = 4 + (i * bevelFacets) + j + (bevelFacets * 4);
                    let p3 = 4 + (i * bevelFacets) + j + (bevelFacets * 4) - 1;
                    
                    this.addQuad([p0, p1, p2, p3]);
                }
            }

            // quad to ensure watertightness            
            {
                let p0 = i;
                let p1 = (i + 1) % 4;
                let p2 = 4 + ((i + 1) % 4) * bevelFacets;
                let p3 = 4 + (i * bevelFacets) + (bevelFacets - 1);
                this.addQuad([p0, p1, p2, p3]);
            }

            // quad to seal extruded face
            {
                let p0 = 4 + (bevelFacets * 4) + (i * bevelFacets) + (bevelFacets - 1);
                let p1 = 4 + (bevelFacets * 4) + (((i + 1) % 4) * bevelFacets);
                let p2 = 4 + (bevelFacets * 8) + ((i+1)%4);
                let p3 = 4 + (bevelFacets * 8) + i;
                this.addQuad([p0, p1, p2, p3]);
            }
        }

        this.addChildren();
    }

    addChildren() {
        const { bevelFacets } = this.params;
        
        let baseIndices = [];
        let extrudedIndices = [];

        let pts = [];

        for (let i=0; i < 4; i++) {
            pts[i] = [];
            pts[i][0] = 4 + (bevelFacets * i) + (bevelFacets - 1);
            pts[i][1] = 4 + (bevelFacets * ((i+1) % 4));
            pts[i][2] = 4 + (bevelFacets * 4) + (bevelFacets * ((i+1) % 4));
            pts[i][3] = 4 + (bevelFacets * 4) + + (bevelFacets * i) + (bevelFacets - 1);
        }

        let c = null;

        for (let i=0; i < 4; i++) {
            c = new HoleQuad(this.app, this.getVertsFromIndices([
                pts[i][0],
                pts[i][1],
                pts[i][2],
                pts[i][3]
            ]));
            this.children.push(c);
            c.addToScene(this.app);
        }

        let frontIndexStart = 4 + (bevelFacets * 8);
        c = new HoleQuad(this.app, this.getVertsFromIndices([
            frontIndexStart,
            frontIndexStart+1,
            frontIndexStart+2,
            frontIndexStart+3
        ]));
        this.children.push(c);
        c.addToScene(this.app);

    }

    updateGeometry() {
        this.clearGeo();
        this.updateParams();

        this.addBevelFaces();

        this.finalizeGeo();
    }
}