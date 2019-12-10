const express = require('express');

//moment timezone stuff
let mo = require('moment');
let moment = require('moment-timezone');

//iCal generator - npm ics
const fs = require('fs')
const ics = require('ics');

//generate calendar url npm
const cal = require('generate-calendar-url');

//express stuff
const app = express();
let handlebars = require('express-handlebars').create({ defaultLayout: 'main' });

let zip = require('express-zip');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 5555);
app.use(express.static('public'));

//load ical page
app.get('/', function (req, res) {
  res.render('home');
});

//ical ics & google cal form submission
app.post('/', function (req, res) { 

  //set locals to form body data for error handling
  res.locals.body = req.body;

  // get timezone from form
  let timeZone = req.body.timeZone;

  //make sure user fills out drop down data -> return error message
  if (timeZone === 'selectTimeZone') {
    res.locals.err = 'Error - please choose a time zone';
    return renderICal(res);
  }
  if (req.body.startDay === 'selectStartDay') {
    res.locals.err = 'Error - please choose a start day';
    return renderICal(res);
  }
  if (req.body.startMonth === 'selectStartMonth') {
    res.locals.err = 'Error - please choose a start month';
    return renderICal(res);
  }
  if (req.body.startYear === 'selectStartYear') {
    res.locals.err = 'Error - please choose a start year';
    return renderICal(res);
  }
  if (req.body.startHour === 'selectStartHour') {
    res.locals.err = 'Error - please choose a start hour';
    return renderICal(res);
  }
  if (req.body.startMinutes === 'selectStartMinutes') {
    res.locals.err = 'Error - please choose start minutes';
    return renderICal(res);
  }
  if (req.body.endDay === 'selectEndDay') {
    res.locals.err = 'Error - please choose an end day';
    return renderICal(res);
  }
  if (req.body.endMonth === 'selectEndMonth') {
    res.locals.err = 'Error - please choose an end month';
    return renderICal(res);
  }
  if (req.body.endYear === 'selectEndYear') {
    res.locals.err = 'Error - please choose an end year';
    return renderICal(res);
  }
  if (req.body.endHour === 'selectEndHour') {
    res.locals.err = 'Error - please choose an end hour';
    return renderICal(res);
  }
  if (req.body.endMinutes === 'selectEndMinutes') {
    res.locals.err = 'Error - please choose end minutes';
    return renderICal(res);
  }
  
 
  //set up trigger
  let alarms = [];
  alarms.push({
    action: 'display',
    trigger: { minutes: req.body.trigger, before: true },
  });

  //get start/end date & time with timezone -> convert to utc & format for input into ical generator
  let startDate = moment.tz(req.body.startYear + '-' + req.body.startMonth + '-' + req.body.startDay + 'T' + req.body.startHour + ':' + req.body.startMinutes, timeZone).utc().format('YYYY-MM-DD-HH-mm').split('-');

  let endDate = moment.tz(req.body.endYear + '-' + req.body.endMonth + '-' + req.body.endDay + 'T' + req.body.endHour + ':' + req.body.endMinutes, timeZone).utc().format('YYYY-MM-DD-HH-mm').split('-');

  //make sure dates are valid
  if (!moment(startDate, 'YYYY-MM-DD-HH-mm').isValid()) {
    res.locals.err = 'Error - the start date you chose does not exist';
    return renderICal(res);
  }
  if (!moment(endDate, 'YYYY-MM-DD-HH-mm').isValid()) {
    res.locals.err = 'Error - the end date you chose does not exist';
    return renderICal(res);
  }

  //if start end date is before start date throw error
  if (moment(endDate).isBefore(startDate)) {
    //throw error
    res.locals.err = 'Error - end date is before start date';
    return renderICal(res);
  }

  //get current day w/ timezone to check against start date
  let today = moment.tz(timeZone).format('YYYY-MM-DD-HH-mm').split('-');
  
  //check that start date is not in the past
  if (moment(startDate).isBefore(today)) {
    //throw error
    res.locals.err = 'Error - start date is in the past';
    return renderICal(res);
  }

  const event = {
    start: startDate,
    end: endDate,
    productId: 'ics generator',
    title: req.body.eventName,
    description: req.body.eventDescription,
    location: req.body.location,
    alarms: alarms
  }

  //create filenames from eventID
  let icsFileName = req.body.eventID + ".ics";
  let vcsFileName = req.body.eventID + ".vcs";

  ics.createEvent(event, (error, value) => {
    if (error) {
      console.log(error);
    } else {
      //write ics & vcs files to server
      fs.writeFile(icsFileName, value, (icsErr) => {
        if (icsErr) {
          return renderICal(res);
        }
      });
      fs.writeFile(vcsFileName, value, (vcsErr) => {
        if (vcsErr) {
          return renderICal(res);
        }
      });
    }
  });

  //format start & end dates for google url gen
  let googleStart = moment(event.start, 'YYYY-MM-DD-HH-mm').format();
  let googleEnd = moment(event.end, 'YYYY-MM-DD-HH-mm').format();

  let e = {
    title: req.body.eventName,
    start: new Date(googleStart),
    end: new Date(googleEnd),
    location: req.body.location,
    description: req.body.eventDescription
  }

  //create google cal text file
  let googleCalFileName = req.body.eventID + "-google-cal.txt";
  fs.writeFile(googleCalFileName, cal.google(e), (googleCalErr) => {
    if (googleCalErr) {
      return renderICal(res);
    }
  });

  //zip up files & download to client
  res.zip([
    { path: icsFileName, name: icsFileName },
    { path: vcsFileName, name: vcsFileName },
    { path: googleCalFileName, name: googleCalFileName }
  ], req.body.eventID + '-ical.zip', (zipErr) => {
    //delete files from server
    fs.unlink(icsFileName, (icsUnlinkErr) => {
      if (icsUnlinkErr) {
        console.log(icsUnlinkErr);
      }
    });
    fs.unlink(vcsFileName, (vcsUnlinkErr) => {
      if (vcsUnlinkErr) {
        console.log(vcsUnlinkErr);
      }
    });
    fs.unlink(googleCalFileName, (googleUnlinkErr) => {
      if (googleUnlinkErr) {
        console.log(googleUnlinkErr);
      }
    });
    if (zipErr) {
      return renderICal(res);
    };
  });
});

function renderICal(res) {
  res.render('home', res.locals);
}


app.use(function (req, res) {
  res.status(404);
  res.render('404');
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.type('plain/text');
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function () {
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
