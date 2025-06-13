class IPendingRecordRepository {
    /**
     * Get pending records from the database
     * @param {number} limit - Maximum number of records to return
     * @returns {Promise<Array>} Array of pending records
     */
    async getPendingRecords(limit) {
        throw new Error('Method not implemented');
    }

    /**
     * Update the status of a record
     * @param {string} id - Record ID
     * @param {string} status - New status
     * @returns {Promise<void>}
     */
    async updateRecordStatus(id, status) {
        throw new Error('Method not implemented');
    }
}

module.exports = IPendingRecordRepository; 