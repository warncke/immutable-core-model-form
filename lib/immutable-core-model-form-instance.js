'use strict'

/* npm modules */
const _ = require('lodash')
const mergeArgs = require('merge-args')()

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
    // delete from args so other values can be merged
    delete args.form
    // if record is passed init form values from model instance
    if (args.record) {
        this.initRecord(args.record)
        // delete from args so other values can be merged
        delete args.record
    }
    // if there was input with errors init form with those values
    else if (args.error) {
        this.initInput(args.input, args.error)
        // delete from args so other values can be merged
        delete args.error
        delete args.input
    }
    // throw error on invalid input
    else {
        throw new Error('need either record or errors and input')
    }
    // merge remaining args to form
    mergeArgs(this, args)
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
 * @param {object} error
 *
 * @throws {Error}
 */
function initInput (input, error) {
    // map of errors by property name
    var errorsByName = {}
    // default input
    if (!input) {
        input = {}
    }
    // add errors
    if (error) {
        // if error data is array then it should be list of field errors
        if (Array.isArray(error.data)) {
            // map errors by property name
            _.each(error.data, error => {
                // this is a missing property error
                if (error.params && error.params.missingProperty) {
                    // get property
                    var property = error.params.missingProperty
                    // add error
                    errorsByName[property] = [property+' required']
                }
                // try getting property from dataPath
                else if (error.dataPath) {
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
                    // ajv does not seem to support custom error messages yet
                    // so hack in loading of custom error messages from schema
                    var message = schema && schema.errors && schema.errors[error.keyword]
                        ? schema.errors[error.keyword]
                        : error.message
                    // add error message to list
                    errorsByName[property].push(message)
                }
            })
        }
        // otherwise add error message as general form error
        else {
            // create errors array for form
            this.errors = []
            // create message
            var message = typeof error.message == 'string'
                ? error.message
                : 'An error occurred'
            // add message to errors
            this.errors.push(message)
        }
    }
    // set value or error for fields
    _.each(this.fields, field => {
        // if field has errors add them
        if (errorsByName[field.property]) {
            // do not add errors on hidden fields
            if (field.inputType !== 'hidden') {
                // add errors array to field
                field.errors = errorsByName[field.property]
                // add error string to field
                field.error = errorsByName[field.property].join(', ')
                // remove error once added to field
                delete errorsByName[field.property]
            }
        }
        // otherwise add value from input
        else {
            field.value = input[field.property]
        }
    })
    // if there are any errors that were not assigned to fields add to
    // generic form errors
    _.each(_.values(errorsByName), error => {
        // create errors if does not exist
        if (!this.errors) {
            this.errors = []
        }
        // add error to general form errors
        this.errors.push(error)
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
    // get model
    var model = record.model
    // get values for fields
    _.each(this.fields, field => {
        if (Array.isArray(field)) {
            // if field is array iterate over fields
            _.each(field, field => {
                // set value
                field.value = record.data[field.property]
            })
        }
        else {
            // set value
            field.value = record.data[field.property]
            // set readonly flag based on immutable property of column
            if (model.columns[field.property] && model.columns[field.property].immutable) {
                field.readonly = true
            }
        }
    })
}