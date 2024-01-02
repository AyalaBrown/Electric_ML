const fetch = require('node-fetch');
const { LevenbergMarquardt } = require('ml-levenberg-marquardt');
const CubicSpline = require('cubic-spline');
const plotly = require('plotly')('bAyala', '4DFS7mOSfInvya0GIawe');

const server = '192.168.16.3';
const database = 'electric_ML';
const username = 'Ayala';
const password = 'isr1953';

const connStr = `http://${username}:${password}@${server}:1433/${database}`;

async function predictChargeTime(start_date, end_date) {
  const response = await fetch(connStr, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `exec dbo.GetElectricPointChargeDetails_acc '${start_date}','${end_date}';`,
    }),
  });

  const data = await response.json();
  const df = data.recordset;

  console.log(df.slice(0, 2));

  console.log('Number of unique idtags:', [...new Set(df.map((row) => row.idtag))].length);
  console.log('Unique idtags:', [...new Set(df.map((row) => row.idtag))]);

  const dataToInsert = [];

  for (const bus of [...new Set(df.map((row) => row.idtag))]) {
    const df1 = df.filter((row) => row.idtag === bus);
    console.log('bus', bus);

    const X = df1.map((row) => [row.soc]);
    const y = df1.map((row) => row.accDiff / 60);

    const yS = df1.map((row) => row.scaled / 60);

    const { X: XTrain, y: yTrain, X: XTest, y: yTest } = splitData(X, yS, 0.2);

    const model = trainModel(XTrain, yTrain);

    const yPred = model.predict(XTest);

    const uniqueXDict = {};
    const filteredCombined = [];

    for (let i = 0; i < XTest.length; i++) {
      const xVal = XTest[i][0];
      const yVal = yPred[i];
      if (!uniqueXDict[xVal]) {
        uniqueXDict[xVal] = true;
        filteredCombined.push([xVal, yVal]);
      }
    }

    const sortedCombined = filteredCombined.sort((a, b) => a[0] - b[0]);

    const sortedSoc = sortedCombined.map((pair) => pair[0]);
    const sortedYPred = sortedCombined.map((pair) => pair[1]);

    const r2Score = model.score(XTest, yTest);
    console.log('R² Score:', r2Score);

    const resultSortedSoc = sortedSoc.join(',');
    const resultSortedYPred = sortedYPred.join(',');

    const newTuple = [bus, resultSortedSoc, resultSortedYPred, r2Score];
    dataToInsert.push(newTuple);
  }

  await insertDataToSql(dataToInsert);
}

async function splitData(X, y, testSize) {
  const data = [];
  for (let i = 0; i < X.length; i++) {
    data.push({ X: X[i], y: y[i] });
  }

  const trainTestData = await fetch(connStr, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `exec dbo.SplitData @data = N'${JSON.stringify(data)}', @testSize = ${testSize};`,
    }),
  });

  const { X: XTrain, y: yTrain, X: XTest, y: yTest } = await trainTestData.json();
  return { XTrain, yTrain, XTest, yTest };
}

function trainModel(XTrain, yTrain) {
  const model = new LevenbergMarquardt({
    func: (params, x) => params[0] + params[1] * x[0],
    initialValues: [0, 0],
  });

  model.train(XTrain, yTrain);
  return model;
}

async function insertDataToSql(dataToInsert) {
  const response = await fetch(connStr, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        DECLARE @TVP AS dbo.udt_predicted_graf;
        INSERT INTO @TVP (idTag, xAxis, yAxis, r2Score) VALUES ${dataToInsert.map(
          (tuple) => `('${tuple[0]}', '${tuple[1]}', '${tuple[2]}', ${tuple[3]})`
        )};
        EXEC dbo.InsertPredictedGraf @TVP;
      `,
    }),
  });

  const result = await response.json();
  console.log('Data inserted to SQL:', result);
}

async function timeRange(bus, start, end) {
  const response = await fetch(connStr, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `SELECT * FROM dbo.predicted_graf WHERE idtag='${bus}';`,
    }),
  });

  const df = (await response.json()).recordset[0];

  const x = df.xAxis.split(',').map((num) => parseFloat(num));
  const y = df.yAxis.split(',').map((num) => parseFloat(num));

  const interpFunc = new CubicSpline(x, y);

  const trace = {
    x: x,
    y: y,
    type: 'scatter',
    mode: 'lines+points',
    marker: { color: 'red' },
  };
  const layout = { title: `Bus: ${bus}, R² Score: ${df.r2Score}` };
  const chartData = [trace];

  plotly.plot(chartData, layout, function (err, msg) {
    if (err) return console.log(err);
    console.log(msg);
  });

  const result = interpFunc(end) - interpFunc(start);
  console.log(`For bus: ${bus}, the predicted time: ${result.toFixed(1)} minutes`);
}

// Example usage
predictChargeTime('20231101', '20231230');
timeRange('14:1F:BA:10:C6:94', 40, 60);
