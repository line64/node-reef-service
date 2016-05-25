import uid from 'uid';
import ResponseStatus from './ResponseStatus';
import EventEmitter from 'events';

export default class ReefService extends EventEmitter {

  constructor(brokerFacade) {

    super();

    this._brokerFacade = brokerFacade;
    this._brokerFacedeName = brokerFacade.constructor.name;
    this._runners = {};
    this._resolvers = {};

  }

  setup() {

    this._brokerFacade.on('request', (req) => this._onRequest(req));

    this._brokerFacade.on('info', (info) => this.emit('info', {Facade: info}));

    this._brokerFacade.on('error', (error) => this.emit('error', {Facade: error}));

    return this._brokerFacade.setup();

  }

  start() {

    this._brokerFacade.start();

  }

  stop() {

    this._brokerFacade.stop();

  }

  async _processQuery(request) {

    this.emit('info', 'Processing query');

    let resolver = this._resolvers[request.queryType];

    if (!resolver) {
      this.emit('info', 'No resolver found for query type');
      request.acknowledge(new Error('No resolver found for query type'));
      return;
    }

    let answer = null,
        status = null;

    try{
        answer = await resolver(request.payload, this);
        status = ResponseStatus.SUCCESS;
    }
    catch(err){
        this.emit('error','Warning - Error in resolver');
        answer = JSON.stringify(err, Object.getOwnPropertyNames(err));;
        status = ResponseStatus.INTERNAL_ERROR;
    }


    this.emit('info', {AnswerResolved: answer});

    let response = {
      uid: uid(),
      reefDialect: 'reef-v1-answer',
      requestUid: request.uid,
      domain: request.replyToDomain,
      lane: request.replyToLane,
      payload: answer,
      status: status
    };

    this.emit('info', {ResponseBuilt: response});

    this.emit('info', 'Enqueing response');
    await this._brokerFacade.enqueueResponse(response);

    this.emit('info', 'Acknoledging request');

    request.acknowledge();

  }

  async _processCommand(request) {

    this.emit('info', 'Processing command');

    let runner = this._runners[request.commandType];

    if (!runner) {
      this.emit('error', `No runner found for query type: ${JSON.stringify(request)}`);
      request.acknowledge(new Error('No runner found for query type'));
      return;
    }

    let payload = null,
        status = null;

    try{
        payload = await runner(request.payload, this);
        status = ResponseStatus.SUCCESS;
    }
    catch(err){
        this.emit('error', 'Warning - Error in runner');
        payload = {message: err.message, stack: err.stack};
        status = ResponseStatus.INTERNAL_ERROR;
    }

    this.emit('info', `Payload resolved: ${JSON.stringify(payload)}`);

    let response = {
      uid: uid(),
      reefDialect: 'reef-v1-receipt',
      requestUid: request.uid,
      domain: request.replyToDomain,
      lane: request.replyToLane,
      payload: payload,
      status: status
    };

    this.emit('info', `Response built: ${JSON.stringify(request)}`);

    this.emit('info', 'Enqueing response');
    await this._brokerFacade.enqueueResponse(response);

    this.emit('info', 'Acknoledging request');

    request.acknowledge();

  }


  _onRequest(request) {

    this.emit('info', 'Request raised');

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
