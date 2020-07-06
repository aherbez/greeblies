import * as THREE from 'three';
import { QuadBase } from './quad_base';
import { QuadTypes, QuadData } from './quad_data';
import { ButtonPanel } from './button_panel';
import { BevelPanel } from './bevel_panel';
import { HandlePanel } from './handle_panel';
import { DialPanel } from './dial_panel';

const NEAR_ZERO = 0.0001;
const SMALLEST_RECT = 0.01;

function sign(n) {
    if (Math.abs(n) < NEAR_ZERO) return 0;
    if (n > 0) return 1;
    return -1;
}

function sameHole(indices) {
    const holeNums = indices.map(i => {
        return Math.floor((i-4)/4);
    });
    return ((holeNums[0] === holeNums[1]) && (holeNums[1] === holeNums[2]));
}

function sideOfLine(start, end, p) {
    /*
    Assuming the points are (Ax,Ay) (Bx,By) and (Cx,Cy), you need to compute:

        (Bx - Ax) * (Cy - Ay) - (By - Ay) * (Cx - Ax)

    This will equal zero if the point C is on the line formed by points A and B,
    and will have a different sign depending on the side. Which side this is depends
    on the orientation of your (x,y) coordinates, but you can plug test values for A,B and C
    into this formula to determine whether negative values are to the left or to the right.
    */
    let diff = end.clone().sub(start);
    let point = p.clone().sub(start);

    let comparison = (diff.x) * (point.y) - (diff.y) * (point.x);
    return sign(comparison);
}

class AnnotatedPoint2d {
    constructor(pt, index, isStart = false) {
        this.pt = pt;
        this.index = index || 0;
        this.isStart = isStart;
    }

    get x() {
        return this.pt.x;
    }

    get y() {
        return this.pt.y;
    }

    eqY(p) {
        return (Math.abs(p.y - this.y) < NEAR_ZERO);
    }
}

class QuadEdge {
    constructor(pt1, pt2, isStart = false) {
        this.pts = [pt1, pt2];
        this.isStart = isStart;
        this.pts[0].isStart = this.isStart;
        this.pts[1].isStart = this.isStart;
    }

    get start() {
        return this.pts[0];
    }

    get end() {
        return this.pts[1];
    }

    get xpos() {
        return this.pts[0].x;
    }
}

class PointList {
    constructor() {
        this.points = [];
    }

    // insert point based on y-value
    addPoint(p) {
        for (let i=0; i < this.points.length; i++) {
            if (this.points[i].y > p.y) {
                this.points.splice(i,0,p);
                return;
            }
        }
        this.points.push(p);
    }

    // if the point is in between previous points
    //  returns two points (above and below)
    // if the point is on the same Y-pos
    //  returns three points (above, equal, and below)
    getPointsNear(p) {
        for (let i=0; i < this.points.length; i++) {
            // new point equals an existing point,
            // return three points (before, eq, and after)
            if (this.points[i].eqY(p)) {
                let pts = [];
                
                if (i > 0) {
                    pts.push(this.points[i-1]);
                }
                pts.push(this.points[i]);
                if (i < this.points.length-1) {
                    pts.push(this.points[i+1]);
                }
                return pts;
            }
            
            if (this.points[i].y > p.y) {
                let pts = [];
                if (i > 0) {
                    pts.push(this.points[i-1]);
                }
                pts.push(this.points[i]);
                return pts;
            }
        }
        // should never get here
        return [];
    }

    removePointByIndex(index) {
        this.points = this.points.filter(p => p.index != index);
    }

    findConcavePoints() {
        let concavePts = [];
        
        /*
        Assuming the points are (Ax,Ay) (Bx,By) and (Cx,Cy), you need to compute:

            (Bx - Ax) * (Cy - Ay) - (By - Ay) * (Cx - Ax)

        This will equal zero if the point C is on the line formed by points A and B,
        and will have a different sign depending on the side. Which side this is depends
        on the orientation of your (x,y) coordinates, but you can plug test values for A,B and C
        into this formula to determine whether negative values are to the left or to the right.
        */

        for (let i=1; i < this.points.length-1; i++) {
            let botI = this.points[i - 1].index;
            let currI = this.points[i].index;
            let topI = this.points[i + 1].index;
            
            // (Ax, Ay) -> (Bx, By)
            let line = this.points[i].pt.clone().sub(this.points[i-1].pt);
            
            // (Cx, Cy)
            let point = this.points[i+1].pt.clone().sub(this.points[i-1].pt);

            let comparison = (line.x) * (point.y) - (line.y) * (point.x);

            if (comparison < 0 && !this.points[i].isStart) {
                const indices = [topI, currI, botI];
                concavePts.push(indices);
            }
        }

        return concavePts;
    }
}


export class HoleQuad extends QuadBase {

    constructor(app, pts, name = 'holeQ') {
        super(app, pts, name, false);

        this.updateGeometry();
    }

    init() {
        this.params = {
            extrude: 0.5,
            bevel: 0.4,
            inset: 0.1,
            bevelFacets: 4,
        };
        this.holes = [];
    }

