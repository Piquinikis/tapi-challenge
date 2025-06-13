const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const IResultRepository = require('./IResultRepository');

class DynamoDBResultRepository extends IResultRepository {
    constructor(tableName) {
        super();
        this.tableName = tableName;
    }

    async saveResult(result) {
        try {
            await dynamodb.put({
                TableName: this.tableName,
                Item: {
                    id: result.id,
                    provider_id: result.provider_id,
                    status: result.status,
                    result: result.result,
                    processed_at: result.processed_at
                },
                ConditionExpression: "attribute_not_exists(id)" // idempotence
            }).promise();
        } catch (err) {
            if (!err.message.includes('ConditionalCheckFailedException')) {
                throw err;
            }
            // Result already exists: not an error, continue
        }
    }
}

module.exports = DynamoDBResultRepository; 