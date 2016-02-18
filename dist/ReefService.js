'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _uid = require('uid');

var _uid2 = _interopRequireDefault(_uid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ReefService = (function () {
  function ReefService(brokerFacade) {
    (0, _classCallCheck3.default)(this, ReefService);

    this._brokerFacade = brokerFacade;
    this._runners = {};
    this._resolvers = {};
  }

  (0, _createClass3.default)(ReefService, [{
    key: 'setup',
    value: function setup() {
      var _this = this;

      this._brokerFacade.on('request', function (req) {
        return _this._onRequest(req);
      });

      return this._brokerFacade.setup();
    }
  }, {
    key: 'start',
    value: function start() {

      this._brokerFacade.start();
    }
  }, {
    key: 'stop',
    value: function stop() {

      this._brokerFacade.stop();
    }
  }, {
    key: '_processQuery',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(request) {
        var resolver, answer, response;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:

                console.log('processing query');

                resolver = this._resolvers[request.queryType];

                if (resolver) {
                  _context.next = 5;
                  break;
                }

                console.log('no resolver found for query type');
                return _context.abrupt('return');

              case 5:
                _context.next = 7;
                return resolver(request.payload);

              case 7:
                answer = _context.sent;

                console.log('answer resolved');
                console.log(answer);

                response = {
                  uid: (0, _uid2.default)(),
                  reefDialect: 'reef-v1-answer',
                  requestUid: request.uid,
                  payload: answer
                };

                console.log('response built');
                console.log(response);

                console.log('enqueing response');
                _context.next = 16;
                return this._brokerFacade.enqueueResponse(response);

              case 16:

                console.log('acknoledging request');

                request.acknowledge();

              case 18:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));
      return function _processQuery(_x) {
        return ref.apply(this, arguments);
      };
    })()
  }, {
    key: '_processCommand',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(request) {
        var runner, receipt, response;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:

                console.log('processing command');

                runner = this._runners[request.commandType];

                if (runner) {
                  _context2.next = 5;
                  break;
                }

                console.log('no runner found for query type');
                return _context2.abrupt('return');

              case 5:
                _context2.next = 7;
                return runner(request.payload, this);

              case 7:
                receipt = _context2.sent;

                console.log('receipt resolved');
                console.log(receipt);

                response = {
                  uid: (0, _uid2.default)(),
                  reefDialect: 'reef-v1-receipt',
                  requestUid: request.uid,
                  payload: receipt
                };

                console.log('response built');
                console.log(response);

                console.log('enqueing response');
                _context2.next = 16;
                return this._brokerFacade.enqueueResponse(response);

              case 16:

                console.log('acknoledging request');

                request.acknowledge();

              case 18:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));
      return function _processCommand(_x2) {
        return ref.apply(this, arguments);
      };
    })()
  }, {
    key: '_onRequest',
    value: function _onRequest(request) {

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
  }, {
    key: 'addResolver',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(type, resolver) {
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:

                this._resolvers[type] = resolver;

              case 1:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));
      return function addResolver(_x3, _x4) {
        return ref.apply(this, arguments);
      };
    })()
  }, {
    key: 'addRunner',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(type, runner) {
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:

                this._runners[type] = runner;

              case 1:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));
      return function addRunner(_x5, _x6) {
        return ref.apply(this, arguments);
      };
    })()
  }, {
    key: 'listen',
    value: function listen(event, callback) {}
  }]);
  return ReefService;
})();

exports.default = ReefService;