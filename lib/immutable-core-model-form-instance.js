'use strict'


/* npm modules */
const _ = require('lodash')

/* exports */
module.exports = ImmutableCoreModelFormInstance

/**
 * @function ImmutableCoreModelFormInstance
 *
 * create new form instance
 *
 * @param {object} args
 *
 * @returns {ImmutableCoreModelFormInstance}
 *
 * @throws {Error}
 */
function ImmutableCoreModelFormInstance (args) {
    // new instance is based on original
    _.merge(this, args.form)
    // deep clone nested data structures
    this.fields = _.cloneDeep(args.form.fields)
    // if record is passed init form values from model instance
    if (args.record) {
        this.initRecord(args.record)
    }
    // if there was input with errors init form with those values
    else if (args.input && args.errors) {
        this.initInput(args.input, args.errors)
    }
    // throw error on invalid input
    else {
        throw new Error('need either record or errors and input')
    }
}

/* public methods */
ImmutableCoreModelFormInstance.prototype = {
    initInput: initInput,
    initRecord: initRecord,
}

/**
 * @function initInput
 *
 * initialize form with values from input and errors
 *
 * @param {object} input
 * @param {object} errors
 *
 * @throws {Error}
 */
function initInput (input, errors) {
    // map of errors by property name
    var errorsByName = {}
    // map errors by property name
    _.each(errors.data, error => {
        // skip if error does not contain dataPath - should not happen
        if (!error.dataPath) {
            return
        }
        // data path contains property name at end
        var property = error.dataPath.match(/\.([^.]+)$/)
        // if not match skip - should not happen
        if (!property) {
            return
        }
        // get actual property from matches array
        property = property[1]
        // create entry for property name
        if (!errorsByName[property]) {
            errorsByName[property] = []
        }
        // get schema for property
        var schema = this.model.schemaData.properties[property]
        // ajv does not seem to support custom error messages yet so hack
        // in loading of custom error messages from schema
        var message = schema && schema.errors && schema.errors[error.keyword]
            ? schema.errors[error.keyword]
            : error.message
        // add error message to list
        errorsByName[property].push(message)
    })
    // set value or error for fields
    _.each(this.fields, field => {
        // if field has errors add them
        if (errorsByName[field.property]) {
            // add errors array to field
            field.errors = errorsByName[field.property]
            // add error string to field
            field.error = errorsByName[field.property].join(', ')
        }
        // otherwise add value from input
        else {
            field.value = input[field.property]
        }
    })
}

/**
 * @function initRecord
 *
 * initialize form with values from model instance
 *
 * @param {object} record
 *
 * @throws {Error}
 */
function initRecord (record) {
    // get values for fields
    _.each(this.fields, field => {
        // set value
        field.value = record.data[field.property]
    })
}