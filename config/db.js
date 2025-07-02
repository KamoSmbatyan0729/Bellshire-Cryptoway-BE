const cassandra = require('cassandra-driver');

const client = new cassandra.Client({
  contactPoints: ['127.0.0.1'], // or Docker IP
  localDataCenter: 'datacenter1',
  keyspace: 'bellshire',
});

client.connect()
  .then(() => console.log('🟢 ScyllaDB connected'))
  .catch(err => console.error('🔴 ScyllaDB connection failed:', err));

module.exports = client;
