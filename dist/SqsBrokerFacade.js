'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _sqsConsumer = require('sqs-consumer');

var _sqsConsumer2 = _interopRequireDefault(_sqsConsumer);

var _sqsProducer = require('sqs-producer');

var _sqsProducer2 = _interopRequireDefault(_sqsProducer);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SqsBrokerFacade = (function (_Emitter) {
  (0, _inherits3.default)(SqsBrokerFacade, _Emitter);

  function SqsBrokerFacade(options) {
    (0, _classCallCheck3.default)(this, SqsBrokerFacade);

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(SqsBrokerFacade).call(this));

    _this._options = options;

    _this._sqs = new _awsSdk2.default.SQS({
      region: options.region,
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey
    });

    return _this;
  }

  (0, _createClass3.default)(SqsBrokerFacade, [{
    key: '_ensureQueue',
    value: function _ensureQueue(name) {
      var _this2 = this;

      return new _promise2.default(function (resolve, reject) {

        var params = {
          QueueName: name
        };

        _this2._sqs.createQueue(params, function (err, data) {
          if (err) return reject(err);
          resolve(data.QueueUrl);
        });
      });
    }
  }, {
    key: '_validateRequestMessage',
    value: function _validateRequestMessage(sqsMessage) {
      //TODO: validate message attributes and payload using 'joi' lib
      return true;
    }
  }, {
    key: '_handleRequestMessage',
    value: function _handleRequestMessage(message, done) {

      console.log('Handling new request message');

      var isValid = this._validateRequestMessage(message);

      if (!isValid) {
        console.log('Invalid queue message');
        return;
      }

      var request = {
        uid: message.MessageAttributes.requestUid.StringValue,
        reefDialect: message.MessageAttributes.reefDialect.StringValue,
        queryType: message.MessageAttributes.queryType.StringValue,
        payload: JSON.parse(message.Body),
        acknowledge: done
      };

      this.emit('request', request);
    }
  }, {
    key: '_setupRequestConsumer',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(domain, lane) {
        var _this3 = this;

        var queueUrl, consumer;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this._ensureQueue(domain + '-' + lane + '-req');

              case 2:
                queueUrl = _context.sent;
                consumer = _sqsConsumer2.default.create({
                  sqs: this._sqs,
                  queueUrl: queueUrl,
                  batchSize: 10,
                  messageAttributeNames: ['All'],
                  handleMessage: function handleMessage(message, done) {
                    _this3._handleRequestMessage(message, done);
                  }
                });

                consumer.on('error', function (err) {
                  console.log(err.message);
                });

                return _context.abrupt('return', consumer);

              case 6:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));
      return function _setupRequestConsumer(_x, _x2) {
        return ref.apply(this, arguments);
      };
    })()
  }, {
    key: '_setupResponseProducer',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(domain, lane) {
        var queueUrl, producer;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this._ensureQueue(domain + '-' + lane + '-res');

              case 2:
                queueUrl = _context2.sent;
                producer = _sqsProducer2.default.create({
                  sqs: this._sqs,
                  queueUrl: queueUrl
                });
                return _context2.abrupt('return', producer);

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));
      return function _setupResponseProducer(_x3, _x4) {
        return ref.apply(this, arguments);
      };
    })()
  }, {
    key: 'setup',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this._setupRequestConsumer(this._options.serviceDomain, this._options.serviceLane);

              case 2:
                this._requestConsumer = _context3.sent;
                _context3.next = 5;
                return this._setupResponseProducer(this._options.clientDomain, this._options.clientLane);

              case 5:
                this._responseProducer = _context3.sent;

              case 6:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));
      return function setup() {
        return ref.apply(this, arguments);
      };
    })()
  }, {
    key: 'start',
    value: function start() {

      this._requestConsumer.start();
    }
  }, {
    key: 'stop',
    value: function stop() {

      this._requestConsumer.stop();
    }
  }, {
    key: 'enqueueResponse',
    value: function enqueueResponse(response) {
      var _this4 = this;

      return new _promise2.default(function (resolve, reject) {

        var message = {
          id: response.uid,
          body: (0, _stringify2.default)(response.payload),
          messageAttributes: {
            reefDialect: { DataType: 'String', StringValue: response.reefDialect },
            requestUid: { DataType: 'String', StringValue: response.requestUid }
          }
        };

        _this4._responseProducer.send([message], function (err) {
          if (err) reject(err);
          resolve();
        });
      });
    }
  }]);
  return SqsBrokerFacade;
})(_events2.default);

exports.default = SqsBrokerFacade;