import EventEmitter from 'events';
import Consumer from 'sqs-consumer';
import Producer from 'sqs-producer';
import AWS from 'aws-sdk';

import ReceiptType from './ReceiptType';

export default class SqsBrokerFacade extends EventEmitter{

  constructor(options) {

    super();

    this._options = options;

    this._sqs = new AWS.SQS({
      region: options.region,
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey
    });

    this._producers = {};

  }

  _ensureQueue(name) {

    return new Promise((resolve, reject) => {

      var params = {
        QueueName: name
      };

      this._sqs.createQueue(params, function(err, data) {
        if (err) return reject(err);
        resolve(data.QueueUrl);
      });

    });

  }

  _validateRequestMessage(sqsMessage) {
    //TODO: validate message attributes and payload using 'joi' lib
    return true;
  }

  _handleRequestMessage(message, done) {

    this.emit('info', 'Handling new request message');

    let isValid = this._validateRequestMessage(message);

    if (!isValid) {
      this.emit('info', 'Invalid queue message');
      return;
    }

    let request = this._buildRequestDto(message, done);
    
    this.emit('request', request);

  }

  _buildRequestDto(message, done){
    let request;

    switch (message.MessageAttributes.reefDialect.StringValue) {
      case 'reef-v1-query':
        request = {
          uid: message.MessageAttributes.requestUid.StringValue,
          reefDialect: message.MessageAttributes.reefDialect.StringValue,
          queryType: message.MessageAttributes.queryType.StringValue,
          replyToDomain: message.MessageAttributes.replyToDomain.StringValue,
          replyToLane: message.MessageAttributes.replyToLane.StringValue,
          payload: JSON.parse(message.Body),
          acknowledge: done
      };
        break;

      case 'reef-v1-command':
        request = {
          uid: message.MessageAttributes.requestUid.StringValue,
          reefDialect: message.MessageAttributes.reefDialect.StringValue,
          commandType: message.MessageAttributes.commandType.StringValue,
          replyToDomain: message.MessageAttributes.replyToDomain.StringValue,
          replyToLane: message.MessageAttributes.replyToLane.StringValue,
          receiptType: message.MessageAttributes.receiptType ? message.MessageAttributes.receiptType.StringValue : ReceiptType.EXPECT_RECEIPT,
          payload: JSON.parse(message.Body),
          acknowledge: done
      };
        break;

      default:
          this.emit('warn', `Unrecognized reefDialect: `, message.MessageAttributes.reefDialect.StringValue);
          return;
    }

    return request;
  }

  async _setupRequestConsumer(domain, lane) {

    let queueUrl = await this._ensureQueue(`${domain}-${lane}-req`);

    let consumer = Consumer.create({
      sqs: this._sqs,
      queueUrl: queueUrl,
      batchSize: 10,
      messageAttributeNames: ['All'],
      handleMessage: (message, done) => { this._handleRequestMessage(message, done); }
    });

    consumer.on('error', err => {
      this.emit('warn', err ? err : new Error("UNKNOWN_CONSUMER_ERROR"));
    });

    return consumer;

  }

  async _setupResponseProducer(domain, lane) {

    let queueName = `${domain}-${lane}-res`;

    if( !this._producers[queueName] ){

        this._producers[queueName] = new Promise( async (resolve, reject) => {

            let queueUrl = await this._ensureQueue(queueName);

            let producer = Producer.create({
              sqs: this._sqs,
              queueUrl: queueUrl
            });

            resolve(producer);

        });
    }

    return this._producers[queueName];

  }

  async setup() {

    this._requestConsumer = await this._setupRequestConsumer(this._options.serviceDomain, this._options.serviceLane);

  }

  start() {

    this._requestConsumer.start();

  }

  stop() {

    this._requestConsumer.stop();

  }

  async enqueueResponse(response) {

    let message = {
      id: response.uid,
      body: JSON.stringify(response.payload),
      messageAttributes: {
        reefDialect: { DataType: 'String', StringValue: response.reefDialect },
        requestUid: { DataType: 'String', StringValue: response.requestUid },
        status: { DataType: 'String', StringValue: response.status }
      }
    };

    let responseProducer = await this._setupResponseProducer(response.domain, response.lane);

    return new Promise( (resolve, reject) => {
      responseProducer.send([message], (err) => {
        if (err) reject(err);
        resolve();
      });
    });

  }

}
