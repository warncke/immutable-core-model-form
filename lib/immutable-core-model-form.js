'use strict'

/* exports */
module.exports = ImmutableCoreModelForm

/* application modules */
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
    this.initFields(args)
}

/* public methods */
ImmutableCoreModelForm.prototype = {
    initFields: initFields,
    initForm: initForm,   
}