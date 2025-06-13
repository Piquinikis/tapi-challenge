const AWS = require('aws-sdk');
const sqs = new AWS.SQS();
const DynamoDBPendingRecordRepository = require('./repositories/DynamoDBPendingRecordRepository');

const QUEUE_URL = process.env.QUEUE_URL;
const PENDING_TABLE = process.env.PENDING_TABLE;

const pendingRecordRepository = new DynamoDBPendingRecordRepository(PENDING_TABLE);

exports.handler = async (event) => {
    const pendingRecords = await pendingRecordRepository.getPendingRecords(100);

    const results = [];
    for (const record of pendingRecords) {
        results.push(
            sqs.sendMessage({
                QueueUrl: QUEUE_URL,
                MessageGroupId: record.provider_id,
                MessageDeduplicationId: record.id,
                MessageBody: JSON.stringify(record)
            }).promise()
        );

        await pendingRecordRepository.updateRecordStatus(record.id, 'EN_QUEUED');
    }
    
    await Promise.all(results);
    return {
        statusCode: 200,
        body: `Encolados: ${results.length} mensajes`
    };
};