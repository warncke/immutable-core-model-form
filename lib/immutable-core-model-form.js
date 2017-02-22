'use strict'

/* npm modules */
const _ = require('lodash')

/* exports */
module.exports = ImmutableCoreModelForm

/* application modules */
const ImmutableCoreModelFormInstance = require('./immutable-core-model-form-instance')
const initFields = require('./immutable-core-model-form/init-fields')
const initForm = require('./immutable-core-model-form/init-form')

/**
 * @function ImmutableCoreModelForm
 *
 * instantiate a new form object
 *
 * @param {object} args
 *
 * @returns {ImmutableCoreModelForm}
 *
 * @throws {Error}
 */
function ImmutableCoreModelForm (args) {
    // set general form configuration options from defaults and args
    this.initForm(args)
    // create field specification based on model and args
    this.initFields()
}

/* public methods */
ImmutableCoreModelForm.prototype = {
    initFields: initFields,
    initForm: initForm,
    inspect: inspect,
    newInstance: newInstance,
}

/**
 * @function inspect
 *
 * custom inspect method for console.log
 *
 * @returns {object}
 */
function inspect () {
    return _.omit(this, ['inspect', 'initFields', 'initForm', 'model', 'newInstance'])
}

/**
 * @function newInstance
 *
 * create new ImmutableCoreModelFormInstance from ImmutableCoreModelForm and
 * either model or input and error data.
 *
 * @param {object} args
 *
 * @returns {ImmutableCoreModelFormInstance}
 *
 * @throws {Error}
 */
function newInstance (args) {
    // add this to args
    args.form = this
    // return new instance
    return new ImmutableCoreModelFormInstance(args)
}