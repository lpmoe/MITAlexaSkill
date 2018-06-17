/**
 * This skill gives information on MIT courses and allow a user to schedule a class on the Google calendar.
 */

var https = require('https');
var http = require('http');
const APP_ID = "askMIT"; 
var Alexa = require('alexa-sdk');

var states = {
    STARTMODE: '_STARTMODE',                // Prompt the user to start the skill.
    ASKMODE: '_ASKMODE',                     // Alexa is asking user the questions.
    ENDMODE: '_ENDMODE'
};
console.log('DEBUG: step-1 ');
var nodes = [{ "node": 1, "message": "What course would you like to know more information about?",  "yes": 2, "no":2},
// Answers & descriptions
             { "node": 2, "message": " .\n Would you like to find out more? Say description, instructor or units", "yes": 3, "no":3},
             { "node": 3, "message": " .\n Would you like to find out more? Say description, instructor or units", "yes": 4, "no":4},
             { "node": 4, "message": " .\n Would you like to add to your calendar? Say add to the calendar", "yes": 5, "no":5},
             { "node": 5, "message": ".\n ", "yes": 0, "no": 0}             
];

// These are messages that Alexa says to the user during conversation
// This is the intial welcome message
var welcomeMessage = "Welcom to MIT. What would you like to ask?";

// This is the message that is repeated if the response to the initial welcome message is not heard
var repeatWelcomeMessage = "Say yes to ask or no to quit.";

// this is the message that is repeated if Alexa does not hear/understand the reponse to the welcome message
var promptToStartMessage = "Say yes to continue, or no to end.";

// This is the prompt during the skill when Alexa doesnt hear or understand a yes / no reply
var promptToSayYesNo = "Say yes or no to answer the question.";

// This is the response to the user after the final question when Alex decides on what group choice the user should be given
var decisionMessage = " "

// This is the prompt to ask the user if they would like to start again
var startAgainMessage = "Thank you for checking with M I T. Goodbye!";

// this is the help message during the setup at the beginning of the skill
var helpMessage = "I will ask you some questions that will identify what you would be best at. Want to start now?";

// This is the goodbye message when the user has asked to quit the skill
var goodbyeMessage = "Ok, thanks for checking with M I T!";

var speechNotFoundMessage = "Could not find speech for node";

var nodeNotFoundMessage = "In nodes array could not find node";

var loopsDetectedMessage = "A repeated path was detected on the node tree, please fix before continuing";

var utteranceTellMeMore = "tell me more";


// the first node that we will use
var START_NODE = 1;
var answer = "";
var answerQuestion;
var userName = "";
// --------------- Handlers -----------------------

// Called when the session starts.
exports.handler = function (event, context, callback) {
    console.log("Entering exports handler L1");
    var alexa = Alexa.handler(event, context);
    //alexa.appId = APP_ID;
    alexa.registerHandlers(newSessionHandler, startSkillHandlers, askQuestionHandlers);
    alexa.execute();
};

function askMIT(context){
    console.log("Entering exports handler L2");
    answer = "";

    // set state to asking questions
    context.handler.state = states.ASKMODE;

    // ask first question, the response will be handled in the askQuestionHandler
    var message = helper.getSpeechForNode(START_NODE);
    // record the node we are on
    context.attributes.currentNode = START_NODE;
    message = answer + message;
    // ask the first question
    safeEmit2(context, ':ask', message, message);    
}
// set state to start up and  welcome the user
var newSessionHandler = { 
  'LaunchRequest': function () {
        //this.handler.state = states.STARTMODE;
        //safeEmit2(this, ':ask', welcomeMessage, repeatWelcomeMessage);
        console.log("NEW SESSION HANDLER: Launch Request");
        askMIT(this);
  },'AMAZON.HelpIntent': function () {
        console.log("Entering exports handler L3");
        this.handler.state = states.STARTMODE;
        safeEmit2(this, ':ask', helpMessage, helpMessage); 
  },
  'Unhandled': function () {
        console.log("Entering exports handler L4");
        this.handler.state = states.STARTMODE;
        safeEmit2(this, ':ask', promptToStartMessage, promptToStartMessage); 
  }
};

// --------------- Functions that control the skill's behavior -----------------------

