var request = require('request');
var cheerio = require('cheerio');

var fs = require('fs');
var url = "https://news.ycombinator.com/";
var projectName='log';

var date = new Date();
var currentTime = date.getTime();

var execSync = require('child_process').execSync;
var blessed = require('blessed');

// Create a screen object.
var screen = blessed.screen();

// Create a box perfectly centered horizontally and vertically.

var queue = blessed.log({  
  fg: 'white',
  bg: 'default',
  label: 'links in queue',
  border: {
    type: 'line',
    fg: '#ffffff'
  },
  tags: true,
  //content: '{center}{red-fg}Hello{/red-fg}{/center}\n'
    //     + '{right}world!{/right}',
  width: '50%',
  height: '50%',
  top: '0%',
  left: '0%'
});

var done = blessed.log({  
  fg: 'white',
  bg: 'default',
    label: 'done links',
  border: {
    type: 'line',
    fg: '#ffffff'
  },
  tags: true,
  //content: '{center}{red-fg}Hello{/red-fg}{/center}\n'
    //     + '{right}world!{/right}',
  width: '50%',
  height: '50%',
  top: '50%',
  left: '0%'
});
var status = blessed.text({
  top: 'center',
  left: 'center',
  label: 'state',
  width: '50%',
  height: '10%',
  content: 'Hello {bold}world{/bold}!',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'magenta',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  },
  top: '0%',
  left: '50%'
});
// Append our box to the screen.
screen.append(status);
screen.append(queue);
screen.append(done);
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

//outer.content="asdasd";

// Render the screen.
screen.render();  
var console={log:function(){}};



var queueFileName=projectName+'-'+currentTime+'-'+'queue';
var doneFileName=projectName+'-'+currentTime+'-'+'done';
var stateFileName=projectName+'-'+currentTime+'-'+'state';

var rate = 10000;
var linkLevel=1;
var linkTotal=1;
var linkCurrent=0;
var linkNextLevel=0;
var linksFailed=0;
var lineCurrent = 0;

function state(){
    return {	queueFileName: queueFileName,
	doneFileName: doneFileName,
	stateFileName: stateFileName,
	
	rate: rate,
	linkLevel: linkLevel,
	linkTotal: linkTotal,
	
	linkNextLevel: linkNextLevel,
	linksFailed: linksFailed,
	lineCurrent: lineCurrent
    }
}
function saveState(){
    status.content = "link current: "+linkCurrent+" links total: "+linkTotal+" links left on level: "+ linkNextLevel+" count of links on level: "+linkLevel+ " errors: "+linksFailed+" line in queue file: "+lineCurrent;
    fs.writeFileSync(stateFileName, JSON.stringify({
	queueFileName: queueFileName,
	doneFileName: doneFileName,
	stateFileName: stateFileName,
	
	rate: rate,
	linkLevel: linkLevel,
	linkTotal: linkTotal,
	
	linkNextLevel: linkNextLevel,
	linksFailed: linksFailed,
	lineCurrent: lineCurrent
	
    }), encoding='utf8');
}
function restoreState(){
    var nstate=execSync('sed \'1q;d\' \''+ stateFileName+'\'').toString('utf8');

    var state = JSON.parse(nstate);
    queueFileName=state.queueFileName;
    doneFileName=state.doneFileName;
    stateFileName=state.stateFileName;

    rate=state.rate;
    linkLevel=state.linkLevel;
    linkTotal=state.linkTotal;

    linkNextLevel=state.linkNextLevel;
    linksFailed=state.linksFailed;
    lineCurrent=state.lineCurrent;

}

function readline(){
    lineCurrent=lineCurrent+1;
    console.log(lineCurrent);
    return execSync('sed \''+lineCurrent+'q;d\' \''+ queueFileName+'\'').toString('utf8');
}

logToQueue(url);
logToQueue("//"+url);
saveState();
console.log(state());
restoreState();
console.log(state());

var url = readline();
console.log(url);
online(url);

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
        logToDone(line);

	setTimeout(function(){
	    console.log("about to start next link "+ line)
	    online(readline());  
	},rate);
    }
}
function logToQueue(line){
    fs.appendFileSync(queueFileName, line+"\n", encoding='utf8');
    queue.add(line);
}
function logToDone(line){
    fs.appendFileSync(doneFileName, line+"\n", encoding='utf8');
    done.add(line);
}
function doOneLink(url){
    saveState();
    request(url, function (error, response, html) {
	if (!error && response.statusCode == 200) {
	    linkCurrent+=1;
	    linkNextLevel-=1;
	    logToDone(url);
	    logToQueue("//"+url);
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
	    var rate = 10000;


	    console.log("link current: "+linkCurrent+" links total: "+linkTotal+" links left on level: "+ linkNextLevel+" count of links on level: "+linkLevel+ " errors: "+linksFailed+" line in queue file: "+lineCurrent);
	}
    });
}
