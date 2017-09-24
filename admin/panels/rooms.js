'use strict';

angular.module('myApp.panels.rooms', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/panels/rooms', {
    templateUrl: 'panels/rooms.html',
    controller: 'RoomsCtrl'
  });
}])

.controller('RoomsCtrl', ['$scope', '$http', '$sce', function($scope, $http, $filter, $sce) {
  $scope.showNew = false;
  $scope.showEdit = false;
  $scope.roomList = [];
  $scope.trackList = [];
  $scope.trackToAdd = '';
  $scope.editRoom = {};
  $scope.editOrig = {};
  $scope.newRoom = {
    room_name: '',
    description: '',
    capacity: '',
    mapclass: '',
    floornum: '',
    latitude: '',
    longitude: '',
    roomstatus: '',
    nickname: ''
  };

  $scope.getTrackListForRoom = function( roomObj ) {
    var roomTrackList = '';
    for( var track in roomObj.room_tracks ) {
      if( roomTrackList == '' ) {
        roomTrackList += roomObj.room_tracks[track].track_name;
      } else {
        roomTrackList += ', '+roomObj.room_tracks[track].track_name;
      }
    }
    if( roomTrackList == '' ) { roomTrackList = "Add to a Track"; }

    return roomTrackList;
  };

  $scope.loadRoomList = function() {
    $http.get('/admin/?p=roomlist&ret=json&ns=1&showall=1').
      then(function(data) {
        let rooms = data.data.page;

        $scope.roomList.length = 0;

        for( var key in rooms ) {
          var roomTrackList = $scope.getTrackListForRoom( rooms[key] );
          rooms[key].room_track_list = roomTrackList;
          rooms[key].roomstatus_name = rooms[key].roomstatus == 1 ? "Active" : "Inactive";
          $scope.roomList.push( rooms[key] );
        }
      });
  };

  /**
   * Loads track data
   */
  $scope.loadTrackData = function() {
    $http.get('/admin/?p=track/list&ret=json').
         then(function(data) {
      let tracks = data.data.page;

      for( var key in tracks ) {
        $scope.trackList.push( tracks[key] );
      }
    });
  };

  $scope.toggleRoomStatus = function() {
    if( $scope.roomGridOptions.selectedItems.length <= 0 ) {
      alert( "Select a room to update status." );
      return;
    }

    var roomId = $scope.roomGridOptions.selectedItems[0].room_id;
    var roomStatus = $scope.roomGridOptions.selectedItems[0].roomstatus;
    roomStatus = Math.abs(roomStatus-1);

    var postData = 'ret=json&p=room/status&room_id='+roomId+"&roomstatus="+roomStatus;

    $http.post('/admin/',
               postData,
               { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
      then(function(data) {
        if( data.data.status == "SUCCESS" ) {
          for( var key in $scope.roomList ) {
            if( $scope.roomList[key].room_id == roomId ) {
              $scope.roomList[key].roomstatus = roomStatus;
              $scope.roomList[key].roomstatus_name = roomStatus == 1 ? "Active" : "Inactive";
            }
          }
        }
      });
  }

  $scope.addTrackToRoom = function() {
    if( $scope.trackToAdd == '' ) { alert( "Select a track to add it to a room." ); return; }
    if( $scope.roomGridOptions.selectedItems.length <= 0 ) {
      alert( "Select a room to add a track to it." );
      return;
    }
    
    var trackId = $scope.trackToAdd;
    var roomId = $scope.roomGridOptions.selectedItems[0].room_id;
    var postData = 'ret=json&p=addtrackroom&room_id='+roomId+"&track_id="+trackId;

    $http.post('/admin/',
               postData,
               { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
       then(function(data) {
         if( data.data.status == "SUCCESS" ) {
           for( var key in $scope.roomList ) {
             if( $scope.roomList[key].room_id == roomId ) {
               let track = $scope.getTrackById(trackId);
               track.track_fk = trackId;
               track.room_fk = roomId;

               $scope.roomList[key].room_tracks.push( track );

               var roomTrackList = $scope.getTrackListForRoom( $scope.roomList[key] );
               $scope.roomList[key].room_track_list = roomTrackList;
             }
           }
           alert( "Added track to room" );
        } else if( data.data.status == "ERROR" ) {
           alert( "Could not add track to room" );
        }
    });
  };

  $scope.removeTrack = function(row) {
    let trackId = row.entity.id;
    let roomId = row.entity.room_fk;
    let postData = 'ret=json&p=deletetrackroom&method=delete&room_id='+roomId+"&track_id="+trackId;
    let key = $scope.roomList.indexOf($scope.editRoom);

    $http.post('/admin/',
               postData,
               { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
       then(function(data) {
         if( data.data.status == "SUCCESS" ) {
           let i = $scope.editRoom.room_tracks.indexOf(row.entity);

           if( i > -1 ) {
             $scope.editRoom.room_tracks.splice(i, 1);

             let roomTrackList = $scope.getTrackListForRoom( $scope.roomList[key] );
             $scope.roomList[key].room_track_list = roomTrackList;
           }
        }
    });
  };

  var cellTemp = '<div class="ngCellText" ng-class="cellClass(row)">{{row.getProperty(col.field)}}</div>';
  var removeTrackTmpl = '<div class="ngCellText" ng-class="cellClass(row)"><button ng-click="removeTrack(row)">[X]</button></div>';

  $scope.roomGridOptions = { 
    data: 'roomList',
    multiSelect: false,
    enableColumnResize: true,
    selectedItems: [],
    sortInfo: { fields:['roomstatus_name','room_name'], directions:['asc'] },
    columnDefs: [
      {field:'room_id', displayName:'ID', width: 40, cellTemplate: cellTemp },
      {field:'room_name', displayName:'Room', width: '220', cellTemplate: '<div class="ngCellText" ng-class="cellClass(row)" ng-dblclick="editRoomStart(row)">{{row.getProperty(col.field)}}</div>'},
      {field:'description', displayName:'Description', width: '*', cellTemplate: cellTemp},
      {field:'capacity', displayName:'Capacity', width: '100', cellTemplate: cellTemp},
      {field:'room_track_list', displayName:'Tracks', cellTemplate: cellTemp, width: '120' },
      {field:'roomstatus_name', displayName:'Status', width: 80, cellTemplate: cellTemp },
    ]
  };

  $scope.roomTrackGrid = {
    data: 'editRoom.room_tracks',
    multiSelect: false,
    columnDefs: [
      {field: 'track_name', width: '*', displayName: 'Track Name'},
      {field: 'track_id', width: '50', displayName: '', cellTemplate: removeTrackTmpl },
    ]
  };

  $scope.cellClass = function(row) {
    if( row.entity.roomstatus == '0' ) {
      return 'highlight';
    } else { return ''; }
  };

  $scope.getTrackById = function( id ) { 
    var dataObj;

    for( var p in $scope.trackList ) {
      if( $scope.trackList[p].id == id ) {
        dataObj = $scope.trackList[p];
        break;
      }
    }
    return dataObj;
  };

  $scope.editRoomStart = function(row) {
    $scope.showEdit = true;
    $scope.editRoom = row.entity;
    angular.copy( row.entity, $scope.editOrig );
  };

  $scope.saveEdits = function() {
    let putData = 'ret=json&ns=1&p=room&method=put&room_id='+$scope.editRoom['room_id'];
    let hadEdits = false;
    let checkTypes = ['string','number'];

    for (var p in $scope.editRoom) {
      if ($scope.editRoom.hasOwnProperty(p)) {
        if(checkTypes.indexOf(typeof $scope.editRoom[p]) > -1) {
          if($scope.editRoom[p] != $scope.editOrig[p]) {
            putData += '&' + p + '=' + encodeURIComponent($scope.editRoom[p]);
            hadEdits = true;
          }
        }
      }
    }

    if( hadEdits ) {
      $http.post('/admin/',
                 putData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
         then(function(data) {
           if( data.data.status == "SUCCESS" ) {
             $scope.loadRoomList();
             $scope.showEdit = false;
           }
      });
    } else {
      $scope.showEdit = false;
    }
  };

  $scope.cancelEditRoom = function() {
    $scope.showEdit = false;
  }

  $scope.newRoomStart = function() {
    $scope.showNew = true;
  };

  $scope.addRoom = function() {
    var postData = 'ret=json&ns=1&p=room';

    for (var p in $scope.newRoom) {
      if ($scope.newRoom.hasOwnProperty(p)) {
        postData += '&' + p + '=' + encodeURIComponent($scope.newRoom[p]);
      }
    }

    $http.post('/admin/',
               postData,
               { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
       then(function(data) {
         if( data.data.status == "SUCCESS" ) {
           $scope.showNew = false;
           $scope.loadRoomList();
         }
    });

  };


  $scope.getTableHeight = function() {
    return {
      height: Math.min( $scope.roomList.length * 30, 600 ) + 'px'
    };
  };

  $scope.getTrackTableHeight = function() {
    if( !$scope.editRoom.hasOwnProperty('room_tracks') ) {
      return { height: '100px', width: '200px' };
    } else {
      return {
        height: Math.min( $scope.editRoom.room_tracks.length * 50, 600 ) + 'px',
        width: '200px',
      };
    }
  };

  $scope.cancelNewRoom = function() {
    $self.showNew = false;
  };

  $scope.showNewRoom = function() {
    return $scope.showNew;
  };
  $scope.showEditRoom = function() {
    return $scope.showEdit;
  };
  $scope.showRoomList = function() {
    return !$scope.showNew && !$scope.showEdit;
  };

  $scope.loadRoomList();
  $scope.loadTrackData();
}]);

