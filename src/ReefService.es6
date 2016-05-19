import uid from 'uid';
import ResponseStatus from './ResponseStatus';
import Emitter from 'events';

export default class ReefService extends Emitter {

  constructor(brokerFacade) {

    super();

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

    this.emit('info', 'processing query');

    let resolver = this._resolvers[request.queryType];

    if (!resolver) {
      this.emit('info', 'no resolver found for query type');
      request.acknowledge(new Error('no resolver found for query type'));
      return;
    }

    let answer = null,
        status = null;

    try{
        answer = await runner(request.payload, this);
        status = ResponseStatus.SUCCESS;
    }
    catch(err){
        this.emit('error','Warning - Error in aplication');
        answer = JSON.stringify(err, Object.getOwnPropertyNames(err));;
        status = ResponseStatus.INTERNAL_ERROR;
    }


    this.emit('info', `answer resolved: ${answer}`);

    let response = {
      uid: uid(),
      reefDialect: 'reef-v1-answer',
      requestUid: request.uid,
      domain: request.replyToDomain,
      lane: request.replyToLane,
      payload: answer,
      status: status
    };

    this.emit('info', `response built: ${response}`);

    this.emit('info', 'enqueing response');
    await this._brokerFacade.enqueueResponse(response);

    this.emit('info', 'acknoledging request');

    request.acknowledge();

  }

  async _processCommand(request) {

    this.emit('info', 'processing command');

    let runner = this._runners[request.commandType];

    if (!runner) {
      this.emit('error', `no runner found for query type: ${request}`);
      request.acknowledge(new Error('no runner found for query type'));
      return;
    }

    let payload = null,
        status = null;

    try{
        payload = await runner(request.payload, this);
        status = ResponseStatus.SUCCESS;
    }
    catch(err){
        this.emit('info', 'Warning - Error in aplication');
        payload = {message: err.message, stack: err.stack};
        status = ResponseStatus.INTERNAL_ERROR;
    }

    this.emit('info', `payload resolved: + ${payload}`);

    let response = {
      uid: uid(),
      reefDialect: 'reef-v1-receipt',
      requestUid: request.uid,
      domain: request.replyToDomain,
      lane: request.replyToLane,
      payload: payload,
      status: status
    };

    this.emit('info', `response built: ${response}`);

    this.emit('info', 'enqueing response');
    await this._brokerFacade.enqueueResponse(response);

    this.emit('info', 'acknoledging request');

    request.acknowledge();

  }


  _onRequest(request) {

    this.emit('info', 'request raised');

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
