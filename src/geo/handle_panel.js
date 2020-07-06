import { QuadBase } from './quad_base';
import { HoleQuad } from './hole_quad';
import { ParamTypes, ParamItem } from '../params/param';

export class HandlePanel extends QuadBase {

    constructor(app, pts) {
        super(app, pts);
    }

    init() {
        this.params = {
            radius: 0.4,
            handleHeight: 0.5,
            separation: 0.1,
            handleSegments: 32,  // must be multiple of 4
            turnSegments: 8,
            turnRadius: 0.5,
        }

        this.paramList = [
            new ParamItem('radius', 0.4, '', ParamTypes.TYPE_FLOAT, 0.2),
            new ParamItem('handleSegments', 32, '', ParamTypes.TYPE_INT, 4),
            new ParamItem('handleHeight', 0.5, '', ParamTypes.TYPE_FLOAT, 0.1),
            new ParamItem('turnRadius', 0.5, '', ParamTypes.TYPE_FLOAT, 0.4),
            new ParamItem('separation', 0.1, '', ParamTypes.TYPE_FLOAT, 0.1)
        ];
    }

    static listParams() {
        return [
            new ParamItem('radius', 0.4, '', ParamTypes.TYPE_FLOAT, 0.2),
            new ParamItem('handleSegments', 32, '', ParamTypes.TYPE_INT, 4),
            new ParamItem('handleHeight', 0.5, '', ParamTypes.TYPE_FLOAT, 0.1),
            new ParamItem('turnRadius', 0.5, '', ParamTypes.TYPE_FLOAT, 0.4),
            new ParamItem('separation', 0.1, '', ParamTypes.TYPE_FLOAT, 0.1)
        ];
    }    

    _addCornerFans() {
        const { handleSegments } = this.params;
        
        // add corner fans
        for (let i=0; i < 4; i++) {
            let startIndex = 4 + (handleSegments * i);
            let offset = ((5 - i) % 4) * (handleSegments / 4);

            for (let j=0; j < Math.floor(handleSegments/4); j++) {
                this.addFace([
                    startIndex + offset + j,
                    i,
                    startIndex + ((offset + j + 1) % handleSegments)
                ]);
                
            }
        }
    }

    _addExteriorFaces() {
        const { handleSegments } = this.params;

        // add exterior edges
        for (let i=0; i < 4; i++) {

            let offset  = (handleSegments/4) * ((5-i) % 4);

            let vert1 = i;
            let vert2 = (i+1) % 4;
            let vert3 = 4 + (handleSegments * ((i + 1)%4)) + offset;
            let vert4 = 4 + (handleSegments * i) + offset;

            this.addQuad([vert1, vert2, vert3, vert4]);
        }

        // add faces joining holes horizontally
        for (let i=0; i < 2; i++) {
            for (let j=0; j < (handleSegments/4); j++) {
                let cornerStart = ((i*2) * handleSegments) + 4; // 
                let cornerNext = ((i * 2 + 1) * handleSegments) + 4;
    
                let offset = (handleSegments/4) * (i * 2 + 1);
                this.addQuad([
                    cornerStart + offset - j,
                    cornerNext + offset + j,
                    cornerNext + ((offset + j + 1) % handleSegments),
                    cornerStart + offset - j - 1,
                    
                ]);
            }    
        }
        
        // connect joining holes vertically
        for (let i=0; i < 2; i++) {
            let startCorner = i;
            let endCorner = (i === 0) ? 3 : 2;

            let startIndex = 4 + (startCorner * handleSegments);
            let endIndex = 4 + (endCorner * handleSegments);

            for (let j=0; j < handleSegments/2; j++) {
                let vert1 = startIndex + (handleSegments/2) + j;
                let vert2 = startIndex + ((handleSegments/2) + j + 1) % handleSegments;
                let vert3 = endIndex + (handleSegments/2) - j - 1;
                let vert4 = endIndex + (handleSegments/2) - j;
    
                this.addQuad([vert1, vert2, vert3, vert4]);
            }
        }
    }

