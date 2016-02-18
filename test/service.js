var ReefService = require('../dist').ReefService;
var SqsBrokerFacade = require('../dist').SqsBrokerFacade;

require('dotenv').load();

var brokerFacade = new SqsBrokerFacade({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  serviceDomain: 'service-mock',
  serviceLane: 'shared',
  clientDomain: 'stress-tester',
  clientLane: 'instance001'
});

var sabreService = new ReefService(brokerFacade);

sabreService.addResolver('echo-data', (params) => {

  return new Promise((resolve, reject) => {

    console.log('echo-data request');

    setTimeout(function () {
      console.log('timeout done');
      resolve(params.data);
    }, params.sleep);

  });

});

sabreService
  .setup()
  .then(function () {
    console.log('starting up service');
    return sabreService.start();
  })
  .then(function () {
    console.log('listening');
  })
  .catch(function (err) {
    console.log('error on test pipeline');
    console.log(err.toString());
    process.exit(1);
  });
