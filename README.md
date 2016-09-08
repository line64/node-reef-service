# node-reef-service
A nodejs service for the Reef arquitectural pattern

#How to
Reef uses Amazon SQS queues, so you need an AWS account and the credentials to use it.

**Set up**

    import { SqsBrokerFacade, ReefService } from 'reef-service';
    import bunyan from 'bunyan';

    let log = bunyan.createLogger({
      name        : 'foo',
      level       : process.env.LOG_LEVEL || 'info',
      stream      : process.stdout,
      serializers : bunyan.stdSerializers
    });

    let brokerFacade = new SqsBrokerFacade({
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESSKEYID,
        secretAccessKey: process.env.AWS_SECRETACCESSKEY,
        clientDomain: "serviceDomain",
        clientLane: "singleton"
    });

    let service = new ReefService(brokerFacade);

    log.info('Setting up runners'); //The ones that listen for commands and fireAndForgets

    service.addRunner("SAVE_USER", saveUser); //service.addRunner(commandToListen, function)
    
    log.info('Setting up resolvers'); //The ones that listen for queries

    service.addResolver("GET_USER_INFORMATION", userInformation);

    log.info('Setting up Reef Service');
    await service.setup();

    log.info('Starting up Reef Service');
    await service.start();

    log.info('Adding info listener');
    service.on('info', (info) => {
        log.info('Reef layer info: ', info);
    });
    
    log.info('Adding warn listener');
    service.on('warn', (info) => {
        log.warn('Reef layer info: ', info);
    });

    log.info('Adding error listener');
    service.on('error', (error) => {
        log.error('Reef layer info: ', error);
    });

    log.info('Listening');

**Programming functions**

There are two types of functions that reef accepts: runners and resolvers.


    import mysql from 'mysql';
    import databaseConnection from './databaseConnection'; //For more detail in how to implement a mysql connection visit mysql repository

    async function saveUser(parameters){ //parameters is the payload that the client sends
      
     let query = `INSERT INTO subscriptor
                (user, name, lastName)
                VALUES (?, ?, ?)`;
        
      let inserts = [parameters.user, parameres.name, parameters.lastName];
      query = mysql.format(query, inserts);

      return new Promise( (resolve, reject) => {
            databaseConnection.query(query, (err, rows, fields) => {
                if (err){
                    bunyanLog.info(err);
                    resolve({
                      success: false,
                      error: err
                    });
                }
                
                resolve({
                  success: true
                });

            });
        });
    }
    

The object that the client will receive is the one that is returned after the promise is resolved.

If a resolver/runner throws an error(reject), it will send a failuere message the the client, and the message will be deleted from the queue.

If a runner throws an error and the command type is a fireAndForget, the message will be requeued, and no response will be sent.

#How does it work

Each service has a request queue compose of the domain and lane. For example a queue full name will be:

    serviceDomain-singleton-req

Each client has a response queue compose of the domain and lane. For example the queue name of the last example will be:

    clientDomain-singleton-res

The service in the other side will send a message through that queue, and the cliente will process that.
    
