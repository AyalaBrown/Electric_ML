const tf = require('@tensorflow/tfjs');
const { request } = require('express');
const Plotly = require('plotly')('bAyala', '4DFS7mOSfInvya0GIawe');
const { plot } = require('nodeplotlib');
const Spline = require('cubic-spline');
const ExcelJS = require('exceljs');
const { normalize } = require('normalize');
const { Builder, parseString , xml2js } = require('xml2js');
const fs = require('fs');
const path = require('path');
const math = require('mathjs');

function calculateRSquared(yTrue, yPred) {
    const yTrueMean = tf.mean(yTrue);
    const totalSumOfSquares = tf.sum(tf.square(tf.sub(yTrue, yTrueMean)));
    const residualSumOfSquares = tf.sum(tf.square(tf.sub(yTrue, yPred)));
    const rSquared = tf.sub(1, tf.div(residualSumOfSquares, totalSumOfSquares));
    return rSquared.dataSync()[0];
}

function getStandardDeviation(array) {
    const len = array.length
    if (len) {
        const avg = getAvg(array);
        return Math.sqrt(array.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b) / len);
    }
    return len;
}

function getAvg(array) {
    return sum(array) / array.length;
}

function stdAvg(data, name, multiplier) {
    console.log(data);
    return {
        "name": name,
        "std": getStandardDeviation(data.flatMap(i => (i[name]))),
        "avg": data.length > 0 ? getAvg(data.flatMap(i => (i[name]))) : 0,
        "multiplier": multiplier
    };
}

