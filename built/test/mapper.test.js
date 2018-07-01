var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { expect } from "chai";
import * as joi from "joi";
import { suite, test } from "mocha-typescript";
import Mapper from "../lib/Mapper";
let MapperTest = class MapperTest {
    mapSimpleObjectTest() {
        const schema = joi.object().keys({ firstname: joi.string(), lastname: joi.string() });
        const mapper = new Mapper(schema, { camelCase: true });
        const data = {
            firstname: "John",
            id: 1,
            lastname: "Lennon",
        };
        const serializedData = mapper.map(data);
        expect(serializedData).to.eql({
            firstname: data.firstname,
            lastname: data.lastname,
        });
    }
    mapNestedObjectTest() {
        const schema = joi.object().keys({
            name: joi.object({
                lastname: joi.string(),
            }),
        });
        const mapper = new Mapper(schema, { camelCase: true });
        const data = {
            id: 1,
            name: {
                firstname: "John",
                lastname: "Lennon",
            },
        };
        const serializedData = mapper.map(data);
        expect(serializedData).to.eql({
            name: { lastname: data.name.lastname },
        });
    }
    mapNestedObjectWithArrayTest() {
        const schema = joi.object().keys({
            names: joi.array().items(joi.string()),
        });
        const mapper = new Mapper(schema, { camelCase: true });
        const data = {
            id: 1,
            names: [
                "Lennon",
                "Harrison",
                "McCartney",
                "Ringo Star",
            ],
        };
        const serializedData = mapper.map(data);
        expect(serializedData).to.eql({
            names: data.names,
        });
    }
    mapNestedObjectWithinArrayTest() {
        const schema = joi.object().keys({
            names: joi.array().items(joi.object({
                firstname: joi.string(),
            })),
        });
        const mapper = new Mapper(schema, { camelCase: true });
        const data = {
            id: 1,
            names: [
                {
                    firstname: "John",
                    lastname: "Lennon",
                },
                {
                    firstname: "George",
                    lastname: "Harrison",
                },
            ],
        };
        const serializedData = mapper.map(data);
        expect(serializedData).to.eql({
            names: [
                { firstname: data.names[0].firstname },
                { firstname: data.names[1].firstname },
            ],
        });
    }
    transformPropertyTest() {
        const data = {
            firstname: "John",
            id: 1,
            lastname: "Lennon",
        };
        const schema = joi.object().keys({
            name: joi.string(),
        });
        const mapper = new Mapper(schema, { camelCase: true });
        const transformFn = (d) => `${d.firstname} ${d.lastname}`;
        mapper.transform("name", transformFn);
        const serializedData = mapper.map(data);
        expect(serializedData).to.eql({
            name: `${data.firstname} ${data.lastname}`,
        });
    }
    transformNestedPropertyTest() {
        const data = {
            id: 1,
            names: [
                {
                    firstname: "John",
                    lastname: "Lennon",
                },
                {
                    firstname: "George",
                    lastname: "Harrison",
                },
            ],
        };
        const schema = joi.object().keys({
            names: joi.array().items(joi.string()),
        });
        const mapper = new Mapper(schema, { camelCase: true });
        mapper.transform("names", (d) => d.names.map((n) => `${n.firstname} ${n.lastname}`));
        const serializedData = mapper.map(data);
        expect(serializedData).to.eql({
            names: [
                `${data.names[0].firstname} ${data.names[0].lastname}`,
                `${data.names[1].firstname} ${data.names[1].lastname}`,
            ],
        });
    }
    useProcessersOnObjectTest() {
        const data = {
            createdAt: new Date(Date.now()),
            firstname: "John",
            id: 1,
            lastname: "Lennon",
            updatedAt: new Date(Date.now()),
        };
        const schema = joi.object().keys({
            firstname: joi.string(),
            id: joi.string().uuid(),
            lastname: joi.string(),
            modifiedAt: joi.date().iso(),
        });
        const mapper = new Mapper(schema, { camelCase: true });
        mapper.setPreProcessor((d) => { d.modifiedAt = d.updatedAt; });
        mapper.setPostProcessor((raw, res) => {
            res.processedBy = "Amazon";
        });
        const serializedData = mapper.map(data);
        expect(serializedData).to.eql({
            firstname: data.firstname,
            id: data.id,
            lastname: data.lastname,
            modifiedAt: data.updatedAt,
        });
    }
    throwsValidationError() {
        const data = {
            firstname: 1,
            lastname: true,
        };
        const schema = joi.object().keys({
            firstname: joi.string(),
            lastname: joi.string(),
        });
        const mapper = new Mapper(schema, { camelCase: true, throwOnError: true });
        mapper.setPreProcessor((d) => { d.modifiedAt = d.updatedAt; });
        try {
            mapper.map(data);
            throw new Error("test failed");
        }
        catch (e) {
            console.error(e);
        }
    }
};
__decorate([
    test
], MapperTest.prototype, "mapSimpleObjectTest", null);
__decorate([
    test
], MapperTest.prototype, "mapNestedObjectTest", null);
__decorate([
    test
], MapperTest.prototype, "mapNestedObjectWithArrayTest", null);
__decorate([
    test
], MapperTest.prototype, "mapNestedObjectWithinArrayTest", null);
__decorate([
    test
], MapperTest.prototype, "transformPropertyTest", null);
__decorate([
    test
], MapperTest.prototype, "transformNestedPropertyTest", null);
__decorate([
    test
], MapperTest.prototype, "useProcessersOnObjectTest", null);
__decorate([
    test
], MapperTest.prototype, "throwsValidationError", null);
MapperTest = __decorate([
    suite
], MapperTest);
