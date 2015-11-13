var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
//var console={log:function(){}};
var url = "https://news.ycombinator.com/";
var projectName='log';
var date = new Date();
var currentTime = date.getTime();

var blessed = require('blessed');

Tail = require('tail').Tail;
var queueFileName=projectName+'-'+'queue'+'-'+currentTime;
var doneFileName=projectName+'-'+'done'+'-'+currentTime;

var lineSeparator= /[\r]{0,1}\n/; // default is now a regex that handle linux/mac (9+)/windows
var fromBeginning = true;
var watchOptions = {}; // as per node fs.watch documentations
var rate = 10000;

logToQueue(url);
logToQueue("//"+url);
var linkLevel=1;
var linkTotal=1;
var linkCurrent=0;
var linkNextLevel=0;
var linksFailed=0;
tail = new Tail(queueFileName,lineSeparator,watchOptions,fromBeginning);

tail.on("line", function(line) {
    console.log(line);
    console.log("start processing line \n");
    if (!line.match(/^\/\//i)){
	console.log("downloading %s",line);
	setTimeout(function(){
	    doOneLink(line);
	},rate);
    }
});
tail.on("error", function(error) {
  console.log('ERROR: ', error);
});
function logToQueue(line){
    fs.appendFile(queueFileName, line+"\n", encoding='utf8', function (err) {
	if (err) throw err;
    });
}
function logToDone(line){
    fs.appendFile(doneFileName, line+"\n", encoding='utf8', function (err) {
	if (err) throw err;
    });
}
function doOneLink(url){
    request(url, function (error, response, html) {
	if (!error && response.statusCode == 200) {
	    linkCurrent+=1;
	    linkNextLevel-=1;

	    var $ = cheerio.load(html);
	    $("a:not([href^=http]):not([href^=mailto])").each(function(i, element){
		linkTotal+=1;
		console.log(url+element.attribs.href);
		logToQueue(url+element.attribs.href);
	    });
	    	linkNextLevel=linkTotal-linkCurrent;
	   
	    if(linkNextLevel==0){
		linkLevel+=1;
	    }
	    logToQueue("//"+url);
	    console.log("linkCurrent "+linkCurrent+" linkTotal "+linkTotal+" linkNextLevel "+ linkNextLevel+" linkLevel "+linkLevel)
	}
    });
}
