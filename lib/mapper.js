const camelcaseObject = require('camelcase-keys');
const joi = require('joi');
const set = require('lodash.set');

const convertToCamelCase = data => camelcaseObject(data, { deep: true });
const clone = data => JSON.parse(JSON.stringify(data));

class MapperError extends Error {}

class Mapper {
    constructor(joiSchema, options) {
        this.schema = joiSchema;
        this.camelCase = options.camelCase === undefined ? true : options.camelCase,
        this.throwOnError = options.throwOnError === undefined ? false : options.throwOnError,
        this.allowUnknown = options.allowUnknown === undefined ? false : options.allowUnknown,
        this.stripUnknown = options.stripUnknown === undefined ? true : options.stripUnknown,
        this.abortEarly = options.abortEarly === undefined ? false : options.abortEarly,
        this.transformFns = {};
        this._postProcess = () => true;
        this._preProcess = data => data;
    }

    _parse(data) {
        return joi.validate(data, this.schema, {
            abortEarly: this.abortEarly,
            stripUnknown: this.stripUnknown,
            allowUnknown: this.allowUnknown,
        });
    }

    /*
     * return JSON object throws MapperError
     */
    map(data) {
        const originalData = clone(data);
        let mappedData = clone(data);
        if (this.camelCase) mappedData = convertToCamelCase(mappedData)
        this._preProcess(mappedData);
        Object.keys(this.transformFns).forEach(key => {
            set(mappedData, key, this.transformFns[key](mappedData));
        })
        this._postProcess(originalData, mappedData);
        const { value, error } = this._parse(mappedData);

        if (this.throwOnError && error) throw new MapperError(error);
        return value;
    }

    transform(propName, transformFn) {
        this.transformFns[propName] = transformFn;
    }

    setPreProcessor(fn) {
        this._preProcess = fn;
    }

    setPostProcessor(fn) {
        this._postProcess = fn;
    }
}

module.exports = Mapper;
