import { FeatureList } from '../geo/param_list';
import { ParamTypes, ParamItem } from '../params/param';

export class ModelerUI {
    constructor(baseDiv, modeler) {    
        this.uiRoot = baseDiv;
        this.modeler = modeler;
        this.exportButton = document.getElementById('export-stl');
        this.exportButton.onclick = this.exportModel.bind(this);

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

        this.makeDownloadLink();

        console.log('SETUP UI');
    }

    makeDownloadLink() {
        this.downloadLink = document.createElement('a');
        this.downloadLink.style.display = "none";
        document.body.appendChild(this.downloadLink);
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

    exportModel() {
        let modelData = this.modeler.getSTLData();
        this.saveString(modelData, 'panel.stl');
    }

    saveString(text, filename)
    {
        this.save(new Blob([text], {type: 'text/plain'}), filename);
    }
    
    save(blob, filename)
    {
        this.downloadLink.href = URL.createObjectURL(blob);
        this.downloadLink.download = filename;
        this.downloadLink.click();
    }
}