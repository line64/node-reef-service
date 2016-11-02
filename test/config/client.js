var SqsBrokerFacade = require('reef-client').SqsBrokerFacade;
var ReefClient = require('reef-client').ReefClient;

module.exports = function() {
  var sqsBrokerFacade = new SqsBrokerFacade({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESSKEYID,
    secretAccessKey: process.env.AWS_SECRETACCESSKEY,
    clientDomain: 'client-test',
    clientLane: 'singleton'
  });

  var client = new ReefClient(sqsBrokerFacade);

  return client
    .setup()
    .then(function () {
      console.log('starting up client');
      return client.start();
    })
    .then(function() {
      client.on('info', console.log);
      client.on('warn', console.log);
      client.on('error', console.log);
      return client;
    })
    .catch(function (err) {
      console.log('error on test pipeline');
      console.log(err.toString());
      process.exit(1);
    });
}
