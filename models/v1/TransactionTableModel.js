var { AppModel } = require('./AppModel');
// For hidden any field from the select query
var Cryptr = require('cryptr'),
    cryptr = new Cryptr(require('../../config/secret')());
const visibilityPlugin = require('objection-visibility');

class Wallets extends visibilityPlugin((AppModel)) {

    constructor() {
        super();
    }

    static get hidden() {
        return ['id'];
    }

    static get tableName() {
        return 'transaction_table';
    }

	/** Each model must have a column (or a set of columns) that uniquely
	   *   identifies the rows. The column(s) can be specified using the `idColumn`
	   *   property. `idColumn` returns `id` by default and doesn't need to be
	   *   specified unless the model's primary key is something else.
	   */
    static get idColumn() {
        return 'id';
    }

    static get virtualAttributes() {

        return ['encript_id'];
    }

    encript_id() {

        if (this.id) {
            return cryptr.encrypt(this.id);
        }
    }

	/**
	   * Decript Id
	   * Used for decript user id
	   *
	   * @param number id user_id
	   *
	   * @returns string decripted id
	   */
    static decript_id(id) {
        return cryptr.decrypt(id);
    }

	/** Optional JSON schema. This is not the database schema!
	   *   Nothing is generated based on this. This is only used
	   *   for input validation. Whenever a model instance is created
	   *   either explicitly or implicitly it is checked against this schema.
	   *   http://json-schema.org/.
	   */
    static get jsonSchema() {

        return {
            type: 'object', required: [
                // 'user_id'
            ], properties: {}
        };
    }
}

module.exports = Wallets;