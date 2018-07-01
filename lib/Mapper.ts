import camelcaseKeys = require("camelcase-keys");
import { Schema, validate, ValidationResult } from "joi";
import set = require("lodash.set");
import MapperError from "./MapperError";

const convertToCamelCase = (data: object): object => camelcaseKeys(data, { deep: true });
const clone = (data: object): object => JSON.parse(JSON.stringify(data));

interface IMapperOptions {
    camelCase?: boolean;
    throwOnError?: boolean;
    allowUnknown?: boolean;
    stripUnknown?: boolean;
    abortEarly?: boolean;
}

export default class Mapper {
    private schema: Schema;
    private transformFns: Map<string, (data: any) => any> = new Map();
    private  options: IMapperOptions = {
        abortEarly: false,
        allowUnknown: false,
        camelCase: true,
        stripUnknown: true,
        throwOnError: false,
    };

    constructor(schema: Schema, options: IMapperOptions) {
        this.schema = schema;
        for (const option in options) {
            this.options[option] = options[option];
        }
    }

    public map(data: object): object {
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
        const validationResult: ValidationResult<object> = this.parse(mappedData);

        if (this.options.throwOnError && validationResult.error) {
            throw new MapperError(validationResult.error.message);
        }

        return validationResult.value;
    }

    public transform(propName: string, transformFn: <T>(data: any) => any) {
        this.transformFns.set(propName, transformFn);
    }

    public setPreProcessor(fn: (data: any) => void) {
        this.preProcess = fn;
    }

    public setPostProcessor(fn: (originalData: any, mappedData: any) => void) {
        this.postProcess = fn;
    }
    private parse(data: object): ValidationResult<object> {
        return validate(data, this.schema, {
            abortEarly: this.options.abortEarly,
            allowUnknown: this.options.allowUnknown,
            stripUnknown: this.options.stripUnknown,
        });
    }

    private preProcess(data: any): void {
        return;
    }

    private postProcess(originalData: any, mappedData: object) {
        return;
    }
}
