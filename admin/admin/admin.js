'use strict';

angular.module('myApp.admin', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/admin', {
    templateUrl: 'admin/admin.html',
    controller: 'AdminCtrl'
  });
}])

.controller('AdminCtrl', ['$scope', '$http', '$sce', function($scope, $http, $sce) {
  $scope.test = '';
  $scope.changeAdminPassword = function() { console.log('test'); };

}]);

