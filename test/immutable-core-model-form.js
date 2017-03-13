'use strict'

const ImmutableCoreModel = require('immutable-core-model')
const ImmutableCoreModelForm = require('../lib/immutable-core-model-form')
const ImmutableDatabaseMariaSQL = require('immutable-database-mariasql')
const chai = require('chai')
const immutable = require('immutable-core')
const chaiSubset = require('chai-subset');

const assert = chai.assert

chai.use(chaiSubset)

const dbHost = process.env.DB_HOST || 'localhost'
const dbName = process.env.DB_NAME || 'test'
const dbPass = process.env.DB_PASS || ''
const dbUser = process.env.DB_USER || 'root'

// use the same params for all connections
const connectionParams = {
    charset: 'utf8',
    db: dbName,
    host: dbHost,
    password: dbPass,
    user: dbUser,
}

describe('immutable-core-model-form', function () {

    // create database connection to use for testing
    var database = new ImmutableDatabaseMariaSQL(connectionParams)

    // fake session to use for testing
    var session = {
        accountId: '11111111111111111111111111111111',
        sessionId: '22222222222222222222222222222222',
    }

    // define in before
    var addressModel, globalAddressModel

    beforeEach(async function () {
        try {
            // reset global data
            immutable.reset()
            ImmutableCoreModel.reset()
            // drop any test tables if they exist
            await database.query('DROP TABLE IF EXISTS address')
            // model for testing
            globalAddressModel = new ImmutableCoreModel({
                database: database,
                name: 'address',
                properties: {
                    addressCountry: {
                        default: 'US',
                        description: 'ISO Country Code',
                        title: 'Country',
                        type: 'string',
                    },
                    addressLocality: {
                        title: 'City',
                        type: 'string',
                    },
                    addressRegion: {
                        enum: ['AL', 'AK', 'AZ'],
                        title: 'State',
                        type: 'string',
                    },
                    firstName: {
                        type: 'string',
                    },
                    lastName: {
                        type: 'string',
                    },
                    postalCode: {
                        errors: {
                            pattern: '5 digit ZIP code required',
                        },
                        pattern: '^\\d{5}$',
                        title: 'ZIP Code',
                        type: 'string',
                    },
                    streetAddress: {
                        type: 'string',
                    },
                },
                required: [
                    'addressCountry',
                    'addressLocality',
                    'addressRegion',
                    'firstName',
                    'lastName',
                    'postalCode',
                    'streetAddress',
                ],
            })
            // create table
            await globalAddressModel.sync()
            // get local model
            addressModel = globalAddressModel.session(session)
        }
        catch (err) {
            throw err
        }
    })

    it('should create new form instance', function () {
        // create new form
        var addressForm = new ImmutableCoreModelForm({
            model: globalAddressModel,
        })
        // should return new instance
        assert.isTrue(addressForm instanceof ImmutableCoreModelForm)

        assert.containSubset(addressForm, {
            fields: [
                {
                    property: 'addressCountry',
                    label: 'Country',
                    inputType: 'text',
                    required: true,
                    description: 'ISO Country Code',
                    name: 'address[addressCountry]',
                },
                {
                    property: 'addressLocality',
                    label: 'City',
                    inputType: 'text',
                    required: true,
                    name: 'address[addressLocality]',
                },
                {
                    property: 'addressRegion',
                    label: 'State',
                    inputType: 'select',
                    options: [
                        {title: 'AL', value: 'AL'},
                        {title: 'AK', value: 'AK'},
                        {title: 'AZ', value: 'AZ'},
                    ],
                    required: true,
                    name: 'address[addressRegion]',
                },
                {
                    property: 'firstName',
                    label: 'First Name',
                    inputType: 'text',
                    required: true,
                    name: 'address[firstName]',
                },
                {
                    property: 'lastName',
                    label: 'Last Name',
                    inputType: 'text',
                    required: true,
                    name: 'address[lastName]',
                },
                {
                    property: 'postalCode',
                    label: 'ZIP Code',
                    inputType: 'text',
                    required: true,
                    pattern: '^\\d{5}$',
                    name: 'address[postalCode]',
                },
                {
                    property: 'streetAddress',
                    label: 'Street Address',
                    inputType: 'text',
                    required: true,
                    name: 'address[streetAddress]',
                },
            ],
            labels: true,
            placeholders: false
        })
    })

    it('should create new form instance with custom fields', function () {
        // create new form
        var addressForm = new ImmutableCoreModelForm({
            fields: [
                ['firstName', 'lastName'],
                'streetAddress',
                [
                    {
                        property: 'addressLocality',
                        unit: '3-5',
                    },
                    {
                        property: 'addressRegion',
                        unit: '1-5',
                    },
                    {
                        property: 'postalCode',
                        unit: '1-5',
                    },
                ],
                {
                    property: 'addressCountry',
                    inputType: 'hidden',
                },
            ],
            model: globalAddressModel,
        })
        // should return new instance
        assert.isTrue(addressForm instanceof ImmutableCoreModelForm)

        assert.containSubset(addressForm.fields, [
            [
                {property: 'firstName', unit: '1-2'},
                {property: 'lastName', unit: '1-2'},
            ],
            {
                property: 'streetAddress',
            },
            [
                {
                    property: 'addressLocality',
                    unit: '3-5',
                },
                {
                    property: 'addressRegion',
                    unit: '1-5',
                },
                {
                    property: 'postalCode',
                    unit: '1-5',
                },
            ],
            {
                property: 'addressCountry',
                inputType: 'hidden',
            },
        ])
    })

    it('should create newInstance with record', async function () {
        try {
            // create address instance
            var address = await addressModel.create({
                firstName: 'foo',
                lastName: 'foo',
                streetAddress: 'foo',
                addressLocality: 'foo',
                addressRegion: 'AL',
                postalCode: '12345',
            })
        }
        catch (err) {
            assert.ifError(err)
        }
        // create new form
        var addressForm = new ImmutableCoreModelForm({
            model: globalAddressModel,
        })
        // create new instance
        addressForm = addressForm.newInstance({
            record: address,
        })

        assert.containSubset(addressForm.fields, [
            { property: 'addressCountry', value: 'US' },
            { property: 'addressLocality', value: 'foo' },
            { property: 'addressRegion', value: 'AL', options: [ {selected: true, value: 'AL'} ] },
            { property: 'firstName', value: 'foo' },
            { property: 'lastName', value: 'foo' },
            { property: 'postalCode', value: '12345' },
            { property: 'streetAddress', value: 'foo' },
        ])
    })

    it('should create newInstance with input and errors', async function () {
        // create input with missing data that will result in errors
        var input = {
            firstName: 'foo',
            lastName: 'foo',
            streetAddress: 'foo',
            addressLocality: 'foo',
            addressRegion: 'Foo',
            postalCode: 'Foo',
        }
        try {
            // create address instance
            var address = await addressModel.create(input)
        }
        catch (err) {
            var error = err
        }
        // create new form
        var addressForm = new ImmutableCoreModelForm({
            model: globalAddressModel,
        })
        // create new instance
        addressForm = addressForm.newInstance({
            error: error,
            input: input,
        })

        assert.containSubset(addressForm.fields, [
            { property: 'addressCountry', value: 'US' },
            { property: 'addressLocality', value: 'foo' },
            { property: 'addressRegion', value: undefined, error: 'should be equal to one of the allowed values' },
            { property: 'firstName', value: 'foo' },
            { property: 'lastName', value: 'foo' },
            { property: 'postalCode', value: undefined, error: '5 digit ZIP code required' },
            { property: 'streetAddress', value: 'foo' },
        ])
    })

})