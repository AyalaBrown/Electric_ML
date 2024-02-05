const { readDataDB } = require('./readingFromDB.js');
const { runModel } = require('./model.js');

async function run(){
    const data = await readDataDB();
    return await runModel(data);
}

run()

