const cassandra = require('cassandra-driver');
const dotenv = require("dotenv");

dotenv.config();

const client = new cassandra.Client({
  contactPoints: ['75.119.153.92'],     //["node-0.aws-us-west-1.2d633b6f811ae79f69c7.clusters.scylla.cloud", "node-1.aws-us-west-1.2d633b6f811ae79f69c7.clusters.scylla.cloud", "node-2.aws-us-west-1.2d633b6f811ae79f69c7.clusters.scylla.cloud"], // or Docker IP
  localDataCenter:  'datacenter1', //'AWS_US_WEST_1',
  keyspace: 'bellshire',
  //credentials: { username: 'scylla', password: 'XM5YuW9iHsnzy7I' },
});

client.connect()
  .then(() => console.log('🟢 ScyllaDB connected'))
  .catch(err => console.error('🔴 ScyllaDB connection failed:', err));

module.exports = client;
