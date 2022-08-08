require("dotenv").config();
const pino = require("pino");
const cryptoJS = require("crypto-js");
const { startsWith, replace, camelCase } = require("lodash");

const getLogger = () => {
    const customProps = {
        prettyPrint: {
            colorize: true,
            translateTime: true,
            crlf: true,
        }
    };
    const logger = (process.env.NODE_ENV === "local") ? pino(customProps) : pino();
    return logger;
}

const decryptConfig = configObject => {
    for (const key in configObject) {
        if (configObject[key] instanceof Object) {
            decryptConfig(configObject[key])
        }
        else {
            const value = configObject[key];
            if (startsWith(key, "encrypted")) {
                const decryptedText = cryptoJS.AES.decrypt(value, process.env.KEY);
                const decryptedData = decryptedText.toString(cryptoJS.enc.Utf8);
                const decryptedKeyName = camelCase(replace(key, "encrypted", ""));
                configObject[decryptedKeyName] = decryptedData;
                delete configObject[key];
            }
        }
    }
    return configObject;
};

module.exports = {
    getLogger,
    decryptConfig
}
