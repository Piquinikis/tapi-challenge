const DynamoDBResultRepository = require('./repositories/DynamoDBResultRepository');
const DynamoDBPendingRecordRepository = require('./repositories/DynamoDBPendingRecordRepository');

const RESULTS_TABLE = process.env.RESULTS_TABLE;
const PENDING_TABLE = process.env.PENDING_TABLE;

const resultRepository = new DynamoDBResultRepository(RESULTS_TABLE);
const pendingRecordRepository = new DynamoDBPendingRecordRepository(PENDING_TABLE);

exports.handler = async (event) => {
    const message = event.Records[0].body;
    await resultRepository.saveResult({
        id: message.id,
        provider_id: message.provider_id,
        status: message.status,
        result: message.result,
        processed_at: message.processed_at
    });

    try {
        await pendingRecordRepository.updateRecordStatus(
            message.id,
            message.status === 'SUCCESS' ? 'PROCESSED' : 'FAILED',
            message.processed_at
        );
    } catch (err) {
        if (!err.message.includes('ConditionalCheckFailedException')) {
            throw err;
        }
    }
};
