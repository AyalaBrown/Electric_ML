
const sql = require('mssql');

// Connection configuration
const config = {
  user: 'Ayala',
  password: 'isr1953',
  server: '192.168.16.3',
  database: 'electric_ML',
  options: {
    encrypt: true, // For Azure SQL Database
  },
};

// Create a connection pool
const pool = new sql.ConnectionPool(config);

// Connect to the database
pool.connect().then(() => {
  console.log('Connected to SQL Server');

  // Use the connection pool to execute queries
  const request = pool.request();

  // Example query
  request.query("exec dbo.GetElectricPointChargeDetails_acc '20230101','20231230'").then((result) => {
    console.dir(result);
  }).catch((err) => {
    console.error('Error executing query:', err);
  }).finally(() => {
    // Close the connection pool after executing queries
    pool.close();
  });
}).catch((err) => {
  console.error('Error connecting to SQL Server:', err);
});
