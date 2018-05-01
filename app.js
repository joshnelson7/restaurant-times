var app = angular.module('plunker', []);

app.controller('MainCtrl', function($scope) {
  
  $scope.selectedDate;
  $scope.selectedTime;
  $scope.restaurantObjects;
  $scope.openRestaurants;
  
  var dayEnum = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7
  };
  
  function isDayRange(item) {
    if (item.charAt(0) == 'S' ||
        item.charAt(0) == 'M' ||
        item.charAt(0) == 'T' ||
        item.charAt(0) == 'W' ||
        item.charAt(0) == 'F') {
      return true;
    }
    
    return false;
  }
  
  function hourToDecimal(timeString, timeRange) {
    let splitOpenTime = timeString.split(":");
    let numHour = +splitOpenTime[0];
    let decimalTime = numHour === 12 ? 0 : numHour;
    if (splitOpenTime.length === 2) {
      decimalTime += splitOpenTime[1] / 60;
    }
    
    if (timeRange === 'pm') {
      decimalTime += 12;
    }
    
    return decimalTime;
  }
  
  function parseTime(splitTime, currIndex) {
    let hours = {};
    
    let openTime = splitTime[currIndex];
    let openTimeRange = splitTime[currIndex + 1];
    
    let closeTime = splitTime[currIndex + 3];
    let closeTimeRange = splitTime[currIndex + 4];
    
    hours.openTime = hourToDecimal(openTime, openTimeRange);
    hours.closeTime = hourToDecimal(closeTime, closeTimeRange);
    
    hours.totalTimeOpen = 0;
    
    if (hours.closeTime < hours.openTime) {
      hours.totalTimeOpen = 24 - hours.openTime + hours.closeTime;
    } else {
      hours.totalTimeOpen = hours.closeTime - hours.openTime;
    }

    return hours;
  }
  
  function getDays(splitTime) {
    let currIndex = 0;
    let ret = {};
    ret.retDays = [];
    let currString = splitTime[currIndex];
    while (isDayRange(currString)) {
      let dayRange = {};
      if (currString.indexOf(',') != -1) {//Strip the comma
        currString = currString.substring(0, currString.length - 1);
      }
      
      let days = currString.split('-');
      
      if (days.length == 2) { //This is the range case
        let start = dayEnum[days[0]];
        let end = dayEnum[days[1]];
        dayRange.start = start;
        dayRange.end = end;
      } else { //this is the single case
        let start = dayEnum[days[0]];
        dayRange.start = start;
        dayRange.end = start;
      }
      
      for (let i = dayRange.start; i <= dayRange.end; i++) {//include the end day
        ret.retDays.push(i);
      }
      
      currIndex++;
      currString = splitTime[currIndex];
    }
    ret.currIndex = currIndex;
    return ret;
  }
  
  function init() {
    $scope.restaurantObjects = [];
    
    restaurantHours.map(restaurant => {
      let restaurantObject = {};
      
      restaurantObject.name = restaurant.name;
      restaurantObject.timesOpen = {
        1: {},
        2: {},
        3: {},
        4: {},
        5: {},
        6: {},
        7: {}
      };
      
      restaurant.times.map(timeEntry => {
        let splitTime = timeEntry.split(' ');
        let days = getDays(splitTime);
        let timeParsed = parseTime(splitTime, days.currIndex);
        
        for (let i = 0; i < days.retDays.length; i++) {
          restaurantObject.timesOpen[days.retDays[i]] = timeParsed;
        }
      });
      
      $scope.restaurantObjects.push(restaurantObject);
    });
    
  }

  $scope.searchRestaurants = function() {
    let day = $scope.selectedDate.getDay();
    if (day === 0) {
      day = 7; //Set Sunday to 7 for easier parsing
    }
    let hours = $scope.selectedTime.getHours();
    let minutes = $scope.selectedTime.getMinutes() / 60;
    
    time = hours + minutes;
    $scope.openRestaurants = getOpenRestaurants(day, time);
  }
  
  function getOpenRestaurants(userDay, userTime) {
    let openRestaurants = [];
    
    let prevDay = userDay - 1 === 0 ? 7 : userDay - 1;
    for (let i = 0; i < $scope.restaurantObjects.length; i++) {
      let currentRestaurant = $scope.restaurantObjects[i];
      let dayTimes = currentRestaurant.timesOpen[userDay];
      let prevDayTimes = currentRestaurant.timesOpen[prevDay];
      
      if ((dayTimes.openTime || dayTimes.openTime === 0) && userTime < dayTimes.openTime || //check if should calculate
            (prevDayTimes.openTime || prevDayTimes.openTime === 0) && !(dayTimes.openTime)) {//total time from opening
        calculatedTime = 24 - prevDayTimes.openTime + userTime;
        if (calculatedTime < prevDayTimes.totalTimeOpen) {
          openRestaurants.push(currentRestaurant.name);
        }
      } else if (dayTimes.closeTime || dayTimes.closeTime === 0) {
        if (dayTimes.closeTime < dayTimes.openTime) { //check if it closes early next day
          if (userTime - dayTimes.openTime < dayTimes.totalTimeOpen) {
            openRestaurants.push(currentRestaurant.name);
          }
        } else {
          if (userTime < dayTimes.closeTime) {
            openRestaurants.push(currentRestaurant.name);
          }           
        }
      }
    }
    
    return openRestaurants;
  }
  
  init();
});