    addNewFeature(pt1, pt2) {
        // don't add anything if the rect is too small
        let diff = pt1.clone().sub(pt2).length();
        if (diff < SMALLEST_RECT) return;

        this.clearGeo();

        let p = this.geo.vertices;

        let newPoints = this.getCornersFromPoints(pt1, pt2);

        let hole = new QuadData(newPoints, QuadTypes.HOLE);
        this.holes.push(hole);        
        this.holes.forEach(h => {
            for (let i=0; i < 4; i++) {
                this.geo.vertices.push(h.pts[i].clone());
            }
        });
        this.updateGeometry();
        
        this.addChildren(hole);
    }

    _edgesFromHole(h, holeIndex) {
        let annotatedPoints = [];
        for (let i=0; i < 4; i++) {
            const normPt = this.normalizePoint(h.pts[i]);
            const vertIndex = 4 + (holeIndex * 4) + i;
            annotatedPoints[i] = new AnnotatedPoint2d(normPt, vertIndex);
        }

        const left = new QuadEdge(
            annotatedPoints[3], annotatedPoints[0], true
        );
        const right = new QuadEdge(
            annotatedPoints[2], annotatedPoints[1], false
        );

        return [
            left,
            right
        ];
    }

    _maybeAddFace(indices) {
        let holeIndices = indices.map(i => {
            return (Math.floor((i-4)/4));
        });

        if ((holeIndices[0] === holeIndices[1]) &&
            (holeIndices[0] === holeIndices[2])) {
            return;
        }
        this.addFace(indices);
    }

    updateGeometry() {
        let p = this.geo.vertices;
        let f = this.geo.faces;

        if (this.holes.length < 1) {
            this.addBaseFaces(); 
        } else {
            // create two segments per hole
            let edges = [];
            this.holes.forEach((h, hI) => {
                // add leading edge
                let extents = this._edgesFromHole(h, hI);
                edges = edges.concat(extents);
            });

            // sort them by X-coord
            edges.sort((e1, e2) => {
                return e1.xpos - e2.xpos;
            });

            // create a DS to hold the leading edge
            let pl = new PointList();
            pl.addPoint(new AnnotatedPoint2d(new THREE.Vector2(0,0), 3));
            pl.addPoint(new AnnotatedPoint2d(new THREE.Vector2(0,this.bounds[1]), 0));

            // for each segment, insert and add triangles
            edges.forEach(e => {
                let ptsToRemove = [];
                for (let j=0; j < 2; j++) {                    
                    let nearVerts = pl.getPointsNear(e.pts[j]);
                    if (nearVerts.length === 2) {
                        this._maybeAddFace([
                            nearVerts[0].index,
                            e.pts[j].index,
                            nearVerts[1].index
                        ]);                        
                    } else if (nearVerts.length === 3) {
                        this._maybeAddFace([
                            e.pts[j].index,
                            nearVerts[1].index,
                            nearVerts[0].index
                        ]);
                        
                        this._maybeAddFace([
                            nearVerts[2].index,
                            nearVerts[1].index,
                            e.pts[j].index,
                        ]);
                        ptsToRemove.push(nearVerts[1].index);
                    }
                    pl.addPoint(e.pts[j]);
                }
                ptsToRemove.forEach(i => {
                    pl.removePointByIndex(i);
                });

                let concavities = pl.findConcavePoints();
                while (concavities.length > 0) {
                    this.addFace(concavities[0]);
                    pl.removePointByIndex(concavities[0][1]);
                    concavities = pl.findConcavePoints();
                }
            });

            this.addFace([1, 0, pl.points[pl.points.length-2].index]);
            this.addFace([2, pl.points[1].index, 3]);

            pl.points[0] = new AnnotatedPoint2d(
                new THREE.Vector2(this.bounds[0], 0), 2);
            pl.points.pop();
            pl.points.push(new AnnotatedPoint2d(
                new THREE.Vector2(this.bounds[0], this.bounds[1]), 1)
            );

            let concavities = pl.findConcavePoints();
            while (concavities.length > 0) {
                this.addFace(concavities[0]);
                pl.removePointByIndex(concavities[0][1]);
                concavities = pl.findConcavePoints();
            }
        }

        this.finalizeGeo();
    }

    addChildren(hole) {
        let p = this.geo.vertices;

        let p2 = [];
        for (let i=0; i < 4; i++) {
            p2[i] = this.movePoint(hole.pts[i], [0,0, this.params.extrude]);
        }

        let featureType = parseInt(document.getElementById('param-feature').value);
        console.log(document.getElementById('param-feature').value);

        let newFeature = null;

        switch (featureType) {
            case 0:
                newFeature = new BevelPanel(this.app, hole.pts);
                break;
            case 1:
                newFeature = new ButtonPanel(this.app, hole.pts);
                break;
            case 2:
                newFeature = new HandlePanel(this.app, hole.pts);
                break;
            case 3:
                newFeature = new DialPanel(this.app, hole.pts);
            default:
                break;
        }

        if (newFeature !== null) {
            this.children.push(newFeature);
            newFeature.addToScene(this.app);
        }

        /*
        if (featureType == 1) {
            let buttons = new ButtonPanel(this.app, hole.pts);
            this.children.push(buttons);
            buttons.addToScene(this.app);    
        } else if (featureType == 2) {
            c = new HandlePanel(this.app, hole.pts);
            this.children.push(c);
            c.addToScene(this.app);
        } else {
            c = new BevelPanel(this.app, hole.pts);
            this.children.push(c);
            c.addToScene(this.app);    
        }
        */
    }
}