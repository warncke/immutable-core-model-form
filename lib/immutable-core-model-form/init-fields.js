'use strict'

/* native modules */
const assert = require('assert')

/* npm modules */
const _ = require('lodash')
const changeCase = require('change-case')

/* exports */
module.exports = initFields

/* constants */

// valid input types
const inputTypes = {
    checkbox: {},
    hidden: {},
    radio: {},
    select: {},
    text: {},
}

/**
 * @function initFields
 *
 * create field specification based on model and args
 *
 * @param {object} args
 *
 * @throws {Error}
 */
function initFields () {
    var form = this
    // if not fields list was passed in args then add all model properties
    if (!this.fields.length && this.model.schemaData) {
        // get data properites from schema
        var properties = this.model.schemaData.properties
        // add each property from data schema as form field
        _.each(properties, (schema, property) => {
            this.fields.push(property)
        })
    }
    // iterate over fields building spec based on args and schema
    this.fields = _.map(this.fields, field => {
        // field group
        if (Array.isArray(field)) {
            // build spec for each field in group
            field = _.map(field, field => initField(form, field))
            // set correct width units for fields
            setUnits(form, field)
        }
        // individual field
        else {
            field = initField(form, field)
        }
        // return field specification
        return field
    })
}

/* private functions */

/**
 * @function initField
 *
 * build a field specification from arguments
 *
 * @param {ImmutableCoreModelForm} form
 * @param {object|string} args
 *
 * @returns {object}
 *
 * @throws {Error}
 */
function initField (form, args) {
    // field specification to return
    var field = {}
    // get model
    var model = form.model
    // set default based on schema data
    if (form.model.schemaData) {
        // get data properites from schema
        var properties = form.model.schemaData.properties
        // create lookup table of required properties
        var required = _.zipObject(form.model.schemaData.required, _.map(form.model.schemaData.required, () => true))
    }
    else {
        var properties = {}
        var required = {}
    }
    // string is passed then use as property name
    if (typeof args === 'string') {
        field.property = args
        // set args as empty object so that it can be checked for values
        args = {}
    }
    else {
        // require field to be object
        assert.ok(args && typeof args === 'object', 'field must be object')
        // field can be a section divider
        if (args.legend) {
            return args
        }
        else {
            // require field to have property
            assert.ok(typeof args.property === 'string' && args.property.length, 'field must have property')
            // set property from args
            field.property = args.property
        }
    }
    // get property schema for field
    var schema = properties[field.property]
    // create field title from schema or property name
    var title = schema && schema.title
        ? schema.title
        : changeCase.titleCase(field.property)
    // set label if labels are enabled
    if (form.labels && args.label !== false) {
        field.label = title
        // delete so wont be merged over placeholder
        if (args.label === true) {
            delete args.label
        }
    }
    // set placeholder if placeholders enabled
    if (form.placeholders || args.placeholder !== false) {
        field.placeholder = title
        // delete so wont be merged over placeholder
        if (args.placeholder === true) {
            delete args.placeholder
        }
    }
    // if property has schema then use schema to populate default values
    if (schema) {
        // if schema has enum then default to select type
        if (schema.enum) {
            field.inputType = 'select'
            field.options = _.map(schema.enum, value => {
                // by default use enum values as both key and value
                return {
                    title: value,
                    value: value,
                }
            })
        }
        // if value is boolean then default to checkbox
        else if (schema.type === 'boolean') {
            field.inputType = 'checkbox'
        }
        // otherwise use text
        else {
            field.inputType = 'text'
        }
        // if property is required make field required
        if (required[field.property]) {
            field.required = true
        }
        // if schema has pattern apply to field
        if (schema.pattern) {
            field.pattern = schema.pattern
        }
        // use schema description
        field.description = schema.description
        // set default value
        field.value = schema.default
    }
    // property does not have schema
    else {
        // if property does not have schema then it must have input type
        assert.ok(inputTypes[args.inputType], 'field without schema must have inputType')
    }
    // set name for input as the modelName[property]
    field.name = model.name+'['+field.property+']'
    // merge args over default set for field
    _.merge(field, args)
    // return field specification
    return field
}

/**
 * @function setUnits
 *
 * set unit property of fields in field group
 *
 * @param {ImmutableCoreModelForm} form
 * @param {array} fieldGroup
 *
 * @throws {Error}
 */
function setUnits (form, fieldGroup) {
    var hasUnit = false
    var noUnit = false
    // check all fields in group to see if they have unit field
    _.each(fieldGroup, field => {
        if (field.unit) {
            hasUnit = true
        }
        else {
            noUnit = true
        }
    })
    // if some fields have unit property and other dont throw error
    assert.ok(!(hasUnit && noUnit), 'some fields do not have unit')
    // if unit already defined do nothing
    if (hasUnit) {
        return
    }
    // 
    var units = fieldGroup.length
    // add unit property to each
    _.each(fieldGroup, field => {
        field.unit = '1-'+units
    })
}