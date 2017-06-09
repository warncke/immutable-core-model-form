'use strict'

/* native modules */
const assert = require('assert')

/* npm modules */
const ImmutableCoreModel = require('immutable-core-model')
const _ = require('lodash')
const mergeArgs = require('merge-args')()

/* exports */
module.exports = initForm

/* contants */

// global form configuration defaults
const defaultForm = {
    // target url
    action: '',
    // form has field that uses ckeditor
    ckeditor: false,
    // form encoding type
    enctype: '',
    // list of general errors that occurred on submit
    errors: [],
    // list of form fields in the order they should be displayed
    fields: [],
    // id of form
    id: '',
    // include labels in form output
    labels: true,
    // http method for form
    method: '',
    // create / update model
    mode: 'create',
    // model form is built for
    model: undefined,
    // include placeholders in inputs
    placeholders: false,
    // url to redirect to on success
    redirect: undefined,
    // submit config
    submit: {
        title: 'Submit',
    },
    // form title
    title: 'Form',
}

/**
 * @function initForm
 *
 * set general form configuration options from defaults and args
 *
 * @param {object} args
 *
 * @throws {Error}
 */
function initForm (args) {
    // create new form instance based on default configuration
    _.merge(this, _.cloneDeep(defaultForm))
    // merge args over default form config
    mergeArgs(this, args)
}