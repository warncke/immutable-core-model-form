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
    // list of form fields in the order they should be displayed
    fields: [],
    // id of form
    id: '',
    // include labels in form output
    labels: true,
    // model form is built for
    model: undefined,
    // include placeholders in inputs
    placeholders: false,
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
    // require something that looks like model
    assert.ok(ImmutableCoreModel.looksLike(args.model), 'invalid model')
    // require model to have data schema
    assert.ok(args.model.schemaData, 'model must have data schema')
    // create new form instance based on default configuration
    _.merge(this, _.cloneDeep(defaultForm))
    // merge args over default form config
    mergeArgs(this, args)
}