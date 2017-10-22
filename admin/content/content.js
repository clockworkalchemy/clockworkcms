
angular.module('myApp.content', ['ngRoute','ngGrid','sticky'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/content', {
    templateUrl: 'content/content.html',
    controller: 'ContentCtrl'
  }).when('/content/newpage', {
    templateUrl: 'content/newpage.html',
    controller: 'ContentCtrl'
  });
}])

.controller('ContentCtrl', ['$scope', '$http', '$sce', '$location', function($scope, $http, $sce, $location) {
  $scope.myData = [];
  $scope.pageToEdit = {};
  $scope.showEdit = 0;
  $scope.errMsg = '';
  $scope.successMsg = '';
  $scope.pageHistory = [];
  $scope.newPage = {};

  $scope.FEATURED_STATUSES = { '0': 'Normal', '1': 'Featured News', '2': 'Featured Important' };
  $scope.FEATURED_OPTS = [
    { id: '0', label: 'Normal'},
    { id: '1', label: 'Featured News'},
    { id: '2', label: 'Featured Important' }
  ];
  $scope.SUBTEMPLATE = { '1': 'blank', '3': 'default', '4': 'leftpicture', '5': 'rightpicture' };
  $scope.SUBTEMPLATE_OPTS = [
    { id: '1', label: 'blank'},
    { id: '3', label: 'default'},
    { id: '4', label: 'leftpicture'},
    { id: '5', label: 'rightpicture' }
  ];
  $scope.NG_TEMPLATE = [
    '/?p=templates/bazaar_artists.html&onefield=full_text',
    '/?p=templates/home.html&onefield=full_text',
    '/?p=templates/news.html&onefield=full_text',
    '/?p=templates/schedule.html&onefield=full_text',
    '/?p=templates/sched_grid.html&onefield=full_text',
    '/?p=templates/sched_list.html&onefield=full_text',
    '/?p=templates/subPageStandard.html&onefield=full_text',
    'templates/bazaar_artists.html',
    'templates/home.html',
    'templates/news.html',
    'templates/schedule.html',
    'templates/sched_grid.html',
    'templates/sched_list.html',
    'templates/subPageStandard.html',
  ];

  $scope.NG_CTRL = [
    'artistsBazaarController',
    'homeController',
    'newsController',
    'schedGridController',
    'scheduleController',
    'subPageStandardController',
  ];


  $scope.getPages = function() {
    $http.get('/?f=pagelist&ns=1&ret=json').
         then(function(data){
      $scope.myData = data.data.results;
    });
  };

  $scope.newDateObj = function(date) {
    if( date == '0000-00-00 00:00:00' ) {
      date = null;
    }
    return new Date(date);
  };

  $scope.getTableHeight = function() {
    return {
      height: Math.min( $scope.myData.length * 30, 600 ) + 'px'
    };
  };

  let pageCell = '<div class="ngCellText" ng-class="cellClass(row)">{{row.getProperty(col.field)}}</div>';
  let editButton = '<button ng-click="editPage(row)">Edit</button>';
  let pageNameCell = '<div class="ngCellText" ng-class="cellClass(row)" ng-dblclick="editPage(row)">' +
                     '{{row.getProperty(col.field)}}' +
                     '</div>';
  let dateCell = '<div class="ngCellText" ng-class="cellClass(row)">' +
                 '{{newDateObj(row.getProperty(col.field)) | date:"MM/dd/yyyy"}}' +
                 '</div>';

  let searchHeader = '<div ng-click="col.sort($event)" ng-class="\'colt\' + col.index" class="ngHeaderText">{{col.displayName}} - <input ng-model="filterOptions.filterText" width=10/></div>';
  $scope.filterOptions = { filterText: '' }; // filter page name

  $scope.gridOptions = { 
    data: 'myData',
    multiSelect: false,
    filterOptions: $scope.filterOptions,
    columnDefs: [
      {field:'resource_id', displayName:'ID', width: 40, cellTemplate: pageCell },
      {field:'pagename', displayName:'Page', width: '*', cellTemplate: pageNameCell, headerCellTemplate: searchHeader },
      {field:'featuredstatus', displayName:'Featured Status', width: 120, cellTemplate: pageCell },
      {field:'featuredyear', displayName:'Year', width: 80, cellTemplate: pageCell },
      {field:'live_date', displayName:'Live Date', width: 120, cellTemplate: dateCell },
      {field:'realm', displayName:'Realm', width: 55, cellTemplate: pageCell },
      {field:'editbutton', displayName:'Edit', width: 53, cellTemplate: editButton }
    ]
  };

  $scope.initDatePicker = function() {
    $('.live_date').datetimepicker({ format:'Y-m-d H:i:s' });
  };

  $scope.editPage = function(row) {
    $scope.loadEditPage(row.entity.resource_id);
  };

  $scope.loadEditPage = function(resId) {
    let contentUrl = '/?ret=json&f=getcontent&ns=1&resource_id='+resId;

    $http.get(contentUrl).
         then(function(data){
      page = data.data.results[0];

      $scope.pageToEdit = page;

      $scope.showEdit = 1;
    });
  };

  $scope.cancelEdits = function() {
    $scope.pageToEdit = {};
    $scope.showEdit = 0;
    $('.info-box').hide();
  };

  $scope.saveEdits = function() {
    let postData = 'ret=json&';

    $scope.pageToEdit['summary']
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/[\u201C\u201D]/g, '"');

    postData += "resource_id="+encodeURIComponent($scope.pageToEdit['resource_id'])+"&";
    postData += "title="+encodeURIComponent($scope.pageToEdit['title'])+"&";
    postData += "image_url="+encodeURIComponent($scope.pageToEdit['image_url'])+"&";
    postData += "full_text="+encodeURIComponent($scope.pageToEdit['full_text'])+"&";
    postData += "summary="+encodeURIComponent($scope.pageToEdit['summary']);

    $http.post('/admin/',
               postData,
               { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
         then(function( data ) {
      $scope.loadEditPage($scope.pageToEdit['resource_id']);
      alert("The page has been saved");
    });

  };

  $scope.cellClass = function(row) {
    if( row.entity.realm == 'dev' ) {
      return 'highlight';
    } else { return ''; }
  };

  $scope.updateFeatured = function(id) {
    let featured = $scope.pageToEdit.featured;
    let featuredYear = $scope.pageToEdit.featuredyear;
    let resId = $scope.pageToEdit.resource_id;

    if( featured && featuredYear == '' ) {
      $scope.errMsg = 'You must select a year before making a page featured';
      $scope.toggle('error-box');
      return;
    }

    let url = '/admin/index.cgi?ret=json&f=update_featured_status&resource_id='+resId+'&featured='+featured+'&featuredyear='+featuredYear;
    $http.get(url).
         then(function(data){
      $scope.toggle(id);
    });
  };

  $scope.approveContent = function() {
    let resId = $scope.pageToEdit.resource_id;
    let rev = $scope.pageToEdit.revision;

    let url = '/admin/index.cgi?ret=json&f=appr&resource_id='+resId+'&rev='+rev

    $http.get(url).
         then(function(data){
      $scope.successMsg = 'The current page has been approved';
      $scope.toggle('success-box');
      $scope.loadEditPage(resId);
    });
  };

  $scope.updateLiveDate = function(id) {
    var resId = $scope.pageToEdit.resource_id;
    var rev = $scope.pageToEdit.revision;
    var liveDate = $scope.pageToEdit.live_date;
    var url = '/admin/index.cgi?ret=json&f=updateLiveDate&resource_id='+resId+"&revision="+rev+"&live_date="+liveDate;

    $http.get(url).
        then(function(data) {
      $scope.successMsg = 'The live-date has been updated';
      $scope.toggle('success-box');
      $scope.toggle(id);
    });
  };

  $scope.updateImage = function(id) {
    var resId = $scope.pageToEdit.resource_id;
    var rev = $scope.pageToEdit.revision;
    var imageUrl = $scope.pageToEdit.imageUrl;
    var url = '/admin/index.cgi?ret=json&f=updateImage&resource_id='+resId+"&revision="+rev+"&image_url="+imageUrl

    $http.get(url).
        then(function(data) {
      $scope.successMsg = 'The image has been updated';
      $scope.toggle('success-box');
      $scope.toggle(id);
    });
  };

  $scope.renamePage = function(id) {
    var resId = $scope.pageToEdit.resource_id;
    var newname = $scope.pageToEdit.pagename;

    var url = '/admin/index.cgi?ret=json&f=rename&resource_id='+resId+"&newname="+newname;

    $http.get(url).
        then(function(data) {
      $scope.loadEditPage(resId);
      $scope.successMsg = 'The page has been renamed';
      $scope.toggle('success-box');
      $scope.toggle(id);
    });
  };

  $scope.updateSubtemplate = function(id) {
    var resId = $scope.pageToEdit.resource_id;
    var subtemplateId = $scope.pageToEdit.subtemplate_id;

    var url = '/admin/index.cgi?ret=json&f=update_subtemplate&resource_id='+resId+'&subtemplate_id='+subtemplateId;

    $http.get(url).
        then(function(data) {
      $scope.successMsg = 'The subtemplate has been updated';
      $scope.toggle('success-box');
      $scope.toggle(id);
    });
  };

  $scope.updateTemplateCtrl = function(id) {
    var resId = $scope.pageToEdit.resource_id;
    var templateUrl = $scope.pageToEdit.templateUrl;
    var controller = $scope.pageToEdit.controller;

    var url = '/admin/?ret=json&f=saveAng&resource_id=' + resId +
                '&templateUrl=' + templateUrl +
                '&controller=' + controller;

    $http.get(url).
        then(function(data) {
      $scope.successMsg = 'The Templates and Controller has been updated';
      $scope.toggle('success-box');
      $scope.toggle(id);
    });
  };

  $scope.showHistory = function() {
    var resId = $scope.pageToEdit.resource_id;
    var url = '/?ret=json&f=hist&resource_id='+resId;

    $http.get(url).
        then(function(data) {
          $scope.pageHistory = data.data.results;
          $scope.toggle('show-history');
    });
  };

  $scope.loadRevision = function(revId) {
    var resId = $scope.pageToEdit.resource_id;

    var url = '/admin/index.cgi?ret=json&f=getcontent&ns=1&resource_id='+resId+"&rev="+revId;

    $http.get(url).
         then(function(data){
      page = data.data.results[0];

      $scope.pageToEdit = page;
    });
    $scope.toggle('show-history');
  };

  $scope.deletePage = function(id) {
    $scope.errMsg = 'You cannot delete that';
    $scope.toggle('error-box');
    $scope.toggle(id);
    
    var url = '/admin/index.cgi?ret=json&d=deleteContent&method=DELETE&resource_id='+resId+"&rev="+revId;
  };

  $scope.cancelNewPage = function() {
    $location.path( '/content' );
  };

  $scope.saveNewPage = function() {
    let postData = 'p=new&pagename='+$scope.newPage.pagename+'&parent_page='+$scope.newPage.parentpage;

    $http.post('/admin/',
               postData,
               { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
         then(function( data ) {
           $location.path( '/content' );
    });
  };


  $scope.showEditPage = function() {
    $scope.initDatePicker();
    return $scope.showEdit;
  };

  $scope.toggle = function(id) {
    $('#'+id).toggle();
  };

  $scope.getPages();
}]);

'use strict';

  
