'use strict'

const ImmutableCoreModel = require('immutable-core-model')
const ImmutableCoreModelForm = require('../lib/immutable-core-model-form')

const chai = require('chai')
const immutable = require('immutable-core')
const chaiSubset = require('chai-subset');

const assert = chai.assert

chai.use(chaiSubset)

describe('immutable-core-model-form', function () {

    // model for testing
    var addressModel = new ImmutableCoreModel({
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
                pattern: '^\d{5}$',
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

    it('should create new form instance', function () {
        // create new form
        var addressForm = new ImmutableCoreModelForm({
            model: addressModel,
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
                },
                {
                    property: 'addressLocality',
                    label: 'City',
                    inputType: 'text',
                    required: true,
                },
                {
                    property: 'addressRegion',
                    label: 'State',
                    inputType: 'select',
                    options: [
                        {key: 'AL', value: 'AL'},
                        {key: 'AK', value: 'AK'},
                        {key: 'AZ', value: 'AZ'},
                    ],
                    required: true,
                },
                {
                    property: 'firstName',
                    label: 'First Name',
                    inputType: 'text',
                    required: true,
                },
                {
                    property: 'lastName',
                    label: 'Last Name',
                    inputType: 'text',
                    required: true,
                },
                {
                    property: 'postalCode',
                    label: 'ZIP Code',
                    inputType: 'text',
                    required: true,
                    pattern: '^d{5}$',
                },
                {
                    property: 'streetAddress',
                    label: 'Street Address',
                    inputType: 'text',
                    required: true,
                },
            ],
            labels: true,
            placeholders: false
        })
    })

})