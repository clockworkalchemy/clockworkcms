'use strict';

var app = angular.module('myApp', ['ngGrid']);

app.

  /**
   * Schedule List Controller
   */
  controller('scheduleListCtrl', function($scope, $http, $filter, $sce, $q, $timeout) {
    $scope.myData = [];
    $scope.roomList = [];
    $scope.timeSlots = [];
    $scope.panelDayList = [];
    $scope.scheduleData = [];
    $scope.orgScheduleData = {};
    $scope.trackList = [];
    $scope.STARTTIME = '2017-05-25 10:00:00';
    $scope.ENDTIME = '2017-05-29 17:00:00';
    $scope.showDay = '';
    $scope.showRoom = '';
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
           success(function(data,status,headers,config) {

        var pageLength = data.page.length;

        for( var key in data.page ) {
          $scope.updateApproval( data.page[key], data.page[key]['approved'] );
          $scope.myData.push( data.page[key] );
        }
      }).then( function() {
        setTimeout( function() {
          $( ".draggable" ).draggable({ 
            start: $scope.setupDroppable,
            helper: "clone",
            appendTo: "body" });
        }, 1000 );
      });
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    $scope.getSchedForRoomDateTime = function() {
    // $scope.scheduleData 
    };
    
    
    // load Schedule Table
    $scope.scheduleTable = function() {      
      if( $scope.roomList.length < 1 ) {
        return $sce.trustAsHtml("");
      } else if( $scope.myData.length < 1 ) {
        return $sce.trustAsHtml("");
      } else { 
        var defered = $q.defer();
      
        var startTime = new Date($scope.STARTTIME);
        var endTime = new Date($scope.ENDTIME); 
        var grid = "<TABLE class='sched-grid-table'>\n";
        grid += "<tr class='sched-grid-row-header'><th class='sched-grid-head'>Times</th>\n";
      
        var roomLength = $scope.roomList.length;
        for ( var roomX = 0; roomX < roomLength; roomX++ ) {
          var room = $scope.roomList[roomX];
          grid += "<th class='sched-grid-head' id='room_id-"+room.room_id+"'>"+room.nickname+"</th>\n";
        }
        grid += "</tr>\n";
        
        var useDate = '';
        var workingTime = startTime;
        while( workingTime <= endTime ) {
          var dateObj = $scope.getDateObjByDay(workingTime);
          var dateId = dateObj.date_id;// get dateId from workingTime;
          var schedStart = moment(workingTime).format("YYYY-MM-DD HH:mm:ss"); // get military time from workingTime 
          var schedStart12 = $scope.getTimeFromDate(workingTime); // get 12 hour time from workingTime

          if( useDate == '' || schedStart.match( /06:00/ ) ) {
            useDate = dateId;
          }

          var oneRow = '';
          var rowFound = 0;
          oneRow += "<tr class='sched-grid-row sched-date-"+useDate+"'>\n";
          // show start time only on hour and half hours
          if( schedStart.match( /:(0|3)0:00$/ ) ) {
            oneRow += "<td rowspan='2' class='sched-grid-time'>"+schedStart12+"</td>";
          }

          for ( var roomX = 0; roomX < roomLength; roomX++ ) {
            var room = $scope.roomList[roomX];
            var roomId = room.room_id;
            var panel = $scope.getPanelFromSchedule( dateId, schedStart, roomId );
            var slotId = dateId+"_"+moment(schedStart).format('HH:mm:ss')+"_"+roomId;
            
            // If the panel exists and starts at the current time
            if( panel != undefined && panel.schedstart == schedStart ) {
              var rows = parseInt(panel.panel_length * 4);

              /**
               * This is the actual cell with the panel
               */
              oneRow += "<td "+
                  "id='sched-panel-"+panel.panel_id+"' " +
                  "class='sched-grid-panel sched-grid-panel-cell track-"+panel.track_name+"' " +
                  "rowspan='"+rows+"' "+
                  "ngClick='unschedule("+panel.panel_id+")' "+
                ">" +
                   panel.panel_title +
                "</td>\n";

              rowFound++;
            // There is a panel in this time, but it didn't start now
            } else if( panel != undefined ) {
              oneRow += "<!-- panel_id "+panel.panel_id+"schedule_id "+panel.schedule_id+" -->";
              rowFound++;
              
            // Empty slot
            } else {
              oneRow += "<td id='"+slotId+"' class='sched-grid-panel droppable'>&nbsp;</td>\n";
            }
          }
          oneRow += "</tr>\n";

          if( 1==1 || rowFound > 0 ) {
            grid += oneRow;
          }

          workingTime = $scope.addMinutes(workingTime,15);
        }
        grid += "</table>";
      
        return $sce.trustAsHtml(grid);
      }
    };

    $scope.doSomething = function() { alert("do something" ); };
    /////////////////////////////////////////////////////////////////////////////////////////////////////

    $scope.updateGrid = function () {
      $('.sched-grid-row').hide();
      $('.'+$scope.showdate).show();
    };

    $scope.updateApproval = function( data, status ) {
      data['approved_word'] = status == 1 ? "Approved" : "Pending";
      data['approved'] = status;
    };


    /**
     * Loads schedule data
     */
    $scope.getScheduleData = function() {
      $http.get('/admin/?p=scheduleData&ret=json').
           success(function(data,status,headers,config) {

        $scope.scheduleData = [];
        for( var key in data.page ) {
          $scope.scheduleData.push( data.page[key] );
          var roomId = data.page[key].room_id;
          var dateId = data.page[key].date_id;
          var schedStart = data.page[key].schedstart;

          if( !$scope.orgScheduleData.hasOwnProperty( roomId.toString() ) ) {
            $scope.orgScheduleData[roomId.toString()] = {}
          }
          if( !$scope.orgScheduleData[roomId.toString()].hasOwnProperty( dateId.toString() ) ) {
            $scope.orgScheduleData[roomId.toString()][dateId.toString()] = {}
          }
          if( !$scope.orgScheduleData[roomId.toString()][dateId.toString()].hasOwnProperty( schedStart ) ) {
            $scope.orgScheduleData[roomId.toString()][dateId.toString()][schedStart] = {}
          }

          $scope.orgScheduleData[roomId.toString()][dateId.toString()][schedStart] = data.page[key];
        }

        $scope.loadPanelDayList($scope.getTimeSlots);
      });
    };

    $scope.getPanelFromScheduleByField = function( field, id ) {
      var obj;

      for( var p in $scope.scheduleData ) {
        if( $scope.scheduleData[p][field] == id ) {
          obj = $scope.scheduleData[p];
          break;
        }
      }
      return obj;
    };


    /**
     * Action taken when a Panel is dropped into the schedule.
     * @param {Object} event
     * @param {Object} ui
     */
    $scope.dropPanel = function( event, ui ) {
      var panelObj;
      var elemId = ui.draggable.prop("id");
      var panel_id = elemId.split('_id_')[1];

      console.log("drop panel: "+panel_id);
      panelObj = $scope.getPanelByField( 'panel_id', panel_id );

      if( panelObj == undefined ) {
        alert( "Something went wrong dropping "+ui.draggable[0].innerHTML );
        return;
      }
      if( panelObj.schedstart != undefined ) {
        alert( ui.draggable[0].innerHTML+" is already scheduled" );
        return;
      }
      if( panelObj.presenters.length <= 0 ) {
        alert( "You cannot schedule a panel that has no presenters!");
        return;
      }

      var targetId = this.getAttribute("id");
      var schedParts = targetId.split("_");
      var dayObj = $scope.getDayById(schedParts[0]);
      var roomObj = $scope.getRoomById(schedParts[2]);
      console.log(schedParts[1]);
      var startTimeObj = moment(schedParts[1]);

      if( panelObj.panel_length == 0 ) {
        alert( panelObj.panel_title+" has no length. Enter an end time. It was dropped into "+dayObj.panel_day+" "+dayObj.panel_date+" starting "+schedParts[1]+" in room "+roomObj.room_name );
      } else {
        var endTimeObj = moment(schedParts[1]);
        endTimeObj.add("m",60*panelObj.panel_length); // We can have less than 1 hour panels, so use minutes
        var endTime = endTimeObj.format('YYYY-MM-DD HH:mm:ss');
        var startTime = startTimeObj.format('YYYY-MM-DD HH:mm:ss');

        $scope.addPanel( panelObj, dayObj, roomObj, startTime, endTime );
      }
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
      //var dateString = $scope.getDayFromDate(date);
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
           success(function(data,status,headers,config) {
        for( var key in data.page ) {
          $scope.panelDayList.push( data.page[key] );
        }
        $scope.showDay = "Thursday";
        $scope.showDate = '0';

        successFunc(); // getTimeslots
      }).then( function() {
        $http.get('/admin/?p=roomlist&ret=json&ns=1').
              success(function(data,status,headers,config) {

          for( var key in data.page ) {
            $scope.roomList.push( data.page[key] );
          }
        });
      });
    };


    /**
     * Initialize Droppable actions on visible .droppable elements
     */
    $scope.setupDroppable = function() {
        $( ".droppable" ).droppable({
          drop: $scope.dropPanel,
          hoverClass: "panelGridTimeHover",
          tolerance: 'pointer'
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

        $scope.timeSlots.push( { startTime: schedStart, dateId: useDate } );

        workingTime = $scope.addMinutes(workingTime,15);
      }
    }; 

    /**
     * sets window.location.href to edit panel page.
     * @param {Object} row
     */
    $scope.editPanel = function(row) {
      window.location.href = '/panels/index.cgi?p=edit&panel_sub_id='+row.entity.panel_sub_id;
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

    // Needs to take into account end times...
    $scope.getPanelFromSchedule = function( dateId, sTime, roomId ) {
      var i = 0;
      var scheduleCount = $scope.scheduleData.length;

      var panelObj;
      
      while( i < scheduleCount ) {
        if( moment(sTime).isSameOrAfter($scope.scheduleData[i].schedstart)
            && moment(sTime).isBefore($scope.scheduleData[i].schedend)
            && $scope.scheduleData[i].room_id == roomId ) {
          panelObj = $scope.getPanelByField( 'panel_id', $scope.scheduleData[i].panel_id );

          panelObj.schedule_id = $scope.scheduleData[i].schedule_id;

          if( panelObj.panel_length == 0 ) {
            panelObj.duration = panelObj.panel_length;
          } else {
            panelObj.duration = $scope.getDuration( $scope.scheduleData[i].schedstart,
                                                    $scope.scheduleData[i].schedend );
          }

          break;
        }
        i++;
      }

      return panelObj;
    };

    // 
    $scope.getPanelFromScheduleByData = function( dateId, sTime, roomId ) {
      var dateObj = $scope.getDateObjByDay(sTime);
      var dateId = dateObj.date_id;// get dateId from workingTime;
      var schedStart = sTime+":00";
      var panelObj = {};
      if( $scope.orgScheduleData[roomId.toString()] != undefined ) {
        if( $scope.orgScheduleData[roomId.toString()][dateId.toString()] != undefined ) {
          if( $scope.orgScheduleData[roomId.toString()][dateId.toString()][schedStart] != undefined ) {

            var schedObj = $scope.orgScheduleData[roomId.toString()][dateId.toString()][schedStart];
            panelObj = $scope.getPanelByField( 'panel_id', schedObj.panel_id );
            panelObj.duration = panelObj.panel_length;
          }
        }
      }

      return panelObj;
    };

    /**
     * Takes startTime and roomId and returns schedule Element from $scope.scheduleList
     * @param {String} sTime
     * @param {Integer} roomId
     * @return {String} Dom element for panel
     */
    $scope.getPanelDiv = function(sTime, roomId) {
      $scope['paneldiv_'+roomId+'_'+sTime] = '';

      var result = '';

      var dateId = undefined;
      var panelObj = $scope.getPanelFromScheduleByData( dateId, sTime, roomId );

      if( panelObj != undefined
          && sTime+":00" == panelObj.schedstart ) {
        var panelClass = "rowSpan"+parseInt(panelObj.panel_length*4);
        result = "<div class='panelGridTimePanel trackStyle_"+panelObj.panel_track+" "+panelClass+"'>"+panelObj.panel_title+"</div>";
      }

      return $sce.trustAsHtml(result);
    };
    
    $scope.unschedule = function(panel_id) {
      console.log("unschedule");
      var panelObj = $scope.getPanelByField( 'panel_id', panel_id );
        
      if( panelObj != undefined ) {
        if( confirm( "Do you want to remove "+panelObj.panel_title+" from the schedule?" ) ) {
          console.log(panelObj);

          var panelId = panelObj.panel_id;

          var postData = 'ret=json&ns=1&p=unschedule&schedule_id='+panelObj.schedule_id;

          console.log(postData);
          $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
            success(function(data,status,headers,config) {
              if( data.status == "SUCCESS" ) {
                var l = $scope.scheduleData.length;
                for( var x = 0; x < l; x++ ) {
                  if( $scope.scheduleData[x].panel_id == panelId ) {
                    $scope.scheduleData.splice(x,1);
                    break;
                  }
                }
                $scope.popupDivHide();

              } else if( data.status == "ERROR"
                         && data.error == "businesslogic" ) {
                alert( data.error_msg );
              }
          });
        }
      }
    };
    
    $scope.XXXunschedulePanel = function(dateId, sTime, roomId) {
      var panelObj = $scope.getPanelFromSchedule( dateId, sTime, roomId );
      if( panelObj != undefined ) {
        if( confirm( "Do you want to remove "+panelObj.panel_title+" from the schedule?" ) ) {
          console.log(panelObj);

          var panelId = panelObj.panel_id;

          var postData = 'ret=json&ns=1&p=unschedule&schedule_id='+panelObj.schedule_id;

          console.log(postData);
          $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
            success(function(data,status,headers,config) {
              if( data.status == "SUCCESS" ) {
                var l = $scope.scheduleData.length;
                for( var x = 0; x < l; x++ ) {
                  if( $scope.scheduleData[x].panel_id == panelId ) {
                    $scope.scheduleData.splice(x,1);
                    break;
                  }
                }
                $scope.popupDivHide();
              } else if( data.status == "ERROR"
                         && data.error == "businesslogic" ) {
                alert( data.error_msg );
              }
          });
        }
      }
    };

    /**
     * Takes day ID and returns Day Object from $scope.panelDayList
     * @param {Integer} id
     * @return {Object} dayObj
     */
    $scope.addPanel = function( panelObj, dayObj, roomObj, startTime, endTime ) { 
      var panelId = panelObj.panel_id;
      var dateId = dayObj.date_id;
      var roomId = roomObj.room_id;

      var postData = 'ret=json&ns=1&p=addtoschedule&panel_id='+panelId+"&date_id="+dateId+"&room_id="+
        roomId+"&schedstart="+startTime+"&schedend="+endTime;

      $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
         success(function(data,status,headers,config) {
           if( data.status == "SUCCESS" ) {
             data.added.start_time = moment(data.added.schedstart).format('HH:mm:ss');
             data.added.end_time = moment(data.added.schedend).format('HH:mm:ss');
             $scope.scheduleData.push( data.added );

             if( !$scope.orgScheduleData.hasOwnProperty( data.added.room_id.toString() ) ) {
               $scope.orgScheduleData[data.added.room_id.toString()] = {}
             }
             if( !$scope.orgScheduleData[data.added.room_id].hasOwnProperty( data.added.date_id.toString() ) ) {
               $scope.orgScheduleData[data.added.room_id.toString()][data.added.date_id.toString()] = {}
             }
             if( !$scope.orgScheduleData[data.added.room_id.toString()][data.added.date_id.toString()].hasOwnProperty( data.added.schedstart ) ) {
               $scope.orgScheduleData[data.added.room_id.toString()][data.added.date_id.toString()][data.added.schedStart] = {}
             }

             $scope.orgScheduleData[data.added.room_id.toString()][data.added.date_id.toString()][data.added.schedStart] = data.added;

             alert( panelObj.panel_title+" dropped into "+dayObj.panel_day+" "+dayObj.panel_date+" starting "+startTime+" and ending "+endTime+" in room "+roomObj.room_name );
          } else if( data.status == "ERROR"
                     && data.error == "businesslogic" ) {
             alert( data.error_msg );
          }
      });
    };

    $scope.getTrackList = function() {
      /**
       * Loads track data
       */
      $http.get('/admin/?p=track/list&ret=json').
           success(function(data,status,headers,config) {
        for( var key in data.page ) {
          $scope.trackList.push( data.page[key] );
        }
      });
    };

    $scope.classByTime = function( startTime ) {
      if( startTime.indexOf(':00') > -1 ) {
        return 'topRow';
      }

      return '';
    };

    $scope.popupDivHide = function() { $('#popupDiv').hide(); };

    $scope.showPanelOptions = function( dateId, sTime, roomId, $event) {
      var panelObj = $scope.getPanelFromSchedule( dateId, sTime, roomId );
      $scope.displayPanelOptions(panelObj, $event);
    };
    $scope.showPanelOptions2 = function( row, $event ) {
      var obj = $scope.getPanelByField( 'panel_id', row.entity.panel_id );
      $scope.displayPanelOptions(obj, $event);
    };

    $scope.displayPanelOptions = function( panelObj, $event ) {
      // popupDiv

      if( panelObj != undefined ) {
        var panel_id = panelObj.panel_id;
        console.log(panelObj);

        var srcY = $event.clientY;
        var srcX = $event.clientX;

        $scope.selectedPanel = panelObj;

        $('#popupDiv').css({
          top: srcY+$(window).scrollTop()-$('#popupDiv').height(),
          left: srcX-$('#popupDiv').width()
        }).show();

      }
    };


    $scope.formatDate = function(date) {
      return new Date(date);
    };

    $scope.getScheduleData();
    $scope.getPanelList();
    $scope.getTrackList();
});



