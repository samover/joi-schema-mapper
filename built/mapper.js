"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const camelcaseKeys = require("camelcase-keys");
const joi_1 = require("joi");
const set = require("lodash.set");
const MapperError_1 = require("./MapperError");
const convertToCamelCase = (data) => camelcaseKeys(data, { deep: true });
const clone = (data) => JSON.parse(JSON.stringify(data));
class Mapper {
    constructor(schema, options) {
        this.transformFns = new Map();
        this.options = {
            abortEarly: false,
            allowUnknown: false,
            camelCase: true,
            stripUnknown: true,
            throwOnError: false,
        };
        this.schema = schema;
        for (const option in options) {
            this.options[option] = options[option];
        }
    }
    map(data) {
        const originalData = clone(data);
        let mappedData = clone(data);
        if (this.options.camelCase) {
            mappedData = convertToCamelCase(mappedData);
        }
        this.preProcess(mappedData);
        this.transformFns.forEach((fn, key) => {
            set(mappedData, key, fn(mappedData));
        });
        this.postProcess(originalData, mappedData);
        const validationResult = this.parse(mappedData);
        if (this.options.throwOnError && validationResult.error) {
            throw new MapperError_1.default(validationResult.error.message);
        }
        return validationResult.value;
    }
    transform(propName, transformFn) {
        this.transformFns.set(propName, transformFn);
    }
    setPreProcessor(fn) {
        this.preProcess = fn;
    }
    setPostProcessor(fn) {
        this.postProcess = fn;
    }
    parse(data) {
        return joi_1.validate(data, this.schema, {
            abortEarly: this.options.abortEarly,
            allowUnknown: this.options.allowUnknown,
            stripUnknown: this.options.stripUnknown,
        });
    }
    preProcess(data) {
        return;
    }
    postProcess(originalData, mappedData) {
        return;
    }
}
exports.default = Mapper;
//# sourceMappingURL=Mapper.js.map