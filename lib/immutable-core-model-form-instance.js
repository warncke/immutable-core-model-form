'use strict'

/* native modules */
const assert = require('assert')

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
    // if there is only input then init form with pre-fill values
    else if (args.input) {
        this.initInput(args.input)
        // delete from args so other values can be merged
        delete args.input
    }
    // merge remaining args to form
    mergeArgs(this, args)
    // if new instance is in udpate mode and model does not have a parentId
    // column then it cannot be update so disable all fields
    if (args.mode && args.mode === 'update' && !this.model.columnName('parentId')) {
        // disable all fields
        _.each(this.fields, field => {
            field.readonly = true
        })
        // disable submit
        this.submit = false
    }
}

/* public methods */
ImmutableCoreModelFormInstance.prototype = {
    getErrorField: getErrorField,
    getErrorMessage: getErrorMessage,
    initInput: initInput,
    initRecord: initRecord,
    setErrorPath: setErrorPath,
    setFieldError: setFieldError,
    setFieldErrors: setFieldErrors,
    setFieldValues: setFieldValues,
}

/* constants */
const indexRegExp = new RegExp(/\[|\]/g)

/**
 * @function getErrorField
 *
 * get field from validation error data path and optional missing property name
 *
 * @param {object} error
 *
 * @returns {object}
 */
function getErrorField (error) {
    // if field is nested the get nested field
    if (error.baseProperty) {
        // get field from base property
        var field = _.find(this.fields, field => field.property === error.baseProperty)
        // get sub field
        return getSubField(field, error.index, error.property)
    }
    // return field
    else {
        return _.find(this.fields, field => field.property === error.property)
    }
}

/**
 * @function getErrorMessage
 *
 * get error message from validation error and any custom message set on model
 *
 * @param {object} error
 *
 * @returns {string}
 */
function getErrorMessage (error) {
    // get schema from model
    var schema = this.model && this.model.schemaData && this.model.schemaData.properties
    // error message
    var message
    // get custom error message from schema if defined
    if (schema) {
        // if there is a base property get nested property
        if (error.baseProperty) {
            message = schema[error.baseProperty].items
                && schema[error.baseProperty].items.properties
                && schema[error.baseProperty].items.properties[error.property]
                && schema[error.baseProperty].items.properties[error.property].errors 
                && schema[error.baseProperty].items.properties[error.property].errors[error.keyword]
        }
        // get custom error message if any
        else {
            message = schema[error.property]
                && schema[error.property].errors
                && schema[error.property].errors[error.keyword]
        }
    }
    // if there is custom error message return it
    if (message) {
        return message
    }
    // default missing property error
    if (error.params && error.params.missingProperty) {
        return error.property+' required'
    }
    // default validation error
    else {
        return error.message
    }
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
    // set field values from input
    this.setFieldValues(input)
    // set errors and clear values on fields with errors
    this.setFieldErrors(error)
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
    // set field values from model data
    this.setFieldValues(record.data)
}

/**
 * @function setErrorPath
 *
 * set path properties for error
 *
 * @param {object} error
 */
function setErrorPath (error) {
    // split path into segments on dots
    var path = error.dataPath.split('.')
    // get missing property if any
    var missingProperty = error.params && error.params.missingProperty
    // path starts with dot and includes the data property name so all paths
    // start with two segments that will be ignored - the third segment is a
    // property name which may include an index for nested arrays
    if (path.length > 2) {
        var property = path[2]
        // split property on index brackets to extract index if it exists
        var propertySegments = property.split(indexRegExp)
        // if there is more than one segment then there is an index
        if (propertySegments.length > 1) {
            // set property name without index
            error.baseProperty = propertySegments[0]
            // get index from property name
            error.index = parseInt(propertySegments[1])
            // if there is missing property use it as property
            error.property = missingProperty
                ? missingProperty
                : path[3]
        }
        // property does not have index
        else {
            if (missingProperty) {
                error.baseProperty = property
                error.property = missingProperty
            }
            else {
                error.property = property
            }
        }
    }
    // if there is not base property then missing property is only property
    else {
        error.property = missingProperty
    }
}

/**
 * @function setFieldError
 *
 * set validtion error on field and clear value
 *
 * @param {object} error
 */
