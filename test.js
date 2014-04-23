
var addon = require('./build/Release/hello');
//var xmlStr = "<ToDo><Item priority=\"1st priority\"> item 1</Item><Item priority=\"2nd priority\"> item 2</Item></ToDo>";
var xmlStr = "<id>1234</id>";

console.log(addon.hello(xmlStr)); // 'world'



