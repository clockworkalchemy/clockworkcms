
angular.module('myApp.users', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/users', {
    templateUrl: 'users/users.html',
    controller: 'UsersCtrl'
  });
}])

.controller('UsersCtrl', ['$scope', '$http', '$sce', function($scope, $http, $sce) {
  $scope.showEdit = false;
  $scope.showNew = false;
  $scope.showPass = false;

  $scope.userList = [];
  $scope.trackList = [];
  $scope.groupList = [];

  $scope.newPassword = '';
  $scope.newUser = {};
  $scope.editUser = {};
  $scope.origEditUser = {};

  $scope.groupToAdd = '';

  $scope.getTableHeight = function() {
    return {
      height: Math.min( $scope.userList.length * 24, 600 ) + 'px'
    };
  };

  $scope.getTrackTableHeight = function() {
    if( $scope.editUser.trackList == undefined
         || $scope.editUser.trackList.length == 0 ) { return { height: '48px' }; }

    return {
      height: Math.min( ( $scope.editUser.trackList.length * 24 ) + 24, 200 ) + 'px'
    };
  };

  $scope.getGroupTableHeight = function() {
    if( $scope.editUser.securityList == undefined
         || $scope.editUser.securityList.length == 0 ) { return { height: '48px' }; }

    return {
      height: Math.min( ( $scope.editUser.securityList.length * 24 ) + 24, 200 ) + 'px'
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
      $scope.userList = data.data.page;
    });
  };


  $scope.cancelNew = function() {
    $scope.newUser = {};
    $scope.showNew = false;
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
      $scope.cancelNew();
    });
  };


  // TODO
  $scope.saveEdit = function() {
    console.log($scope.editUser);
    console.log($scope.origEditUser);
    $scope.editUser = {};
    $scope.origEditUser = {};
    $scope.showEdit = false;
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


  $scope.loadEditUser = function(row) {
    angular.copy( row.entity, $scope.editUser );
    angular.copy( row.entity, $scope.origEditUser );
    $scope.showEdit = true;
  };
  $scope.closeEditUser = function() {
    $scope.editUser = {};
    $scope.showEdit = false;
  };

  $scope.loadNewPage = function() {
    var newBlankUser = {
      id: 'New',
      new_user_id: $scope.getNewId(),
      username: '',
      password: 'changeme',
      cancel_button: '',
      save_button: ''
    };
    $scope.newUser = newBlankUser;
    $scope.showNew = true;
  }; // end loadNewPage


  var cellTemp = '<div class="ngCellText">{{row.getProperty(col.field)}}</div>';
  var editCellTmpl = '<div class="ngCellText"><span ng-click="loadEditUser(row)">{{row.getProperty(col.field)}}</span></div>';

  $scope.gridOptions = { 
    data: 'userList',
    multiSelect: false,
    enableColumnResize: true,
    selectedItems: [],
    rowHeight: 24,
    columnDefs: [
      {field:'id', displayName:'ID', width: 30, cellTemplate: cellTemp },
      {field:'username', displayName:'User Name', width: '300', cellTemplate: editCellTmpl },
      {field:'name', displayName:'Name', width: '*', cellTemplate: cellTemp },
    ]
  };

  $scope.groupGrid = {
    data: 'editUser.securityList',
    multiSelect: false,
    enableColumnResize: true,
    selectedItems: [],
    rowHeight: 24,
    columnDefs: [
      {field: 'id', displayName:'ID', width: 30, cellTemplate: cellTemp },
      {field: 'name', displayName:'Name', width: '*', cellTemplate: cellTemp },
    ]
  };

  $scope.trackGrid = {
    data: 'editUser.trackList',
    multiSelect: false,
    enableColumnResize: true,
    selectedItems: [],
    rowHeight: 24,
    columnDefs: [
      {field:'id', displayName:'ID', width: 30, cellTemplate: cellTemp },
      {field:'track_name', displayName:'Name', width: '*', cellTemplate: cellTemp },
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

  $scope.showChangePassword = function() { return $scope.showPass; };
  $scope.changePassword = function() {
    $scope.showPass = true;
    $scope.newPassword = '';
  };

  $scope.submitPassword = function() {
    var user = $scope.editUser.username;
    var pass = $scope.newPassword;

    var postData = 'ret=json&p=changepass&username='+user+'&password='+pass;
    console.log( postData );

    $http.post('/admin/',
               postData,
               { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
       then(function(data) {
        $scope.showPass = false;
        $scope.newPassword = '';
      });

  };

  /**
   * Loads security group data
   */
  $scope.getAccessGroupList = function() {
    $http.get('/admin/?p=accessgroup/list&ret=json').
         then(function(data) {
      $scope.groupList = data.data.page;
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

  $scope.showEditPage = function() { return $scope.showEdit; };
  $scope.showNewPage = function() { return $scope.showNew; };
  $scope.showList = function() { return !$scope.showNew && !$scope.showEdit };

  $scope.getTrackList();
  $scope.getAccessGroupList();
  $scope.getUserList();
}]);

'use strict';

