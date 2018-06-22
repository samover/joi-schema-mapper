const { expect } = require('chai');
const joi = require('joi');
const uuid4 = require('uuid/v4');
const faker = require('faker');
const Mapper = require('../lib/mapper');

describe('#Mapper joi to json object', () => {
    it('correctly maps a simple object', () => {
        const schema = joi.object().keys({ firstname: joi.string(), lastname: joi.string() });
        const mapper = new Mapper(schema, { camelCase: true });
        const data = {
            id: uuid4(),
            firstname: faker.name.firstName(),
            lastname: faker.name.lastName(),
        };
        const serializedData = mapper.map(data);
        expect(serializedData).to.eql({
            firstname: data.firstname,
            lastname: data.lastname,
        });
    });

    it('correctly maps a nested object', () => {
        const schema = joi.object().keys({
            name: joi.object({
                lastname: joi.string(),
            }),
        });
        const mapper = new Mapper(schema, { camelCase: true });
        const data = {
            id: uuid4(),
            name: {
                firstname: faker.name.firstName(),
                lastname: faker.name.lastName(),
            },
        };
        const serializedData = mapper.map(data);
        expect(serializedData).to.eql({
            name: { lastname: data.name.lastname },
        });
    });

    it('correctly maps a nested object with array', () => {
        const schema = joi.object().keys({
            names: joi.array().items(joi.string()),
        });
        const mapper = new Mapper(schema, { camelCase: true });
        const data = {
            id: uuid4(),
            names: [
                faker.name.lastName(),
                faker.name.lastName(),
                faker.name.lastName(),
                faker.name.lastName(),
            ],
        };
        const serializedData = mapper.map(data);
        expect(serializedData).to.eql({
            names: data.names,
        });
    });

    it('correctly maps an object nested within array', () => {
        const schema = joi.object().keys({
            names: joi.array().items(joi.object({
                firstname: joi.string(),
            })),
        });
        const mapper = new Mapper(schema, { camelCase: true });
        const data = {
            id: uuid4(),
            names: [
                {
                    firstname: faker.name.firstName(),
                    lastname: faker.name.lastName(),
                },
                {
                    firstname: faker.name.firstName(),
                    lastname: faker.name.lastName(),
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
    });

    it('correctly transforms a property', () => {
        const data = {
            id: uuid4(),
            firstname: faker.name.firstName(),
            lastname: faker.name.lastName(),
        };
        const schema = joi.object().keys({
            name: joi.string(),
        });
        const mapper = new Mapper(schema, { camelCase: true });
        mapper.transform('name', d => `${d.firstname} ${d.lastname}`);
        const serializedData = mapper.map(data);
        expect(serializedData).to.eql({
            name: `${data.firstname} ${data.lastname}`,
        });
    });

    it('correctly transforms a nested property', () => {
        const data = {
            id: uuid4(),
            names: [
                {
                    firstname: faker.name.firstName(),
                    lastname: faker.name.lastName(),
                },
                {
                    firstname: faker.name.firstName(),
                    lastname: faker.name.lastName(),
                },
            ],
        };
        const schema = joi.object().keys({
            names: joi.array().items(joi.string()),
        });
        const mapper = new Mapper(schema, { camelCase: true });
        mapper.transform('names', d => d.names.map(n => `${n.firstname} ${n.lastname}`));
        const serializedData = mapper.map(data);
        expect(serializedData).to.eql({
            names: [
                `${data.names[0].firstname} ${data.names[0].lastname}`,
                `${data.names[1].firstname} ${data.names[1].lastname}`,
            ],
        });
    });

    it('correctly uses processors on an object', () => {
        const data = {
            id: uuid4(),
            firstname: faker.name.firstName(),
            lastname: faker.name.lastName(),
            updatedAt: faker.date.recent(),
            createdAt: faker.date.past(),
        };
        const schema = joi.object().keys({
            id: joi.string().uuid(),
            firstname: joi.string(),
            lastname: joi.string(),
            modifiedAt: joi.date().iso(),
        });
        const mapper = new Mapper(schema, { camelCase: true });
        mapper.setPreProcessor((d) => { d.modifiedAt = d.updatedAt; });
        mapper.setPostProcessor((raw, res) => {
            res.processedBy = 'Amazon';
        });
        const serializedData = mapper.map(data);
        expect(serializedData).to.eql({
            id: data.id,
            firstname: data.firstname,
            lastname: data.lastname,
            modifiedAt: data.updatedAt,
            processedBy: 'Amazon',
        });
    });
});