    _addHandleFaces() {
        const { handleSegments, turnSegments } = this.params;

        // add faces for z-aligned parts of handles
        for (let i=0; i < 4; i++) {
            for (let j=0; j < handleSegments; j++) {
                this.addQuad([
                    (handleSegments * i) + 4 + ((j + 1)%handleSegments),
                    (handleSegments * i) + 4 + j,
                    (handleSegments * i) + 4 + j + (handleSegments * 4),
                    (handleSegments * i) + 4 + ((j + 1)%handleSegments) + (handleSegments * 4),
                ]);
            }
        }

        // add in elbow faces
        for (let i=0; i < 4; i++) {
            let startIndexBase = 4 + (handleSegments * 4);
            startIndexBase += (handleSegments * i);
            
            let startIndex = 4 + (4 * handleSegments * 2);
            startIndex += (turnSegments * handleSegments * i);

            for (let k=0; k < handleSegments; k++) {
                if (i < 2) {
                    this.addQuad([
                        startIndexBase + ((k + 1) % handleSegments),
                        startIndexBase + k,
                        startIndex + k,
                        startIndex + ((k + 1) % handleSegments),
                    ]);
                } else {
                    let i1 = (k === 0) ? 0 : handleSegments - k;
                    let i2 = handleSegments - k - 1;

                    this.addQuad([
                        startIndex + i1,
                        startIndex + i2,
                        startIndexBase + ((k + 1) % handleSegments),                        
                        startIndexBase + k,
                    ]);           
                }
            }

            for (let j=0; j < turnSegments-1; j++) {

                for (let k=0; k < handleSegments; k++) {
                    
                    if (i < 2) {
                        this.addQuad([
                            startIndex + (j * handleSegments) + ((k + 1) % handleSegments),
                            startIndex + (j * handleSegments) + k,
                            startIndex + (j * handleSegments) + k + handleSegments,
                            startIndex + (j * handleSegments) + ((k + 1) % handleSegments) + handleSegments,
                        ]);
                    } else {
                        this.addQuad([
                            startIndex + (j * handleSegments) + k,
                            startIndex + (j * handleSegments) + ((k + 1) % handleSegments),
                            startIndex + (j * handleSegments) + ((k + 1) % handleSegments) + handleSegments,
                            startIndex + (j * handleSegments) + k + handleSegments,
                        ]);
                    }

                }
            }
        }

        // make faces joining pairs of elbows
        for (let i=0; i < 2; i++) {
            let startIndex = 4 + (handleSegments * 8) + (i * (handleSegments * turnSegments));
            startIndex += (handleSegments * (turnSegments - 1));
            
            let endCorner = (i === 0) ? 3 : 2;
            let endIndex = 4 + (handleSegments * 8) + (endCorner * (handleSegments * turnSegments));
            endIndex += (handleSegments * (turnSegments - 1));

            for (let j=0; j < handleSegments; j++) {
                this.addQuad([
                    startIndex + ((j+1) % handleSegments),
                    startIndex + j,
                    endIndex + j,
                    endIndex + ((j+1) % handleSegments),
                ]);
            }
        }
    }

    updateGeometry() {
        this.clearGeo();
        this.updateParams();

        let p = this.geo.vertices;
        let f = this.geo.faces;

        const { 
            radius,
            handleHeight,
            separation,
            handleSegments,
            turnSegments,
            turnRadius,
        } = this.params;

        const offsets = [
            [1,-1],
            [-1,-1],
            [-1,1],
            [1,1]
        ];

        const offsetAmt = radius + separation;

        let handleVerts = [];
        let handleOffsets = [];

        for (let i=0; i < 4; i++) {
            let center = this.movePoint(
                this.geo.vertices[i], [
                    offsetAmt * offsets[i][0],
                    offsetAmt * offsets[i][1],
                    0
                ]
            );
            handleOffsets[i] = center;

            let newPoints = this.addCircleVerts(center, radius, handleSegments);
            handleVerts = handleVerts.concat(newPoints);
        }

        // add verts away from the panel
        handleVerts.forEach(v => {
            this.geo.vertices.push(this.movePoint(v, [
                0, 0, handleHeight
            ]));
        });

        // add verts for handle turns
        let turnTheta = (Math.PI/2) / turnSegments;

        for (let i=0; i < 4; i++) {
            let newCenter = this.movePoint(handleOffsets[i], [
                0,
                (i < 2) ? -(turnRadius) : turnRadius,
                handleHeight
            ]);

            for (let j=0; j < turnSegments; j++) {
                let angle = (j+1) * turnTheta;

                let y = Math.cos(-angle) * turnRadius;
                let z = -Math.sin(-angle) * turnRadius;

                if (i > 1) {
                    angle = Math.PI - angle;
                    y *= -1;
                }

                let c = this.movePoint(newCenter, [
                    0,
                    y,
                    z
                ]);
                this.addCircleVerts(c, radius, handleSegments, angle);
            }
        }

        // ------ ADD FACES --------
        this._addCornerFans();
        this._addExteriorFaces();
        this._addHandleFaces();

        this.addChildren();

        this.finalizeGeo();
    }

    addChildren() {
        const { handleSegments } = this.params;

        let pts = [];

        pts[0] = 4;
        pts[1] = 4 + (handleSegments * 1.5);
        pts[2] = 4 + (handleSegments * 2.5);
        pts[3] = 4 + (handleSegments * 3);

        let c = new HoleQuad(this.app, this.getVertsFromIndices(pts));
        this.children.push(c);
        c.addToScene(this.app);        
    }
}