const ExcelJS = require('exceljs');

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

        if (!headers) {
            headers = row.values.map(String);
            return;
        }

        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            const header = headers[colNumber];
            rowData[header] = cell.value;
        });

        data.push(rowData);
    });

    return data;
}


module.exports = {
    readData,
};