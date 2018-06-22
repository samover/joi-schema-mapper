const camelcaseObject = require('camelcase-keys');
const joi = require('joi');

class MapperError extends Error {}

class Parser {
  constructor(data, description, transformers) {
    this.data = data;
    this.description = description;
    this.transformers = transformers;
  }

  process() {
    return this.parse(this.description, this.data);
  }

  parse(props, data) {
    const childProps = props.children;
    const keys = childProps ? Object.keys(childProps) : null;
    const obj = {};

    if (!keys) return data;

    keys.forEach((k) => {
      if (this.transformers[k]) {
        obj[k] = this.transformers[k](this.data);
      } else if (childProps[k].type === 'object') {
        obj[k] = this.parse(childProps[k], data[k]);
      } else if (childProps[k].type === 'array') {
        obj[k] = data[k].map(i => this.parse(childProps[k].items[0], i));
      } else {
        obj[k] = data[k];
      }
    });

    return obj;
  }
}

class Mapper {
  constructor(joiSchema, options) {
    this.schema = joiSchema;
    this.camelCase = options.camelCase || false;
    this.objectType = options.objectType || null;
    this.throwOnError = options.throwOnError || false;
    this.transformFns = {};
    this.postProcess = () => true;
    this.preProcess = data => data;
  }

    /*
     * return JSON object throws MapperError
     */
  map(data) {
    if (this.camelCase) {
      data = camelcaseObject(data, { deep: true });
    }
    const parser = new Parser(data, this.schema.describe(), this.transformFns);

    this.preProcess(data);
    const result = parser.process();
    this.postProcess(data, result);

    const valid = joi.validate(result, this.schema, { abortEarly: false });
    if (this.throwOnError && valid.error) throw new MapperError(valid.error);
    return valid.value;
  }

  transform(propName, transformFn) {
    this.transformFns[propName] = transformFn;
  }

  setPreProcessor(fn) {
    this.preProcess = fn;
  }

  setPostProcessor(fn) {
    this.postProcess = fn;
  }
}

module.exports = Mapper;
