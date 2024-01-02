const { Connection, Request } = require('tedious');

// Connection configuration
const config = {
  userName: 'Ayala',
  password: 'isr1953',
  server: '192.168.16.3',
  options: {
    encrypt: true, // For Azure SQL Database
    database: 'electric_ML',
  },
};

// Create a connection instance
const connection = new Connection(config);
console.log("I'm here:)")
// Connect to the database
connection.on('connect', (err) => {
  if (err) {
    console.error('Error connecting to SQL Server:', err);
  } else {
    console.log('Connected to SQL Server');

    // Execute a query
    const request = new Request("exec dbo.GetElectricPointChargeDetails_acc '20230101','20231230'", (queryErr, rowCount) => {
      if (queryErr) {
        console.error('Error executing query:', queryErr);
      } else {
        console.log(`${rowCount} row(s) returned`);
      }

      // Close the connection
      connection.close();
    });

    // Handle the result set
    request.on('row', (columns) => {
      columns.forEach((column) => {
        console.log(column.value);
      });
    });

    // Execute the request
    connection.execSql(request);
  }
});

// Handle errors
connection.on('error', (err) => {
  console.error('Error:', err);
});
