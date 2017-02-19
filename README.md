# immutable-core-model-form

Immutable Core Model Form provides a Class for defining forms for Immutable
Core Models.

Immutable Core Model Form instances are constructed with defaults based on the
schema of the Immutable Core Model the form is for. These defaults can then be
overriden to customize the form.

## Creating a From

    const ImmutableCoreModel = require('immutable-core-model')
    const ImmutableCoreModelFrom = require('immutable-core-model-form')

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

    var fooForm = new ImmutableCoreModelForm({
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
                type: 'hidden',
            },
        ],
        model: fooModel,
    })

In this example an address model is created with property names based on
[Schema.org Postal Address](https://schema.org/PostalAddress).

The enum, default, description, title and type from the
[JSON Schema](https://spacetelescope.github.io/understanding-json-schema/)
for the model will be used to populate default form options.

