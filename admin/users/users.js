
angular.module('myApp.users', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/users', {
    templateUrl: 'users/users.html',
    controller: 'UsersCtrl'
  });
}])

.controller('UsersCtrl', ['$scope', '$http', '$sce', function($scope, $http, $sce) {
    $scope.userList = [];
    $scope.trackList = [];
    $scope.groupList = [];
    $scope.newUser = [];
    $scope.groupToAdd = '';

    $scope.getTableHeight = function() {
      return {
        height: Math.min( $scope.userList.length * 30, 600 ) + 'px'
      };
    };

    $scope.addTrackToUser = function(  ) {
      if( $scope.trackToAdd == '' ) { alert( "Select a track to add it to a user." ); return; }
      if( $scope.gridOptions.selectedItems.length <= 0 ) {
        alert( "Select a user to add a track to it." );
        return;
      }

      var trackId = $scope.trackToAdd;

      var user = $scope.gridOptions.selectedItems[0];
      var userId = user.id;
      var postData = 'ret=json&p=addtrackuser&user_id='+userId+"&track_id="+trackId;
      console.log( postData );

      $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
         then(function(data) {
           var data = data.data;
           console.log(data);
           if( data.status == "SUCCESS" ) {

             $scope.getUserList();
             alert( "Added track to user" );
          } else if( data.status == "ERROR" ) {
             alert( "Could not add track to user" );
          }
      });
    };

    $scope.addGroupToUser = function() {
      console.log("Add group to user");
      if( $scope.groupToAdd == '' ) { alert( "Select a group to add it to a user." ); return; }
      if( $scope.gridOptions.selectedItems.length <= 0 ) {
        alert( "Select a user to add a group to it." );
        return;
      }

      var groupId = $scope.groupToAdd;

      var userId = $scope.gridOptions.selectedItems[0].id;
      var postData = 'ret=json&p=addgroupuser&user_id='+userId+"&group_id="+groupId;
      console.log( postData );

      $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
         then(function(data) {
           var data = data.data;

           if( data.status == "SUCCESS" ) {
             $scope.getUserList();

             alert( "Added group to user" );
          } else if( data.status == "ERROR" ) {
             alert( "Could not add group to user" );
          }
      });

    };

    $scope.getUserList = function() {
      $scope.userList = [];
      $http.get('/admin/?p=userlist&ret=json').
           then(function(data) {
        var page = data.data.page;

        for( var key in page ) {
          $scope.userList.push( page[key] );
        }
      });
    };


    $scope.newUserGridOptions = {
      data: 'newUser',
      multiSelect: false,
      enableColumnResize: true,
      columnDefs: [
        { field: 'new_user_id', visible: false },
        { field: 'username', displayName:'Username',
          cellTemplate: '<div class="ngCellText" ng-class="cellClass(row)"><input ng-model="row.entity.username" ng-maxlength="20" size="10"></div>'},
        { field: 'password', displayName:'Password',
          cellTemplate: '<div class="ngCellText" ng-class="cellClass(row)"><input ng-model="row.entity.password" ng-maxlength="20" size="10"></div>'},
        { field: 'email', displayName:'Email',
          cellTemplate: '<div class="ngCellText" ng-class="cellClass(row)"><input ng-model="row.entity.email" ng-maxlength="50" size="10"></div>'},
        { field: 'save_button', displayName:'Save',
          cellTemplate: '<div class="ngCellText" ng-class="cellClass(row)"><button ng-click="saveNew(row)">SAVE</button></div>' },
        { field: 'cancel_button', displayName:'Cancel',
          cellTemplate: '<div class="ngCellText" ng-class="cellClass(row)"><button ng-click="cancelNew(row)">Cancel</button></div>' },
      ]
    };


    $scope.cancelNew = function( row ) {
      $scope.deleteNew(row.entity);

      if( $scope.newUser.length < 1 ) {
        $('#new-grid').addClass('hidden');
      }
    };

    $scope.saveNew = function( row ) {
      var postData = 'p=newuser&ret=json';
      postData += '&username='+row.entity.username;
      postData += '&password='+row.entity.password;
      postData += '&email='+row.entity.email;

      $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
           then(function(data) {
        $scope.getUserList();
        $('#new-grid').addClass('hidden');
      });

      $scope.deleteNew(row.entity);
    };


    $scope.getNewId = function() {
      var newId = 0;
      var key = 0;
      for( key = 0; key < $scope.newUser.length; key++ ) {
        if( $scope.newUser[key].new_user_id >= newId ) {
          newId = $scope.newUser[key].new_user_id;
        }
      }

      return newId + 1;
    }; // end getNewId


    $scope.loadNewPage = function() {
      $scope.newUser = [];

      var newBlankUser = {
        id: 'New',
        new_user_id: $scope.getNewId(),
        username: '',
        password: 'changeme',
        cancel_button: '',
        save_button: ''
      };
      $scope.newUser.push( newBlankUser );
      $('#new-grid').removeClass('hidden');
    }; // end loadNewPage

    var cellTemp = '<div class="ngCellText" ng-class="cellClass(row)">{{row.getProperty(col.field)}}</div>';

    $scope.gridOptions = { 
      data: 'userList',
      multiSelect: false,
      enableColumnResize: true,
      selectedItems: [],
      rowHeight: 40,
      columnDefs: [
        {field:'id', displayName:'ID', width: 30, cellTemplate: cellTemp },
        {field:'username', displayName:'User Name', width: '*', cellTemplate: cellTemp },
        {field:'trackList', displayName:'User Track', cellTemplate: '<div class="ngCellText" style="overflow: auto;" ng-class="cellClass(row)"><span class="track-span-style" ng-repeat="t in row.entity.trackList">{{t.track_name}} <span ng-click="removeTrack(row.entity,t)">[X]</span></span></div>', width: '340' },
        {field:'securityList', displayName:'Security Groups', cellTemplate: '<div class="ngCellText" style="overflow: auto;" ng-class="cellClass(row)"><span class="track-span-style" ng-repeat="g in row.entity.securityList">{{g}} <span ng-click="removeGroup(row.entity,g)">[X]</span></span></div>', width: '340' },
      ]
    };

    $scope.removeTrack = function( data, t ) {
      console.log("remove track");
      console.log(data);
      console.log(t);
    };

    $scope.removeGroup = function( data, g ) {
      console.log("remove group");
      console.log(data);
      console.log(g);
    };

    $scope.getAccessGroupList = function() {
      /**
       * Loads security group data
       */
      $http.get('/admin/?p=accessgroup/list&ret=json').
           then(function(data) {
        var page = data.data.page;

        for( var key in page ) {
          $scope.groupList.push( page[key] );
        }
      });
    };

    $scope.getTrackList = function() {
      /**
       * Loads track data
       */
      $http.get('/admin/?p=track/list&ret=json').
           then(function(data) {
        var page = data.data.page;

        for( var key in page ) {
          $scope.trackList.push( page[key] );
        }
      });
    };

    $scope.cellClass = function(row) {
      if( row.entity.realm == 'dev' ) {
        return 'highlight';
      } else { return ''; }
    };


    $scope.deleteNew = function(obj) {
      var key = 0;
      while( key < $scope.newUser.length ) {
        if( $scope.newUser[key].new_user_id == obj.new_user_id ) {
          $scope.newUser.splice(key,1);
          return;
        }
        key++;
      }
    };

    $scope.getTrackList();
    $scope.getAccessGroupList();
    $scope.getUserList();
}]);

'use strict';

