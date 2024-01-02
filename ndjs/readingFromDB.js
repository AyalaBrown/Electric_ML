const sql = require('mssql');

const config = {
        user: 'Ayala',
        password: 'isr1953',
        server: '192.168.16.3',
        database: 'electric_ML',
        options: {
          encrypt: false, 
        },
      };

async function readDataDB() {

    try {
        // Connect to the database
        await sql.connect(config);

        // Query to select data from your table
        const result = await sql.query`exec dbo.GetElectricPointChargeDetails_acc '20230101','20231230'`;

        // Map the result to an array of objects
        const data = result.recordset;

        console.log("reading from db");

        return data;
    } catch (err) {
        console.error('Error reading data from SQL Server:', err.message);
        throw err;
    } finally {
        await sql.close();
    }
}

async function saveToDb(key, xml) {

    try {
        await sql.connect(config);

        const transaction = new sql.Transaction();
        await transaction.begin();

        const request = new sql.Request(transaction);

        await request.query`exec UpsertModels ${key},${xml}`;

        console.log(`${key} saving to DB`);
        await transaction.commit();
    } catch (err) {
        console.error('Error saving data to SQL Server:', err.message);
        throw err;
    } finally {
        await sql.close();
    }
}

module.exports = {
    readDataDB,
    saveToDb,
};
