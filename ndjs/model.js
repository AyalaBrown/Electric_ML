const tf = require('@tensorflow/tfjs');
const {training} = require('./train.js')
const fs = require('fs');
const { saveToDb} = require('./readingFromDB.js');
const { Builder} = require('xml2js');

async function runModel(data, busesCapacity) {
    console.log("Starting model training...");
    // console.log(tf.getBackend());
    // tf.setBackend('gpu');
    // console.log(tf.getBackend());

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
        // const capacity = busesCapacity.where(row => row.trackCode == bus);
        const capacity = 300;
        const levels = [...new Set(filteredData.map(row => row.amperLevel))];
        console.log(levels)
        for(let j = 1; j <=5; j++) {
            console.log("level",j)
            //if there is no data for this bus and level, putting avg instead
            if((j in levels) == false) {
                console.log("simple avg")
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

                saveToDb(`${bus},${j}`, singleLineString);

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
                console.log("simple avg", filteredData);
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

                console.log("less then 10", filteredData)


                const builder = new Builder({ headless: true, explicitRoot: false, rootName: 'root', xmldec: { encoding: 'utf-8' } });

                const xml = builder.buildObject(outputData);

                const singleLineString = xml.replace(/\n\s*/g, '');

                saveToDb(`${bus},${j}`, singleLineString);

                i++;

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
            // return xml;

            const singleLineString = xml.replace(/\n\s*/g, '');

            console.log("singleLineString");

            saveToDb(`${bus},${level}`, singleLineString);
            
            i++;
        }
    }
}

module.exports = {
    runModel,
}