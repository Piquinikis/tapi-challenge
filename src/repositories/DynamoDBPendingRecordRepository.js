const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const IPendingRecordRepository = require('./IPendingRecordRepository');

class DynamoDBPendingRecordRepository extends IPendingRecordRepository {
    constructor(tableName) {
        super();
        this.tableName = tableName;
    }

    async getPendingRecords(limit) {
        const result = await dynamodb.scan({
            TableName: this.tableName,
            FilterExpression: '#st = :pending',
            ExpressionAttributeNames: { '#st': 'status' },
            ExpressionAttributeValues: { ':pending': 'PENDING' },
            Limit: limit
        }).promise();

        return result.Items;
    }

    async updateRecordStatus(id, status) {
        await dynamodb.update({
            TableName: this.tableName,
            Key: { id },
            UpdateExpression: 'SET #st = :status',
            ExpressionAttributeNames: { '#st': 'status' },
            ExpressionAttributeValues: { ':status': status }
        }).promise();
    }
}

module.exports = DynamoDBPendingRecordRepository; 