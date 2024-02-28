const tf = require('@tensorflow/tfjs');
const {training} = require('./train.js')
const { saveToDb} = require('./readingFromDB.js');
const { Builder} = require('xml2js');

async function runModel(data) {
    let median = [[],[],[],[],[]];
    let noData = [[],[],[],[],[]];

    console.log("Starting model training...");

    const Busses = [...new Set(data.map(row => row.idtag))];
    for (const bus of Busses) {
        let filteredData_bus = data.filter((row) => row.idtag === bus);
        if (filteredData_bus.length === 0) {
            console.log(`No data found with idtag ${bus}.`);
            return;
        }
        const levels = [...new Set(filteredData_bus.map(row => row.amperLevel))];
        
        for(let j = 1; j <=levels.length; j++) {
            //if there is no data for this bus and level, putting avg instead
            if(levels.includes(j) == false) {
                noData[j-1].push(bus);
                continue;
            }

            level = j;

            filteredData = filteredData_bus.filter((row) => row.amperLevel === level);  

            const uniqueSocValues = {};

            // Iterate through the array and add 'soc' values to the object
            filteredData.forEach(item => {
            uniqueSocValues[item.soc] = 0;
            });

            // Get the count of distinct 'soc' values
            const distinctSocCount = Object.keys(uniqueSocValues).length;

            console.log(`distinctSocCount: ${distinctSocCount}`);

            if (filteredData.length === 0) {
                console.log(`No data found with bus ${bus} and level ${level}.`);
                return;
            }
            
            if (distinctSocCount < 50) {
                if (distinctSocCount < 5){
                    noData[j-1].push(bus);
                    continue;
                }
                let distinctSoc = [];
                let avgs = []
                let med = 0;
                for(let k = 0; k < filteredData.length; k++) {
                    let soc = filteredData[k]['soc'];
                    if ((soc in distinctSoc)==false) {
                        distinctSoc.push(soc);
                        avgs.push(parseInt(filteredData[k]['avgDiffInSec']));
                    }
                }
                avgs.sort((a, b) => a - b);
                if (avgs.length%2 == 0){
                    med = (avgs[avgs.length/2]+avgs[avgs.length/2-1])/2;
                }
                else{
                    med = avgs[Math.floor(avgs.length/2)];
                }
                outputData = {
                    model: {
                        '$': { type: 'simple avg2'},
                        inputs: {input: [{$:{name: 'soc'}}]},
                        outputs: { output: [{$:{name:'scaled', avg: med/60.}}] },
                    }
                }
                console.log(`less then 10, average ${med}`);
                const builder = new Builder({ headless: true, explicitRoot: false, rootName: 'root', xmldec: { encoding: 'utf-8' } });
                const xml = builder.buildObject(outputData);
                const singleLineString = xml.replace(/\n\s*/g, '');
                await saveToDb(`${bus},${j}`, singleLineString);
                median[j-1].push(parseInt(med));
                continue;
            } 

            let X = tf.tensor2d(filteredData.map((row) => [row.soc]), [filteredData.length, 1]).arraySync().flat();
            let y = tf.tensor2d(filteredData.map((row) => [row.scaled]/60),  [filteredData.length, 1]).arraySync().flat();

            const input_layer = X.length;

            const post = {
                data: [
                    {"soc":X,
                    "scaled":y}
                ],
                setting: {
                    inputLayerSize: input_layer,
                    dense: [
                        {
                            input:1,
                            activisionFunction: 'SIGMOID',
                            output:50
                        },
                        {
                            input:50,
                            activisionFunction: 'SIGMOID',
                            output:25
                        },
                        {
                            input:25,
                            activisionFunction: 'LINEAR',
                            output:1
                        }
                    ],
                    settingsData:{
                        epochs: 30,
                        multiplier: 1,
                        percentOfTesting: 10,
                        minCycles: 50,
                        numCyclesCheck: 5
                    },
                    input: [
                        {
                            name:'soc',
                            typeOfNormalize: 'STD_AVG'
                        }
                    ],
                    output: [
                        {
                            name:'scaled',
                            typeOfNormalize:'STD_AVG'
                        }
                    ]
                },
            }
            const xml = await training(post);
            const singleLineString = xml.replace(/\n\s*/g, '');
            await saveToDb(`${bus},${level}`, singleLineString);
            median[j-1].push(parseInt(filteredData[0]['avgDiffInSec']));
        }
    }
    for(i = 0; i < 5; i++){
        med = 0;
        median[i].sort((a, b) => a - b);
        if(median[i].length % 2 == 0){
            med = (median[i][median[i].length/2-1]+median[i][median[i].length/2])/2;
        }
        else{
            med = median[i][Math.floor(median[i].length/2)];
        }
        for(j in noData[i]){
            outputData = {
                model: {
                    '$': { type: 'simple avg2'},
                    inputs: {input: [{$:{name: 'soc'}}]},
                    outputs: { output: [{$:{name:'scaled', avg: med/60.}}] },
                }
            }
            const builder = new Builder({ headless: true, explicitRoot: false, rootName: 'root', xmldec: { encoding: 'utf-8' }});
            const xml = builder.buildObject(outputData);
            const singleLineString = xml.replace(/\n\s*/g, '');
            console.log(singleLineString)
            await saveToDb(`${noData[i][j]},${i+1}`, singleLineString);
            continue;
        }
    }
    console.log("Model training finished.");
}

module.exports = {
    runModel,
}