function minMax(data, name) {
    return data.flatMap(x => x[name]).reduce((a, b) => {
        if (a.min > b) a.min = b;
        if (a.max < b) a.max = b;
        return a;
    }, {
        min: 999999999999999999999999999999,
        max: -99999999999999999999999999999,
        name: name,
    });
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function sum(array) {
    return array.reduce((a, b) => a + b, 0);
}

function normelizeRow(name, tmpName, data, multiplier) {
    if (Array.isArray(data[name["name"]])) {
      // If data is an array, normalize each element separately
      return data[name["name"]].map(value =>
        normalizeValue(value, tmpName, multiplier)
      );
    } else {
      return normalizeValue(data[name["name"]], tmpName, multiplier);
    }
  }
  
  function normalizeValue(value, tmpName, multiplier) {
    if (tmpName.max && tmpName.min) {
      if (tmpName.max === tmpName.min) {
        tmpName.max += 1;
      }
      return (value - tmpName.min) / (tmpName.max - tmpName.min);
    } else if (tmpName.avg && tmpName.std) {
      return ((value - tmpName.avg) / tmpName.std) * multiplier;
    } else {
      // Handle other cases or return a default value
      return value;
    }
  }

function normelizeData(_trainingData, input, nameOutputData, outputData, multiplier) {
    return tf.tensor(_trainingData.map(data =>
        input.map(inputItem => {
            const s = nameOutputData+'s';
            let tmpName = outputData.model[s][nameOutputData].find(x => x["$"].name == inputItem["name"])
            return normelizeRow(inputItem, tmpName["$"], data, multiplier);;
        })
    ));
}

async function training(post){

    let data = post["data"],
    _trainingData = data,
    dense = post["setting"]["dense"],
    dataEpochs = post["setting"]["settingsData"]["epochs"] != undefined ? post["setting"]["settingsData"]["epochs"] : 20,
    multiplier = post["setting"]["settingsData"]["multiplier"] != undefined ? post["setting"]["settingsData"]["multiplier"] : 1,
    percentOfTesting = post["setting"]["settingsData"]["percentOfTesting"] != undefined ? post["setting"]["settingsData"]["percentOfTesting"]/100 : 0,
    minCycles = post["setting"]["settingsData"]["minCycles"] != undefined ? post["setting"]["settingsData"]["minCycles"] : 50,
    numCyclesCheck = post["setting"]["settingsData"]["numCyclesCheck"] != undefined ? post["setting"]["settingsData"]["numCyclesCheck"] : minCycles / 5,
    outputData = {
        model: {
            '$': { type: 'neural net'},
            inputs: { input: [] },
            outputs: { output: [] },
            net: { layer: [] }
        }
    },
    trainingData,
    outputTrainingData,
    testingData,
    outputTestingData,
    output = post["setting"]["output"],
    input = post["setting"]["input"]

    // try {
    if (typeof multiplier === 'string' || multiplier instanceof String)
        multiplier = parseFloat(multiplier);

    for (let i in input) {
        let obj = {}
        if(input[i]["typeOfNormalize"] == 'STD_AVG'){
            const d = stdAvg(data, input[i]["name"], multiplier)
            obj = {
                '$': {
                    name: d.name,
                    std: d.std,
                    avg:  d.avg,
                    multiplier: d.multiplier,
                    type: 'STDAVG'
                }
            }
        }
        else{
            const d = minMax(data, input[i]["name"])
            obj = {
                '$': {
                    name: d.name,
                    min: d.min,
                    max:  d.max,
                    type: 'MINMAX'
                }
            }
        }
        console.log("input",obj)
        outputData.model.inputs.input.push(obj);
    }

    for (let i in output) {
        let obj = {}
        if(output[i]["typeOfNormalize"] == 'STD_AVG'){
            const d = stdAvg(data, output[i]["name"], multiplier)
            obj = {
                '$': {
                    name: d.name,
                    std: d.std,
                    avg:  d.avg,
                    multiplier: d.multiplier,
                    type: 'STDAVG'
                }
            }
        }
        else{
            const d = minMax(data, output[i]["name"])
            obj = {
                '$': {
                    name: d.name,
                    min: d.min,
                    max:  d.max,
                    type: 'MINMAX'
                }
            }
        }
        console.log("output",obj)
        outputData.model.outputs.output.push(obj);
    }

    let X_normalized = normelizeData(_trainingData, input, "input", outputData, multiplier).reshape([dense[0]["input"]]);

    let y_normalized = normelizeData(_trainingData, output, "output", outputData, multiplier).reshape([dense[0]["input"]]);

    const totalSamples = X_normalized.shape[0];
    const trainSize = Math.floor(percentOfTesting * totalSamples);

    const indices = tf.util.createShuffledIndices(totalSamples);
    const trainIndices = indices.slice(0, trainSize);
    const testIndices = indices.slice(trainSize);

    const trainIndicesArray = Array.from(trainIndices);
    const testIndicesArray = Array.from(testIndices);

    trainingData = tf.gather(X_normalized, trainIndicesArray);
    outputTrainingData = tf.gather(y_normalized, trainIndicesArray);
    testingData = tf.gather(X_normalized, testIndicesArray);
    outputTestingData = tf.gather(y_normalized, testIndicesArray);

    trainingData = trainingData.reshape([trainingData.shape[0],1])
    outputTrainingData = outputTrainingData.reshape([outputTrainingData.shape[0],1]);

    let model = tf.sequential({
        layers: [
        tf.layers.dense({inputShape: [trainingData.shape[1]], units: 100, activation: 'relu'}),
        tf.layers.dense({units: 50, activation: 'relu'}),
        tf.layers.dense({units: 25, activation: 'relu'}),
        tf.layers.dense({units: 1}),
        ]
    });

    model.summary();

    model.compile({
        loss: 'meanSquaredError', 
        optimizer: tf.train.adam(0.01), 
        metrics: ['mse']
    });

    console.log("training...")
    let valHistory = [];
    try {
        await model.fit(trainingData, outputTrainingData, { epochs: dataEpochs, validationData: [testingData, outputTestingData] }).then((h) => {
            for (let i = 0; i < dataEpochs; i++) {
                console.log(i)
                h.history.val_loss.forEach(val_loss => {
                    valHistory.push(val_loss);
                });
            }
        });
    } catch (error) {
        throw error.message + " train model ERROR";
    }
    console.log("valHistory", valHistory) ;

    console.log( JSON.stringify(outputData, null, 2));

    let layers = [];
    for (let layer, i = 0; i < model.layers.length && (layer = model.getLayer(null, i).getWeights()); i++) {

        let weightList = layer[0].arraySync();
        let biasList = layer[1] ? layer[1].arraySync() : [];
        let numNeurons = weightList[0].length;

        for (let j = 0; j < numNeurons; j++) {
            let neuron = weightList.map(l => l[j]);
            neuron.unshift(biasList[j]);
            (layers[i] || (layers[i] = [])).push(neuron);
        }

        const l = {
            "$" : {
                activation:  dense[i]["activisionFunction"]
            },
            neuron : []
        };

        for(let n = 0; n<layers[i].length; n++){
            let ne = { w: [] }
            for(let w = 0; w<layers[i][n].length; w++ ){
                ne.w.push(layers[i][n][w]);
            }
            l.neuron.push(ne)
        }
        outputData.model.net.layer.push(l)

    }

    // console.log("outputData",JSON.stringify((outputData), null, 2));

    const builder = new Builder();

    const xml = builder.buildObject(outputData);

    const filePath = 'wish.xml';

    fs.writeFileSync(filePath, xml, 'utf-8');

    console.log(`XML saved to ${filePath}`);
    const predictions_normalized = model.predict(testingData);
    const predictions = tf.mul(predictions_normalized, tf.sqrt(y_variance.add(1e-8))).add(y_mean);

    const predictedValues = await predictions.array();

    const mse = tf.metrics.meanSquaredError(outputTestingData, predictedValues).dataSync()[0];
    const rSquared = calculateRSquared(outputTestingData, predictedValues);

    console.log(`Mean Squared Error (MSE): ${mse}, R-squared: ${rSquared}`);

    // let XTest;
    // if (X_test && X_mean && X_variance) {
    //     const X_test_denormalized = tf.mul(X_test, tf.sqrt(X_variance.add(1e-8))).add(X_mean);
    //     XTest = await X_test_denormalized.array();
    // } else {
    //     XTest = X_test;
    // }

    // const pairs = XTest.map((item, index) => [item[0], predictedValues[index][0]]);

    // // Sort the pairs by XTest
    // pairs.sort((a, b) => a[0] - b[0]);

    // const pairsMap = new Map(pairs);
    // const uniquePairs = Array.from(pairsMap.entries());

    // // Separate the sorted pairs for the return
    // const sortedXTest = uniquePairs.map(pair => pair[0]);
    // const sortedPredictions = uniquePairs.map(pair => pair[1]);

    // const XTest_sort = sortedXTest.map(item => item).join(',');

    // const predictedValuesString = sortedPredictions.map(item => item).join(',');

    // xmlData.busses.push({
    //     idtag: bus,
    //     X: XTest_sort,
    //     y: predictedValuesString,
    //     score:rSquared
    // });
}

// training()

module.exports = {
    training,
};
