const fs = require('fs');
const xml2js = require('xml2js');

// Sample data for the XML structure
const data = {
  model: {
    $: { type: 'neural net' },
    inputs: {
      input: [
        { $: { name: 'soc', min: '1.000000', max: '6.000000', type: 'CONSTANT' } },
      ],
    },
    outputs: {
      output: { $: { name: 'charging_time', error: '0.03', min: '0.000000', max: '30.000000', type: 'CONSTANT' } },
    },
    net: {
      layer: [
        {
          $: { activation: 'SIGMOID' },
          neuron: [
            '0.09334171563386917',
            '-0.008104167878627777',
            '-0.826951801776886',
            '0.19033686816692352',
            '0.6462565660476685',
            '0.11175461113452911',
          ],
        },
        {
          $: { activation: 'LINEAR' },
          neuron: ['0.11883735656738281', '1.1670423746109009', '-0.6987031698226929', '0.539645791053772'],
        },
      ],
    },
  },
};

// Create a new instance of the XML builder
const builder = new xml2js.Builder();
const xmlString = builder.buildObject(data);

console.log(xmlString);