function setFieldError (error) {
    // set path properties for error
    this.setErrorPath(error)
    // get field from error path and missing property name
    var field = this.getErrorField(error)
    // get error message based on error and custom messages on model
    var message = this.getErrorMessage(error)
    // if field is found and not hidden then add error to field
    if (field && !field.hidden) {
        // clear value from field - setting to default or undefined
        field.value = field.default
        // set error message on field
        field.error = message
    }
    // if not specific field set general error on field
    else {
        this.errors.push(message)
    }
}

/**
 * @function setFieldErrors
 *
 * set errors and clear values on fields with errors
 *
 * @param {object} data
 */
function setFieldErrors (error) {
    // skip if no error object
    if (!error) {
        return
    }
    // if error is string then add as generic error
    if (typeof error === 'string') {
        this.errors.push(error)
    }
    // if error is object then should be error object from AJV
    else if (typeof error === 'object') {
        // validation errors are set as array on error data - it this is not
        // set then only add generic error
        if (!Array.isArray(error.data)) {
            // create message
            var message = typeof error.message === 'string'
                ? error.message
                : 'An error occurred'
            // add message to errors
            this.errors.push(message)
            // skip further processing
            return
        }
        // add validation errors to fields and clear values for fields with errors
        _.each(error.data, error => this.setFieldError(error))
    }
}

/**
 * @function setFieldValues
 *
 * set value for fields from input or model data
 *
 * @param {object} data
 *
 * @throws {Error}
 */
function setFieldValues (data) {
    // skip if no data
    if (!data) {
        return
    }
    // get values for fields
    _.each(this.fields, field => {
        // if field is array set value for each field in array
        if (Array.isArray(field)) {
            _.each(field, field => setFieldValue(data, field))
        }
        // set value for field
        else {
            setFieldValue(data, field)
        }
    })
}

/* private functions */

/**
 * @function getSubField
 *
 * get sub field by index and property name from field
 *
 * @param {object} field
 * @param {integer} index
 * @param {string} property
 *
 * @returns {object}
 */
function getSubField (field, index, property) {
    // get list of sub fields by index
    var fields = field.values.length > index
        ? field.values[index]
        : field.fields
    // find field for property
    return _.find(fields, field => field.property === property)
}

/**
 * @function setFieldValue
 *
 * set value for field from input or model data
 *
 * @param {object} data
 * @param {object} field
 *
 * @throws {Error}
 */
function setFieldValue (data, field) {
    // do not set value for password input
    if (field.inputType === 'password') {
        return
    }
    // get value
    var value = data[field.property] || data[field.name]
    // field is nested array
    if (field.nested && field.array) {
        setFieldValuesNestedArray(field, value)
    }
    // set value
    else {
        field.value = value
    }
    // if field is select then set selected flag on option that matches value
    if (field.inputType === 'select') {
        _.each(field.options, option => {
            if (option.value === field.value) {
                option.selected = true
            }
        })
    }
    // if field is immutable and it has a value then make it readonly
    if (field.immutable && field.value !== undefined) {
        field.readonly = true
    }
}

/**
 * @function setFieldValuesNestedArray
 *
 * create field values from record property which is array of items
 *
 * @param {object} field
 * @param {object} items
 *
 * @throws {Error}
 */
function setFieldValuesNestedArray (field, items) {
    // property value must be array of items
    assert.ok(Array.isArray(items), 'expected array for '+field.property)
    // index of item in values array
    var idx = 0
    // create entry in field values for each item in array
    _.each(items, item => {
        // index string for field name
        var nameIdx = '['+idx+']'
        // each entry in values is an array of fields with values
        var values = []
        // add each sub field to values with value from record item
        _.each(field.fields, field => {
            // clone field to change properties for local version
            field = _.cloneDeep(field)
            // set value from item
            setFieldValue(item, field)
            // replace index in field name
            field.name = field.name.replace('[0]', nameIdx)
            // add field to list of values for item
            values.push(field)
        })
        // add row to values
        field.values.push(values)
        // increment row count
        idx++
    })
    // get index string for new row
    var nameIdx = '['+idx+']'
    // update row index for field names that will be used for a new row
    _.each(field.fields, field => {
        field.name = field.name.replace('[0]', nameIdx)
    })
}