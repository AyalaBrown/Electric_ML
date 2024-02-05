const fs = require('fs');
const xml2js = require('xml2js');

// Read the XML file
const xmlData = fs.readFileSync('./model.xml', 'utf-8');

// Parse XML to JavaScript object
xml2js.parseString(xmlData, { explicitArray: false }, (err, result) => {
  if (err) {
    console.error(err);
    return;
  }

  // Access the JavaScript object
  const modelObject = result.model;


  console.log(modelObject);
  // Print the JavaScript object
  console.log(JSON.stringify(modelObject, null, 2));
});


