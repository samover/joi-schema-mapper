import camelcaseKeys = require("camelcase-keys");
import { Schema, validate, ValidationResult } from "joi";
import set = require("lodash.set");
import { MapperError } from "./MapperError";

const convertToCamelCase = (data: object): object => camelcaseKeys(data, { deep: true });
const clone = (data: object): object => JSON.parse(JSON.stringify(data));

interface IMapperOptions {
  camelCase?: boolean;
  throwOnError?: boolean;
  allowUnknown?: boolean;
  stripUnknown?: boolean;
  abortEarly?: boolean;
}

export class Mapper {
  private schema: Schema;
  private transformFns: Map<string, (data: any) => any> = new Map();
  private preProcess: Set<(...args) => void>;
  private postProcess: Set<(...args) => void>;
  private  options: IMapperOptions = {
    abortEarly: false,
    allowUnknown: false,
    camelCase: true,
    stripUnknown: true,
    throwOnError: false,
  };

  constructor(schema: Schema, options: IMapperOptions) {
    this.schema = schema;
    this.preProcess = new Set();
    this.postProcess = new Set();
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

    this.preProcess.forEach((fn) => {
      fn(mappedData);
    });
    this.transformFns.forEach((fn, key) => {
      set(mappedData, key, fn(mappedData));
    });
    const validationResult: ValidationResult<object> = this.parse(mappedData);

    if (this.options.throwOnError && validationResult.error) {
      throw new MapperError(validationResult.error.message);
    }

    this.postProcess.forEach((fn) => {
      fn(originalData, validationResult.value);
    });

    return validationResult.value;
  }

  public transform(propName: string, transformFn: <T>(data: any) => any) {
    this.transformFns.set(propName, transformFn);
  }

  public setPreProcessor(fn: (data: any) => void) {
    this.preProcess.add(fn);
  }

  public setPostProcessor(fn: (originalData: any, mappedData: any) => void) {
    this.postProcess.add(fn);
  }
  private parse(data: object): ValidationResult<object> {
    return validate(data, this.schema, {
      abortEarly: this.options.abortEarly,
      allowUnknown: this.options.allowUnknown,
      stripUnknown: this.options.stripUnknown,
    });
  }
}
