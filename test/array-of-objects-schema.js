'use strict'

const ImmutableAccessControl = require('immutable-access-control')
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

describe('immutable-core-model-form - array of objects schema', function () {

    // create database connection to use for testing
    var database = new ImmutableDatabaseMariaSQL(connectionParams)

    // fake session to use for testing
    var session = {
        accountId: '11111111111111111111111111111111',
        roles: ['all', 'authenticated'],
        sessionId: '22222222222222222222222222222222',
    }

    // define in before
    var businessModel, globalBusinessModel

    beforeEach(async function () {
        try {
            // reset global data
            immutable.reset()
            ImmutableCoreModel.reset()
            ImmutableAccessControl.reset()
            // drop any test tables if they exist
            await database.query('DROP TABLE IF EXISTS business')
            // model for testing
            globalBusinessModel = new ImmutableCoreModel({
                database: database,
                name: 'business',
                properties: {
                    businessName: {
                        errors: {
                            required: 'must provide business name',
                        },
                        type: 'string',
                    },
                    hoursOfOperation: {
                        items: {
                            properties: {
                                fromDay: {
                                    enum: [
                                        'Sunday',
                                        'Monday',
                                        'Tuesday',
                                        'Wednesday',
                                        'Thursday',
                                        'Friday',
                                        'Saturday',
                                    ],
                                    type: 'string',
                                },
                                toDay: {
                                    enum: [
                                        'Sunday',
                                        'Monday',
                                        'Tuesday',
                                        'Wednesday',
                                        'Thursday',
                                        'Friday',
                                        'Saturday',
                                    ],
                                    type: 'string',
                                },
                                fromHourOne: {
                                    errors: {
                                        pattern: 'Enter time as HH:MM like 09:30',
                                    },
                                    pattern: '^\\d{2}:\\d{2}$',
                                    type: 'string',
                                },
                                toHourOne: {
                                    errors: {
                                        pattern: 'Enter time as HH:MM like 09:30',
                                    },
                                    pattern: '^\\d{2}:\\d{2}$',
                                    type: 'string',
                                },
                                fromHourTwo: {
                                    errors: {
                                        pattern: 'Enter time as HH:MM like 09:30',
                                    },
                                    pattern: '^(\\d{2}:\\d{2})?$',
                                    type: 'string',
                                },
                                toHourTwo: {
                                    errors: {
                                        pattern: 'Enter time as HH:MM like 09:30',
                                    },
                                    pattern: '^(\\d{2}:\\d{2})?$',
                                    type: 'string',
                                },
                            },
                            required: [
                                'fromDay',
                                'toDay',
                                'fromHourOne',
                                'toHourOne',
                            ],
                            type: 'object',
                        },
                        maxItems: 7,
                        minItems: 0,
                        type: 'array',
                    },
                },
                required: [
                    'businessName',
                ],
            })
            // create table
            await globalBusinessModel.sync()
            // get local model
            businessModel = globalBusinessModel.session(session)
        }
        catch (err) {
            throw err
        }
    })

    it('should create new form instance', function () {
        // create new form
        var businessForm = new ImmutableCoreModelForm({
            model: globalBusinessModel,
        })
        // should return new instance
        assert.isTrue(businessForm instanceof ImmutableCoreModelForm)

        assert.containSubset(businessForm.fields[1], {
            array: true,
            nested: true,
            fields: [
                {name: 'business[hoursOfOperation][0][fromDay]'},
                {name: 'business[hoursOfOperation][0][toDay]'},
                {name: 'business[hoursOfOperation][0][fromHourOne]'},
                {name: 'business[hoursOfOperation][0][toHourOne]'},
                {name: 'business[hoursOfOperation][0][fromHourTwo]'},
                {name: 'business[hoursOfOperation][0][toHourTwo]'},
            ],
        })
    })

    it('should allow customization of sub fields', function () {
        // create new form
        var businessForm = new ImmutableCoreModelForm({
            fields: [
                {
                    fields: [
                        'toDay',
                        'toHourOne',
                        'toHourTwo',
                    ],
                    property: 'hoursOfOperation',
                }
            ],
            model: globalBusinessModel,
        })
        // should return new instance
        assert.isTrue(businessForm instanceof ImmutableCoreModelForm)

        assert.containSubset(businessForm.fields[0], {
            array: true,
            nested: true,
            fields: [
                {name: 'business[hoursOfOperation][0][toDay]'},
                {name: 'business[hoursOfOperation][0][toHourOne]'},
                {name: 'business[hoursOfOperation][0][toHourTwo]'},
            ],
        })
    })

    it('should create new instance from model', async function () {
        try {
            // create business instance
            var business = await businessModel.create({
                businessName: 'test',
                hoursOfOperation: [
                    {
                        fromDay: 'Sunday',
                        toDay: 'Thursday',
                        fromHourOne: '11:00',
                        toHourOne: '14:00',
                        fromHourTwo: '16:30',
                        toHourTwo: '21:00',
                    },
                    {
                        fromDay: 'Friday',
                        toDay: 'Saturday',
                        fromHourOne: '11:00',
                        toHourOne: '23:00',
                    },
                ],
            })
        }
        catch (err) {
            assert.ifError(err)
        }

        // create new form
        var businessForm = new ImmutableCoreModelForm({
            model: globalBusinessModel,
        })
        // create new instance from record
        businessForm = businessForm.newInstance({
            record: business,
        })

        assert.containSubset(businessForm.fields[1], {
            fields: [
                {name: 'business[hoursOfOperation][2][fromDay]'},
                {name: 'business[hoursOfOperation][2][toDay]'},
                {name: 'business[hoursOfOperation][2][fromHourOne]'},
                {name: 'business[hoursOfOperation][2][toHourOne]'},
                {name: 'business[hoursOfOperation][2][fromHourTwo]'},
                {name: 'business[hoursOfOperation][2][toHourTwo]'},
            ],
            values: [
                [
                    {name: 'business[hoursOfOperation][0][fromDay]', value: 'Sunday'},
                    {name: 'business[hoursOfOperation][0][toDay]', value: 'Thursday'},
                    {name: 'business[hoursOfOperation][0][fromHourOne]', value: '11:00'},
                    {name: 'business[hoursOfOperation][0][toHourOne]', value: '14:00'},
                    {name: 'business[hoursOfOperation][0][fromHourTwo]', value: '16:30'},
                    {name: 'business[hoursOfOperation][0][toHourTwo]', value: '21:00'},
                ],
                [
                    {name: 'business[hoursOfOperation][1][fromDay]', value: 'Friday'},
                    {name: 'business[hoursOfOperation][1][toDay]', value: 'Saturday'},
                    {name: 'business[hoursOfOperation][1][fromHourOne]', value: '11:00'},
                    {name: 'business[hoursOfOperation][1][toHourOne]', value: '23:00'},
                    {name: 'business[hoursOfOperation][1][fromHourTwo]', value: undefined},
                    {name: 'business[hoursOfOperation][1][toHourTwo]', value: undefined},
                ],
            ],
        })

        assert.deepEqual(businessForm.fields[1].fields[0].options, [
            { title: 'Sunday', value: 'Sunday' },
            { title: 'Monday', value: 'Monday' },
            { title: 'Tuesday', value: 'Tuesday' },
            { title: 'Wednesday', value: 'Wednesday' },
            { title: 'Thursday', value: 'Thursday' },
            { title: 'Friday', value: 'Friday' },
            { title: 'Saturday', value: 'Saturday' },
        ])
    })

    it('should create new instance from input and errors', async function () {
        // input with errors
        var input = {
            hoursOfOperation: [
                {
                    fromDay: 'XXX',
                    toDay: undefined,
                    fromHourOne: '11:00',
                    toHourOne: '14:00',
                    fromHourTwo: '16:30AM',
                    toHourTwo: '21:00',
                },
            ],
        }
        // create instance which should throw error
        try {
            await businessModel.create(input)
        }
        catch (err) {
            var error = err
        }
        // create form
        var businessForm = new ImmutableCoreModelForm({
            model: globalBusinessModel,
        })
        // create new instance from record
        businessForm = businessForm.newInstance({
            error: error,
            input: input,
        })

        assert.containSubset(businessForm.fields[0], {
            error: 'must provide business name',
            value: undefined,
        })

        assert.containSubset(businessForm.fields[1].values[0], [
            {error: 'should be equal to one of the allowed values', value: undefined},
            {error: 'toDay required', value: undefined},
            {value: '11:00'},
            {value: '14:00'},
            {error: 'Enter time as HH:MM like 09:30', value: undefined},
            {value: '21:00'},
        ])
    })

})