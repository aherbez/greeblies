import { FeatureList } from '../geo/param_list';
import { ParamTypes, ParamItem } from '../params/param';

export class ModelerUI {
    constructor(baseDiv, modeler) {    
        this.uiRoot = baseDiv;
        this.modeler = modeler;

        this.featureSelect = document.getElementById('param-feature');
        this.featureSelect.onchange = (evt) => {
            let value = parseInt(this.featureSelect.value);
            this.setFeatureType(value);
            this.featureSelect.blur();
        }
        this.initSelection();
        this.featureDesc = document.getElementById('feature-desc');

        this.paramsRoot = document.getElementById('param-list');

        this.setFeatureType(0);
        console.log('SETUP UI');
    }

    initSelection() {
        FeatureList.forEach((f, i) => {
            let select = document.createElement('option');
            select.value = i;
            select.innerHTML = f.name;
            this.featureSelect.appendChild(select);
        });
    }

    clearParams() {
        this.paramsRoot.innerHTML = '';
    }

    setFeatureType(type) {
        this.clearParams();
        // console.log(`Setting feature type to: ${type}`);
        this.featureDesc.innerHTML = FeatureList[type].desc;

        const params = FeatureList[type].class.listParams();
        params.forEach(p => {
            let idName = `param-${p.name}`;

            let pDiv = document.createElement('div');
            pDiv.className = 'param-div';

            let label = document.createElement('label');
            label.innerHTML = p.name;
            label.className = 'param-label';

            let input = document.createElement('input');
            input.value = p.defaultVal;
            input.className = 'param';
            input.id = idName;

            pDiv.appendChild(label);
            pDiv.appendChild(input);

            this.paramsRoot.appendChild(pDiv);
        });
    }
}