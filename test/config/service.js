var ReefService = require('../../dist').ReefService;
var SqsBrokerFacade = require('../../dist').SqsBrokerFacade;

module.exports = function() {
  var sqsBrokerFacade = new SqsBrokerFacade({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESSKEYID,
    secretAccessKey: process.env.AWS_SECRETACCESSKEY,
    serviceDomain: 'service-test',
    serviceLane: 'singleton'
  });

  var service = new ReefService(sqsBrokerFacade);

  service.addResolver('echo-data', (params) => {

    return new Promise((resolve, reject) => {

      console.log('echo-data request');

      resolve(params.data);

    });
  });


  service.addRunner('receive-data', (params) => {

    return new Promise((resolve, reject) => {

      console.log('receive-data request');

      resolve({ success: true });

    });

  });


  service.addRunner('return-null-response-runner', (params) => {

    return new Promise((resolve, reject) => {

      console.log('receive-data request');

      resolve(null);

    });

  });

  service.addRunner('return-undefined-response-runner', (params) => {

    return new Promise((resolve, reject) => {

      console.log('receive-data request');

      resolve(undefined);

    });

  });

  service.addRunner('error-no-acknowledge-explicit', (params) => {

    let error = new Error('No Acknowledge');
    error.acknowledge = false;

    throw error;

  });

  service.addRunner('error-yes-acknowledge-explicit', (params) => {

    let error = new Error('Acknowledge');
    error.acknowledge = true;

    throw error;
  });

  service.addRunner('error-yes-acknowledge-implicit', (params) => {

    throw new Error('Aacknowledge');

  });



  service.addResolver('return-null-response-resolver', (params) => {

    return new Promise((resolve, reject) => {

      console.log('receive-data request');

      resolve(null);

    });

  });

  service.addResolver('return-undefined-response-resolver', (params) => {

    return new Promise((resolve, reject) => {

      console.log('receive-data request');

      resolve(undefined);

    });
  });

  service.addResolver('no-return-response-resolver', (params) => {
    return;
  });

  service.addRunner('no-return-response-runner', (params) => {

    return;

  });



  return service
    .setup()
    .then(function () {
      console.log('starting up service');
      return service.start();
    })
    .then(function () {
      console.log('listening');
      service.on('info', console.log);
      service.on('warn', console.log);
      service.on('error', console.log);
      return service;
    })
    .catch(function (err) {
      console.log('error on test pipeline');
      console.log(err.toString());
      process.exit(1);
    });
}
