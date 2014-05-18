
var cluster = require('cluster');
var uuid = require('node-uuid');
var numCPUs = (process.argv[5]) ? process.argv[5] : require('os').cpus().length;
var sys = require("sys"),
my_http = require("http");
var net = require('net');
var flumeClient = new net.Socket();
var useCppModule = true;
/*
var log4js = require('log4js');
log4js.configure({
    appenders: [
        { type: 'console' },
        { type: 'file', filename: 'cheese.log', category: 'cheese' }
    ]
});

var logger = log4js.getLogger('cheese');
logger.setLevel('INFO');
logger.info("123");
*/
if (!process.argv[2] || !process.argv[3] || !process.argv[4]) {
   console.log("** missing parameters **");
   console.log("\"" + process.argv[0] + " " + process.argv[1] + " [server Port] [flume IP] [flume Port] [# of servers (optional)]\"");
   process.abort();
}


// This is flume tcp socket
flumeClient.connect(process.argv[4], process.argv[3], function() {
    console.log('Connected to flume socket at ' + process.argv[3] + ":" + process.argv[4]);
});
flumeClient.on('error', function(err) {
    console.log('ERROR can\'t connect to flume socket at ' + process.argv[3] + ":" + process.argv[4]);
});
flumeClient.on('data', function(data) {
    //console.log('Received: ' + data);
    //flumeClient.destroy(); // kill client after server's response
});
flumeClient.on('close', function() {
    console.log('Flume connection was closed');
});

if (cluster.isMaster) {
    // console.log(useCppModule ? 'C++ Parser module' : 'NodeJS parser module');
    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', function(worker, code, signal) {
        console.log('worker ' + worker.process.pid + ' died');
    });
} else {
    // Workers can share any TCP connection
    // In this case its a HTTP server
    my_http.createServer(function(request,response){

        //sys.puts("I got kicked");
        handleRequest(request, response);

    }).listen(process.argv[2]);
    sys.puts("Server Running on " + process.argv[2]);
}



function handleRequest(request, response) {
    //if (request.method == 'POST') {
        var body = '';
        request.on('data', function (data) {
            body += data;
            if (body.length > 1e6) {// 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
                request.connection.destroy();// FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
            }
        });
        request.on('end', function () {
            writeResponse(response); 
            jsonParser(body, response);
            /*if (useCppModule) {
                modulename.callback(false, function(err, result) {
                    xmlParserCppModule(body, response);
                });
            } else {
                modulename.callback(false, function(err, result) {
                    xmlParserNodeJSModule(body, response);
                });
            }*/
        });
    //}
}

function xmlParserNodeJSModule(xml, response) {
    //var xml = "<id>999</id>"
    var parseString = require('xml2js').parseString;
    parseString(xml, function (err, result) {
        dataStr = JSON.stringify(result['id']);
        flumeClient.write(dataStr + "\n", function() {
            writeResponse(response);
        });
    });
}

function xmlParserCppModule(xml, response) {
    var addon = require('./build/Release/hello');
    var dataStr = addon.hello(xml);
    flumeClient.write(dataStr + "\n", function() {
        writeResponse(response);
    });
}

function jsonParser(json, response) {
    //var str = '{"id": "6495"}';

// parse str into an object
    //var obj = JSON.parse(json);
    //var dataStr = obj.id;
    //var dataStr = obj.site.publisher.id;
    // replace T with space and delete the dot and everything after
    var uuid1 = uuid.v1();
    //var uuid1 = "c654ec1-7f8f-11e3-ae96-b385f4bc450c";
    //var uuid1 = "123";
    var utcTimestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var dataStr = "{\"uuid\":\"" + uuid1 + "\",\"bid_request\":" + json + ",\"timestamp\":\"" + utcTimestamp + "\"}";
    //var dataStr = "{\"uuid\":\"" + uuid1 + "\",\"bid_request\":\"json\",\"timestamp\":\"" + utcTimestamp + "\"}";
    //var dataStr = "{\"uuid\":\"" + uuid1 + "\",\"bid_request\":{\"id\":\"222\"},\"timestamp\":\"" + utcTimestamp + "\"}";
    dataStr = dataStr.replace(/\n/g, '');


    flumeClient.write(dataStr + "\n", function() {
        //writeResponse(response);
    });
}


function writeResponse(response) {
    response.writeHeader(202, {"Content-Type": "text/plain"});
    response.write("no-bid");
    response.end();
}

                                       
