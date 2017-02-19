'use strict'

const ImmutableCoreModel = require('immutable-core-model')
const ImmutableCoreModelForm = require('../lib/immutable-core-model-form')

const chai = require('chai')
const immutable = require('immutable-core')

const assert = chai.assert

describe('immutable-core-model-form', function () {

    // model for testing
    var addressModel = new ImmutableCoreModel({
        name: 'address',
        properties: {
            addressCountry: {
                default: 'US',
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
    })

})