const { readDataDB, readBusesCapacity } = require('./readingFromDB.js');
const { runModel } = require('./model.js');
const fs = require('fs');
const path = require('path');

const logDirectory = path.join(__dirname, 'logs');

// Create the log directory if it doesn't exist
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

const logFilePath = path.join(logDirectory, 'app.log');

const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Redirect console.log to the log file
const originalLog = console.log;

console.log = function (message) {
    const formattedMessage = `[${new Date().toISOString()}] ${message}\n`;
    logStream.write(formattedMessage);
    originalLog.apply(console, arguments);
};

const originalError = console.error;
console.error = function (error) {
    const formattedError = `[${new Date().toISOString()}] ERROR: ${error.stack}\n`;
    logStream.write(formattedError);
    originalError.apply(console, arguments);
};

async function run(profiles){
    const data = await readDataDB(profiles);
    return await runModel(data);
}

run(1)

// getting the profile parameter from the command line.
