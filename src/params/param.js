export const ParamTypes = {
    TYPE_INT: 0,
    TYPE_FLOAT: 1,
}

export class ParamItem {
    constructor(name, defaultVal, description, type, min, max) {
        this.name = name;
        this.type = type;
        this.desc = description || '';
        this.defaultVal = defaultVal;
        this.min = min || -Infinity;
        this.max = max || Infinity;
    }

    get value() {
        let inputEl = document.getElementById(`param-${this.name}`);
        let value = 0;
        if (this.type === ParamTypes.TYPE_INT) {
            value = parseInt(inputEl.value);
        } else if (this.type === ParamTypes.TYPE_FLOAT) {
            value = parseFloat(inputEl.value);
        }
        if (value !== value) value = 0;

        if (value > this.max) value = this.max;
        if (value < this.min) value = this.min;

        inputEl.value = value;
        return value;
    }
}
