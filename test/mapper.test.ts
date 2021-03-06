import { expect } from "chai";
import * as joi from "joi";
import { slow, suite, test, timeout, only } from "mocha-typescript";
import { Mapper } from "../lib/Mapper";

@suite
class MapperTest {

    @test
    public mapSimpleObjectTest() {
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

    @test
    public mapNestedObjectTest() {
        const schema = joi.object({
            name: joi.object({
                lastname: joi.string(),
            }),
            numbers: joi.array().items(joi.number()),
        }).required();
        const mapper = new Mapper(schema, {});
        const data = {
            id: 1,
            name: {
                firstname: "John",
                lastname: "Lennon",
            },
          numbers: [1, 3],
        };
        const serializedData = mapper.map(data);
        expect(serializedData).to.eql({
            name: {
              lastname: data.name.lastname,
            },
            numbers: data.numbers,
        });
    }

    @test
    public mapNestedObjectWithArrayTest() {
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

    @test
    public mapNestedObjectWithinArrayTest() {
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

    @test
    public transformPropertyTest() {
        const data: any = {
            firstname: "John",
            id: 1,
            lastname: "Lennon",
        };
        const schema = joi.object().keys({
            name: joi.string(),
        });
        const mapper = new Mapper(schema, { camelCase: true });
        const transformFn = <String>(d: any) => `${d.firstname} ${d.lastname}`;
        mapper.transform("name", transformFn);
        const serializedData = mapper.map(data);
        expect(serializedData).to.eql({
            name: `${data.firstname} ${data.lastname}`,
        });
    }

    @test
    public transformNestedPropertyTest() {
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

    @test
    public useProcessersOnObjectTest() {
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
            processedBy: "Amazon",
        });
    }

    @test
    public allowMultiplePreProcessors() {
        const data = {
            createdAt: new Date(Date.now()),
            firstname: "John",
            id: 1,
            lastname: "Lennon",
            updatedAt: new Date(Date.now()),
        };
        const schema = joi.object().keys({
            id: joi.string().uuid(),
            modifiedAt: joi.date().iso(),
            name: joi.string(),
        });
        const mapper = new Mapper(schema, { camelCase: true });
        mapper.setPreProcessor((d) => { d.modifiedAt = d.updatedAt; });
        mapper.setPreProcessor((d) => { d.name = `${d.firstname} ${d.lastname}`; });

        const serializedData = mapper.map(data);
        expect(serializedData).to.eql({
            id: data.id,
            modifiedAt: data.updatedAt,
            name: `${data.firstname} ${data.lastname}`,
        });
    }

    @test
    public throwsValidationError() {
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
        } catch (e) {
          expect(e.message).to.have.string("firstname");
        }
    }
}
