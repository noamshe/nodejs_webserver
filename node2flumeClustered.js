
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
    for (var i = 0; i < 6; i++) {
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
        handleRequest(request, function() {
            writeResponse(response);
        });

    }).listen(8080);
    sys.puts("Server Running on 8080");
}

function handleRequest(request, callback) {
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
                    xmlParserCppModule(body, callback);
                });
            } else {
                modulename.callback(false, function(err, result) {
                    xmlParserNodeJSModule(body, callback);
                });
            }
        });
    }
}

function xmlParserNodeJSModule(xml, callback) {
    //var xml = "<id>999</id>"
    var parseString = require('xml2js').parseString;
    parseString(xml, function (err, result) {
        dataStr = JSON.stringify(result['id']);
        flumeClient.write(dataStr + "\n", function() {
            callback();
        });
    });
}

function xmlParserCppModule(xml, callback) {
    var addon = require('./build/Release/hello');
    var dataStr = addon.hello(xml);
    flumeClient.write(dataStr + "\n", function() {
        callback();
    });
}


function writeResponse(response) {
    response.writeHeader(204, {"Content-Type": "text/plain"});
    response.write("no-bid");
    response.end();
}

