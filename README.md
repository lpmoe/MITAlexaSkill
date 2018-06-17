# MITAlexaSkill


Alexa MIT Skill Version 1.0

This skill will allow a user to retrieve MIT courses information using the course number. The user can find out course title, course description and course instructor. It will also allow the user to add the course to the calendar.

Alexa Lambda Service
Alexa service will goes through the questions and answers nodes.
function askMIT			- Ask the first question
function newSessionHandler  	- set state to start up and  welcome the user
function startSkillHandlers 	- Call at the start of the skill, picks and ask first question for the user
askQuestionHandlers    		- user will have been asked a question when this intent is called. We want to look at their yes/no

GetMITCourseIntent     		- This function will give information on the MIT courses
function QueryMitApi   		- Make https call to get MIT course information

ScheduleCourseIntent   		- This function will add MIT course to the schedule
function queryCalendarApi  	- Make http call to add to calenda


MIT API Request
https://mit-public.cloudhub.io/coursecatalog/v2
Request Object - /terms/{term}/subjects/{subjectId} - See MIT doc
Response Object - See MIT doc

Google Calendar API Add Request
http://latchapartments.com:8080/AddEvent
Request: { users: [user1, user2, etc...], eventStart: <'yyyy-mm-ddThh:mm:ss'>, eventEnd: <'yyyy-mm-ddThh:mm:ss'>, summary:<optional: string>, recur: <[MO,TU,WE,TH,FR]>} 

Response: { outcome: <string: success or failure>, readout: <string response> }


Alexa Client
GetMITCourseIntent = User Utterances and valid slot values to retrieve MIT courses
ScheduleCourseIntent = User Utterances and valid slot values to add MIT cousrse schedule to the calendar


Alexa ScheduleIt Skill Version 1.0
This skill will allow a user to schedule a meeting with a friend who is in their contact list and who has previously given an access to his/her calendar. 

Alexa Lambda Service
FindScheduleItIntent   		- This will pass query values and make a call to function to retrieve available slots on two users' calendars
function queryCalendarApi  	- Retrieve timeslots available on both users calendar
AddScheduleItIntent       	- This will pass query values and make a call to function to add a calendar event
function addCalendarApi   	- Add a calendar event and update the meeting invite

Google Calendar API Retrieve Available Timeslots Request
http://latchapartments.com:8080/findFreeTime
Request Object
'{"users":["tyler","lwin"],"window":"wake","dateStart":"2017-12-05T12:30:00"}' 
Response Object
{"freeTimes":[{"start":"2017-12-05T08:00:00.000Z","end":"2017-12-05T13:00:00.000Z"},{"start":"2017-12-05T18:30:00.000Z","end":"2017-12-05T22:00:00.000Z"}],"readout":"you are both free on Tuesday from eight AM to one PM or from six thirty PM to ten PM "}


Google Calendar API Add to the Calendar Request
http://latchapartments.com:8080/AddEvent
Request: { users: [user1, user2, etc...], eventStart: <'yyyy-mm-ddThh:mm:ss'>, eventEnd: <'yyyy-mm-ddThh:mm:ss'>, summary:<optional: string>, recur: <[MO,TU,WE,TH,FR]>} 
   
Response: { outcome: <string: success or failure>, readout: <string response> }


Alexa Client
FindScheduleItIntent = User Utterances and valid slot values to retrieve available slots on users' calendars
AddScheduleItIntent = User Utterances and valid slot values to add a meeting on users' calendars
