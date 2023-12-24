const tf = require('@tensorflow/tfjs');
const { request } = require('express');
// const mssql = require('mssql');
const Plotly = require('plotly')('bAyala', '4DFS7mOSfInvya0GIawe');
const { plot } = require('nodeplotlib');
const Spline = require('cubic-spline');
const ExcelJS = require('exceljs');
const { normalize } = require('normalize');
const { Builder, parseString  } = require('xml2js');
const fs = require('fs');
const path = require('path');
const math = require('mathjs');

const server = '192.168.16.3';
const database = 'electric_ML';
const port = '';
const username = 'Ayala';
const password = 'isr1953';

const config = {
  user: username,
  password: password,
  server: server,
  database: database,
  options: {
    encrypt: true,
  },
};

const connStr = `http://${username}:${password}@${server}:1433/${database}`;

function calculateRSquared(yTrue, yPred) {
    const yTrueMean = tf.mean(yTrue);
    const totalSumOfSquares = tf.sum(tf.square(tf.sub(yTrue, yTrueMean)));
    const residualSumOfSquares = tf.sum(tf.square(tf.sub(yTrue, yPred)));
    const rSquared = tf.sub(1, tf.div(residualSumOfSquares, totalSumOfSquares));
    return rSquared.dataSync()[0];
}

async function readData(excelFilePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelFilePath);

    const sheetName = 'Sheet1';
    const worksheet = workbook.getWorksheet(sheetName);

    if (!worksheet) {
        throw new Error(`Worksheet '${sheetName}' not found in the workbook.`);
    }

    const data = [];
    let headers = null;

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const rowData = {};

        // Use the first row as headers
        if (!headers) {
            headers = row.values.map(String);
            return;
        }

        // Map the data to headers
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            const header = headers[colNumber];
            rowData[header] = cell.value;
        });

        data.push(rowData);
    });

    return data;
}


const excelFilePath = './data.xlsx';

async function training(){
    const data = await readData(excelFilePath);

    const uniqueIdtags = [...new Set(data.map(row => row.idtag))];

    // bus="14:1F:BA:13:8E:F6";
    bus = "14:1F:BA:10:C6:94";

    const xmlData = {
        buses: []
    };

    for (const bus of uniqueIdtags) {

        const filteredData = data.filter((row) => row.idtag === bus);

        if (filteredData.length === 0) {
            console.log(`No rows found with idtag ${bus}.`);
            return;
        }

        const X = tf.tensor2d(filteredData.map((row) => [row.soc]), [filteredData.length, 1]);
        const y = tf.tensor2d(filteredData.map((row) => [row.accDiff]/60),  [filteredData.length, 1]);
        const y_s = tf.tensor2d(filteredData.map((row) => [row.scaled]/60),  [filteredData.length, 1]);

        const { mean: X_mean, variance: X_variance } = tf.moments(X, 0);
        const X_normalized = tf.div(tf.sub(X, X_mean), tf.sqrt(X_variance.add(1e-8)));

        const { mean: y_mean, variance: y_variance } = tf.moments(y_s, 0);
        const y_s_normalized = tf.div(tf.sub(y_s, y_mean), tf.sqrt(y_variance.add(1e-8)));

        const splitRatio = 0.8;
        const totalSamples = X_normalized.shape[0];
        const trainSize = Math.floor(splitRatio * totalSamples);

        const indices = tf.util.createShuffledIndices(totalSamples);
        const trainIndices = indices.slice(0, trainSize);
        const testIndices = indices.slice(trainSize);

        const trainIndicesArray = Array.from(trainIndices);
        const testIndicesArray = Array.from(testIndices);


        const X_train = tf.gather(X_normalized, trainIndicesArray);
        const y_train = tf.gather(y_s_normalized, trainIndicesArray);
        const X_test = tf.gather(X_normalized, testIndicesArray);
        const y_test = tf.gather(y_s, testIndicesArray);

        const model = tf.sequential({
            layers: [
            tf.layers.dense({inputShape: [X_train.shape[1]], units: 100, activation: 'relu'}),
            tf.layers.dense({units: 50, activation: 'relu'}),
            tf.layers.dense({units: 25, activation: 'relu'}),
            tf.layers.dense({units: 1}),
            ]
        });

        model.summary();

        model.compile({
            loss: 'meanSquaredError', 
            optimizer: tf.train.adam(0.01), 
            metrics: ['mse'], 
        });

        const history = await model.fit(X_train, y_train, {
            epochs: 20,
            batchSize: 32,
            shuffle: true,
        });

        // console.log('Training History:', history.history);

        // const historyDataFrame = tf.data.array(history.history);

        // const modelSavePath = path.resolve('./models');

        // if (!fs.existsSync(modelSavePath)) {
        //     fs.mkdirSync(modelSavePath, { recursive: true });
        //   }

        // const modelFilePath = path.join(modelSavePath, 'model');

        // await model.save(`file://${modelFilePath}`);

        const predictions_normalized = model.predict(X_test);
        const predictions = tf.mul(predictions_normalized, tf.sqrt(y_variance.add(1e-8))).add(y_mean);

        const predictedValues = await predictions.array();

        const mse = tf.metrics.meanSquaredError(y_test, predictedValues).dataSync()[0];
        const rSquared = calculateRSquared(y_test, predictedValues);

        console.log(`Bus: ${bus}, Mean Squared Error (MSE): ${mse}, R-squared: ${rSquared}`);

        let XTest;
        if (X_test && X_mean && X_variance) {
            const X_test_denormalized = tf.mul(X_test, tf.sqrt(X_variance.add(1e-8))).add(X_mean);
            XTest = await X_test_denormalized.array();
        } else {
            XTest = X_test;
        }

        const pairs = XTest.map((item, index) => [item[0], predictedValues[index][0]]);

        // Sort the pairs by XTest
        pairs.sort((a, b) => a[0] - b[0]);

        const pairsMap = new Map(pairs);
        const uniquePairs = Array.from(pairsMap.entries());

        // Separate the sorted pairs for the return
        const sortedXTest = uniquePairs.map(pair => pair[0]);
        const sortedPredictions = uniquePairs.map(pair => pair[1]);

        const XTest_sort = sortedXTest.map(item => item).join(',');

        const predictedValuesString = sortedPredictions.map(item => item).join(',');

        xmlData.buses.push({
            idtag: bus,
            X: XTest_sort,
            y: predictedValuesString,
            score:rSquared
        });

    }

    const builder = new Builder();
    const xml = builder.buildObject(xmlData);

    fs.writeFileSync('./predictions.xml', xml);

}

