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
    // skip if no model
    if (!this.model) {
        return
    }
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
            field = _.map(field, field => initField(this, field))
            // set correct width units for fields
            setUnits(this, field)
        }
        // individual field
        else {
            field = initField(this, field)
        }
        // return field specification
        return field
    })
}

/* private functions */

/**
 * @function buildArrayField
 *
 * @param {object} args
 * @param {object} field
 * @param {object} form
 * @param {object} model
 * @param {object} schema
 *
 * build field specification from args and schema for array of fields
 *
 * @returns {Object}
 *
 * @throws {Error}
 */
function buildArrayField (args, field, form, model, schema) {
    // array items must be single object which is the schema for an object
    // that will be repeated in the array
    assert.ok(schema.items && typeof schema.items === 'object' && !Array.isArray(schema.items), field.property+' array must have single object for items')
    // get schema for sub object
    var subSchema = schema.items    
    // get data properites from schema
    var properties = subSchema.properties
    // create lookup table of required properties
    var required = _.zipObject(subSchema.required, _.map(subSchema.required, () => true))
    // set properties for field indicating that it is a nested array of objects
    field.array = true
    field.nested = true
    // create list of sub fields for field
    field.fields = []
    // list values
    field.values = []
    // get list of sub fields from args or sub schema properties
    var subFields = Array.isArray(args.fields)
        ? args.fields
        : _.keys(properties)
    // add each sub field
    _.each(subFields, subField => {
        // if field is string then treat as property name
        if (typeof subField === 'string') {
            subField = {
                property: subField,
            }
        }
        // require property to exist
        assert.ok(properties[subField.property], 'invalid property '+subField.property+' for '+field.property+' nested array')
        // set sub field properties based on args and schema
        buildField(_.clone(subField), subField, form, model, properties[subField.property])
        // set required flag if property required
        if (required[subField.property]) {
            subField.required = true
        }
        // set field id with 0 appended
        subField.id = subField.id + '-0'
        // set field name which includes field and sub field property and index
        subField.name = model.name+'['+field.property+'][0]['+subField.property+']'
        // add to fields
        field.fields.push(subField)
    })

    return field
}

/**
 * @function buildField
 *
 * @param {object} args
 * @param {object} field
 * @param {object} form
 * @param {object} model
 * @param {object} schema
 * @param {boolean} isArrayField
 *
 * build field specification from args and schema
 *
 * @returns {Object}
 *
 * @throws {Error}
 */
function buildField (args, field, form, model, schema, isArrayField) {
    // create field title from schema or property name
    var title = schema && schema.title
        ? schema.title
        : changeCase.titleCase(field.property)
    // set field title
    field.title = title
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
    // set immutable property on field - field will be disabled/readonly after
    // initial value is set
    if (model.columns[field.property] && model.columns[field.property].immutable) {
        field.immutable = true
    }
    // if property has schema then use schema to populate default values
    if (schema) {
        // if schema is an array then need to create sub fields for elements
        if (schema.type === 'array') {
            // do not allow nested arrays
            assert.ok(!isArrayField, 'nested arrays not supported')
            // build field that is array of fields
            return buildArrayField(args, field, form, model, schema)
        }
        // if schema has enum then default to select type
        else if (schema.enum) {
            field.inputType = 'select'
            field.options = _.map(schema.enum, value => {
                // by default use enum values as both key and value
                var option = {
                    title: value,
                    value: value,
                }
                // set selected flag for default value
                if (schema.default && schema.default === value) {
                    option.selected = true
                }
                return option
            })
        }
        // if value is boolean then default to checkbox
        else if (schema.type === 'boolean') {
            field.inputType = 'checkbox'
            // set default value
            field.value = schema.default
        }
        // otherwise use text
        else {
            field.inputType = 'text'
            // set default value
            field.value = schema.default
        }
        // if schema has pattern apply to field
        if (schema.pattern) {
            field.pattern = schema.pattern
        }
        // use schema description
        field.description = schema.description
        // store schema type on field since multiple schema types may map
        // to the same input type but need to be handled differently
        field.schemaType = schema.type
    }
    // property does not have schema
    else {
        // if property does not have schema then it must have input type
        assert.ok(inputTypes[args.inputType], `field without schema must have inputType ${model.name} ${field.property}`)
    }
    // set id for input
    field.id = model.path+'-'+field.property
    // set name for input as the modelName[property]
    field.name = model.name+'['+field.property+']'
    // merge args over default set for field
    _.merge(field, args)
    // if ckeditor flag is set on field then set for form
    if (field.ckeditor) {
        form.ckeditor = true
    }
    // return built field
    return field
}

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
    // if property is required make field required
    if (required[field.property]) {
        field.required = true
    }
    // set path base on property name
    field.path = changeCase.paramCase(field.property)
    // get property schema for field
    var schema = properties[field.property]
    // build field data from args and schema
    return buildField(args, field, form, model, schema)
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