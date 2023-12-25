const tf = require('@tensorflow/tfjs');

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
            const X = tf.tensor2d(filteredData.map((row) => [row.soc]), [filteredData.length, 1]);
            const y = tf.tensor2d(filteredData.map((row) => [row.scaled]/60),  [filteredData.length, 1]);
            console.log(X, y)

            // const X_normalized = minMaxNormalization(X);
            // const y_normalized =minMaxNormalization(y);
            const splitRatio = 0.8;
            const post = {
                data: {
                    X:X,
                    y:y
                },
                setting: {
                    dense: [
                        {
                            input:[X.shape[1]],
                            activisionFunction: 'mse',
                            output:100
                        },
                        {
                            input:100,
                            activisionFunction: 'mse',
                            output:50
                        },
                        {
                            input:50,
                            activisionFunction: 'mse',
                            output:1
                        }
                    ],
                    settingsData:{
                        epochs: '',
                        multiplier: '',
                        percentOfTesting: '',
                        minCycles: '',
                        numCyclesCheck: ''
                    },
                    input: [
                        {
                            typeOfNormalize: 'MIN_MAX'
                        }
                    ],
                    output: ''
                },
            }

            training(X_normalized, y_normalized);
            const builder = new Builder();
            const xml = builder.buildObject(xmlData);
        
            fs.writeFileSync('./predictions.xml', xml);

        // }
    // }

}

async function training(X_normalized, y_normalized){

    var logs = [];
    console.log = function() {
        for (let i = 0; i < arguments.length; i++) {
            try {
                logs.push(JSON.parse(JSON.stringify(arguments[i])))
            } catch (e) {

            }
        }
    }

    let data = post["data"],
        _trainingData = data,
        _testingData = [],
        dense = post["setting"]["dense"],
        dataEpochs = post["setting"]["settingsData"]["epochs"] != undefined ? post["setting"]["settingsData"]["epochs"] : 20,
        multiplier = post["setting"]["settingsData"]["multiplier"] != undefined ? post["setting"]["settingsData"]["multiplier"] : 1,
        percentOfTesting = post["setting"]["settingsData"]["percentOfTesting"] != undefined ? post["setting"]["settingsData"]["percentOfTesting"] : 0,
        minCycles = post["setting"]["settingsData"]["minCycles"] != undefined ? post["setting"]["settingsData"]["minCycles"] : 50,
        numCyclesCheck = post["setting"]["settingsData"]["numCyclesCheck"] != undefined ? post["setting"]["settingsData"]["numCyclesCheck"] : minCycles / 5,
        outputData = {
            "input": [],
            "output": [],
            "net": {}
        },
        trainingData,
        outputTrainingData,
        testingData,
        outputTestingData,
        output = post["setting"]["output"],
        input = post["setting"]["input"]
    console.log(dense, dataEpochs, multiplier, percentOfTesting)

    try {
        if (typeof multiplier === 'string' || multiplier instanceof String)
            multiplier = parseFloat(multiplier);

        for (let i in input) {
            outputData["input"].push(input[i]["typeOfNormalize"] == 'STD_AVG' ? stdAvg(data, input[i]["name"], multiplier) : minMax(data, input[i]["name"]));
        }

        for (let i in output) {
            outputData["output"].push(output[i]["typeOfNormalize"] == 'STD_AVG' ? stdAvg(data, output[i]["name"], multiplier) : minMax(data, output[i]["name"]));
        }

        for (let i = data.length - 1 - (data.length % percentOfTesting); i > 0; i -= percentOfTesting) {
            const indexToValidationData = getRandomInt(percentOfTesting)
            _testingData.push(data[i - indexToValidationData])
            _trainingData.splice(i - indexToValidationData, 1);
        }

        // if have no validation data testing data worth training data
        if (percentOfTesting == 0) {
            _testingData = _trainingData;
        }

        trainingData = normelizeData(_trainingData, input, "input", outputData, multiplier);

        outputTrainingData = normelizeData(_trainingData, output, "output", outputData, multiplier);

        testingData = normelizeData(_testingData, input, "input", outputData, multiplier);

        outputTestingData = normelizeData(_testingData, output, "output", outputData, multiplier);


        let model = tf.sequential();

        // Create neural network
        for (let i = 0; i < dense.length; i++) {
            model.add(tf.layers.dense({
                inputShape: [dense[i]["input"]],
                activation: dense[i]["activisionFunction"] != 'NONE' ? dense[i]["activisionFunction"].toLowerCase() : undefined,
                units: dense[i]["output"],
            }));
        }

        model.compile({
            loss: "meanSquaredError",
            optimizer: 'sgd',
            metrics: ['accuracy']
        });
        // meanAbsolutePercentageError


        // Train the model using the data.
        let valHistory = [],
            cycles = 0,
            prevModel,
            bestModel

        async function fit() {

            let regression = sum(valHistory.slice(-dataEpochs)) > sum(valHistory.slice(-dataEpochs * 2, -dataEpochs));
            prevModel = model;

            // console.log(trainingData.arraySync())
            valHistory = [...valHistory, ...await fittingModel(model, trainingData, outputTrainingData, dataEpochs, testingData, outputTestingData)];
            // console.log("line 177")

            // console.log(valHistory)
            if (regression && cycles > 0 || cycles++ >= minCycles) {
                let sumMinValHistory = sum(valHistory.slice(-dataEpochs));
                if (cycles + numCyclesCheck > minCycles) numCyclesCheck = minCycles - cycles;

                if (regression) {
                    bestModel = prevModel;
                    for (let i = 0; i < numCyclesCheck; i++) {
                        valHistory.concat(await fittingModel(model, trainingData, outputTrainingData, dataEpochs, testingData, outputTestingData));
                        if (sum(valHistory.slice(-dataEpochs)) < sumMinValHistory) {
                            cycles += i;
                            await fit();
                            break;
                        }
                    }
                } else {
                    bestModel = model;
                }

                let layers = [];

                outputData["net"]["activisionFunction"] = dense[0]["activisionFunction"];
                outputData["net"]["net"] = [];

                for (let layer, i = 0; i < bestModel.layers.length && (layer = bestModel.getLayer(null, i).getWeights()); i++) {
                    console.log(bestModel.getLayer(null, i));
                    let weightList = layer[0].arraySync();
                    let biasList = layer[1] ? layer[1].arraySync() : [];
                    let numNeurons = weightList[0].length;

                    for (let j = 0; j < numNeurons; j++) {
                        let neuron = weightList.map(l => l[j]);
                        neuron.unshift(biasList[j]);
                        (layers[i] || (layers[i] = [])).push(neuron);
                    }

                    // console.log(layer)
                    outputData["net"]["net"][i] = {};
                    outputData["net"]["net"][i]["activisionFunction"] = dense[i]["activisionFunction"];
                    outputData["net"]["net"][i]["weight"] = layers[i];
                }

                for (let i = 0; i < outputData["output"].length; i++)
                    outputData["output"][i]["error"] = valHistory[cycles * dataEpochs - 1 + i]

                dataRet.models = outputData;
                // dataRet.console = logs;
                dataRet.status = 'OK';
                process.stdout.write(JSON.stringify(dataRet))
                process.stdout.flush();
            } else await fit();
        }

        await fit();
    } catch (err) {
        dataRet.message = 'external ERROR';
        // dataRet.console = logs;
        dataRet.status = 'ERROR';
        process.stdout.write(JSON.stringify(dataRet))
        process.stdout.flush();
        return;
    }
}

module.exports = {
    runModel,
  };