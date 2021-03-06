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
        this.preProcess = new Set();
        this.postProcess = new Set();
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
        this.preProcess.forEach((fn) => {
            fn(mappedData);
        });
        this.transformFns.forEach((fn, key) => {
            set(mappedData, key, fn(mappedData));
        });
        const validationResult = this.parse(mappedData);
        if (this.options.throwOnError && validationResult.error) {
            throw new MapperError_1.MapperError(validationResult.error.message);
        }
        this.postProcess.forEach((fn) => {
            fn(originalData, validationResult.value);
        });
        return validationResult.value;
    }
    transform(propName, transformFn) {
        this.transformFns.set(propName, transformFn);
    }
    setPreProcessor(fn) {
        this.preProcess.add(fn);
    }
    setPostProcessor(fn) {
        this.postProcess.add(fn);
    }
    parse(data) {
        return joi_1.validate(data, this.schema, {
            abortEarly: this.options.abortEarly,
            allowUnknown: this.options.allowUnknown,
            stripUnknown: this.options.stripUnknown,
        });
    }
}
exports.Mapper = Mapper;
//# sourceMappingURL=Mapper.js.map