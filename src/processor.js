const AWS = require('aws-sdk');
const axios = require('axios');
const sns = new AWS.SNS();
const sqs = new AWS.SQS();

const DLQ_URL = process.env.DLQ_URL;

exports.handler = async (event) => {
    for (const record of event.Records) {
        const payload = JSON.parse(record.body);
        try {
            const apiResponse = await axios.post(process.env.API_URL + payload.endpoint, payload.body);
            await sendResultToSNS(payload, 'SUCCESS', apiResponse.data);
        } catch (e) {
            if (e.response) {
                const statusCode = e.response.status;
                if (statusCode >= 500) {
                    throw new Error("TRANSIENT_ERROR");
                }
                
                if (statusCode < 500) {
                    await sqs.sendMessage({
                        QueueUrl: DLQ_URL,
                        MessageBody: JSON.stringify({
                            originalMessage: payload,
                            error: {
                                statusCode: statusCode,
                                data: e.response.data
                            },
                            timestamp: new Date().toISOString()
                        })
                    }).promise();
                    
                    continue;
                }
            }
            throw e;
        }
    }
};

async function sendResultToSNS(payload, status, resultData) {
    await sns.publish({
        TopicArn: topicArn,
        Message: JSON.stringify({
            id: payload.id,
            provider_id: payload.provider_id,
            endpoint: payload.endpoint,
            body: payload.body,
            status: status,
            result: resultData,
            processed_at: new Date().toISOString()
        })
    }).promise();
}