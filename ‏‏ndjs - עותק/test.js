const tf = require('@tensorflow/tfjs');
const { saveToDb} = require('./readingFromDB.js');
const { Builder} = require('xml2js');
const { readDataDB } = require('./readingFromDB.js');

async function runModel(data) {
    let i = 0;
    const Busses = [...new Set(data.map(row => row.idtag))];
    for (const bus of Busses) {
        let filteredData = data.filter((row) => row.idtag === bus);
        if (filteredData.length === 0) {
            console.log(`No data found with idtag ${bus}.`);
            return;
        }
        const capacity = 300;
        const levels = [...new Set(filteredData.map(row => row.amperLevel))];
        console.log(levels)
        for(let j = 1; j <=5; j++) {
            if((j in levels) == false) {
                average = 0
                // <model type="simple avg">
                //     <outputs>
                //         <output name="consumption" min="13.67600000" max="25.33000000" avg="20.20850000" error="28.83" />
                //     </outputs>
                // </model>
                outputData = {
                    model: {
                        '$': { type: 'simple avg1'},
                        inputs: {input: [{$:{name: 'soc'}}]},
                        outputs: { output: [{$:{name:'duration', avg: average}}] },
                    }
                }

                const builder = new Builder({ headless: true, explicitRoot: false, rootName: 'root', xmldec: { encoding: 'utf-8' } });

                const xml = builder.buildObject(outputData);

                const singleLineString = xml.replace(/\n\s*/g, '');

                await saveToDb(`${bus},${j}`, singleLineString);

                i++;

                continue;
            }

            level = j;

            filteredData = data.filter((row) => row.amperLevel === level);   

            if (filteredData.length === 0) {
                console.log(`No data found with bus ${bus} and level ${level}.`);
                return;
            }
            
            if (filteredData.length <10) {
                console.log("filteredData.length <10", filteredData);
                avg = 0
                // <model type="simple avg">
                //     <outputs>
                //         <output name="consumption" min="13.67600000" max="25.33000000" avg="20.20850000" error="28.83" />
                //     </outputs>
                // </model>
                outputData = {
                    model: {
                        '$': { type: 'simple avg1'},
                        inputs: {input: [{$:{name: 'soc'}}]},
                        outputs: { output: [{$:{name:'duration', avg: average}}] },
                    }
                }

                const builder = new Builder({ headless: true, explicitRoot: false, rootName: 'root', xmldec: { encoding: 'utf-8' } });

                const xml = builder.buildObject(outputData);

                const singleLineString = xml.replace(/\n\s*/g, '');

                saveToDb(`${bus},${j}`, singleLineString);

                i++;

                continue;

            }
        }
    }
}


async function run(fromDate, toDate){
    const data = await readDataDB(fromDate, toDate);
    return await runModel(data);
}

run('20230101','20240206')