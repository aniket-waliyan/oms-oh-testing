require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;

const { getLogger } = require("./src/util");
let logger;

(async () => {
    try {
        logger = getLogger();
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true
        };

        // const nativeClient = await MongoClient.connect(process.env.MONGO_DB_URI, options);

        global.byjus = {
            // nativeClient,
            logger
        };
        logger.info("Oh-OMSLite Consumer is in Online...");

        const { startConsumer } = require("./src/consumer");
        await startConsumer();
    }
    catch (error) {
        // console.log(error);
        logger.error(error);
        process.exit(1);
    }
})();
