
  /**
   * Gallery Controller
   */
  controller('galleryListCtrl', function($scope, $http) {
    $scope.myData = [];
    $scope.artistData = [];
    $scope.artistList = [];
    $scope.artistToEdit = {};
    $scope.basePanelToEdit = {};
    $scope.boolListInts = [{ id: '0', name: 'No' }, { id: '1', name: 'Yes' }];

    $scope.loadArtists = function() {
      $http.get('/admin/?p=events-and-exhibits/gallery/form/list&ret=json').
           success(function(data,status,headers,config) {

        for( var key in data.page ) {
          $scope.updateApproval( data.page[key], data.page[key].approved );
          $scope.myData.push( data.page[key] );
        }
      });
    };

    $scope.galleryGridOptions = { 
      data: 'myData',
      multiSelect: false,
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
      $('#edit-panel').addClass('hidden');
    };

    $scope.loadEditPage = function( data ) {
      $scope.artistToEdit = data.entity;

      angular.copy( $scope.artistToEdit, $scope.baseArtistToEdit );

      $('#edit-panel').removeClass('hidden');
    };

    $scope.approveArtist = function(panelData) {
      var postData = 'p=events-and-exhibits/gallery/'+$scope.artistToEdit.artist_id+'/approve';
      postData += '&ret=json';
      $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
           success(function(data,status,headers,config) {
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
           success(function(data,status,headers,config) {
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
      var postData = 'p=events-and-exhibits/gallery/'+$scope.artistToEdit.artist_id+'/reqPay';
      postData += '&ret=json';
      $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
           success(function(data,status,headers,config) { $scope.updatePayment( 1 ); }
      );
    };

    $scope.unRequestPayment = function() {
      var postData = 'p=events-and-exhibits/gallery/'+$scope.artistToEdit.artist_id+'/unReqPay';
      postData += '&ret=json';
      $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
           success(function(data,status,headers,config) { $scope.updatePayment( 0 ); }
      );
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
           success(function(data,status,headers,config) {
             // This has been successfully updated. Do what?
           }
      );
    }; // end savePanelEdits

    var cellTemp = '<div class="ngCellText" ng-class="cellClass(row)">{{row.getProperty(col.field)}}</div>';

    $scope.loadArtists();
})
