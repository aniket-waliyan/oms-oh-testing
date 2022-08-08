require("dotenv").config();
const kafkaNode = require("kafka-node");
const Kafka = require("node-rdkafka");
const async = require("async");
const { get, cloneDeep, upperCase } = require("lodash");

const { processData } = require("./processor");
const { decryptConfig } = require("./util");
const connectorDetails = require('../connector/connector.config.json');

let logger = global.byjus.logger;

/**
 * While running the consumer in local if facing any issues in 'node-rdkafka'
comment the 'node-rdkafka' functionalities and uncomment the 'kafka-node' functionalities
 * Don't commit the 'kafka-node' functionalities into dev or prod environment
*/

const startConsumer = async () => {
    try {
        const configList = get(connectorDetails, "config", {});
        const consumerConfig = decryptConfig(cloneDeep(configList));
        logger.info({ topic: consumerConfig.topic, kafkaHost: consumerConfig.kafkaHost, config: JSON.stringify(consumerConfig) }, "DEFAULT CONFIGURATION");
        if (process.env.NODE_ENV !== "local") {
            /**'node-rdkafka' related changes */
            executeThroughRdKafka(consumerConfig);
        } else {
            /**'kafka-node' related changes */
            // await executeThroughNodeKafka(consumerConfig);
            executeThroughRdKafka(consumerConfig);

        }
    } catch (e) {
        logger.error(`Error in OH-OMSLite aggregator consumer: ${e.message}`);
    }
}

const executeThroughRdKafka = (consumerConfig) => {
    const kafkaConfig = {
        "security.protocol": "sasl_ssl",
        "sasl.mechanisms": upperCase(consumerConfig.sasl.mechanism),
        "sasl.username": consumerConfig.sasl.username,
        "sasl.password": consumerConfig.sasl.password,
        "bootstrap.servers": consumerConfig.kafkaHost,
        "group.id": consumerConfig.groupId
    };

    const topicConfig = {
        "auto.offset.reset": "latest",
    };

    const streamConfig = {
        topics: connectorDetails.topics,
    };

    logger.info({ kafkaConfig, topicConfig, streamConfig });

    // Creating a kafka consumer group.
    const kafkaConsumer = Kafka.KafkaConsumer.createReadStream(kafkaConfig, topicConfig, streamConfig);

    kafkaConsumer.on("ready", () => {
        logger.info("Consumer connected successfully.");
    });
    //
    // // Listening for messages from kafka.
    // kafkaConsumer.on("data", async (data) => {
    //     try {
    //         const { value, offset, timeStamp, partition } = data;
    //         console.log(data);
    //         const messageData = JSON.parse(value);
    //         const payload = JSON.parse(messageData.payload.replace(/\bNaN\b/g, "null"));
    //         workerQueue.push(payload, function (err, result) {
    //             if (err) {
    //                 logger.error(err);
    //             }
    //         });
    //         kafkaConsumer.pause();
    //     } catch (error) {
    //         logger.error("Error", error);
    //     }
    // });
    //
    // kafkaConsumer.on("event.log", (e) => {
    //     logger.error(" event.log Consumer ready to listen to messages.", e);
    // });
    // kafkaConsumer.on("event.error", (error) => {
    //     logger.error("Kafka Consumer Error", error);
    // });
    //
    // const workerQueue = async.queue((payload, callback) => {
    //     processData(payload)
    //         .then((response) => {
    //             if (response && response.errorMessage) {
    //                 logger.error(`Error : ${response} not updated due to the error : ${response.errorMessage}`);
    //             } else if (response) {
    //                 logger.info(`${response} is successfully synced to OMSLite`);
    //             }
    //             kafkaConsumer.resume();
    //             callback();
    //         });
    // }, 1);
    //
    // workerQueue.drain = () => {
    //     kafkaConsumer.resume();
    // };
}

const executeThroughNodeKafka = async (consumerConfig) => {
    const topics = connectorDetails.topics;
    logger.info({ topic: topics, kafkaHost: consumerConfig.kafkaHost, config: JSON.stringify(consumerConfig) }, "DEFAULT CONFIGURATION");
    // Creating a kafka consumer group.
    const kafkaConsumerGroup = new kafkaNode.ConsumerGroup(consumerConfig, topics);
    kafkaConsumerGroup.on("connect", () => {
        logger.info(`Kafka Consumer Connected Successfully with topic : ${topics}`);
    });
    // Listening for messages from kafka.
    kafkaConsumerGroup.on("message", async (message) => {
        try {
            let payload = JSON.parse(message.value);
            const response = await processData(payload, message.topic);

            if (response && response.errorMessage) {
                logger.error(`Error: ${response} not updated due : ${response.errorMessage}`);
            } else if (response) {
                logger.info(`${response} is successfully synced to OH-OMSLite`);
            }

            kafkaConsumerGroup.commit((error, data) => {
                if (error) {
                    logger.error(error);
                } else {
                    logger.info('Commit success ');
                }
            });
        }
        catch (error) {
            logger.error(`Error: ${error} - Request : ${message}`);
        }
    });

    kafkaConsumerGroup.on("error",(error) => {
        logger.error(`Kafka Consumer Error: ${error}`);
    })

}

module.exports = {
    startConsumer,
};