// training()

async function readingFromXml(bus, path) {
    const xmlData = fs.readFileSync(path, 'utf-8');

    let targetData;

    parseString(xmlData, { explicitArray: false }, (err, result) => {
        if (err) {
            console.error('Error parsing XML:', err);
            return;
        }
        // console.log(result)
        const buses = result.buses;
        const idtags = Array.isArray(buses.idtag) ? buses.idtag : [buses.idtag];
        const Xs = Array.isArray(buses.X) ? buses.X : [buses.X];
        const ys = Array.isArray(buses.y) ? buses.y : [buses.y];
        const scores = Array.isArray(buses.score) ? buses.score : [buses.score];

        const busIndex = idtags.indexOf(bus);

        if (busIndex !== -1) {

        const X = Xs[busIndex].split(',').map(Number);
        const y = ys[busIndex].split(',').map(Number);

        targetData = {
            idtag: idtags[busIndex],
            X: X,
            y: y,
            score: scores[busIndex],
        };

        // console.log('Data for idtag', bus, ':', targetData);
        } else {
            console.log('idtag', bus, 'not found in the XML data.');
        }
    });
    return targetData;
}

function plotGraph(x, y, interpFunc){
    console.log(x,y);
    plot([{
        x: x,
        y: y,
        type: 'scatter',
        mode: 'markers',
        marker: { color: 'black' },
        name: 'plots'
    }, {
        x: x,
        y: y,
        name: 'line'
    }]);
}




async function timeRange(bus, start, end, path) {

    const result = await readingFromXml(bus, path);

    console.log(result)
    if (!result) {
        console.log(`No data found for idtag ${bus}.`);
        return;
    }

    const x = result.X;
    const y = result.y;
    const r2Score = result.score;

    const interpFunc =  new Spline(x, y);
    const predictedTime = interpFunc.at(end) - interpFunc.at(start);
    const roundedPredictedTime = Math.round(predictedTime * 10) / 10;

    console.log(`For bus ${bus}, the predicted time: ${roundedPredictedTime} minutes`);
    console.log(`R² Score: ${r2Score}`);

    // Plot the graph if needed
    // plotGraph(x, y, interpFunc);

    return {
        bus,
        predictedTime: roundedPredictedTime,
        r2Score,
    };
}


timeRange("14:1F:BA:10:C6:94", "50", "60", "./predictions.xml").then(result=>console.log(result))
