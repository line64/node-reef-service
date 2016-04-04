import uid from 'uid';

export default class ReefService {

  constructor(brokerFacade) {

    this._brokerFacade = brokerFacade;
    this._runners = {};
    this._resolvers = {};

  }

  setup() {

    this._brokerFacade.on('request', (req) => this._onRequest(req));

    return this._brokerFacade.setup();

  }

  start() {

    this._brokerFacade.start();

  }

  stop() {

    this._brokerFacade.stop();

  }

  async _processQuery(request) {

    console.log('processing query');

    let resolver = this._resolvers[request.queryType];

    if (!resolver) {
      console.log('no resolver found for query type');
      request.acknowledge(new Error('no resolver found for query type'));
      return;
    }

    let answer = await resolver(request.payload);

    console.log('answer resolved');
    console.log(answer);

    let response = {
      uid: uid(),
      reefDialect: 'reef-v1-answer',
      requestUid: request.uid,
      payload: answer
    };

    console.log('response built');
    console.log(response);

    console.log('enqueing response');
    await this._brokerFacade.enqueueResponse(response);

    console.log('acknoledging request');

    request.acknowledge();

  }

  async _processCommand(request) {

    console.log('processing command');

    let runner = this._runners[request.commandType];

    if (!runner) {
      console.log('no runner found for query type');
      request.acknowledge(new Error('no runner found for query type'));
      return;
    }

    let receipt = await runner(request.payload, this);

    console.log('receipt resolved');
    console.log(receipt);

    let response = {
      uid: uid(),
      reefDialect: 'reef-v1-receipt',
      requestUid: request.uid,
      payload: receipt
    };

    console.log('response built');
    console.log(response);

    console.log('enqueing response');
    await this._brokerFacade.enqueueResponse(response);

    console.log('acknoledging request');

    request.acknowledge();

  }


  _onRequest(request) {

    console.log('request raised');

    switch (request.reefDialect) {

      case 'reef-v1-query':
        this._processQuery(request);
        break;

      case 'reef-v1-command':
        this._processCommand(request);
        break;

      default:
        throw new Error('Cant understand reef dialog');

    }

  }

  async addResolver(type, resolver) {

    this._resolvers[type] = resolver;

  }

  async addRunner(type, runner) {

    this._runners[type] = runner;

  }

  listen(event, callback) {

  }

}
