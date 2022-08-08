require("dotenv").config();
const { get } = require("lodash");
const { SalesOrder } = require('@byjus-orders/nmsexemplum')

let logger = global.byjus.logger;

const processData = async (changeStreamDoc, topic) => {
    const { nativeClient } = global.byjus;
    const { fullDocument, ns, operationType, updateDescription = {} } = changeStreamDoc || {};

    try {
        console.log(`Streaming Data from topic : ${topic} -> ${JSON.stringify(changeStreamDoc, null, 2)}`);
        return changeStreamDoc;
    }
    catch (error) {
        //console.log(error);
        logger.info(`Error in Consuming data- ${error}`);
        return {
            errorMessage: error.toString(),
        };
    }
};

module.exports = {
    processData,
};