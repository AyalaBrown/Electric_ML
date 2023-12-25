const { readData } =require('./readingXl.js');
const { runModel } = require('./model.js');
const tf = require('@tensorflow/tfjs');
const { plot } = require('nodeplotlib');
const Spline = require('cubic-spline');
const ExcelJS = require('exceljs');
const { normalize } = require('normalize');
const { Builder, parseString  } = require('xml2js');
const fs = require('fs');

function calculateRSquared(yTrue, yPred) {
    const yTrueMean = tf.mean(yTrue);
    const totalSumOfSquares = tf.sum(tf.square(tf.sub(yTrue, yTrueMean)));
    const residualSumOfSquares = tf.sum(tf.square(tf.sub(yTrue, yPred)));
    const rSquared = tf.sub(1, tf.div(residualSumOfSquares, totalSumOfSquares));
    return rSquared.dataSync()[0];
}

const excelFilePath = './data.xlsx';

readData(excelFilePath).then(data=> runModel(data));

