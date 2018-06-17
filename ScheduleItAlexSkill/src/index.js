/**
 * This skill allows a user to schedule a meeting with friends from the Google Contact List.
 */

var https = require('https');
var http = require('http');
const APP_ID = "askScheduleIt"; 
var Alexa = require('alexa-sdk');

var states = {
    STARTMODE: '_STARTMODE',                // Prompt the user to start the skill.
    ASKMODE: '_ASKMODE',                     // Alexa ask user the questions.
    ENDMODE: '_ENDMODE'
};
console.log('DEBUG: step-1 ');

var nodes = [{ "node": 1, "message": "How can I help you with the schedule?",  "yes": 2, "no":2},
// Answers & descriptions
             { "node": 2, "message": "Great. Which day would you like to schedule?", "yes": 3, "no":3},
             { "node": 3, "message": "When timeslot would you like to schedule?", "yes": 4, "no":4},
            // { "node": 4, "message": "", "yes": 5, "no":5},
             { "node": 4, "message": "Thank you", "yes": 0, "no": 0}             
];

// These are messages that Alexa says to the user during conversation
// This is the intial welcome message
var welcomeMessage = "Welcome to ScheduleIt We will set up the schedule for you.";

// This is the message that is repeated if the response to the initial welcome message is not heard
var repeatWelcomeMessage = "Say yes to ask or no to quit.";

// this is the message that is repeated if Alexa does not hear/understand the reponse to the welcome message
var promptToStartMessage = "Say yes to continue, or no to end.";

// This is the prompt during the skill when Alexa doesnt hear or understand a yes / no reply
var promptToSayYesNo = "Say yes or no to answer the question.";

// This is the response to the user after the final question when Alex decides on what group choice the user should be given
var decisionMessage = " "

// This is the prompt to ask the user if they would like to start again
var startAgainMessage = "Thank you for using ScheduleIt. Have a nice day. Goodbye!";

// this is the help message during the setup at the beginning of the scheduling
var helpMessage = "I will ask you some questions to help you with the process. Are you ready?";

// This is the goodbye message when the user has asked to quit the skill
var goodbyeMessage = "Ok, Thanks for using Schedule It!";

var speechNotFoundMessage = "Could not find speech for node";

var nodeNotFoundMessage = "In nodes array could not find node";

var loopsDetectedMessage = "A repeated path was detected on the node tree, please fix before continuing";

var utteranceTellMeMore = "tell me more";


// the first node that we will use
var START_NODE = 1;

