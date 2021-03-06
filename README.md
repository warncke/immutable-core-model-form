# immutable-core-model-form

Immutable Core Model Form provides a Class for defining forms for Immutable
Core Models.

Immutable Core Model Form instances are constructed with defaults based on the
schema of the Immutable Core Model the form is for. These defaults can then be
overriden to customize the form.

## Native async/await

Immutable Core Model Form requires Node.js v7.6.0 or greater with native
async/await support.

## Creating a Form From a Model

    const ImmutableCoreModel = require('immutable-core-model')
    const ImmutableCoreModelForm = require('immutable-core-model-form')

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
        model: fooModel,
    })

In this example an address model is created with property names based on
[Schema.org Postal Address](https://schema.org/PostalAddress).

The enum, default, description, title and type from the
[JSON Schema](https://spacetelescope.github.io/understanding-json-schema/)
for the model will be used to populate default form options.

## Fields

The fields array contains field specifications in the order that they will be
presented in the from.

A field can be specified as either the name of the model property that the field
maps to or an object that contains the property along with other configuration
options.

A field group can be specified by providing an array value for the field. This
array must consist of either string property names or object field
specifications.

## Creating a From Without a Model

    var registerForm = new ImmutableCoreModelForm({
        fields: [
            {
                inputType: 'text',
                name: 'firstName'
                placeholder: 'First Name',
                required: true,
            },
            {
                inputType: 'text',
                name: 'lastName'
                placeholder: 'Last Name',
                required: true,
            },
            {
                inputType: 'text',
                name: 'email'
                placeholder: 'Email',
                required: true,
            },
            {
                inputType: 'password',
                name: 'password'
                placeholder: 'Password',
                required: true,
            },
        ],
        method: 'post',
        submit: {
            title: 'Register',
        },
    })

## Form Properties

name            | description                                                  |
----------------|--------------------------------------------------------------|
action          | action property for form element - url form will submit to   |
fields          | list of form fields may be field or sub-list of fields       |
id              | id property for form element                                 |
enctype         | enctype property for form element                            |
method          | method property for form element                             |
submit          | object with submit properties - if false will not render     |
submit.title    | text value for submit button                                 |

## Field Types

name            |
----------------|
checkbox        |
color           |
hidden          |
password        |
select          |
text            |

## Field Properties

name            | description                                                  |
----------------|--------------------------------------------------------------|
description     | description that will be shown in help tooltip               |
id              | input id property, needed to link label to input             |
inputSize       | size property for input                                      |
label           | text that will be shown as label - false for no label        |
name            | input name property                                          |
pattern         | regex pattern for validating input value                     |
placeholder     | placeholder to display in input - false for none             |
readonly        | make input read only                                         |
required        | make input required                                          |


## Units

The unit option is used by the default Immutable App form view to set the grid
units that a field in a field group occupies. Immutable App uses
[Pure CSS Grids](https://purecss.io/grids/).

If the unit option is not specified then it will be defaulted to 1-n where n is
the number of fields in the field group.

## Creating a form instance from a record

    addressForm.newInstance({record: record})

When the newInstance method is called with a model instance a form instance
with values populated from the existing model will be returned.

## Creating a form instance from input and errors

    addressForm.newInstance({
        errors: errors,
        input: input,
    })

If form submission results in errors then newInstance can be called with the
form input and errors to create a new form instance with correct values and
error messages populated.