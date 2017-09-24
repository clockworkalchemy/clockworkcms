'use strict';

angular.module('myApp.panels.presenters', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/panels/presenters', {
    templateUrl: 'panels/presenters.html',
    controller: 'PresentersCtrl'
  });
}])

/**
 * Presenter Controller
 */
.controller('PresentersCtrl', ['$scope', '$http', '$sce', function($scope, $http, $filter, $sce) {
  $scope.myData = [];
  $scope.newPresenter = {};
  $scope.Presenter = {'mem_dis':0,'has_photo':0};
  $scope.showEdit = false;
  $scope.shoeNew = false;

  $scope.presenterFields = [
    'name', 
    'fanname',
    'phone',
    'atcon_phone',
    'email',
    'email2',
    'has_photo',
    'photo',
    'bio',
    'resource_id_fk',
    'type',
    'mem_dis'
  ];


  $scope.basePresenter = {};
  $scope.boolListWords = [{ id: 'no', name: 'No' }, { id: 'yes', name: 'Yes' }];
  $scope.boolListInts = [{ id: '0', name: 'No' }, { id: '1', name: 'Yes' }];
  $scope.presenterType = [
    { id: "staff", name: 'Staff Member' },
    { id: "guest", name: 'Guest of Honor' },
    { id: "featured", name: 'Featured Guest' },
    { id: "panelist", name: 'Panelist' },
  ];

  $scope.loadPresenters = function() {
    $http.get('/admin/?p=presenterlist&ret=json').
         then(function(data) {
      let presData = data.data.page;
      var pageLength = presData.length;
      $scope.myData = [];

      for( var key in presData ) {
        if( presData[key].bio == '' ) {
          presData[key].hasbio='No';
        } else {
          presData[key].hasbio='Yes';
        }
        $scope.myData.push( presData[key] );
      }
    });
  };
  $scope.loadPresenters();

  var cellTemp = '<div class="ngCellText" ng-class="cellClass(row)">{{row.getProperty(col.field)}}</div>';

  $scope.presenterGridOptions = { 
    data: 'myData',
    multiSelect: false,
    columnDefs: [
      {field:'presenter_id', displayName:'ID', width: 40, cellTemplate: cellTemp },
      {field:'name', displayName:'Name', width: '*', cellTemplate: '<div class="ngCellText" ng-class="cellClass(row)" ng-dblclick="edit(row)">{{row.getProperty(col.field)}}</div>'},
      {field:'fanname', displayName:'Fan Name', width: '100' },
      {field:'phone', displayName:'Phone', width: '100' },
      {field:'email', displayName:'Email', width: '100' },
      {field:'mem_dis', displayName:'Discount', width: '80' },
      {field:'hasbio', displayName:'Has Bio', width: '80' },
      {field:'type', displayName:'Type', width: '100' },
    ]
  };

  $scope.edit = function(row) {
    $scope.loadEditPage(row.entity);
  };

  $scope.cellClass = function(row) {
    if( row.entity.realm == 'dev' ) {
      return 'highlight';
    } else { return ''; }
  };

  $scope.getNewPresenterById = function(id) {
    for( var oneNew in $scope.newPresenter ) {
      if( oneNew.new_presenter_id == id ) {
        return oneNew;
      }
    }
    return undefined;
  };

  $scope.getNewPresenterId = function() {
    var newId = 0;
    var key = 0;
    for( key = 0; key < $scope.newPresenter.length; key++ ) {
      if( $scope.newPresenter[key].new_presenter_id >= newId ) {
        newId = $scope.newPresenter[key].new_presenter_id;
      }
    }

    return newId + 1;
  };

  $scope.closeEdit = function( ) { $scope.showEdit = false; };
  $scope.closeNew = function() {
    $scope.showNew = false;
    $scope.newPresenter = {};
  };

  $scope.loadEditPage = function( data ) {
    $scope.Presenter = data;
    $scope.showEdit = true;
    angular.copy( $scope.Presenter, $scope.basePresenter );
  };

  $scope.loadNewPresenterPage = function() {
    var newBlankPresenter = {
      panel_id: 'New',
      new_panel_id: $scope.getNewPresenterId(),
      name: '',
      fanname: '',
      phone: '',
      email: '',
      mem_dis: '',
      hasbio: '',
      type: '',
      cancel_button: '',
      save_button: ''
    };

    $scope.newPresenter = newBlankPresenter;
    $scope.showNew = true;
  };

  $scope.saveEdits = function() {
    var postData = 'p=guests/presenters/'+$scope.Presenter.presenter_id;
    postData += '&ret=json&presenter_id='+$scope.Presenter.presenter_id;

    angular.forEach( $scope.Presenter, function(value,key) {
      if( $scope.basePresenter[key] != value ) {
        postData += '&'+key+'='+encodeURIComponent(value);
      };
    });

    $http.post('/admin/',
               postData,
               { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
         then(function(data) {
           // This has been successfully updated. Do what?
           $scope.closeEdit();
         }
    );
  };

  $scope.saveNew = function() {
    let newPres = $scope.newPresenter;

    console.log(newPres);
    var postData = 'p=guests/presenters&ret=json';

    if( newPres.name == undefined ) {
      alert("You must include a name");
      return;
    }
    for( var f in $scope.presenterFields ) {
      let field = $scope.presenterFields[f];

      if( newPres[field] != undefined ) {
        postData += '&'+field+'='+newPres[field];
      }
    }

    $http.post('/admin/',
               postData,
               { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
         then(function(data) {
         
      $scope.showNew = false;
      $scope.loadPresenters();
    });
  };

  $scope.showNewPresenter = function() { return $scope.showNew; };
  $scope.showEditPresenter = function() { return $scope.showEdit; };
  $scope.showMainGrid = function() {
    return !$scope.showEdit && !$scope.showNew;
  };


  $scope.getTableHeight = function() {
    return {
      height: Math.min( 30+($scope.myData.length * 60), 600 ) + 'px'
    };
  };

}]);

