'use strict';

var mod = angular.module('myApp.panels', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/panels', {
    templateUrl: 'panels/panels.html',
    controller: 'PanelsCtrl'
  }).when('/panels/submissions', {
    templateUrl: 'panels/submissions.html',
    controller: 'PanelsCtrl'
  });
}])

.controller('PanelsCtrl', ['$scope', '$http', '$sce', function($scope, $http, $sce) {
  $scope.test = '';

}]);

