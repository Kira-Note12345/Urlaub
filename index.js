'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').DialogflowApp;
const functions = require('firebase-functions');

// the action name from the Dialogflow intent
const SAY_ACTION = 'say_name';
const SPECIFIC_DATE_ACTION = 'say_specific_date';
const APPOINTMENT_ACTION = 'make_appointment';
const APPOINTMENT_CONFIRMATION_ACTION = 'appointment_confirmation';
const SAY_ALL_ACTION = 'say_all'; 
const SAY_WHICH_APPOINTMENT_ACTION = 'say_which_appointment';
const SAY_SPECIFIC_DATE_CUSTOM_ACION = 'say_specific_date_custom';
const MAKE_HAIR_STYLE_ACTION = 'make-hair-style';
const MAKE_HAIR_STYLE_FALLBACK_ACTION = 'make-hair-style.make-hair-style-fallback';
const SAY_SPECIFIC_DATE_FALLBACK_ACTION = 'say_specific_date.say_specific_date-fallback';
const SAY_SPECIFIC_DATE_TIME_ACTION = 'say_specific_date.say_specific_date-time';
const DEFULT_FALLBACL_ACTION = 'input.unknown';
const SAY_NAME_YES_ACTION = 'say_name.say_name-yes';
const SAY_NAME_NO_ACTION = 'say_name.say_name-no';
const NEGATION_DATE_ACTION = 'negation-date';
const NEGATION_DATE_YES_ACTION = 'negation-date.negation-date-yes';
const SAY_TIME_ACTION = 'say_time';
const SAY_TIME_DATE_TIME_ACTION = 'say_specific_date.say_specific_date-time_yes';
const SAY_TIME_WITH_LANGUAGE_ACTION = 'say_specific_date.say_specific_date-say_with_language';
const DATE_PERIOD_ACTION = 'date-period';
const MORE_DATES_ACTION = 'say_date_period.say_date_period-more-dates';
const NOT_THIS_DATE_ACTION = 'say_specific_date.say_specific_date-no';
const SAY_DATE_YES_ACTION = 'say_specific_date.say_specific_date-yes';
const SAY_DAYTIME_ACTION = 'say_daytime';
const SAY_DAYTIME_YES_ACTION = 'say_daytime.say_daytime-yes';
const MORE_DATE_TIME_ACTION = 'say_daytime.say_daytime-more-dates';
const FUNNY_ANSWER_ACTION = 'funny-answer';

// the parameters that are parsed from the intent 
const SPECIFIC_DATE_ARGUMENT = 'specific-date';
const GIVEN_NAME_ARGUMENT = 'given-name';
const PHONE_NUMBER_ARGUMENT = 'phone-number';
const HAIR_STYLIST_ARGUMENT = 'hair-stylist';
const BARBER_OFFER_ARGUMENT = 'barber-offer';
const TIME_OF_DAY_AURGUMENT = 'givenTime';
const NOT_THAT_DATE_ARGUMENT = 'not-that-date'; 
const NOT_ARGUMENT = 'Nicht'; 
const NUMBER_ARGUMENT = 'Nummerierung';
const DATE_PERIOD_ARGUMENT = 'date-period';
const DAY_TIME_ARGUMENT = 'Tageszeit';
const WHAT_TO_DO_ARGUMENT = 'Friseurangebot';
const LENGTH_OF_HAIR_ARGUMENT = 'Haarlaenge';

const i18n = require('i18n');
const moment = require('moment');
var counterActionFurtherInquiries = 0;
var counterLengthFurtherInquiries = 0;
var counterDateCommit = 0;
var counterClockCommit = 0;
var funnyanswer =  false; 

// There is an empty appointment, this will be filled with user data. This is the creation of a general class
function NewAppointment(freeDate, timeOfDay, hairStylist, whatToDo, customerName, lengthOfHair) {
  this.freeDate = freeDate;
  this.timeOfDay = timeOfDay;
  this.hairStylist = hairStylist;
  this.whatToDo = whatToDo;
  this.customerName = customerName;
  this.lengthOfHair = lengthOfHair;
}

// The object newAppointment represents the empty appointment for the user.
var newAppointment = new NewAppointment();

