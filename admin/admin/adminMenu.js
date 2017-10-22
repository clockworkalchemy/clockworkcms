'use strict';

angular.module('myApp.adminMenu', ['ngRoute'])

.controller('adminMenuCtrl', ['$scope', '$http', '$sce', '$location', '$timeout', function($scope, $http, $sce, $location, $timeout) {
  $scope.password = '';
  $scope.passwordDone = false;

  $scope.isPage = function(page) {
    return $location.path().startsWith(page)
  };

  /*
   * changeAdminPassword
   * Make REST call to update admin password
   **/
  $scope.changeAdminPassword = function() {
    let scripturl = "/admin/index.cgi";
    let pass = $scope.password;
    $scope.password = '';

    let postData = "?ret=json&p=admin&method=PUT&password="+pass;

    $http.get(scripturl+postData).
        then(function(data,status,headers,config) {
          $scope.passwordDone = true;
          $timeout(function(){ $scope.passwordDone = false;}, 10000);
        }
    );

  };



  $scope.getTitle = function() {
    let t = 'Clockwork Alchemy Administration';
    switch( $location.path() ) {
      case '/gallery':
        t = "Artist's Gallery Administration";
        break;
      case '/bazaar':
        t = "Artist's Bazaar Administration";
        break;
      case '/content':
        t = "Content Administration";
        break;
      case '/useradmin':
        t = "User Administration";
        break;
      case '/panels':
        t = "Schedule Administration";
        break;
      default:
       break;
    }

    return t;
  };

  $scope.menuOptions = [{ 'link': '/admin/#!/admin', 'title': 'Admin Home' }]

  $scope.groupToMenu = {
    'panels': { 'link': '/admin/#!/panels',
                'title': 'Schedule Administration' },
    'gallery': { 'link': '/admin/#!/gallery',
                 'title': 'Artist\'s Gallery Administration' },
    'bazaar': { 'link': '/admin/#!/bazaar',
                'title': 'Artist\'s Bazaar Administration' },
    'content': { 'link': '/admin/#!/content',
                 'title': 'Edit Website Content' },
    'useradmin': { 'link': '/admin/#!/users',
                   'title': 'User Administration' }
    };

  $scope.panelsMenuOptions = [
    {'link': '/admin/#!/panels/submissions', 'title': 'Panel Submissions'},
    {'link': '/admin/#!/panels/scheduler', 'title': 'Panel Scheduler'},
    {'link': '/admin/#!/panels/presenters', 'title': 'Manage Presenters'},
    {'link': '/admin/#!/panels/rooms', 'title': 'Manage Rooms'},
    {'link': '/admin/#!/panels/reports', 'title': 'Schedule Reports'}
  ];

  $scope.contentMenuOptions = [
    {'link': '/admin/#!/content/newpage', 'title': 'Create New Page'},
  ];

  $scope.getMenuOptions = function() {
    $http.get('/admin/?ret=json&f=get_groups_for_user').
       then(function(data,status,headers,config) {
         let results = data.data.results
         for( let key in $scope.groupToMenu ) {
           if( results.indexOf(key) >= 0 ) {
             $scope.menuOptions.push( $scope.groupToMenu[key] );
           }
         }
      });

  };

  $scope.getMenuOptions();

}]);

