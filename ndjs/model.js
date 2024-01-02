const tf = require('@tensorflow/tfjs');
const {training} = require('./wish.js')
const fs = require('fs');
const { saveToDb} = require('./readingFromDB.js');

async function runModel(data) {
    let i = 0;
    const Busses = [...new Set(data.map(row => row.idtag))];
    // let bus = "14:1F:BA:10:7F:79"
    // let level = 3;
    for (const bus of Busses) {
        let filteredData = data.filter((row) => row.idtag === bus);
        if (filteredData.length === 0) {
            console.log(`No data found with idtag ${bus}.`);
            return;
        }
        const levels = [...new Set(filteredData.map(row => row.amperLevel))];
        for(const level of levels) {
            filteredData = data.filter((row) => row.amperLevel === level);    
            if (filteredData.length === 0) {
                console.log(`No data found with bus ${bus} and level ${level}.`);
                return;
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
            // return xml;

            const singleLineString = xml.replace(/\n\s*/g, '');

            console.log("singleLineString");

            saveToDb(`${bus},${level}`, singleLineString);

            // const filePath = `./xml/${i}.xml`;

            // await fs.writeFileSync(filePath, xml, 'utf-8');

            // console.log(`XML saved to ${filePath}`);
            
            i++;
        }
    }
}

module.exports = {
    runModel,
}