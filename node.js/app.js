const tf = require('@tensorflow/tfjs');
const { request } = require('express');
const mssql = require('mssql');
const plotly = require('plotly')('bAyala', '4DFS7mOSfInvya0GIawe');
const { CubicSpline } = require('natural');
const ExcelJS = require('exceljs');

// const server = '192.168.16.3';
// const database = 'electric_ML';
// const port = '';
// const username = 'Ayala';
// const password = 'isr1953';

// const config = {
//   user: username,
//   password: password,
//   server: server,
//   database: database,
//   options: {
//     encrypt: true,
//   },
// };

const excelFilePath = './data.xlsx';

function fisherYatesShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function predictChargeTime(start_date, end_date) {

  const workbook = new ExcelJS.Workbook();

  try {
    // await mssql.connect(config);
    // const query = `exec dbo.GetElectricPointChargeDetails_acc '${start_date}','${end_date}';`;
    // const result = await request.query(query);

    await workbook.xlsx.readFile(excelFilePath);

    // Specify the worksheet you want to read from
    const sheetName = 'Sheet1'; // Replace 'Sheet1' with the actual sheet name
    const worksheet = workbook.getWorksheet(sheetName);

    if (!worksheet) {
      throw new Error(`Worksheet '${sheetName}' not found in the workbook.`);
    }

    // Extract data from the worksheet into an array of objects
    const data = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const rowData = {};
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        rowData[`Column${colNumber}`] = cell.value;
      });
      data.push(rowData);
    });
    
    console.log(data);

    // for (const bus of data.map((item) => item.Column1).filter((value, index, self) => self.indexOf(value) === index)) {

      bus="14:1F:BA:13:8E:F6";

      // bus = "14:1F:BA:10:C6:18"
      const filteredData = data.filter((row) => row.Column1 === bus);
  
      if (filteredData.length === 0) {
        console.log(`No rows found with idtag ${bus}.`);
        return;
      }
    
      const X = tf.tensor2d(filteredData.map((row) => [row.Column4]), [filteredData.length, 1]);
      const y = tf.tensor2d(filteredData.map((row) => [row.Column10]/60),  [filteredData.length, 1]);
      const y_s = tf.tensor2d(filteredData.map((row) => [row.Column14]/60),  [filteredData.length, 1]);
      
      // const concatenatedData = tf.concat([X, y_s], 1);

      // const concatenatedArray = Array.from(concatenatedData.dataSync());

      // fisherYatesShuffle(concatenatedArray);
      // console.log(concatenatedArray)
      // const shuffledData = tf.tensor2d(concatenatedArray, concatenatedData.shape);

      // const { X_train, X_test, y_train, y_test } = tf.split(shuffledData, [1, 1], 1);

      // console.log(X_train, X_test, y_train, y_test)
      // const scaler = tf.layers.normalization.batchNormalization();
      // const model = tf.sequential({
      //   layers: [
      //     tf.layers.dense({ units: 100, activation: 'relu', inputShape: [2] }),
      //     tf.layers.dense({ units: 50, activation: 'relu' }),
      //     tf.layers.dense({ units: 25, activation: 'relu' }),
      //     tf.layers.dense({ units: 1 }),
      //   ],
      // });

      // model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

      // const xs = scaler.apply(X_train);
      // const ys = scaler.apply(y_train);

      // await model.fit(xs, ys, { epochs: 100 });

      // const x_predict_tensor = scaler.apply(tf.tensor(df1.map((item) => item.soc), [df1.length, 1]));
      // const y_pred = model.predict(x_predict_tensor).arraySync();

      // const data_combine = df1.map((item, index) => [item.soc, y_pred[index][0]]);
      // const unique_x_dict = {};
      // const filtered_combined = [];

      // for (const [x_val, y_val] of data_combine) {
      //   if (!unique_x_dict[x_val]) {
      //     unique_x_dict[x_val] = true;
      //     filtered_combined.push([x_val, y_val]);
      //   }
      // }

      // const sorted_combined = filtered_combined.sort((a, b) => a[0] - b[0]);

      // const [sorted_soc, sorted_y_pred] = sorted_combined.reduce(
      //   ([soc, y_pred], [x_val, y_val]) => [[...soc, x_val], [...y_pred, y_val]],
      //   [[], []]
      // );

      // console.log(`bus: ${bus}, sorted_soc: ${sorted_soc}, sorted_y_pred: ${sorted_y_pred}`);

      // const r2_score = model.evaluate(scaler.apply(X_test), scaler.apply(y_test)).dataSync()[0];
      // console.log(`R² Score: ${r2_score}`);

      // const result_sorted_soc = sorted_soc.join(',');
      // const result_sorted_y_pred = sorted_y_pred.join(',');

      // const new_tuple = [bus, result_sorted_soc, result_sorted_y_pred, r2_score];
      // console.log(new_tuple);
    // }
  } finally {
    await mssql.close();
  }
}


async function timeRange(bus, start, end) {
  try {
    await mssql.connect(config);
    const selectQuery = `SELECT * FROM dbo.predicted_graf where idtag='${bus}'`;
    const result = await mssql.query(selectQuery);
    const df = result.recordset;

    const x = df[0].xAxis.split(',').map(parseFloat);
    const y = df[0].yAxis.split(',').map(parseFloat);

    const interpFunc = new CubicSpline(x, y);

    // Plotting using Plotly
    const trace = {
      x: x,
      y: y,
      mode: 'markers',
      type: 'scatter',
    };

    const layout = {
      title: `Bus: ${bus},   R² Score: ${df[0].r2_score}`,
    };

    const figure = { data: [trace], layout: layout };

    plotly.plot(figure, { filename: 'scatter-plot' }, (err, msg) => {
      if (err) throw err;
      console.log(msg);
    });

    const result1 = interpFunc(parseFloat(end)) - interpFunc(parseFloat(start));
    const resultMinutes = round(result1, 1);
    console.log(`for bus: ${bus}, the predicted time: ${resultMinutes} minutes`);
    return `for bus: ${bus}, the predicted time: ${resultMinutes} minutes`;
  } finally {
    await mssql.close();
  }
}

function round(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

async function main() {
  await predictChargeTime('20231101', '20231230');
  // const result = await timeRange("14:1F:BA:10:C6:94", "40", "60");
  // console.log(result);
}

main().catch((error) => console.error(error));
