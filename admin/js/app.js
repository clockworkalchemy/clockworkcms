'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'ngGrid',
  'sticky',
  'myApp.adminMenu',
  'myApp.admin',
  'myApp.gallery',
  'myApp.bazaar',
  'myApp.users',
  'myApp.content',
  'myApp.panels',
  'myApp.panels.submissions',
  'myApp.panels.presenters',
  'myApp.panels.rooms',
  'myApp.panels.reports',
  'myApp.panels.scheduler',
]).
config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {

  $routeProvider.otherwise({redirectTo: '/admin'});
}]);
