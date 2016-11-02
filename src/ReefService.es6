import uid from 'uid';
import ResponseStatus from './ResponseStatus';
import EventEmitter from 'events';

import ReceiptType from './ReceiptType';

export default class ReefService extends EventEmitter {

  constructor(brokerFacade) {

    super();

    this._brokerFacade = brokerFacade;
    this._brokerFacedeName = brokerFacade.constructor.name;
    this._runners = {};
    this._resolvers = {};

  }

  setup() {

    this._brokerFacade.on('request', req => this._onRequest(req));

    this._brokerFacade.on('info', info => this.emit('info', {Facade: info}));

    this._brokerFacade.on('error', error => this.emit('warn', {Facade: error}));

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

    let response = {
      uid: uid(),
      reefDialect: 'reef-v1-answer',
      requestUid: request.uid,
      domain: request.replyToDomain,
      lane: request.replyToLane,
      payload: null,
      status: null
    };

    try{
        if (!resolver) {
            this.emit('warn', `No resolver found for query`, request.queryType);
            throw {message: 'No resolver found for query type'};
        }
        response.payload = await resolver(request.payload, this);
        if(!response.payload) throw {message: 'Empty response'};
        response.status = ResponseStatus.SUCCESS;
    }
    catch(err){
        this.emit('warn',`Error in resolver`, err);
        response.payload = err;
        response.status = ResponseStatus.INTERNAL_ERROR;
    }

    this.emit('trace', `Request: `, request);
    this.emit('trace', `Response: `, response);

    this.emit('info', `Enqueing response for lane: `, `${request.replyToDomain}-${request.replyToLane}`);
    await this._brokerFacade.enqueueResponse(response);

    this.emit('info', `Acknoledging request uid: `, request.uid);

    request.acknowledge();

  }

  async _processCommand(request) {

    this.emit('info', 'Processing command');

    let runner = this._runners[request.commandType];

    let status,
        payload;

    try{
        if (!runner) {
            this.emit('warn', `No runner found for command type: `, request.commandType);
            throw {message: 'No runner found for command type'};
        }
        payload = await runner(request.payload, this);
        if(!payload) throw {message: 'Empty response'};
        status = ResponseStatus.SUCCESS;
    }
    catch(err){
        this.emit('warn',`Error in runner: `, err);
        payload = err;
        status = ResponseStatus.INTERNAL_ERROR;
    }

    if ( request.receiptType == ReceiptType.FIRE_AND_FORGET){
        this.emit('info', 'Processing fire and forget');

        if( status == ResponseStatus.SUCCESS || !runner ){
            return request.acknowledge();
        }
        return request.acknowledge(new Error());
    }

    let response = {
      uid: uid(),
      reefDialect: 'reef-v1-receipt',
      requestUid: request.uid,
      domain: request.replyToDomain,
      lane: request.replyToLane,
      payload: payload,
      status: status
    };

    this.emit('trace', `Request: `, request);
    this.emit('trace', `Response: `, response);

    this.emit('info', `Enqueing response for lane: `, `${request.replyToDomain}-${request.replyToLane}`);
    await this._brokerFacade.enqueueResponse(response);

    this.emit('info', `Acknoledging request uid: `, request.uid);

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

        this.emit('warn', new Error(`Cant understand reef dialog: ${request.reefDialect}`));

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
