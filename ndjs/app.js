const { readDataDB, readBusesCapacity } = require('./readingFromDB.js');
const { runModel } = require('./model.js');

async function run(fromDate, toDate){
    const data = await readDataDB(fromDate, toDate);
    const busesCapacity = await readBusesCapacity();
    return await runModel(data, busesCapacity);
}

run('20230101','20240215')

