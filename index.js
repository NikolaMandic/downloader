var request = require('request');
var cheerio = require('cheerio');

var fs = require('fs');
//var console={log:function(){}};
var url = "https://news.ycombinator.com/";
var projectName='log';
var date = new Date();
var currentTime = date.getTime();
var execSync = require('child_process').execSync;
var blessed = require('blessed');

Tail = require('tail').Tail;
var queueFileName=projectName+'-'+'queue'+'-'+currentTime;
var doneFileName=projectName+'-'+'done'+'-'+currentTime;
var rate = 10000;
var linkLevel=1;
var linkTotal=1;
var linkCurrent=0;
var linkNextLevel=0;
var linksFailed=0;
var lineCurrent = 0;
logToQueue(url);
logToQueue("//"+url);

var url = readline();

console.log(url);
online(url);
function readline(){
    lineCurrent=lineCurrent+1;
    console.log(lineCurrent);
    return execSync('sed \''+lineCurrent+'q;d\' \''+ queueFileName+'\'').toString('utf8');
}
function online(line) {
    console.log(line);
    console.log("start processing line \n");
    if (!line.match(/^\/\//i)){
	console.log("downloading %s",line);
        doOneLink(line);
	setTimeout(function(){
	    online(readline());  
	},rate);
    }else{
	setTimeout(function(){
	    console.log("about to start next link "+ line)
	    online(readline());  
	},rate);
    }
}

function logToQueue(line){
    fs.appendFileSync(queueFileName, line+"\n", encoding='utf8');
}
function logToDone(line){
    fs.appendFileSync(doneFileName, line+"\n", encoding='utf8');
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
