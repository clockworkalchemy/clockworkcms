
angular.module('myApp.gallery', ['ngRoute','ngGrid'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/gallery', {
    templateUrl: 'gallery/gallery.html',
    controller: 'GalleryCtrl'
  });
}])


.controller('GalleryCtrl', ['$scope', '$http', '$sce', function($scope, $http, $sce) {
    $scope.myData = [];
    $scope.artistData = [];
    $scope.artistList = [];
    $scope.artistToEdit = {};
    $scope.basePanelToEdit = {};
    $scope.boolListInts = [{ id: '0', name: 'No' }, { id: '1', name: 'Yes' }];

    $scope.loadArtists = function() {
      $http.get('/admin/?p=events-and-exhibits/gallery/form/list&ret=json').
           then(function(data) {
        var page = data.data.page;
        
        for( var key in page ) {
          $scope.updateApproval( page[key], page[key].approved );
          $scope.myData.push( page[key] );
        }
      });
    };

    $scope.getTableHeight = function() {
      return {
        height: Math.min( $scope.myData.length * 30, 600 ) + 'px'
      };
    };

    $scope.galleryGridOptions = {
      data: 'myData',
      multiSelect: false,
      rowHeight: 30,
      columnDefs: [
        {field:'artist_id', displayName:'ID', width: 40, cellTemplate: cellTemp },
        {field:'name', displayName:'Name', width: '*', cellTemplate: '<div class="ngCellText" ng-class="cellClass(row)" ng-dblclick="loadEditPage(row)">{{row.getProperty(col.field)}}</div>'},
        {field:'email', displayName:'Email', width: '260' },
//<!--        {field:'approved_word', displayName:'Approved', width: '100' }, -->
      ]
    };

    $scope.cellClass = function(row) {
      if( row.entity.realm == 'dev' ) {
        return 'highlight';
      } else { return ''; }
    };

    $scope.updateApproval = function( data, status ) {
      data['approved_word'] = status == 1 ? "Approved" : "Pending";
      data['approved'] = status;
    };

    $scope.updatePayment = function( status ) {
      $scope.artistToEdit.needs_payment=status;
    };

    $scope.closeEdit = function( ) {
      $('#edit-panel').hide();
      $('#gallery-grid').show();
    };

    $scope.loadEditPage = function( data ) {
      $scope.artistToEdit = data.entity;

      angular.copy( $scope.artistToEdit, $scope.baseArtistToEdit );

      $('#edit-panel').show();
      $('#gallery-grid').hide();
    };

    $scope.approveArtist = function(panelData) {
      var postData = 'p=events-and-exhibits/gallery/'+$scope.artistToEdit.artist_id+'/approve';
      postData += '&ret=json';
      $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
           then(function(data) {
             $scope.updateApproval( panelData, 1 );
           }
      );
    }; // end approveArtist

    $scope.unapproveArtist = function(panelData) {
      var postData = 'p=events-and-exhibits/gallery/'+$scope.artistToEdit.artist_id+'/unapprove';
      postData += '&ret=json';
      $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
           then(function(data) {
             $scope.updateApproval( panelData, 0 );
           }
      );
    }; // end unapproveArtist

    $scope.approveArtistEdit = function() {
      $scope.approveArtist($scope.artistToEdit);
    };

    $scope.approveArtistRow = function(row) {
      $scope.approveArtist(row.entity);
    };

    $scope.unapproveArtistEdit = function() {
      $scope.unapproveArtist($scope.artistToEdit);
    };

    $scope.saveArtistEdits = function() {
      var postData = 'p=events-and-exhibits/gallery/'+$scope.artistToEdit.panel_id;
      postData += '&ret=json&panel_id='+$scope.artistToEdit.panel_id;
      angular.forEach( $scope.artistToEdit, function(value,key) {
        if( $scope.baseArtistToEdit[key] != value ) {
          postData += '&'+key+'='+value;
        };
      });

      $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
           then(function(data) {
             // This has been successfully updated. Do what?
           }
      );
    }; // end savePanelEdits

    var cellTemp = '<div class="ngCellText" ng-class="cellClass(row)">{{row.getProperty(col.field)}}</div>';

    $scope.loadArtists();
}]);

'use strict';