var answer = "";
var answerQuestion;
var replyName;
var days = {"Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6};
var convertNextDate;
var nextDate;
var userName = "";
// --------------- Handlers -----------------------

// Called when the session starts.
exports.handler = function (event, context, callback) {
    console.log("Entering exports handler");
    var alexa = Alexa.handler(event, context);
    //alexa.appId = APP_ID;
    alexa.registerHandlers(newSessionHandler, startSkillHandlers, askQuestionHandlers);
    alexa.execute();
};

//Ask the first question
function askMIT(context){
    console.log("Entering askMIT");
    answer = "";

    // set state to asking questions
    context.handler.state = states.ASKMODE;

    // ask first question, the response will be handled in the askQuestionHandler
    var message = helper.getSpeechForNode(START_NODE);
    // record the node we are on
    context.attributes.currentNode = START_NODE;
    message = answer + message;
    // ask the first question 
    console.log("FIRST QUESTION: " + message);
    safeEmit2(context, ':ask', message, message);    
}
// set state to start up and  welcome the user
var newSessionHandler = { 
  'LaunchRequest': function () {
        //this.handler.state = states.STARTMODE;
        //safeEmit2(this, ':ask', welcomeMessage, repeatWelcomeMessage);
        console.log("Entering newSessionHandler LaunchRequest");
        askMIT(this);
  },'AMAZON.HelpIntent': function () {
        console.log("Entering newSessionHanlder helpIntent");
        this.handler.state = states.STARTMODE;
        safeEmit2(this, ':ask', helpMessage, helpMessage); 
  },
  'Unhandled': function () {
        console.log("Entering newSessionHanlder Unhandled");
        this.handler.state = states.STARTMODE;
        safeEmit2(this, ':ask', promptToStartMessage, promptToStartMessage); 
  }
};

// --------------- Functions that control the skill's behavior -----------------------

// Called at the start of the skill, picks and asks first question for the user
var startSkillHandlers = Alexa.CreateStateHandler(states.STARTMODE, {
    'AMAZON.YesIntent': function () {
        console.log("startSkillHandlers YesIntent");
        askMIT(this);
    },
    'AMAZON.NoIntent': function () {
        // Handle No intent.
        console.log("startSkillHandlers NoIntent");
        safeEmit(this, ':tell', goodbyeMessage);
    },
    'AMAZON.StopIntent': function () {
        safeEmit(this, ':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        safeEmit(this, ':tell', goodbyeMessage);
    },
    'AMAZON.StartOverIntent': function () {
         safeEmit2(this, ':ask', promptToStartMessage, promptToStartMessage);
    },
    'AMAZON.HelpIntent': function () {
         safeEmit2(this, ':ask', helpMessage, helpMessage);
       
    },
    'Unhandled': function () {
        console.log("startSkillHandlers Unhandled");
        safeEmit2(this, ':ask', promptToStartMessage, promptToStartMessage);
    }
});


// user will have been asked a question when this intent is called. We want to look at their yes/no
// response and then ask another question. If we have asked more than the requested number of questions Alexa will
// make a choice, inform the user and then ask if they want to start again
var askQuestionHandlers = Alexa.CreateStateHandler(states.ASKMODE, {

    'AMAZON.YesIntent': function () {
        // Handle Yes intent.
        // reset the skill state to start mode
       // this.handler.state = states.STARTMODE;
       // safeEmit2(this, ':ask', welcomeMessage, repeatWelcomeMessage);
       console.log("AskQuestionsHandler YesIntent");
    },
    'AMAZON.NoIntent': function () {
        console.log("AskQuestionsHandler NoIntent");
        // Handle No intent.
        answer = "";
        helper.yesOrNo(this, 'no');
        safeEmit(this,':tell', ':responseReady');
    },
    'AMAZON.HelpIntent': function () {
        console.log("AskQuestionsHandler HelpIntent");
        safeEmit2(this, ':ask', promptToSayYesNo, promptToSayYesNo);
    },
    'AMAZON.StopIntent': function () {
        console.log("AskQuestionsHandler StopIntent");
        safeEmit(this, ':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        console.log("AskQuestionsHandler CancelIntent");
        safeEmit(this, ':tell', goodbyeMessage);
    },
    'AMAZON.StartOverIntent': function () {
        console.log("AskQuestionsHandler StartOverIntent");
		answer = "";
        // reset the skill state to start mode
        this.handler.state = states.STARTMODE;
        safeEmit2(this, ':ask', welcomeMessage, repeatWelcomeMessage);
    }, //This will pass query values and make a call to function to retrieve available slots on two users' calendars
    'FindScheduleItIntent': function () {
            console.log("AskQuestionsHandler FindScheduleItIntent");
            var intent = this.event.request.intent;

            var replyDay = this.event.request.intent.slots.day.value;
            var replyWindow = this.event.request.intent.slots.window.value;	
            var replyDuration = this.event.request.intent.slots.number.value;
    
            console.log("DEBUG: ScheduleItIntent: "+"replyName "+replyName+" and replyDay: "+ replyDay + " and replyDuration: "+ replyDuration);
            var currentQuestion = helper.getSpeechForNode(this.attributes.currentNode);

            if (replyName == null){
                replyName = this.event.request.intent.slots.name.value;	
            }

            captureThis = this;

            if (replyWindow != null){
                console.log("DEBUG: About to make calendar api call")
                answer = "Making API Call";
                queryCalendarApi(function (response) {
                    console.log("DEBUG calendar call: String" + JSON.stringify(response));
                    console.log("DEBUG calendar call: Object" + response.readout);
                               
                    //var modReply = response.readout.substr(0, 60);
                
                    //console.log("DEBUG calendar call: ModReply" + modReply);
                    answer = "The calender returns the following time: "+ response.readout + ".\n";
                    //answerQuestion = response;
                    console.log("DEBUG: Now call yes or no with no");
                    helper.yesOrNo(captureThis, 'no');
                }, replyName, replyDay, replyWindow, replyDuration);
      
            }else if (replyName != null){
                console.log("DEBUG: Now call yes or no with no");
                helper.yesOrNo(captureThis, 'no');
            }else{
                console.log("HM... my reply was: " + replyName + "... I dont know how to handle");
                helper.handleUnknown(this);
                return;
            }
    },//This will pass query values and make a call to function to add a calendar event
    'AddScheduleItIntent': function () {
        console.log("AskQuestionsHandler FindScheduleItIntent");
        var intent = this.event.request.intent;
        var replyDay = this.event.request.intent.slots.day.value;
        var replyStartTime = this.event.request.intent.slots.starttime.value;	
        var replyEndTime = this.event.request.intent.slots.endtime.value;
        var currentQuestion = helper.getSpeechForNode(this.attributes.currentNode);

        captureThis = this;

        if (replyDay != null && replyStartTime != null){
            console.log("DEBUG: About to make calendar api call")
            answer = "Making API Call";
            addCalendarApi(function (response) {
                console.log("DEBUG calendar call: " + response);
 
                answer = " "+ response.readout + ".\n";
                //answerQuestion = response;
                // Temporary hack to go to next question
                console.log("DEBUG: Now call yes or no with no");
                helper.yesOrNo(captureThis, 'no');
            }, replyDay, replyStartTime, replyEndTime);
  
        }
        else {
            console.log("HM... my reply was: " + replyDay + "... I dont know how to handle");
            helper.handleUnknown(this);
            return;
        }
},
    'Unhandled': function () {
        console.log("AskQuestionsHandler Unhandled");
		helper.handleUnknown(this);
    }
});



// --------------- Helper Functions  -----------------------
function nextDay(x){
    var now = new Date();    
    now.setDate(now.getDate() + (x+(7-now.getDay())) % 7);
    return now;
}

//Retrieve timeslots available on both users calendar
function queryCalendarApi(callbackFunc, replyName, replyDay, replyWindow, replyDuration) {
    console.log("I enter querCalendarApi with reply value: "+ replyName + " and " + replyDay + " and " + replyWindow + " and " + replyDuration );

    var querystring = require('querystring');

    //var data = querystring.stringify({users: ['lwin', 'tyler'], window: replyWindow, length: replyDuration, dateRange: {start: "2017-11-30T09:00:00", end: "2017-11-30T09:00:00"}, dateStart: "2017-11-30T09:00:00"});
    
    nextDate = nextDay(days[replyDay]);
    convertNextDate = nextDate.toISOString().slice(0, -5)
    console.log("Date returned for "+ replyDay + " :"+ convertNextDate);
    var data = querystring.stringify(
        {
        users: [userName, replyName], 
        window: replyWindow, 
        length: replyDuration,
        dateStart: convertNextDate 
        });
    
    console.log("MY DATA TO SEND: " + data);
    var options = {
        host: 'latchapartments.com',
        //host: '192.54.222.4',
        port: 8080,
        path: '/findFreeTime',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    var body = '';
	var req = http.request(options, function(res) {
	  res.on("data", function(chunk) {
		  body += chunk;
	  });
	  res.on('end', function(){
        console.log("CALENDAR: " + JSON.parse(body));
        callbackFunc(JSON.parse(body));
	  });
	}).on('error', function(e) 
	    {
		    console.log("Got error in http fetch: " + e.message);
		}
    );
    req.write(data);
    req.end();
}

//Add a calendar event and update the meeting invite
function addCalendarApi(callbackFunc, replyDay, replyStartTime, replyEndTime) {
    console.log("I enter addCalendarApi with reply values: "+ replyDay + "," + replyStartTime + " and "+ replyEndTime);

    var querystring = require('querystring');
    
    // Request: { users: [user1, user2, etc...], eventStart: <'yyyy-mm-ddThh:mm:ss'>, eventEnd: <'yyyy-mm-ddThh:mm:ss'>, summary:<optional: string>, recur: <[MO,TU,WE,TH,FR]>} 
    // Response: { outcome: <string: success or failure>, readout: <string response> }

    nextDate = nextDay(days[replyDay]);
    nextDate.setMinutes(0);
    nextDate.setSeconds(0);
    nextDate.setHours(replyStartTime.substring(0,2));
    console.log("Date returned for startTime "+ replyStartTime + " :"+ nextDate);
    //var startTime = nextDate.toISOString().slice(0, -5);
    var startTime = nextDate.toISOString();
    console.log("Date returned for startTime "+ replyStartTime + " :"+ startTime);

    nextDate.setHours(replyEndTime.substring(0,2));
    console.log("Date returned for startTime "+ replyStartTime + " :"+ nextDate);
    //var endTime = nextDate.toISOString().slice(0, -5);
    var endTime = nextDate.toISOString();
    console.log("Date returned for startTime "+ replyEndTime + " :"+ endTime);

    var data = querystring.stringify(
        {
            users: [userName, replyName], 
            eventStart: startTime,
            eventEnd:  endTime,
            summary: "Meeting with "+ replyName
                    
        })

    console.log("MY DATA TO SEND: " + data);
    var options = {
        host: 'latchapartments.com',
        //host: '192.54.222.4',
        port: 8080,
        path: '/addEvent',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    var body = '';
	var req = http.request(options, function(res) {
	  res.on("data", function(chunk) {
		  body += chunk;
	  });
	  res.on('end', function(){
        //var myResponse = JSON.parse(body);
        //response(myResponse);
        console.log("CALENDAR: " + JSON.stringify(body));
        callbackFunc(JSON.parse(body));
	  });
	}).on('error', function(e) 
	    {
		    console.log("Got error in http fetch: " + e.message);
		}
    );
    req.write(data);
    req.end();
}


function safeEmit(context, emitType, response){
    var myResponse = response.replace("&", "and");
    context.emit(emitType, myResponse, myResponse);
}

function safeEmit2(context, emitType, response, otherRespone){
    var myResponse = response.replace("&", "and");
    var myOtherRespone = otherRespone.replace("&", "and");
    context.emit(emitType, myResponse, myOtherRespone);
}

var helper = {

    handleUnknown: function (context) {
		console.log("DEBUG: UNKNOWN Answer");
		var message = "I'm sorry I do not recognize this answer. Please try again. " + helper.getSpeechForNode(context.attributes.currentNode);	
		console.log("DEBUG: UNKNOWN - asking " + message);
		safeEmit2(context, ':ask', message, message);
	},

    // logic to provide the responses to the yes or no responses to the main questions
    yesOrNo: function (context, reply) {
        console.log("GOT TO: YES OR NO");
        // this is a question node so we need to see if the user picked yes or no
        var nextNodeId = helper.getNextNode(context.attributes.currentNode, reply);
		console.log("GOT TO: YES OR NO: My nextNodeId is: " + nextNodeId);
        // error in node data
        if (nextNodeId == -1)
        {
            context.handler.state = states.STARTMODE;

            // the current node was not found in the nodes array
            // this is due to the current node in the nodes array having a yes / no node id for a node that does not exist
            console.log("GOT TO: YES OR NO: I was -1. nodeNotFound..");
            safeEmit2(context, ':tell', nodeNotFoundMessage, nodeNotFoundMessage);
        }

        // get the speech for the child node
        var message = helper.getSpeechForNode(nextNodeId);
        console.log("GOT TO: YES OR NO: answer: " + answer);
        message = answer + " " + helper.getSpeechForNode(nextNodeId);
        console.log("GOT TO: YES OR NO: mesage: " + message);
        // have we made a decision
        if (helper.isAnswerNode(nextNodeId) === true) {
            console.log("GOT TO: YES OR NO: Decision was made");

            context.handler.state = states.ENDMODE;
			
            // append the start again prompt to the decision and speak it
            message = answer + ' ' + startAgainMessage;
            safeEmit(context, ':tell', message);
			return;
        }

        // set the current node to next node we want to go to
        context.attributes.currentNode = nextNodeId;
        console.log("GOT TO: YES OR NO: About to ask: " + message);
        safeEmit(context, ':ask', message);
    },

    // returns the speech for the provided node id
    getSpeechForNode: function (nodeId) {

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].node == nodeId) {
                return nodes[i].message;
            }
        }
        return speechNotFoundMessage + nodeId;
    },

    // checks to see if this node is an choice node or a decision node
    isAnswerNode: function (nodeId) {

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].node == nodeId) {
                if (nodes[i].yes === 0 && nodes[i].no === 0) {
                    return true;
                }
            }
        }
        return false;
    },

    // gets the next node to traverse to based on the yes no response
    getNextNode: function (nodeId, yesNo) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].node == nodeId) {
                if (yesNo == "yes") {
                    return nodes[i].yes;
                }
                return nodes[i].no;
            }
        }
        // error condition, didnt find a matching node id. Cause will be a yes / no entry in the array but with no corrosponding array entry
        return -1;
    },
};