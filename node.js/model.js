const tf = require('@tensorflow/tfjs');
const {setModel} = require('./shosh.js');

function minMaxNormalization(data) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const normalizedData = data.map((value) => (value - min) / (max - min));
    return normalizedData;
} 

async function runModel(data) {
    const Busses = [...new Set(data.map(row => row.idtag))];
    let bus = "14:1F:BA:10:7F:79"
    // for (const bus of Busses) {
        let filteredData = data.filter((row) => row.idtag === bus);
        const levels = [...new Set(filteredData.map(row => row.amperLevel))];
        // for(const level of levels) {
            let level = 1;
            filteredData = data.filter((row) => row.amperLevel === level);    
            if (filteredData.length === 0) {
                console.log(`No data found with idtag ${bus}.`);
                return;
            }
            // for(const state of )
            let X = tf.tensor2d(filteredData.map((row) => [row.soc]), [filteredData.length, 1]).arraySync().flat();
            let y = tf.tensor2d(filteredData.map((row) => [row.scaled]/60),  [filteredData.length, 1]).arraySync().flat();
            // console.log(X, y);
            // const inputShape = [X.shape[0]]
            // console.log(X.shape[0])
            // X = X.arraySync().flat();
            const input_layer = X.length;
            // console.log("input_layer", input_layer);
            // console.log(y, y.length);
            // const _X = tf.tensor2d(X, [1, X.length])
            // const _y = tf.tensor2d(y, [1, y.length])
            // const X_normalized = minMaxNormalization(X);
            // const y_normalized =minMaxNormalization(y);
            const post = {
                data: [
                    {"soc":X,
                    "scaled":y}
                ],
                setting: {
                    dense: [
                        {
                            input:input_layer,
                            activisionFunction: 'relu',
                            output:100
                        },
                        {
                            input:100,
                            activisionFunction: 'relu',
                            output:50
                        },
                        {
                            input:50,
                            activisionFunction: 'relu',
                            output:1
                        }
                    ],
                    settingsData:{
                        epochs: 20,
                        multiplier: 0.01,
                        percentOfTesting: 20,
                        minCycles: 50,
                        numCyclesCheck: 5
                    },
                    input: [
                        {
                            name:'soc',
                            typeOfNormalize: 'MIN_MAX'
                        }
                    ],
                    output: [
                        {
                            name:'scaled',
                            typeOfNormalize:'MIN_MAX'
                        }
                    ]
                },
            }

            const jsonString = JSON.stringify(post, null, 2);
            // console.log(jsonString);
            // console.log(post["setting"])
            setModel(post);
            // const builder = new Builder();
            // const xml = builder.buildObject(xmlData);
        
            // fs.writeFileSync('./predictions.xml', xml);

        // }
    // }
}

module.exports = {
    runModel,
};