exports.sillyNameMaker = functions.https.onRequest((request, response) => {

  const app = new App({request, response});

  // auxiliary function: date will be formated to show it well.
  function formatDate(date) {
    var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return[day, month, year].join('.');
  }

  // auxiliary function: date will b formated to calculate with it well.
  function formatDate2(date) {
    var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return d;
  }

  // calculate days between: 0 means no day in beetween. >0 are past days. <0 are future days
  Date.daysBetween = function( date1, date2 ) {
    // Get 1 day in milliseconds
    var one_day=1000*60*60*24;
    
    // Convert both dates to milliseconds
    var date1_ms = date1.getTime();
    var date2_ms = date2.getTime();

    // Calculate the difference in milliseconds
    var difference_ms = date2_ms - date1_ms;
    
    // Convert back to days and return
    return Math.round(difference_ms/one_day); 
  }

  // get a random int value beetween the min and max value
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function getDayName(dateLocal) {
    var days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    var dayName = days[dateLocal.getDay()];
    return dayName;
  }

  function makeRandomDates(randomDatesLocal, datesLocal) {
    var randomValue = 0;
    for ( var i = 0; i < 3; i++){
      randomValue = getRandomInt(0, (datesLocal.length - 1)); 
          randomDatesLocal.push(datesLocal[randomValue]);
          datesLocal.splice(randomValue, 1);
      }
      
    var randomAndOtherDates = [randomDatesLocal, datesLocal];  
    return (randomAndOtherDates);
  }

  function giveAnswers(app, dates, dateMin, dateMax, differentAppointment) {
    if(dates.length > 0 ){
      newAppointment.setfreeDate(dates);
      if(dates.length === 1) {
        newAppointment.setTimeOfDay(dates[0].timeOfDay);
        newAppointment.setHairStylist(dates[0].hairStylist);
        newAppointment.setfreeDate(dates[0].freeDate);
        counterDateCommit = 1;
        if(dateMin != 0) {
          app.ask('Wir hätten in der Woche vom ' + formatDate(dateMin) + ' zum ' + formatDate(dateMax) + ' am ' + dates[0].freeDate +  ' um ' + dates[0].timeOfDay + ' Uhr einen Termin frei. Würde einer dieser Termine für dich passen?');
          } else {
            counterDateCommit = 1;
            app.ask('Wir hätte im gleichen Zeitraum ' + ' am ' + dates[0].freeDate +  ' um ' + dates[0].timeOfDay + ' Uhr einen Termin frei. Würde einer dieser Termine für dich passen?');
          }
      } else if(dates.length > 1 && dates.length < 4 ) {
          var allDates = " am " + getDayName(dates[0].freeDate) + " um " + dates[0].timeOfDay;
          for(var i = 1; i < dates.length; i++) {
            allDates += ' und am ';
            allDates += getDayName(dates[i].freeDate);
            allDates += ' um ';
            allDates += dates[i].timeOfDay;
          }

          newAppointment.setfreeDate(dates);
          if(dateMin != 0) {
            counterDateCommit = 1;
            app.ask('Wir hätten in der Woche vom ' + formatDate(dateMin) + ' zum ' + formatDate(dateMax) + allDates + ' Uhr Termine frei. Würde einer dieser Termine für dich passen?');
          } else {
              counterDateCommit = 1;
              app.ask('Wir hätte im gleichen Zeitraum ' + allDates + ' Uhr Termine frei. Würde einer dieser Termine für dich passen?');
          }

          } else if(dates.length > 3) {
              var randomDates = [];

            // show 3 random dates to the user
            // function give an array with three random dates of the given time period back
            var values = makeRandomDates(randomDates, dates);
            randomDates = values[0];

            var allDates = " am " + getDayName(randomDates[0].freeDate) + " um " + randomDates[0].timeOfDay;
            for(var i = 1; i < randomDates.length; i++) {
              allDates += ' und am ';
              allDates += getDayName(randomDates[i].freeDate);
              allDates += ' um ';
              allDates += randomDates[i].timeOfDay;
            }

            newAppointment.freeDate = values;
            app.ask('Wir hätten in der Woche vom ' + formatDate(dateMin) + ' zum ' + formatDate(dateMax) + allDates + ' Uhr Termine frei. Würde einer dieser Termine für dich passen oder soll ich dir weitere in diesem Zeitraum vorschlagen?');
          }
      } else if (dates.length === 0) {
          if(differentAppointment.length > 1) {
            var randomValue = getRandomInt(0, (differentAppointment.length - 1));
          } else {
            app.ask('Wir sind leider ausgebucht und können keine Termine anbieten. Auf Wiedersehen.');
        }
        newAppointment.setfreeDate(differentAppointment[randomValue].freeDate);
        newAppointment.setHairStylist(differentAppointment[randomValue].hairStylist);
        newAppointment.setTimeOfDay(differentAppointment[randomValue].timeOfDay);
        counterDateCommit = 1;

        app.ask('In diesem Zeitraum sind wir leider ausgebucht. Hast du auch an einem anderen Termin Zeit? Wir hätten zum Beispiel am ' + formatDate(differentAppointment[randomValue].freeDate) + ' um '  + differentAppointment[randomValue].timeOfDay + ' Uhr noch einen Termin frei.');
      }

  }

  
  // This class is for free time slots 
  function FreeAppointment(freeDate, timeOfDay, hairStylist, daytime, jobTitle) {
    this.freeDate = freeDate;
    this.timeOfDay = timeOfDay;
    this.hairStylist = hairStylist;
    this.daytime = daytime;
    this.jobTitle = jobTitle;
  }

  
  NewAppointment.prototype.setfreeDate = function(freeDateLocal) {
    this.freeDate = freeDateLocal;
  }

  NewAppointment.prototype.setTimeOfDay = function(timeOfDayLocal) {
    this.timeOfDay = timeOfDayLocal;
  }


  NewAppointment.prototype.setHairStylist = function(hairStylistLocal) {
    this.hairStylist = hairStylistLocal;
  }

  NewAppointment.prototype.setWhatToDo = function(whatToDoLocal) {
    this.whatToDo = whatToDoLocal;
  }

  NewAppointment.prototype.setCustomerName = function(customerNameLocal) {
    this.customerName = customerNameLocal;
  }

  NewAppointment.prototype.setHairLength = function(lengthOfHairLocal) {
    this.lengthOfHair = lengthOfHairLocal;
  }


   // new appointments will be created
    var freeAppointment1 = new FreeAppointment(formatDate2('May 15,2018'), '16:30:00', 'Frau Müller', 'Nachmittag', 'senior');
    var freeAppointment2 = new FreeAppointment(formatDate2('May 15,2018'), '16:00:00', 'Frau Dackel', 'Nachmittag', 'senior');
    var freeAppointment3 = new FreeAppointment(formatDate2('May 22,2018'), '13:00:00', 'Frau Blau', 'Mittag', 'junior');
    var freeAppointment4 = new FreeAppointment(formatDate2('May 23,2018'), '16:00:00', 'Frau Blau', 'Nachmittag', 'junior');
    var freeAppointment5 = new FreeAppointment(formatDate2('May 25,2018'), '17:00:00', 'Frau Müller', 'Abend', 'senior');
    var freeAppointment6 = new FreeAppointment(formatDate2('May 25,2018'), '11:00:00', 'Frau James', 'Vormittag', 'Geschäftsführer');
    var freeAppointment7 = new FreeAppointment(formatDate2('May 25,2018'), '15:00:00', 'Frau Müller', 'Nachmittag', 'senior');
    var freeAppointment8 = new FreeAppointment(formatDate2('Jun 1,2018'), '16:30:00', 'Frau Müller', 'Nachmittag', 'senior');
    var freeAppointment9 = new FreeAppointment(formatDate2('Jun 1,2018'), '16:00:00', 'Frau Dackel', 'Nachmittag', 'senior');
    var freeAppointment10 = new FreeAppointment(formatDate2('Jun 4,2018'), '16:00:00', 'Frau Müller', 'Nachmittag', 'senior');
    var freeAppointment11 = new FreeAppointment(formatDate2('Jun 5,2018'), '14:30:00', 'Herr James', 'Nachmittag', 'Geschäftsführer');
    var freeAppointment12 = new FreeAppointment(formatDate2('Jun 6,2018'), '10:00:00', 'Frau Blau', 'Vormittag', 'junior');
    var freeAppointment13 = new FreeAppointment(formatDate2('Jun 6,2018'), '08:00:00', 'Herr James', 'Vormittag', 'Geschäftsführer');
    var freeAppointment14 = new FreeAppointment(formatDate2('Jun 12,2018'), '17:30:00', 'Herr Klein', 'Abend', 'Praktikant');
    var freeAppointment15 = new FreeAppointment(formatDate2('Jun 12,2018'), '18:30:00', 'Frau Blau', 'Abend', 'junior');
    var freeAppointment16 = new FreeAppointment(formatDate2('Jun 12,2018'), '10:30:00', 'Frau Dackel', 'Vormittag', 'senior');
    var freeAppointment17 = new FreeAppointment(formatDate2('Jun 19,2018'), '16:30:00', 'Frau Klein', 'Nachmittag', 'Praktikant');
    var freeAppointment18 = new FreeAppointment(formatDate2('Jun 22,2018'), '11:30:00', 'Frau Dackel', 'Vormittag', 'senior');
    var freeAppointment19 = new FreeAppointment(formatDate2('Jun 26,2018'), '12:30:00', 'Frau Dackel', 'Vormittag', 'senior');
    var freeAppointment20 = new FreeAppointment(formatDate2('Jun 29,2018'), '15:30:00', 'Frau Dackel', 'Nachmittag', 'senior');
    var freeAppointment21 = new FreeAppointment(formatDate2('Jul 19,2018'), '17:30:00', 'Frau Klein', 'Abend', 'Praktikant');
    var freeAppointment22 = new FreeAppointment(formatDate2('Jul 22,2018'), '17:30:00', 'Frau Blau', 'Abend', 'junior');
    var freeAppointment23 = new FreeAppointment(formatDate2('Jul 26,2018'), '17:30:00', 'Frau Dackel', 'Abend', 'senior');
    var freeAppointment24 = new FreeAppointment(formatDate2('Jul 29,2018'), '17:30:00', 'Frau Dackel', 'Abend', 'senior');

    var freeAppointment25 = new FreeAppointment(formatDate2('May 8,2018'), '18:30:00', 'Frau Dackel', 'Abend', 'senior');
    var freeAppointment26 = new FreeAppointment(formatDate2('May 9,2018'), '19:00:00', 'Frau Blau', 'Abend', 'junior');
    var freeAppointment27 = new FreeAppointment(formatDate2('May 9,2018'), '17:30:00', 'Frau Müller', 'Abend', 'senior');
    var freeAppointment28 = new FreeAppointment(formatDate2('May 10,2018'), '19:30:00', 'Herr James', 'Abend', 'Geschäftsführer');
    var freeAppointment29 = new FreeAppointment(formatDate2('May 8,2018'), '19:00:00', 'Frau Dackel', 'Abend', 'senior');
    var freeAppointment30 = new FreeAppointment(formatDate2('May 8,2018'), '19:30:00', 'Frau Dackel', 'Abend', 'senior');
    var freeAppointment31 = new FreeAppointment(formatDate2('May 9,2018'), '19:30:00', 'Frau Dackel', 'Abend', 'senior');
    var freeAppointment32 = new FreeAppointment(formatDate2('May 10,2018'), '13:30:00', 'Herr James', 'Mittag', 'Geschäftsführer');
    var freeAppointment33 = new FreeAppointment(formatDate2('May 11,2018'), '19:00:00', 'Herr James', 'Abend', 'Geschäftsführer');
    var freeAppointment34 = new FreeAppointment(formatDate2('May 11,2018'), '19:30:00', 'Herr Klein', 'Abend', 'Praktikant');
    var freeAppointment35 = new FreeAppointment(formatDate2('May 12,2018'), '19:00:00', 'Frau Dackel', 'Abend', 'senior');
    var freeAppointment36 = new FreeAppointment(formatDate2('May 12,2018'), '19:30:00', 'Frau Blau', 'Abend', 'junior');
    var freeAppointment37 = new FreeAppointment(formatDate2('May 14,2018'), '19:30:00', 'Frau Blau', 'Abend', 'junior');
    var freeAppointment38 = new FreeAppointment(formatDate2('May 15,2018'), '19:00:00', 'Frau Dackel', 'Abend', 'senior');

    var freeAppointment39 = new FreeAppointment(formatDate2('May 16,2018'), '08:00:00', 'Frau Dackel', 'Vormittag', 'senior');
    var freeAppointment40 = new FreeAppointment(formatDate2('May 16,2018'), '17:30:00', 'Frau Dackel', 'Abend', 'senior');
    var freeAppointment41 = new FreeAppointment(formatDate2('May 16,2018'), '18:00:00', 'Frau Dackel', 'Abend', 'senior');
    var freeAppointment42 = new FreeAppointment(formatDate2('May 16,2018'), '18:30:00', 'Frau Dackel', 'Abend', 'senior');
    var freeAppointment43 = new FreeAppointment(formatDate2('May 16,2018'), '19:00:00', 'Frau Dackel', 'Abend', 'senior');
    var freeAppointment44 = new FreeAppointment(formatDate2('May 16,2018'), '19:30:00', 'Frau Dackel', 'Abend', 'senior');

    var freeAppointment45 = new FreeAppointment(formatDate2('May 17,2018'), '08:00:00', 'Frau Dackel', 'Vormittag', 'senior');
    var freeAppointment46 = new FreeAppointment(formatDate2('May 17,2018'), '08:30:00', 'Frau Dackel', 'Vormittag', 'senior');
    var freeAppointment47 = new FreeAppointment(formatDate2('May 17,2018'), '09:00:00', 'Frau Dackel', 'Vormittag', 'senior');
    var freeAppointment48 = new FreeAppointment(formatDate2('May 17,2018'), '09:30:00', 'Frau Dackel', 'Vormittag', 'senior');
    var freeAppointment49 = new FreeAppointment(formatDate2('May 17,2018'), '10:00:00', 'Frau Dackel', 'Vormittag', 'senior');
    var freeAppointment50 = new FreeAppointment(formatDate2('May 17,2018'), '10:30:00', 'Frau Dackel', 'Vormittag', 'senior');
    var freeAppointment51 = new FreeAppointment(formatDate2('May 17,2018'), '11:00:00', 'Frau Dackel', 'Vormittag', 'senior');
    var freeAppointment52 = new FreeAppointment(formatDate2('May 17,2018'), '11:30:00', 'Frau Dackel', 'Vormittag', 'senior');
    
    var freeAppointment53 = new FreeAppointment(formatDate2('May 18,2018'), '09:30:00', 'Frau Dackel', 'Vormittag', 'senior');
    var freeAppointment54 = new FreeAppointment(formatDate2('May 18,2018'), '10:00:00', 'Frau Dackel', 'Vormittag', 'senior');
    var freeAppointment55 = new FreeAppointment(formatDate2('May 18,2018'), '10:30:00', 'Frau Dackel', 'Vormittag', 'senior');
    var freeAppointment56 = new FreeAppointment(formatDate2('May 18,2018'), '11:00:00', 'Frau Dackel', 'Vormittag', 'senior');
    var freeAppointment57 = new FreeAppointment(formatDate2('May 18,2018'), '11:30:00', 'Frau Dackel', 'Mittag', 'senior');
    var freeAppointment58 = new FreeAppointment(formatDate2('May 18,2018'), '14:00:00', 'Frau Dackel', 'Nachmittag', 'senior');
    var freeAppointment59 = new FreeAppointment(formatDate2('May 18,2018'), '14:30:00', 'Frau Dackel', 'Nachmittag', 'senior');
    var freeAppointment60 = new FreeAppointment(formatDate2('May 18,2018'), '15:00:00', 'Frau Dackel', 'Nachmittag', 'senior');
    var freeAppointment61 = new FreeAppointment(formatDate2('May 18,2018'), '15:30:00', 'Frau Dackel', 'Nachmittag', 'senior');
    var freeAppointment62 = new FreeAppointment(formatDate2('May 18,2018'), '16:00:00', 'Frau Dackel', 'Nachmittag', 'senior');
    var freeAppointment63 = new FreeAppointment(formatDate2('May 18,2018'), '16:30:00', 'Frau Dackel', 'Nachmittag', 'senior');
    var freeAppointment64 = new FreeAppointment(formatDate2('May 22,2018'), '19:30:00', 'Frau Blau', 'Abend', 'junior');

    var freeAppointment65 = new FreeAppointment(formatDate2('May 25,2018'), '18:00:00', 'Frau Blau', 'Abend', 'junior');
    var freeAppointment66 = new FreeAppointment(formatDate2('May 25,2018'), '18:30:00', 'Frau Blau', 'Abend', 'junior');
    var freeAppointment67 = new FreeAppointment(formatDate2('May 25,2018'), '19:00:00', 'Frau Blau', 'Abend', 'junior');
    var freeAppointment68 = new FreeAppointment(formatDate2('May 25,2018'), '19:30:00', 'Frau Blau', 'Abend', 'junior');
    
    var freeAppointment69 = new FreeAppointment(formatDate2('May 29,2018'), '11:00:00', 'Frau Blau', 'Mittag', 'junior');
    var freeAppointment70 = new FreeAppointment(formatDate2('May 29,2018'), '11:30:00', 'Frau Blau', 'Mittag', 'junior');
    var freeAppointment71 = new FreeAppointment(formatDate2('May 29,2018'), '12:00:00', 'Frau Blau', 'Mittag', 'junior');
    var freeAppointment72 = new FreeAppointment(formatDate2('May 29,2018'), '12:30:00', 'Frau Blau', 'Mittag', 'junior');
    var freeAppointment73 = new FreeAppointment(formatDate2('May 29,2018'), '13:00:00', 'Frau Blau', 'Mittag', 'junior');
    var freeAppointment74 = new FreeAppointment(formatDate2('May 29,2018'), '13:30:00', 'Frau Blau', 'Mittag', 'junior');
    var freeAppointment75 = new FreeAppointment(formatDate2('May 29,2018'), '14:00:00', 'Frau Blau', 'Nachmittag', 'junior');
    var freeAppointment76 = new FreeAppointment(formatDate2('May 29,2018'), '14:30:00', 'Frau Blau', 'Nachmittag', 'junior');
    var freeAppointment77 = new FreeAppointment(formatDate2('May 29,2018'), '15:00:00', 'Frau Blau', 'Nachmittag', 'junior');
    var freeAppointment78 = new FreeAppointment(formatDate2('May 29,2018'), '15:30:00', 'Frau Blau', 'Nachmittag', 'junior');
    var freeAppointment79 = new FreeAppointment(formatDate2('May 29,2018'), '16:00:00', 'Frau Blau', 'Nachmittag', 'junior');
    var freeAppointment80 = new FreeAppointment(formatDate2('May 29,2018'), '16:30:00', 'Frau Blau', 'Nachmittag', 'junior');
    


    
    // All free appointments in an array 
    var differentAppointment = [freeAppointment1, freeAppointment2, freeAppointment3, freeAppointment4, freeAppointment5, freeAppointment6, freeAppointment7, freeAppointment8, freeAppointment9, freeAppointment10, freeAppointment11, freeAppointment12, freeAppointment13, freeAppointment14, freeAppointment15, freeAppointment16, freeAppointment17, freeAppointment18, freeAppointment19, freeAppointment20, freeAppointment21, freeAppointment22, freeAppointment23, freeAppointment24, freeAppointment25, freeAppointment26, freeAppointment27, freeAppointment28, freeAppointment29, freeAppointment30, freeAppointment31, freeAppointment32, freeAppointment33, freeAppointment34, freeAppointment35, freeAppointment36, freeAppointment37, freeAppointment38, freeAppointment39, freeAppointment40, freeAppointment41, freeAppointment42, freeAppointment43, freeAppointment44, freeAppointment45, freeAppointment46, freeAppointment47, freeAppointment48, freeAppointment49, freeAppointment50, freeAppointment51, freeAppointment52, freeAppointment53, freeAppointment54, freeAppointment55, freeAppointment56, freeAppointment57, freeAppointment58, freeAppointment59, freeAppointment60, freeAppointment61, freeAppointment62, freeAppointment63, freeAppointment64, freeAppointment65, freeAppointment66, freeAppointment67, freeAppointment68, freeAppointment69, freeAppointment70, freeAppointment71, freeAppointment72, freeAppointment73, freeAppointment74, freeAppointment75, freeAppointment76, freeAppointment77, freeAppointment78, freeAppointment79, freeAppointment80 ];
  
   function searchDayTime(app, givenDayTime, dates, givenSpecificDate){
    
     if(givenDayTime != 0 &&  givenSpecificDate === null){
     for (var i = 0; i < differentAppointment.length; i++) {
        if( differentAppointment[i].daytime === givenDayTime) {
          dates.push(differentAppointment[i]); 
        } 
      }
    } else if(givenDayTime === 0){
      givenDayTime = dates[0].daytime;
    } else if(givenSpecificDate != null && givenDayTime != 0){
      givenSpecificDate = formatDate2(givenSpecificDate);
      for (var i = 0; i < differentAppointment.length; i++) {
        if( Date.daysBetween(differentAppointment[i].freeDate, givenSpecificDate) === 0 && differentAppointment[i].daytime === givenDayTime) {
          dates.push(differentAppointment[i]); 
        }
      }
    }


      if(dates.length === 1) {
        newAppointment.setTimeOfDay(dates[0].timeOfDay);
        newAppointment.setHairStylist(dates[0].hairStylist);
        newAppointment.setfreeDate(dates[0].freeDate);

        app.ask('Wir hätten am ' + givenDayTime + ' dem ' + formatDate(dates[0].freeDate) + ' um ' + dates[0].timeOfDay + ' Uhr einen Termin frei. Würde dieser für dich passen?');
      } else if(dates.length < 4 && dates.length > 1) {

          var allDates = formatDate(dates[0].freeDate) + ' um ' +  dates[0].timeOfDay;

          for(var i = 1; i < dates.length; i++) {
            allDates += ' und am ';
            allDates += formatDate(dates[i].freeDate);
            allDates += ' um ';
            allDates += dates[i].timeOfDay;
          }

          newAppointment.setfreeDate(dates);
          app.ask('Wir hätten am ' + givenDayTime +  ' dem ' + allDates + ' Uhr einen Termin frei. Würde einer dieser Termine für dich passen?');

        } else if(dates.length > 3){


          var randomDates = [];

            // show 3 random dates to the user
            // function give an array with three random dates of the given time period back
            var values = makeRandomDates(randomDates, dates);
            randomDates = values[0];

            var allDates = " am " + formatDate(randomDates[0].freeDate) + " um " + randomDates[0].timeOfDay;
            for(var i = 1; i < randomDates.length; i++) {
              allDates += ' und am ';
              allDates += formatDate(randomDates[i].freeDate);
              allDates += ' um ';
              allDates += randomDates[i].timeOfDay;
            }

            newAppointment.freeDate = values;

          app.ask('Wir hätten am ' + givenDayTime +  ' dem ' + allDates + ' Uhr einen Termin frei. Würde einer dieser Termine für dich passen? Ich kann dir auch weitere Termine zu dieser Tageszeit vorschlagen.');


          } else {
          var randomAlternativeDates = new Array();
          var today = new Date();
          formatDate2(today);

          for(var i = 0; i < differentAppointment.length; i++) {
          // Dates in the future will be pushed to randomAlternativeDates
          if( Date.daysBetween(differentAppointment[i].freeDate, today) <= -1) {
            randomAlternativeDates.push(differentAppointment[i]); 
          }
        }

        // Calculate a random date of the available dates.
        if(randomAlternativeDates.length > 1) {
          var randomValue = getRandomInt(0, (randomAlternativeDates.length - 1));
        } else {
          app.ask('Wir sind leider ausgebucht und können keine Termine anbieten. Auf Wiedersehen.');
        }
        newAppointment.setfreeDate(randomAlternativeDates[randomValue].freeDate);
        newAppointment.setHairStylist(randomAlternativeDates[randomValue].hairStylist);
        newAppointment.setTimeOfDay(randomAlternativeDates[randomValue].timeOfDay);

        app.ask('Zu dieser Tageszeit haben wir keine Termine. Hast du auch an einem anderen Termin Zeit? Wir hätten zum Beispiel am ' + formatDate(randomAlternativeDates[randomValue].freeDate) + ' um '  + randomAlternativeDates[randomValue].timeOfDay + ' Uhr noch einen Termin frei.');
      }

      app.ask("Wie hast du das geschafft?");
    } 


   function defaultAnswers(){
         if(!funnyanswer){
          if(newAppointment.whatToDo === undefined){
            app.ask('Ich habe dich leider nicht richtig verstanden. Was möchtest du machen lassen? Wir bieten z.B. Haare schneiden, Farbe oder Strähnchen an. Sowohl für Herren als auch für Damen und Kinder.');
          } else if(newAppointment.lengthOfHair === undefined &&  newAppointment.whatToDo !== undefined){
            app.ask('Ich habe dich leider nicht richtig verstanden. Soll ich den Termin für lange oder kurze Haare eintragen?');
          } else if(newAppointment.freeDate === undefined && newAppointment.lengthOfHair !== undefined ){
            app.ask('Ich habe dich leider nicht richtig verstanden. Wann hast du denn Zeit für den Friseurtermin?');

          } else if(newAppointment.timeOfDay === undefined && newAppointment.freeDate !== undefined){
            app.ask('Ich habe dich leider nicht richtig verstanden. Welche Uhrzeit möchtest du?');
          } else if(newAppointment.customerName === undefined && newAppointment.timeOfDay !== undefined){
            app.ask('Kannst du mir bitte deinen vollständigen Vornamen nennen? Spitznamen verstehe ich leider nicht');
          } else{
            app.ask('Ich habe dich leider nicht verstanden.');
          }
        }else{
          if(newAppointment.whatToDo === undefined){
            funnyanswer = false; 
            app.ask('Nein, ich möchte dir nur helfen einen Termin auszumachen. Was möchtest du machen lassen? Wir bieten z.B. Haare schneiden, Farbe oder Strähnchen an. Sowohl für Herren als auch für Damen und Kinder.');
          } else if(newAppointment.lengthOfHair === undefined &&  newAppointment.whatToDo !== undefined){
            funnyanswer = false; 
            app.ask('Nein, ich möchte dir nur helfen einen Termin auszumachen. Soll ich den Termin für lange oder kurze Haare eintragen?');
          } else if(newAppointment.freeDate === undefined && newAppointment.lengthOfHair !== undefined ){
            funnyanswer = false; 
            app.ask('Nein, ich möchte dir nur helfen einen Termin auszumachen. Wann hast du denn Zeit für den Friseurtermin?');

          } else if(newAppointment.timeOfDay === undefined && newAppointment.freeDate !== undefined){
            funnyanswer = false; 
            app.ask('Nein, ich möchte dir nur helfen einen Termin auszumachen. Welche Uhrzeit möchtest du?');
          } else if(newAppointment.customerName === undefined && newAppointment.timeOfDay !== undefined){
            funnyanswer = false; 
            app.ask('Nein, ich möchte dir nur helfen einen Termin auszumachen. Kannst du mir bitte deinen vollständigen Vornamen nennen? Spitznamen verstehe ich leider nicht');
          } else{
            funnyanswer = false; 
            app.ask('Ich habe dich leider nicht verstanden.');
          }
        }
   }

  // Here will be calculated if the user date fits to the free dates
  function calculateFreeAppointment(app, givenDate, givenNotDate, givenTime = 0 , datePeriodArrayLocal = 0, givenHairStylist = 0, givenOffer = 0) {
    var dates = new Array();
    var alternativeDates = new Array();
    var today = new Date();
    formatDate2(today);

    if (givenDate != 0 ) {
      for (var i = 0; i < differentAppointment.length; i++) {
        if( Date.daysBetween(differentAppointment[i].freeDate, givenDate) === 0) {
          dates.push(differentAppointment[i]); 
        } 
        else if(Date.daysBetween(differentAppointment[i].freeDate, givenDate) === 1 || Date.daysBetween(differentAppointment[i].freeDate, givenDate) === -1 && Date.daysBetween(differentAppointment[i].freeDate, today) <= 0) {
          // push dates that in the timeperiod ( 1 before or after the given date) and the date must be today or in the future
          alternativeDates.push(differentAppointment[i]);       
          }
        }

        
        if(dates.length === 1) {
          newAppointment.setTimeOfDay(dates[0].timeOfDay);
          newAppointment.setHairStylist(dates[0].hairStylist);
          newAppointment.setfreeDate(dates[0].freeDate);
          app.ask('Wir hätten am ' + formatDate(givenDate) +  ' um ' + dates[0].timeOfDay + ' Uhr einen Termin frei. Würde dieser für dich passen?');

        } 
        else if(dates.length > 1) {

          var allDates = dates[0].timeOfDay;

          for(var i = 1; i < dates.length; i++) {
            allDates += ' und ';
            allDates += dates[i].timeOfDay;
          }

          newAppointment.setfreeDate(dates);
          app.ask('Wir hätten am ' + formatDate(givenDate) +  ' um ' + allDates + ' Uhr einen Termin frei. Würde einer dieser Termine für dich passen?');

        } else if (dates.length === 0 && alternativeDates.length === 1 ) {
          newAppointment.setfreeDate(alternativeDates[0].freeDate);
          newAppointment.setHairStylist(alternativeDates[0].hairStylist);
          newAppointment.setTimeOfDay(alternativeDates[0].timeOfDay);
          counterDateCommit = 1;

          app.ask('An diesem Termin sind wir leider ausgebucht. Hast du auch an einem anderen Termin Zeit? Wir hätten zum Beispiel am ' + formatDate(alternativeDates[0].freeDate) + ' um'  + alternativeDates[0].timeOfDay + ' Uhr noch einen Termin frei.');
        } else if(dates.length === 0 && alternativeDates.length > 1 ) {
          newAppointment.setfreeDate(alternativeDates);
          counterDateCommit = 1;
          app.ask('An diesem Termin sind wir leider ausgebucht. Hast du auch an einem anderen Termin Zeit? Wir hätten zum Beispiel am ' + formatDate(alternativeDates[0].freeDate) + ' um'  + alternativeDates[0].timeOfDay + ' Uhr noch einen Termin frei.');
        } else {

          var randomAlternativeDates = new Array();

          for(var i = 0; i < differentAppointment.length; i++) {
          // Dates in the future will be pushed to randomAlternativeDates
          if( Date.daysBetween(differentAppointment[i].freeDate, today) <= -1) {
            randomAlternativeDates.push(differentAppointment[i]); 
          }
        }

        // Calculate a random date of the available dates.
        if(randomAlternativeDates.length > 1) {
          var randomValue = getRandomInt(0, (randomAlternativeDates.length - 1));
        } else {
          app.ask('Wir sind leider ausgebucht und können keine Termine anbieten. Auf Wiedersehen.');
        }
        newAppointment.setfreeDate(randomAlternativeDates[randomValue].freeDate);
        newAppointment.setHairStylist(randomAlternativeDates[randomValue].hairStylist);
        newAppointment.setTimeOfDay(randomAlternativeDates[randomValue].timeOfDay);

        app.ask('An diesem Termin und in diesem Zeitraum sind wir leider ausgebucht. Hast du auch an einem anderen Termin Zeit? Wir hätten zum Beispiel am ' + formatDate(randomAlternativeDates[randomValue].freeDate) + ' um '  + randomAlternativeDates[randomValue].timeOfDay + ' Uhr noch einen Termin frei.');
      }
    }
    // If one date isn't good, search another date
    else if(givenNotDate != 0) {
     //app.ask(differentAppointment[0].freeDate + "und" + givenNotDate );
     for(var i = 0; i < differentAppointment.length; i++) {
      if(Date.daysBetween(differentAppointment[i].freeDate, givenNotDate) != 0 ) {
        dates.push(differentAppointment[i]); 
      }     
    }


    if(dates.length === 1) {
      newAppointment.setTimeOfDay(dates[0].timeOfDay);
      newAppointment.setHairStylist(dates[0].hairStylist);
      newAppointment.setfreeDate(dates[0].freeDate);
      app.ask('Wir hätten am ' + formatDate(dates[0].freeDate) +  ' um ' + dates[0].timeOfDay + ' Uhr einen Termin frei. Würde dieser für dich passen?');
 
    } else if(dates.length > 1) {

      var allDates = formatDate(dates[0].freeDate) + ' um ' +  dates[0].timeOfDay;
      if (dates.length < 4){

        for(var i = 1; i < dates.length; i++) {
          allDates += ' und am ';
          allDates += formatDate(dates[i].freeDate);
          allDates += ' um ';
          allDates += dates[i].timeOfDay;
        }
      } else { 
        for(var i = 1; i < 3; i++) {
          allDates += ' und am ';
          allDates += formatDate(dates[i].freeDate);
          allDates += ' um ';
          allDates += dates[i].timeOfDay;
        }
      }

      newAppointment.setfreeDate(dates);
      app.ask('Wir hätten am ' +  allDates + ' Uhr einen Termin frei. Würde einer dieser Termine für dich passen?');

    } else { 
      app.ask('Wir sind leider ausgebucht und können keine Termine anbieten. Auf Wiedersehen.');
    }

  } else if(datePeriodArrayLocal != null) {
      var dateMin = formatDate2(datePeriodArrayLocal[0]);
      var dateMax = formatDate2(datePeriodArrayLocal[1]);
      //app.ask("DATE: " + dateMin + " " + dateMax);

      var days = Date.daysBetween(dateMin, dateMax);

      for (var i = 0; i < differentAppointment.length; i++) {
        if( Date.daysBetween(differentAppointment[i].freeDate, dateMin) >= -days && Date.daysBetween(differentAppointment[i].freeDate, dateMin) <= 0 && Date.daysBetween(differentAppointment[i].freeDate, today) <= 0) {
          dates.push(differentAppointment[i]); 
        } 
      }

      giveAnswers(app, dates, dateMin, dateMax, differentAppointment );

  }
}



function responseHandler (app) {
  // intent contains the name of the intent you defined in the Actions area of Dialogflow
  let intent = app.getIntent();
  switch (intent) {

    case SAY_SPECIFIC_DATE_TIME_ACTION:

    case SAY_TIME_ACTION: 

    case SAY_TIME_DATE_TIME_ACTION:
      let givenTime = null;

      if(app.getArgument(TIME_OF_DAY_AURGUMENT) != null) {
        givenTime = app.getArgument(TIME_OF_DAY_AURGUMENT);
      } 
      else {
        app.ask('Ich habe die Uhrzeit leider nicht verstanden. Kannst du sie bitte wiederholen?');
      }


      if(newAppointment.freeDate != undefined && newAppointment.freeDate.length != undefined && counterDateCommit === 1 && givenTime != null && givenTime.length === undefined) {
        for(var i = 0; i < newAppointment.freeDate.length; i++) {
          //here
          if(newAppointment.freeDate[i].timeOfDay === givenTime){
            newAppointment.freeDate = newAppointment.freeDate[i].freeDate;
            newAppointment.timeOfDay = givenTime;
            app.ask('Für wen darf ich den Termin eintragen?');
        }
      }
    } else if(newAppointment.freeDate != undefined && newAppointment.freeDate.length === undefined && counterDateCommit === 1 && givenTime != null && givenTime.length === undefined){
       newAppointment.freeDate = newAppointment.freeDate[i].freeDate;
        newAppointment.timeOfDay = givenTime;
        app.ask('Für wen darf ich den Termin eintragen?');

    }
    else {
      var datesWithThisTime = [];
      for(var i = 0; i < differentAppointment.length; i++) {
        if(differentAppointment[i].timeOfDay === givenTime) {
          datesWithThisTime.push(differentAppointment[i]);
        }
      } 
      
      if(datesWithThisTime.length > 0 && datesWithThisTime.length < 2) {

        var allDatesWithTime = " am " + getDayName(datesWithThisTime[0].freeDate) + " den " + formatDate(datesWithThisTime[0].freeDate);
        app.ask('Wir hätten ' + allDatesWithTime + ' um diese Uhrzeit einen Termin frei. Würde dieser Termin für dich passen?');

      } else if (datesWithThisTime.length > 1) {
          var allDatesWithTime = " am " + getDayName(datesWithThisTime[0].freeDate) + " den " + formatDate(datesWithThisTime[0].freeDate);
          for(var i = 1; i < datesWithThisTime.length; i++) {
            allDatesWithTime += ' und am ';
            allDatesWithTime += getDayName(datesWithThisTime[i].freeDate);
            allDatesWithTime += ' den ';
            allDatesWithTime += formatDate(datesWithThisTime[i].freeDate);
          }
          app.ask('Wir hätten ' + allDatesWithTime + ' um diese Uhrzeit einen Termin frei. Würde einer dieser Termine für dich passen? ');
      

    } else if (datesWithThisTime.length < 1) {
      var alternativeDatesWithOtherTime = [];
      for(var i = 0; i < differentAppointment.length; i++) {
        if(differentAppointment[i].timeOfDay != givenTime ) {
          alternativeDatesWithOtherTime.push(differentAppointment[i]);
        }
      }
    }
    if(alternativeDatesWithOtherTime.length != 0) {
      app.ask('Zu dieser Uhrzeit sind wir leider ausgebucht. Hast du auch zu einer anderen Uhrzeit Zeit? Wir hätten zum Beispiel am ' + formatDate(alternativeDatesWithOtherTime[0].freeDate) + ' um ' + alternativeDatesWithOtherTime[0].timeOfDay + ' Uhr einen Termin frei.');
    } else {
      app.ask('Wir sind leider ausgebucht und können keine Termine anbieten. Auf Wiedersehen.');
    }
  }
    
  
  
    break;

    case MAKE_HAIR_STYLE_FALLBACK_ACTION:

      if(newAppointment.whatToDo === undefined && counterActionFurtherInquiries === 0){
      counterActionFurtherInquiries++;
      app.ask('Ich habe dich leider nicht richtig verstanden. Was möchtest du machen lassen? Wir bieten z.B. Haare schneiden, Farbe oder Strähnchen an. Sowohl für Herren als auch für Damen und Kinder.');
      } else if(newAppointment.whatToDo === undefined && counterActionFurtherInquiries > 0){
      app.ask('Ich habe dich leider nicht richtig verstanden. Was möchtest du machen lassen?');
      } else if(newAppointment.whatToDo !== undefined && counterLengthFurtherInquiries === 0 && newAppointment.lengthOfHair === undefined){
      app.ask('Ich habe dich leider nicht richtig verstanden. Brauchst du einen Langhaar oder Kurzhaarschnitt?');

      } else if(newAppointment.whatToDo !== undefined && counterLengthFurtherInquiries > 0 && newAppointment.lengthOfHair === undefined){
      app.ask('Ich habe dich leider nicht richtig verstanden. Brauchst du einen Langhaar oder Kurzhaarschnitt?');
      } else {
      app.ask('Ich habe dich leider nicht verstanden');
      }
    break;

    case SAY_SPECIFIC_DATE_FALLBACK_ACTION:
      var recommendedDates = newAppointment.freeDate[0].timeOfDay;
      for(var i = 1; i < newAppointment.freeDate.length; i++){
        recommendedDates += ' und ';
        recommendedDates += newAppointment.freeDate[i].timeOfDay;
      }

      app.ask('Ich habe dich leider nicht verstanden. Wir hätten am ' + formatDate(newAppointment.freeDate[0].freeDate) +  ' um ' + recommendedDates + ' Uhr einen Termin frei. Würde einer dieser Termine für dich passen?');
    break;

    case SAY_DATE_YES_ACTION:
      if(newAppointment.freeDate != undefined && newAppointment.freeDate.length !== undefined){
        app.ask('Super! Welche Uhrzeit möchtest du?');
      }
      else {
        app.ask('Für wen darf ich den Termin eintragen?');
      }
    break;

    case MAKE_HAIR_STYLE_ACTION:
    let givenWhatToDo = app.getArgument(WHAT_TO_DO_ARGUMENT);
    let givenLengthOFHair = app.getArgument(LENGTH_OF_HAIR_ARGUMENT);
    
    if(app.getArgument(WHAT_TO_DO_ARGUMENT) != null && counterActionFurtherInquiries === 0){
      givenWhatToDo = app.getArgument(WHAT_TO_DO_ARGUMENT);
      newAppointment.whatToDo = givenWhatToDo;

    } else if(givenWhatToDo === null && counterActionFurtherInquiries > 0){
      app.ask('Ich habe dich leider nicht richtig verstanden. Was möchtest du machen lassen?');
    } else{
      counterActionFurtherInquiries++;
      app.ask('Ich habe dich leider nicht richtig verstanden. Was möchtest du machen lassen? Wir bieten z.B. Haare schneiden, Farbe oder Strähnchen an. Sowohl für Herren als auch für Damen und Kinder.');
    }

    if(app.getArgument(LENGTH_OF_HAIR_ARGUMENT) != null){
      givenLengthOFHair = app.getArgument(LENGTH_OF_HAIR_ARGUMENT);
      newAppointment.setHairLength(givenLengthOFHair);
      newAppointment.lengthOfHair = givenLengthOFHair;
    } else {
       app.ask('Langhaar oder Kurzhaarschnitt?');
    }

    if(givenWhatToDo !== null &&  givenLengthOFHair !== null ) {
      app.ask('Wann hast du denn Zeit für den Friseurtermin?');
      } 
    else { 
      defaultAnswers();
    }
    defaultAnswers();

  break;


  //Check if date is available or if it's the start
  case SAY_ACTION:
     let name = app.getArgument(GIVEN_NAME_ARGUMENT);
     //newAppointment.setCustomerName(name);
     newAppointment.customerName = name;
     /*if (newAppointment.freeDate === undefined) {

     } else if (newAppointment.timeOfDay === undefined) {

     }*/
     app.ask('Super. Dann trage ich am ' + formatDate(newAppointment.freeDate) + ' um ' + newAppointment.timeOfDay  + ' den Termin auf ' + newAppointment.customerName + ' bei ' + newAppointment.hairStylist + ' in unseren Kalender ein. Vielen Dank für deine Buchung. Falls du noch Fragen zum Termin hast kannst du dich jederzeit beim Friseur Salon Noel Paris unter der 01723456432 melden.');
  break;

  case SPECIFIC_DATE_ACTION:
     let date = app.getArgument(SPECIFIC_DATE_ARGUMENT);
     let notHint = app.getArgument(NOT_ARGUMENT);
     if(newAppointment.freeDate === undefined) {
      if (!notHint) {
        date = formatDate2(date);
        calculateFreeAppointment(app, date, 0); 
      } else {
        calculateFreeAppointment(app, 0, date); 
      }
     }
     else if(newAppointment.freeDate != undefined && newAppointment.freeDate.length === undefined && newAppointment.freeDate && newAppointment.timeOfDay !== undefined && counterDateCommit === 1) {
        app.ask('Für wen darf ich den Termin eintragen?');
     } else if(newAppointment.freeDate !== undefined && counterDateCommit === 0 && newAppointment.freeDate.length === undefined ){
        var saver = newAppointment.freeDate;
        newAppointment.freeDate = undefined;
        app.ask ('Ich habe mehrere Daten erhalten. Möchtest du einen Termin am ' + formatDate(saver) + ' oder am ' + formatDate(date) + '?');
      } else if(newAppointment.freeDate !== undefined && counterDateCommit === 0 && newAppointment.freeDate.length !== undefined ){
          newAppointment.freeDate = undefined;
         app.ask ('Ich habe mehrere Daten von dir erhalten. Welches Datum möchtest du?');

      }
     
     app.ask('Möchtest du einen Termin am ' + formatDate(date) + ' ?' );
  break;

  case SAY_SPECIFIC_DATE_CUSTOM_ACION:
   let newDate = app.getArgument(SPECIFIC_DATE_ARGUMENT);
   newDate = formatDate2(newDate);
   calculateFreeAppointment(app, newDate, 0); 
  break;

  case APPOINTMENT_ACTION:
  if(newAppointment.customerName === undefined) {
    app.ask('Für wen darf ich den Termin eintragen?');
  } else if(newAppointment.freeDate === undefined){
    app.ask('Wann hast du denn Zeit für den Friseurtermin?');
  } 
  else {
   app.ask('Super. Dann trage ich am ' + formatDate(newAppointment.freeDate) + ' um ' + newAppointment.timeOfDay  + ' den Termin auf ' + newAppointment.customerName + ' bei ' + newAppointment.hairStylist + ' in unseren Kalender ein. Vielen Dank für deine Buchung. Falls du noch Fragen zum Termin hast kannst du dich jederzeit beim Friseur Salon Noel Paris unter der 01723456432 melden.');
  }
  
  break;



  case SAY_ALL_ACTION:
   let dateAll = app.getArgument(SPECIFIC_DATE_ARGUMENT);
   let timeAll = app.getArgument(TIME_OF_DAY_AURGUMENT);
   let whatToDoAll = app.getArgument(BARBER_OFFER_ARGUMENT);
  
   dateAll = formatDate2(dateAll);
   var datesAll = [];

   for(var i = 0; i < differentAppointment.length; i++) {
      if(differentAppointment[i].timeOfDay == timeAll && Date.daysBetween(differentAppointment[i].freeDate, dateAll) === 0 ) {
          datesAll.push(differentAppointment[i]);
        }
    }
    
    if(datesAll.length > 0) {
      newAppointment.freeDate = dateAll;
      newAppointment.timeOfDay = timeAll;
      newAppointment.whatToDo = whatToDoAll;
      app.ask('Perfekt, dieser Termin ist noch frei. Darf ich den Termin dann für dich eintragen?');
      
    } else {
      app.ask('An diesem Termin sind wir leider ausgebucht. Hast du auch an einem anderen Termin Zeit?');
    }

  break;

  case SAY_NAME_YES_ACTION:
    app.ask('Auf Widersehen');
  break;


  case SAY_NAME_NO_ACTION:
     app.ask('Auf Widersehen');
  break;

  case NEGATION_DATE_ACTION:
      let notDate = app.getArgument(NOT_THAT_DATE_ARGUMENT);
      let notArgument = app.getArgument(NOT_ARGUMENT);
      notDate = formatDate2(notDate);
      calculateFreeAppointment(app, 0, notDate);

  break;

  case NEGATION_DATE_YES_ACTION:
      if(newAppointment.timeOfDay !== undefined && newAppointment.customerName === undefined){
            app.ask('Für wen darf ich den Termin eintragen?');
          } else if(newAppointment.timeOfDay !== undefined && newAppointment.customerName !== undefined && newAppointment.freeDate !== undefined){
            app.ask('Super. Dann trage ich am ' + formatDate(newAppointment.freeDate) + ' um ' + newAppointment.timeOfDay  + ' den Termin auf ' + newAppointment.customerName + ' bei ' + newAppointment.hairStylist + ' in unseren Kalender ein. Vielen Dank für deine Buchung. Falls du noch Fragen zum Termin hast kannst du dich jederzeit beim Friseur Salon Noel Paris unter der 01723456432 melden.');
          } else{
            app.ask('Sehr gut. Welchen Termin möchtest du?');
          }

  break;

  case FUNNY_ANSWER_ACTION:
        funnyanswer = true; 
  case DEFULT_FALLBACL_ACTION:
        defaultAnswers();
   

  break;

  case SAY_TIME_WITH_LANGUAGE_ACTION:
      let numberArgument = null;
    if(app.getArgument(NUMBER_ARGUMENT) != null) {
       numberArgument = app.getArgument(NUMBER_ARGUMENT);
    } else {
      app.ask('Bitte nenne das exakte Datum oder die genaue Uhrzeit.');
    }
            

      for(var i = 0; i < newAppointment.freeDate.length; i++) {
        if(i === (numberArgument-1)) {
          newAppointment.freeDate = newAppointment.freeDate[i].freeDate;
          //newAppointment.timeOfDay = newAppointment.freeDate[i].timeOfDay;
          app.ask('Für wen darf ich den Termin eintragen?');

        }
      }

      app.ask('Es gibt keinen Termin um diese Uhrzeit.');

  break;

  case DATE_PERIOD_ACTION:
  let givenDatePeriod = null;
  if(app.getArgument(DATE_PERIOD_ARGUMENT) != null){
    givenDatePeriod = app.getArgument(DATE_PERIOD_ARGUMENT);
  } else {
    app.ask("leer");
  }
   
  var datePeriodArray = givenDatePeriod.split('/');
  calculateFreeAppointment(app, 0, 0, 0, datePeriodArray, 0, 0  );

  break;

  case MORE_DATES_ACTION:
   var moreDates = newAppointment.freeDate[1];
   giveAnswers(app, moreDates, 0, 0);
  break;

  case MORE_DATE_TIME_ACTION:
   var moreDates = newAppointment.freeDate[1];
   searchDayTime(app, 0, moreDates);
  break; 


  case NOT_THIS_DATE_ACTION:

    if(newAppointment.customerName != undefined && newAppointment.timeOfDay != undefined) {
      app.ask('Vielen Dank für deine Buchung. Falls du noch Fragen zum Termin hast kannst du dich jederzeit beim Friseur Salon Noel Paris unter der 01723456432 melden. (Zur Info: ' + newAppointment.freeDate + ' ' + newAppointment.timeOfDay + ' ' + newAppointment.hairStylist + ' ' + newAppointment.whatToDo + ' ' +  newAppointment.customerName + ' ' +  newAppointment.lengthOfHair);
    }
    app.ask("Ok, wann hast du noch Zeit für den Friseurtermin? Du kannst mir z.B. ein anderes Datum oder anderen Zeitraum nennen.");

  break;

  case SAY_DAYTIME_ACTION:
     let givenDayTime = null;
     if(app.getArgument(DAY_TIME_ARGUMENT) != null) {
      givenDayTime = app.getArgument(DAY_TIME_ARGUMENT);
    } else {
      app.ask("Ich konnte deine angegebene Tageszeit nicht verarbeiten. Kannst du deine Anfrage bitte nochmal stellen?");
    }

    let givenSpecificDate = null;
  if(app.getArgument(DAY_TIME_ARGUMENT) != null) {
     givenSpecificDate = app.getArgument(SPECIFIC_DATE_ARGUMENT);
  }

    var dates = [];
    searchDayTime(app, givenDayTime, dates, givenSpecificDate );

  break;


   case SAY_DAYTIME_YES_ACTION:
    let givenTimeYes = app.getArgument(TIME_OF_DAY_AURGUMENT);
  
      if(newAppointment.freeDate != undefined && newAppointment.freeDate.length !== undefined && givenTimeYes === null ){
        app.ask('Super! Welchen Termin möchtest du? :)');
      }
      else if(newAppointment.freeDate != undefined && newAppointment.freeDate.length === undefined && givenTimeYes === null ){
        app.ask('Für wen darf ich den Termin eintragen?');
      } else if(givenTimeYes !== null ){
        for(var i = 0; i < newAppointment.freeDate.length ; i++){
          if( newAppointment.freeDate[i].timeOfDay === givenTimeYes){
            newAppointment.setTimeOfDay(newAppointment.freeDate[i].timeOfDay);
            newAppointment.setHairStylist(newAppointment.freeDate[i].hairStylist);
            newAppointment.setfreeDate(newAppointment.freeDate[i].freeDate);
            app.ask('Für wen darf ich den Termin eintragen?');
          }
        }
        app.ask('Welchen Termin möchtest du?');
      }
    break;
    }
  }


// you can add the function name instead of an action map
app.handleRequest(responseHandler);

});

