

var sys = require("sys"),
my_http = require("http");
var net = require('net');
var flumeClient = new net.Socket();
// this is flume tcp socket
flumeClient.connect(81, '127.0.0.1', function() {
    console.log('Connected');
});
flumeClient.on('data', function(data) {
    //console.log('Received: ' + data);
    //flumeClient.destroy(); // kill client after server's response
});
flumeClient.on('close', function() {
    console.log('Connection closed');
});

my_http.createServer(function(request,response){
    //sys.puts("I got kicked");
    handleRequest(request, response);


}).listen(8080);
sys.puts("Server Running on 8080");


function handleRequest(request, response) {
    var qs = require('querystring');
    if (request.method == 'POST') {
        var body = '';
        request.on('data', function (data) {
            body += data;
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6) {
                // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
                request.connection.destroy();
            }
        });
        request.on('end', function () {
            //console.dir(body);

            var POST = qs.parse(body);
            // use POST
            //console.dir(" - " + POST.xml);
            xmlParser(POST.xml, response);
        });
    }
}

function xmlParser(xml, response) {
//    var xml = "<root>Hello xml2js!</root>"
/*
    var parseString = require('xml2js').parseString;
    parseString(xml, function (err, result) {
        rootElement = JSON.stringify(result['id']);
        console.dir("result: " + rootElement);
        flumeClient.write(rootElement + "\n");
    });
*/
//var addon = require('./build/Release/hello');
//console.log(addon.hello(xml)); // 'world'
//flumeClient.write(addon.hello(xml) + "\n", function() {
//flumeClient.write("noam" + "\n", function() {
    // write no-bid back
    response.writeHeader(204, {"Content-Type": "text/plain"});
    response.write("Hello World");
    response.end();
//});

}

