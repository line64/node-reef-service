import Emitter from 'events';
import Consumer from 'sqs-consumer';
import Producer from 'sqs-producer';
import AWS from 'aws-sdk';

export default class SqsBrokerFacade extends Emitter{

  constructor(options) {

    super();

    this._options = options;

    this._sqs = new AWS.SQS({
      region: options.region,
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey
    });

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

    console.log('Handling new request message');

    let isValid = this._validateRequestMessage(message);

    if (!isValid) {
      console.log('Invalid queue message');
      return;
    }

    let request = {
      uid: message.MessageAttributes.requestUid.StringValue,
      reefDialect: message.MessageAttributes.reefDialect.StringValue,
      queryType: message.MessageAttributes.queryType.StringValue,
      payload: JSON.parse(message.Body),
      acknowledge: done
    };

    this.emit('request', request);

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

    consumer.on('error', function (err) {
      console.log(err.message);
    });

    return consumer;

  }

  async _setupResponseProducer(domain, lane) {

    let queueUrl = await this._ensureQueue(`${domain}-${lane}-res`);

    let producer = Producer.create({
      sqs: this._sqs,
      queueUrl: queueUrl
    });

    return producer;

  }

  async setup() {

    this._requestConsumer = await this._setupRequestConsumer(this._options.serviceDomain, this._options.serviceLane);

    this._responseProducer = await this._setupResponseProducer(this._options.clientDomain, this._options.clientLane);

  }

  start() {

    this._requestConsumer.start();

  }

  stop() {

    this._requestConsumer.stop();

  }

  enqueueResponse(response) {

    return new Promise((resolve, reject) => {

      let message = {
        id: response.uid,
        body: JSON.stringify(response.payload),
        messageAttributes: {
          reefDialect: { DataType: 'String', StringValue: response.reefDialect },
          requestUid: { DataType: 'String', StringValue: response.requestUid }
        }
      };

      this._responseProducer.send([message], function(err) {
        if (err) reject(err);
        resolve();
      });

    });

  }

}
