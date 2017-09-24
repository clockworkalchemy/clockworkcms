
angular.module('myApp.bazaar', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/bazaar', {
    templateUrl: 'bazaar/bazaar.html',
    controller: 'BazaarCtrl'
  });
}])

.controller('BazaarCtrl', ['$scope', '$http', '$sce', function($scope, $http, $sce) {
    $scope.myData = [];
    $scope.artistData = [];
    $scope.artistList = [];
    $scope.artistToEdit = {};
    $scope.basePanelToEdit = {};

    $scope.loadArtists = function() {
      $http.get('/admin/?p=events-and-exhibits/bazaar/form/list&ret=json').
           then(function(data) {
        var page = data.data.page;

        for( var key in page ) {
          $scope.updateApproval( page[key], page[key].approved );
          $scope.updatePaid( page[key], page[key].paid );
          $scope.myData.push( page[key] );
        }
      });
    };

    $scope.bazaarGridOptions = { 
      data: 'myData',
      multiSelect: false,
      enableColumnResize: true,
      columnDefs: [
        {field:'artist_id', displayName:'ID', width: 40, cellTemplate: cellTemp },
        {field:'name', displayName:'Name', width: '*', cellTemplate: '<div class="ngCellText" ng-class="cellClass(row)" ng-dblclick="loadEditPage(row)">{{row.getProperty(col.field)}}</div>'},
        {field:'display_name', displayName:'Display Name', width: '*' },
        {field:'email', displayName:'Email', width: '260' },
        {field:'approved_word', displayName:'Approved', width: '100' },
        {field:'paid_word', displayName:'Paid', width: '160' },
//        {field:'invitecode', displayName:'Invite Code', width: '10' },
      ]
    };

    $scope.getTableHeight = function() {
      return {
        height: Math.min( $scope.myData.length * 30, 600 ) + 'px'
      };
    };

    $scope.cellClass = function(row) {
      if( row.entity.realm == 'dev' ) {
        return 'highlight';
      } else { return ''; }
    };

    $scope.updatePaid = function( data, status ) {
      data['paid_word'] = status == 1 ? data['paid_date'] : "Pending";
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
      $('#bazaar-grid').show();
    };

    $scope.loadEditPage = function( data ) {
      $scope.artistToEdit = data.entity;

      angular.copy( $scope.artistToEdit, $scope.baseArtistToEdit );

      $('#edit-panel').show();
      $('#bazaar-grid').hide();
    };

    $scope.approveArtist = function(panelData) {
      var postData = 'p=events-and-exhibits/bazaar/'+$scope.artistToEdit.artist_id+'/approve';
      postData += '&ret=json';
      $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
           then(function( data ) {
             $scope.updateApproval( panelData, 1 );
           }
      );
    }; // end approveArtist

    $scope.unapproveArtist = function(panelData) {
      var postData = 'p=events-and-exhibits/bazaar/'+$scope.artistToEdit.artist_id+'/unapprove';
      postData += '&ret=json';
      $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
           then(function(data){
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

    $scope.requestPayment = function() {
      var postData = 'p=events-and-exhibits/bazaar/'+$scope.artistToEdit.artist_id+'/reqPay';
      postData += '&ret=json';
      $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
           then(function(data) { $scope.updatePayment( 1 ); }
      );
    };

    $scope.unRequestPayment = function() {
      var postData = 'p=events-and-exhibits/bazaar/'+$scope.artistToEdit.artist_id+'/unReqPay';
      postData += '&ret=json';
      $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
           then(function(data) { $scope.updatePayment( 0 ); }
      );
    };

    $scope.updateUrl = function() {
      var postData = 'p=events-and-exhibits/bazaar/'+$scope.artistToEdit.artist_id+'/display_contact';
      postData += '&ret=json&display_contact='+$scope.artistToEdit.display_contact;
      $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
           then(function(data) {
             window.alert('The url has been updated');
           }
      );
    };

    $scope.updateArtistGuestLevel = function(guestLevel) {
      var postData = 'p=events-and-exhibits/bazaar/'+$scope.artistToEdit.artist_id;

      if(guestLevel=='guest')
        postData += '/guest';
      else if(guestLevel=='featured')
        postData += '/featured';
      else if(guestLevel=='honor')
        postData += '/honor';

      postData += '&ret=json';

      $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
           then(function(data) { $scope.artistToEdit.guestlevel=guestLevel }
      );
    };

    $scope.saveArtistEdits = function() {
      var postData = 'p=events-and-exhibits/bazaar/'+$scope.artistToEdit.artist_id;
      postData += '&ret=json&panel_id='+$scope.artistToEdit.artist_id;

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
