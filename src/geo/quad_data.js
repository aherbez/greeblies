import * as THREE from 'three';

export const QuadTypes = {
    BASE: 0,
    HOLE: 1
}

export class QuadData {

    constructor(pts, type = QuadTypes.BASE, parent = null) {
        if (pts.length !== 4) {
            throw(new Error(`QuadData requires exactly four points. Given: ${pts.length}`));
        }
        
        this.type = type;

        this.pts = pts.slice(0);
        this.parent = parent;
        
        if (parent) {
            this._rotatePoints(parent);
        }
    }

    _rotatePoints() {
        // make sure that index 0 represents the top-left relative to the parent
    }
}