// Called at the start of the skill, picks and asks first question for the user
var startSkillHandlers = Alexa.CreateStateHandler(states.STARTMODE, {
    'AMAZON.YesIntent': function () {
        console.log("START skill HANDLERS: YES INTENT");
        askMIT(this);
    },
    'AMAZON.NoIntent': function () {
        // Handle No intent.
        console.log("Entering exports handler L6");
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
        console.log("Entering exports handler L7");
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
       console.log("ASK Question Handlers: YES INTENT - Bad");
    },
    'AMAZON.NoIntent': function () {
        console.log("ASK Question Handlers: No INTENT");
        // Handle No intent.
        answer = "";
        helper.yesOrNo(this, 'no');
        safeEmit(this,':tell', ':responseReady');
    },
    'AMAZON.HelpIntent': function () {
        console.log("ASK Question Handlers: Help Intent");
        safeEmit2(this, ':ask', promptToSayYesNo, promptToSayYesNo);
    },
    'AMAZON.StopIntent': function () {
        console.log("ASK Question Handlers: Stop INTENT");
        safeEmit(this, ':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        console.log("ASK Question Handlers: Cancel INTENT");
        safeEmit(this, ':tell', goodbyeMessage);
    },
    'AMAZON.StartOverIntent': function () {
        console.log("ASK Question Handlers: StartOver INTENT");
		answer = "";
        // reset the skill state to start mode
        this.handler.state = states.STARTMODE;
        safeEmit2(this, ':ask', welcomeMessage, repeatWelcomeMessage);
    },//  This function will give information on the MIT courses
	'GetMITCourseIntent': function () {
        console.log("ASK Question Handlers: GetMITCourseIntent INTENT");
		var intent = this.event.request.intent;
        var reply = this.event.request.intent.slots.courseid.value;	
        var replyWord = this.event.request.intent.slots.word.value;

        //console.log(this.event.request.intent.slots.courseid.value);
        var currentQuestion = helper.getSpeechForNode(this.attributes.currentNode);
        console.log('DEBUG: getMITCourseIntent replyWord: ' + replyWord);
        console.log('DEBUG: getMITCourseIntent reply: ' + reply);
		console.log('DEBUG: currentQuestion: ' + currentQuestion);
        captureThis = this;
        
        if (answerQuestion != null) {
            if (replyWord == "description"){
                answer = answerQuestion.item.description;
                helper.yesOrNo(captureThis, 'no');
            }else if (replyWord == "instructor"){
                answer = answerQuestion.item.instructors;
                helper.yesOrNo(captureThis, 'no');
            }else if (replyWord == "units"){
                answer = answerQuestion.item.units;
                helper.yesOrNo(captureThis, 'no');
            }
        }

		if (reply != null){
			console.log("DEBUG: About to make mit api call")
			answer = "Making API Call";
			queryMitApi(function (response) {
				console.log("DEBUG mit call: " + JSON.stringify(response));
                answer = response.item.title;
                answerQuestion = response;
                console.log("DEBUG: Have MIT call. Now call yes or no with no");
                helper.yesOrNo(captureThis, 'no');
            }, reply);
  
        }
        },//this function will add MIT course to the schedule
        'ScheduleCourseIntent': function () {
            console.log("ASK Question Handlers: ScheduleCourseIntent INTENT");
            var intent = this.event.request.intent;
            var reply = this.event.request.intent.slots.action.value;	
    
            console.log(" " + reply);
            var currentQuestion = helper.getSpeechForNode(this.attributes.currentNode);

            captureThis = this;

            if (reply == "add"){
                console.log("DEBUG: About to make calendar api call")
                answer = "Making API Call";
                queryCalendarApi(function (response) {
                    console.log("DEBUG mit call:\n" + JSON.stringify(response));
                    answer = "  "  + response.readout + ".\n";
                    //answerQuestion = response;
                    // Temporary hack to go to next question
                    console.log("DEBUG: Have MIT schedule added. " + answer );
                    helper.yesOrNo(captureThis, 'no');
                }, reply);
      
            }
		else {
			console.log("HM... my reply was: " + reply + "... I dont know how to handle");
			helper.handleUnknown(this);
			return;
		}
	},
    'Unhandled': function () {
		helper.handleUnknown(this);
    }
});



// --------------- Helper Functions  -----------------------
//Make https call to get MIT course information
function queryMitApi(callbackFunc, reply) {
    console.log("I enter queryMitApi with reply value: "+ reply + ".");
    var modReply = reply;
    //string manipulation needed to pass valid courseID
    if (reply.length== 4){
        modReply = reply.substr(0, 1);
        modReply = modReply + ".";
        modReply = modReply + reply.substr(1,3);
        reply = modReply;
    }else if (reply.length ==5){
        modReply = reply.substr(0, 2);
        modReply = modReply + ".";
        modReply = modReply + reply.substr(2,4);
        reply = modReply;
    }

    console.log("The modified reply is: "+ modReply + ".");

	var options = {
        host: "mit-public.cloudhub.io",
        path: '/coursecatalog/v2/terms/2017FA/subjects/'+reply,
        method: 'GET',
        headers : {
            "client_id" : "CLIENT_ID",
            "client_secret" : "CLIENT_SECRET"
		}
	};

	var body = '';
	https.get(options, function(res) {
	  console.log("Response: " + res.statusCode);
	  res.on("data", function(chunk) {
		  body += chunk;
	  });
	  res.on('end', function(){
        var myResponse = JSON.parse(body);
        callbackFunc(myResponse);
	  });
	}).on('error', function(e) 
	    {
		    console.log("Got error in https fetch: " + e.message);
		}
	);
}

//Make http call to add to calendar
function queryCalendarApi(callbackFunc, reply) {
    console.log("I enter querCalendarApi with reply value: "+ reply + ".");

    var querystring = require('querystring');
    
    // Request: { users: [user1, user2, etc...], eventStart: <'yyyy-mm-ddThh:mm:ss'>, eventEnd: <'yyyy-mm-ddThh:mm:ss'>, summary:<optional: string>, recur: <[MO,TU,WE,TH,FR]>} 
    // Response: { outcome: <string: success or failure>, readout: <string response> }

    var data = querystring.stringify(
        {
            users: userName, 
            eventStart:  "2017-12-20T10:00:00", 
            eventEnd:    "2017-12-20T11:30:00",
            summary: "MIT Course: "+ answerQuestion.item.title
            //recur: ["TH"]
        })

    console.log("MY DATA TO SEND: " + data);
    var options = {
        host: 'latchapartments.com',
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
		    console.log("Got error in https fetch: " + e.message);
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