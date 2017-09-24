'use strict';

angular.module('myApp.panels.scheduler', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/panels/scheduler', {
    templateUrl: 'panels/scheduler.html',
    controller: 'SchedulerCtrl'
  });
}])

.controller('SchedulerCtrl', ['$scope', '$http', '$sce', function($scope, $http, $filter, $sce, $timeout, $q) {
  $scope.showAdd = false;
  $scope.showSelected = false;
  $scope.showOptions = false;
    
  $scope.myData = [];
  $scope.roomList = [];
  $scope.timeSlots = [];
  $scope.panelDayList = [];
  $scope.schedule = {};
  $scope.trackList = [];
  $scope.STARTTIME = '2018-03-22 10:00:00';
  $scope.ENDTIME = '2018-03-26 23:00:00';
  $scope.showDay = '';
  $scope.showDate = '';
  $scope.showRoom = '';
  $scope.useRoom = '';
  $scope.panelStartTime = 0;
  $scope.panelEndTime = 0;
  $scope.selectedPanel = {};

  $scope.gridPanelsOptions = { 
    data: 'myData',
    multiSelect: false,
    columnDefs: [
      {field:'panel_title', displayName:'Title', width: '*', cellTemplate: '<div id="panel_id_{{row.entity.panel_id}}" class="ngCellText gridPanelsCellStyle draggable" ng-class="cellClass(row)" ng-dblclick="showPanelOptions2(row, $event)">{{row.getProperty(col.field)}}</div>'},
      {field:'approved_word', displayName:'Status', width: '75', cellTemplate: '<div class="ngCellText gridPanelsCellStyle draggable" ng-class="cellClass(row)">{{row.getProperty(col.field)}}</div>'},
      {field:'panel_length', displayName:'Length', width: '65', cellTemplate: '<div class="ngCellText gridPanelsCellStyle draggable" ng-class="cellClass(row)">{{row.getProperty(col.field)}}</div>'},
    ]
  };

  /**
   * Loads panel list for scheduler.
   */
  $scope.getPanelList = function() {
    $http.get('/admin/?p=events-and-exhibits/panels/reg/list&ret=json').
         then(function(data) {

      let panels = data.data.page;

      var pageLength = panels.length;

      for( var key in panels ) {
        $scope.updateApproval( panels[key], panels[key]['approved'] );
        $scope.myData.push( panels[key] );

        if( panels[key]['sched_room'] != null &&
              panels[key]['sched_start'] != null ) {

          $scope.registerPanelInSchedule(
              panels[key]['sched_room'].toString(),
              panels[key]['sched_start'],
              panels[key]
          );
        }
      }
    });
  };

  $scope.registerPanelInSchedule = function( roomId, startTime, panelObj ) {
    if( !$scope.schedule.hasOwnProperty(roomId) ) {
      $scope.schedule[roomId] = {};
    }

    if( !$scope.schedule[roomId].hasOwnProperty(startTime) ) {
      $scope.schedule[roomId][startTime] = {};
    }

    $scope.schedule[roomId][startTime] = panelObj;
  };

  $scope.isTimeBetweenTimes = function(timeSlot, startTime, endTime) {
    if( timeSlot.isSameOrAfter(endTime) ) {
      return 0;
    }
    if( timeSlot.isBefore(startTime) ) {
      return 0;
    }

    return 1;
  };

  $scope.classForRoom = function(roomId, timeSlot) {
    if( $scope.panelStartTime == 0 ) {
      return '';
    }

    var timeObj = moment(timeSlot);
    var startObj = moment($scope.panelStartTime + ':00');
    var endTimeObj = moment($scope.panelEndTime);

    if( roomId == $scope.useRoom ) {
      if( $scope.isTimeBetweenTimes(timeObj,startObj,endTimeObj) ) {
        return 'selectedRoomTime';
      } else {
        return 'selectedRoom';
      }
    } else if($scope.panelStartTime != 0 && $scope.isTimeBetweenTimes(timeObj,startObj,endTimeObj) ) {
      return 'selectedTime';
    }

    return '';
  }

  $scope.updateGrid = function () {
    $('.sched-grid-row').hide();
    $('.'+$scope.showdate).show();
  };

  $scope.updateApproval = function( data, status ) {
    data['approved_word'] = status == 1 ? "Approved" : "Pending";
    data['approved'] = status;
  };

  /**
   * Action taken when Add Panel to Schedule is clicked from panelScheduleFloat
   */
  $scope.addPanelToSchedule = function() {
    var panelObj = $scope.selectedPanel;
    var errorCount = 0;
    var errorMsg = '';

    if( panelObj.presenters.length <= 0 ) {
      errorMsg += "You cannot schedule a panel that has no presenters!\n";
      errorCount++;
    }
    if( $scope.panelStartTime <= 0 ) {
      errorMsg += "You must select a starting time to schedule a panel!\n";
      errorCount++;
    }
    if( $scope.useRoom <= 0 ) {
      errorMsg += "You must select a room in order to schedule a panel!\n";
      errorCount++;
    }
    if( $scope.showDate == '' ) {
      errorMsg += "You must select a day in order to schedule a panel!\n";
      errorCount++;
    }
    if( panelObj.panel_length == 0 ) {
      errorMsg += "That panel needs to have a length assigned.\n";
      errorCount++;
    }

    if( errorCount > 0 ) {
      alert( errorMsg );
      return;
    }
    var startTime = $scope.panelStartTime + ':00';
    var endTimeObj = moment($scope.panelEndTime);
    var endTime = endTimeObj.format('YYYY-MM-DD HH:mm:ss');

    $scope.addPanel( panelObj, $scope.useRoom, startTime, endTime, $scope.clearSelectedPanel );
  };


  /**
   * Get date Obj for time.
   * @param {String} timeString
   * @return {Object <Date>} dateObj
   */
  $scope.getDateForTime = function( timeString ) {
    var dateObj = new Date();
    var dateParts = timeString.split(':');
    dateObj.setHours(dateParts[0]);
    dateObj.setMinutes(dateParts[1]);
    dateObj.setSeconds(0);

    return dateObj;
  };

  /**
   * Takes Date obj and returns panel time
   * @param {Object <Date>} dateObj
   * @return {String} timeString
   */
  $scope.getTimeFromDate = function(dateObj) {
    var timeString = '';
    timeString += dateObj.getHours();
    timeString += ':';
    var m = dateObj.getMinutes();
    timeString += m >= 10 ? m : "0"+m;
    return timeString;
  };
  
  $scope.addMinutes = function(date, minutes) {
    return new Date(date.getTime() + minutes*60000);
  };
  
  /**
   * Takes panel ID and returns panel Object from $scope.myData
   * @param {Integer} id
   * @return {Object} panelObj
   */
  $scope.getPanelByField = function( field, id ) { 
    var panelObj;

    var f;
    for( var p in $scope.myData ) {
      f = String($scope.myData[p][field]).replace(/&/g, '&amp;');

      if( f == id ) {
        panelObj = $scope.myData[p];
        break;
      }
    }
    return panelObj;
  };


  /**
   * Takes day ID and returns Day Object from $scope.panelDayList
   * @param {Integer} id
   * @return {Object} dayObj
   */
  $scope.getDayById = function( id ) { 
    var dayObj;

    for( var p in $scope.panelDayList ) {
      if( $scope.panelDayList[p].date_id == id ) {
        dayObj = $scope.panelDayList[p];
        break;
      }
    }
    return dayObj;
  };
  
  /**
   * Takes Date object and returns date_id from $scope.panelDayList
   * @param {Integer} id
   * @return {Object} dayObj
   */
  $scope.getDateObjByDay = function( date ) { 
    var dayObj;

    var dateString = moment(date).format("YYYY-MM-DD");
    for( var p in $scope.panelDayList ) {
      if( $scope.panelDayList[p].panel_date == dateString ) {
        dayObj = $scope.panelDayList[p];
        break;
      }
    }
    return dayObj;
  };

  /**
   * Takes room ID and returns room Object from $scope.roomList
   * @param {Integer} id
   * @return {Object} roomObj
   */
  $scope.getRoomById = function( id ) { 
    var roomObj;

    for( var p in $scope.roomList ) {
      if( $scope.roomList[p].room_id == id ) {
        roomObj = $scope.roomList[p];
        break;
      }
    }
    return roomObj;
  };


  /**
   * Loads panel days, then rooms for scope.
   */
  $scope.loadPanelDayList = function(successFunc) {
    $http.get('/admin/?p=paneldaylist&ret=json&ns=1').
         then(function(data) {
      let days = data.data.page;

      for( var key in days ) {
        $scope.panelDayList.push( days[key] );
      }
      $scope.showDay = "Thursday";
      $scope.showDate = '1';

      successFunc(); // getTimeslots

      $http.get('/admin/?p=roomlist&ret=json&ns=1').
            then(function(data) {
        $scope.roomList = data.data.page;
      });
    });
  };


  $scope.getTimeSlots = function() {
    var startTime = new Date($scope.STARTTIME);
    var endTime = new Date($scope.ENDTIME);

    var workingTime = startTime;
    var useDate = 0;

    while( workingTime <= endTime ) {
      var dateObj = $scope.getDateObjByDay(workingTime);
      var dateId = dateObj.date_id;// get dateId from workingTime;
      var schedStart = moment(workingTime).format("YYYY-MM-DD HH:mm"); // get military time from workingTime

      if( useDate == '' || schedStart.match( /06:00/ ) ) {
        useDate = dateId;
      }

      $scope.timeSlots.push( { startTime: schedStart, dateId: useDate, fullTime: schedStart+":00" } );

      workingTime = $scope.addMinutes(workingTime,15);
    }
  }; 

  $scope.cellClass = function(row) {
    var obj = $scope.getPanelFromScheduleByField( 'panel_id', row.entity.panel_id );

    if( obj != undefined ) {
      return 'highlight-blue';
    } else { return ''; }
  };

  $scope.getDuration = function( startTime, endTime ) {
    var startDate = $scope.getDateForTime( startTime );
    var endDate = $scope.getDateForTime( endTime );

    var hours = endDate.getHours() - startDate.getHours();
    if( hours < 0 ) hours += 24;

    return hours;
  };

  $scope.normalizeTime = function( timeVar ) {
    var timeParts = timeVar.split( ':' );
    if( parseInt(timeParts[0]) < 10 ) {
      timeVar = '0'+timeVar;
    }
    timeVar += ":00";
    return timeVar;
  };

  $scope.getPanelClasses = function(panelObj) {
    if( panelObj != undefined )
      return "rowSpan"+parseInt(panelObj.panel_length*4)+ " trackStyle_"+panelObj.panel_track;

    return '';
  };
  
  $scope.unschedule = function(panel_id) {
//    var panelObj = $scope.getPanelByField( 'panel_id', panel_id );
    var panelObj = $scope.selectedPanel;
      
    if( panelObj != undefined ) {
      if( confirm( "Do you want to remove "+panelObj.panel_title+" from the schedule?" ) ) {
        var panelId = panelObj.panel_id;

        var postData = 'ret=json&ns=1&p=unschedule&panel_id=' + panel_id;

        $http.post('/admin/',
               postData,
               { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
          then(function(data) {
            if( data.data.status == "SUCCESS" ) {
              var roomId = panelObj.sched_room;
              var startTime = panelObj.sched_start;

              $scope.schedule[roomId][startTime] = undefined

              panelObj.sched_room = undefined;
              panelObj.sched_start = undefined;
              panelObj.sched_end = undefined;
   
              $scope.showOptions = false;

            } else if( data.data.status == "ERROR"
                       && data.data.error == "businesslogic" ) {
              alert( data.data.error_msg );
            }
        });
      }
    }
  };
  
  /**
   * Adds panel to schedule
   * @param {Integer} id
   * @return {Object} dayObj
   */
  $scope.addPanel = function( panelObj, roomId, startTime, endTime, onSuccess ) { 
    var panelId = panelObj.panel_id;

    var dateId = $scope.getDateObjByDay(startTime).date_id;

    var postData = 'ret=json&ns=1&p=addtoschedule&panel_id=' + panelId + '&room_id=' + 
      roomId + "&schedstart=" + startTime + "&schedend=" + endTime + '&date_id=' + dateId;

    $http.post('/admin/',
               postData,
               { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
       then(function(data) {
         if( data.data.status == "SUCCESS" ) {
           $scope.registerPanelInSchedule( roomId, startTime, panelObj);

           panelObj.sched_start = startTime;
           panelObj.sched_end = endTime;
           panelObj.sched_room = roomId;
           var roomObj = $scope.getRoomById(roomId);

           alert( panelObj.panel_title+" scheduled starting "+startTime+" and ending "+endTime+" in room "+roomObj.room_name );

           onSuccess();
         } else if( data.data.status == "ERROR"
                    && data.data.error == "businesslogic" ) {
           alert( data.data.error_msg );
         }
    });
  };

  /**
   * Loads track data
   */
  $scope.getTrackList = function() {
    $http.get('/admin/?p=track/list&ret=json').
         then(function(data) {
      $scope.trackList = data.data.page;
    });
  };

  $scope.classByTime = function( startTime ) {
    if( startTime.indexOf(':00') > -1 ) {
      return 'topRow';
    }

    return '';
  };

  $scope.setEndTime = function( startTime ) {
    var dateObj = $scope.formatDate(startTime);

    dateObj.setTime(dateObj.getTime() + ( $scope.selectedPanel.panel_length * 60 * 60 * 1000 ));

    $scope.panelEndTime = dateObj;
  };

  $scope.popupDivHide = function() { $scope.showOptions = false; };
  $scope.closeOptions = function() { $scope.showOptions = false; };

  $scope.showPanelOptions = function( sTime, roomId, $event) {
    var panelObj = $scope.schedule[roomId][sTime];
    $scope.displayPanelOptions(panelObj, $event);
  };

  $scope.showPanelOptions2 = function( row, $event ) {
    var obj = $scope.getPanelByField( 'panel_id', row.entity.panel_id );
    $scope.displayPanelOptions(obj, $event);
  };

  $scope.clearSelectedPanel = function() {
    $scope.useRoom = '';
    $scope.panelStartTime = 0;
    $scope.panelEndTime = 0;

    $scope.showSelected = false;
  };

  $scope.selectPanelRow = function( row ) {
    if( row.panel_selected != 1 ) {
      let myDataLength = $scope.myData.length;

      for(let x = 0; x < myDataLength; x++) {
        $scope.myData[x].panel_selected = 0;
      }
      row.panel_selected = 1;
    } else {
      row.panel_selected = 0;
    }
  };

  $scope.showPanelSchedData = function( row ) {
    $scope.selectedPanel = row;
    $scope.showSelected = true;
    $scope.showAdd = false;
  };

  $scope.displayPanelOptions = function( panelObj, $event ) {
    console.log(panelObj);

    if( panelObj != undefined ) {
      let panel_id = panelObj.panel_id;

      let srcY = $event.clientY;
      let srcX = $event.clientX;

      $scope.selectedPanel = panelObj;

      $('#popupDiv').css({
        top: srcY+$(window).scrollTop()-$('#popupDiv').height(),
        left: srcX-($('#popupDiv').width()/2)
      });
      $scope.showOptions = true;
    }
  };

  $scope.formatDate = function(date) {
    return new Date(date);
  };

  $scope.showPanelList = function() { $scope.showAdd = !$scope.showAdd; };

  $scope.showList = function() { return $scope.showAdd; };
  $scope.doShowOptions = function() { return $scope.showOptions; };
  $scope.showSelectedPanel = function() { return $scope.showSelected; };

  $scope.getPanelList();
  $scope.getTrackList();
  $scope.loadPanelDayList($scope.getTimeSlots);
}]);



