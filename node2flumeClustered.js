
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var sys = require("sys"),
my_http = require("http");
var net = require('net');
var flumeClient = new net.Socket();
var useCppModule = true;
var modulename = require('./build/Release/modulename');


// This is flume tcp socket
flumeClient.connect(81, '127.0.0.1', function() {
    console.log('Connected to flume socket');
});
flumeClient.on('data', function(data) {
    //console.log('Received: ' + data);
    //flumeClient.destroy(); // kill client after server's response
});
flumeClient.on('close', function() {
    console.log('Connection closed');
});

if (cluster.isMaster) {
    console.log(useCppModule ? 'Cpp Parser module' : 'NodeJS parser module');
    // Fork workers.
    for (var i = 0; i < 3; i++) {
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
    if (request.method == 'POST') {
        var body = '';
        request.on('data', function (data) {
            body += data;
            if (body.length > 1e6) {// 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
                request.connection.destroy();// FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
            }
        });
        request.on('end', function () {
            if (useCppModule) {
                modulename.callback(false, function(err, result) {
                    xmlParserCppModule(body, response);
                });
            } else {
                modulename.callback(false, function(err, result) {
                    xmlParserNodeJSModule(body, response);
                });
            }
        });
    }
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


function writeResponse(response) {
    response.writeHeader(204, {"Content-Type": "text/plain"});
    response.write("no-bid");
    response.end();
}

