const fs = require('fs');
const path = require('path');

// Define the file path for the log file
const logFilePath = path.join(__dirname, 'logs', 'app.log');

// Create a write stream to the log file
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Redirect console.log to the log file
const originalLog = console.log;
console.log = function (message) {
    const formattedMessage = `[${new Date().toISOString()}] ${message}\n`;
    logStream.write(formattedMessage);
    originalLog.apply(console, arguments);
};


let arr = [3,4,5,6,7,8,2,1,9]
arr.sort((a, b) => a - b)
console.log(arr);
console.log(arr[Math.floor(arr.length/2)]);
