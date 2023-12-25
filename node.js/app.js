import readData from 'readingXl.js'
import runModel from 'models.js'
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

function calculateRSquared(yTrue, yPred) {
    const yTrueMean = tf.mean(yTrue);
    const totalSumOfSquares = tf.sum(tf.square(tf.sub(yTrue, yTrueMean)));
    const residualSumOfSquares = tf.sum(tf.square(tf.sub(yTrue, yPred)));
    const rSquared = tf.sub(1, tf.div(residualSumOfSquares, totalSumOfSquares));
    return rSquared.dataSync()[0];
}

const excelFilePath = './data.xlsx';

const data = await readData(excelFilePath);

runModel(data);

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

function plotGraph(x, y){
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


// timeRange("14:1F:BA:10:C6:94", "50", "60", "./predictions.xml").then(result=>console.log(result))
