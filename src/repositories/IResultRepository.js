class IResultRepository {
    /**
     * Save a result record
     * @param {Object} result - The result to save
     * @param {string} result.id - Record ID
     * @param {string} result.provider_id - Provider ID
     * @param {string} result.status - Status (SUCCESS/ERROR)
     * @param {Object} result.result - Result data
     * @param {string} result.processed_at - Processing timestamp
     * @returns {Promise<void>}
     */
    async saveResult(result) {
        throw new Error('Method not implemented');
    }
}

module.exports = IResultRepository; 