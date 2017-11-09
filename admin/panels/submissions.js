'use strict';

angular.module('myApp.panels.submissions', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/panels/submissions', {
    templateUrl: 'panels/submissions.html',
    controller: 'SubmissionsCtrl'
  });
}])

.controller('SubmissionsCtrl', ['$scope', '$http', '$sce', function($scope, $http, $sce) {
  $scope.myData = [];
  $scope.presenterData = [];
  $scope.presenterHash = {};
  $scope.panelistList = [];
  $scope.selectedPresenter = '';
  $scope.newPanel = [];
  $scope.showEdit = false;
  $scope.showNewPanel = false;
  $scope.panelToEdit = {'panel_before': 'no','projector':0,'mem_dis':0,'internalonly':0};
  $scope.basePanelToEdit = {};
  $scope.trackList = [];
  $scope.boolListWords = [{ id: 'no', name: 'No' }, { id: 'yes', name: 'Yes' }];
  $scope.boolListInts = [{ id: '0', name: 'No' }, { id: '1', name: 'Yes' }];
  $scope.panelLengthOpts = [
    { id: '0.25', name: '15 minutes' },
    { id: '0.50', name: '30 minutes' },
    { id: '1.00', name: '1 hour' },
    { id: '1.50', name: '1.5 hour' },
    { id: '2.00', name: '2 hour' },
    { id: '2.50', name: '2.5 hour' },
    { id: '3.00', name: '3 hour' },
    { id: '3.50', name: '3.5 hour' },
    { id: '4.00', name: '4 hour' },
    { id: '4.50', name: '4.5 hour' },
    { id: '5.00', name: '5 hour' },
    { id: '5.50', name: '5.5 hour' },
    { id: '6.00', name: '6 hour' },
    { id: '6.50', name: '6.5 hour' },
    { id: '7.00', name: '7 hour' },
    { id: '7.50', name: '7.5 hour' },
    { id: '8.00', name: '8 hour' },
    { id: '8.50', name: '8.5 hour' },
    { id: '9.00', name: '9 hour' },
    { id: '9.50', name: '9.5 hour' },
    { id: '10.00', name: '10 hour' },
    { id: '11.00', name: '11 hour' },
    { id: '12.00', name: '12 hour' }
  ];
  $scope.ageRangeList = [
    { id: 'Kid', name: 'Geared for Kids' },
    { id: 'All', name: 'All Ages' },
    { id: '16', name: '16+ ( not recommended for those under 16)' },
    { id: '18', name: '18+ ID required' }
  ];

  $scope.timeSlots = [
    { id: "10", name: 'Friday Early Afternoon (starts at 2:00 or 3:00 pm' },
    { id: "11", name: 'Friday Late Afternoon (starts at 4:00, 5:00, or 6:00 pm)' },
    { id: "20", name: 'Saturday Morning (starts at 10:00 or 11:00 am)' },
    { id: "21", name: 'Saturday Early Afternoon (starts at 12:00 noon, or at 1:00, 2:00, or 3:00 pm)' },
    { id: "22", name: 'Saturday Late Afternoon (starts at 4:00, 5:00, or 6:00 pm)' },
    { id: "30", name: 'Sunday Morning (starts at 10:00 or 11:00 am)' },
    { id: "31", name: 'Sunday Early Afternoon (starts at 12:00 noon, or at 1:00, 2:00, or 3:00 pm)' },
    { id: "32", name: 'Sunday Late Afternoon (starts at 4:00, 5:00, or 6:00 pm)' },
    { id: "40", name: 'Monday Morning (starts at 10:00 or 11:00 am)' },
    { id: "41", name: 'Monday Early Afternoon (starts at 12:00 noon, or at 1:00 or 2:00 pm)' },
  ];
  $scope.eventType = [
    'Con Services',
    'Artists',
    'Gaming',
    'Performance',
    'Workshop',
    'Panel',
    'Fashion',
    'Authors Salon',
    'Film',
    'War Room',
    'Dance',
    'Dirigible'
  ];


  let cellTemp = '<div class="ngCellText" ng-class="cellClass(row)">'+
    '{{row.getProperty(col.field)}}</div>';
  let titleTemplate = '<div class="ngCellText" ng-class="cellClass(row)" '+
    'ng-dblclick="editPanel(row)">{{row.getProperty(col.field)}}</div>';

  let newPanelTitleTemplate = '<div class="ngCellText" ng-class="cellClass(row)">'+
    '<input ng-model="row.entity.panel_title" name="title" ng-maxlength="200" size="50"></div>';
  let newPanelDescTemplate = '<div class="ngCellText" ng-class="cellClass(row)">'+
    '<input ng-model="row.entity.panel_description" name="panel_description" '+
    'ng-maxlength="5000" size="50"></div>';
  let newPanelTrackTemplate = '<div class="ngCellText" ng-class="cellClass(row)">'+
    '<select ng-model="row.entity.panel_track" name="track" '+
    'ng-options="d.id as d.track_name for d in trackList"></select></div>';
  let newPanelEventTypeTemplate = '<div class="ngCellText" ng-class="cellClass(row)">'+
    '<select ng-model="row.entity.event_type" name="type" '+
    'ng-options="event_type for event_type in eventType"></select></div>';
  let newPanelLengthTemplate = '<div class="ngCellText" ng-class="cellClass(row)">'+
    '<input ng-model="row.entity.panel_length" name="panel_length" '+
    'ng-maxlength="4" size="2"></div>';
  let newPanelSaveButtonTemplate = '<div class="ngCellText" ng-class="cellClass(row)">'+
    '<button ng-click="saveNewPanel(row)">SAVE</button></div>';
  let newPanelCancelButtonTemplate = '<div class="ngCellText" ng-class="cellClass(row)">'+
    '<button ng-click="cancelNewPanel(row)">Cancel</button></div>';


  /*
   * loadPanels
   * Loads panel information from DB including Track info
  **/
  $scope.loadPanels = function() {
    $http.get('/admin/?p=events-and-exhibits/panels/reg/list&ret=json&byusertrack=1').
         then(function(data) {
      $scope.myData = []; // Loading panels does require first clearing them.
      let panelData = data.data.page;

      /**
       * Loads track data
       */
      $http.get('/admin/?p=track/list&ret=json').
           then(function(data) {
        let trackData = data.data.page;

        for( var key in trackData ) {
          $scope.trackList.push( trackData[key] );
        }

        for( var key in panelData ) {
          $scope.updateApproval( panelData[key], panelData[key]['approved'] );
          $scope.updateContacted( panelData[key], panelData[key]['contacted'] );

          var trackObj = $scope.getTrackById(panelData[key]['panel_track']);
          if( trackObj ) {
            panelData[key]['track_name'] = trackObj.track_name;
          }

          $scope.myData.push( panelData[key] );
        }
      });
    });
  };


  /*
   * getPresenterInfoForPanel
   * Load list of presenters for each panel.
   **/
  $scope.getPresenterInfoForPanel = function( data, panelId ) {
    $http.get('/admin/?p=events-and-exhibits/panels/'+panelId+'/presenters&ret=json').
	 then(function(data) {
           $scope.panelistList = [];

           for( var key in data.page ) {
             $scope.panelistList.push( data.page[key] );
           }
         });
  };


  $scope.validatePostData = function( data, varName ) {
    if( data[varName] != undefined ) {
      return '&'+varName+'='+data[varName];
    } else {
      return '';
    }
  };

  $scope.createPresenterFromPanel = function() {
    var newData = $scope.panelToEdit;

    var postData = 'p=guests/presenters&ret=json';

    postData += '&name='+newData.name;
    postData += $scope.validatePostData( newData, 'fanname' );
    postData += $scope.validatePostData( newData, 'phone' );
    postData += $scope.validatePostData( newData, 'conphone' );
    postData += $scope.validatePostData( newData, 'email' );
    postData += $scope.validatePostData( newData, 'photo' );
    postData += $scope.validatePostData( newData, 'bio' );
    postData += $scope.validatePostData( newData, 'mem_dis' );
    postData += $scope.validatePostData( newData, 'notes' );
    postData += $scope.validatePostData( newData, 'unavailable_times' );

    $http.post('/admin/',
               postData,
               { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
         then(function(data) {
      $scope.loadPresenters();
    });
  };

  // Remove Presenter from Panel
  $scope.doRemovePresenterFromPanel = function( presenterId ) {

    var delData = 'p=events-and-exhibits/panels/'+
      $scope.panelToEdit.panel_id+'/presenters'+
      '&presenter_id='+presenterId+
      '&ret=json&method=DELETE';

    $http.get('/admin/?'+delData,
               { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
         then(function(data) {
           for( let i = 0; i < $scope.panelToEdit.presenters.length; i++ ) {
             let pres = $scope.panelToEdit.presenters[i];
             if(pres.presenter_id == presenterId) {
               $scope.panelToEdit.presenters.splice(i, 1);
               return;
             }
           }
    });
  };

  $scope.addPresenterToPanel = function() {
    var presId = $scope.selectedPresenter;

    $scope.addPresenterToPanelById(presId);
  };

  $scope.addPresenterToPanelById = function(presId) {
    var i;

//    for( i = 0; i < $scope.panelistList.length; i++ ) {
//      if( $scope.panelistList[i].presenter_id == presId ) {
    for( i = 0; i < $scope.panelToEdit.presenters.length; i++ ) {
      if( $scope.panelToEdit.presenters[i].presenter_id == presId ) {
        alert( "That presenter is already assigned to this panel" );
        $scope.selectedPresenter = "";
        return;
      }
    }
    var postData = 'p=events-and-exhibits/panels/'+$scope.panelToEdit.panel_id+'/presenters';
    postData += '&presenter_id='+presId+'&ret=json';

    let pres = $scope.presenterHash[presId];
    let newPres = {name: pres.name, presenter_id: pres.presenter_id};
    
    $http.post('/admin/',
               postData,
               { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
         then(function(data) {

           $scope.panelToEdit.presenters.push(newPres);
           $scope.selectedPresenter = "";
         }
    );
  };

  /**
   *
   */
  $scope.loadPresenters = function() {
    $http.get('/admin/?p=presenterlist&ret=json').
      then(function(data) {
        let res = data.data.page;
        for( let key in res ) {
          $scope.presenterData.push( res[key] );
          $scope.presenterHash[res[key].presenter_id] = res[key];
        }
    });
  };

  /**
   * Takes presenter ID and returns presenter Object from $scope.presenterData
   * @param {Integer} id
   * @return {Object} presenterObj
   */
  $scope.getPresenterByField = function( field, id ) { 
    var obj;

    for( var p in $scope.myData ) {
      if( $scope.presenterData[p][field] == id ) {
        obj = $scope.presenterData[p];
        break;
      }
    }
    return obj;
  };


  $scope.panelGridOptions = { 
    data: 'myData',
    multiSelect: false,
    columnDefs: [
      {field:'panel_id', displayName:'ID', width: 40, cellTemplate: cellTemp },
      {field:'panel_title', displayName:'Title', width: '*', cellTemplate: titleTemplate },
      {field:'track_name', displayName:'Track', width: '100' },
      {field:'event_type', displayName:'Panel Type', width: '100' },
      {field:'approved_word', displayName:'Approved', width: '140' },
    ]
  };


  $scope.newPanelGridOptions = {
    data: 'newPanel',
    multiSelect: false,
    enableColumnResize: true,
    columnDefs: [
      { field: 'new_panel_id', visible: false },
      { field: 'panel_id', displayName:'ID', width: 50, cellTemplate: cellTemp },
      { field: 'panel_title', displayName:'Title', width: '*', cellTemplate: newPanelTitleTemplate},
      { field: 'panel_description', displayName:'Description', width: '*', cellTemplate: newPanelDescTemplate },
      { field: 'panel_track', displayName:'Track', width: '110', cellTemplate: newPanelTrackTemplate },
      { field: 'event_type', displayName:'Type', width: '110', cellTemplate: newPanelEventTypeTemplate },
      { field: 'panel_length', displayName:'Length', width: '60', cellTemplate: newPanelLengthTemplate},
      { field: 'save_button', displayName:'Save', width: '55', cellTemplate: newPanelSaveButtonTemplate},
      { field: 'cancel_button', displayName:'Cancel', width: '55', cellTemplate: newPanelCancelButtonTemplate},
    ]
  };

  $scope.editPanel = function(row) {
    $scope.loadEditPanelPage(row.entity);
  };

  $scope.cellClass = function(row) {
    if( row.entity.realm == 'dev' ) {
      return 'highlight';
    } else { return ''; }
  };

  $scope.getTrackById = function( id ) { 
    var dataObj;

    for( var p in $scope.trackList ) {
      if( $scope.trackList[p].id == id ) {
        dataObj = $scope.trackList[p];
        break;
      }
    }
    return dataObj;
  };

  $scope.getNewPanelById = function(panelId) {
    for( var oneNewPanel in $scope.newPanel ) {
      if( oneNewPanel.new_panel_id == panelId ) {
        return oneNewPanel;
      }
    }
    return undefined;
  };

  $scope.deleteNewPanel = function(panelObj) {
    var key = 0;
    while( key < $scope.newPanel.length ) {
      if( $scope.newPanel[key].new_panel_id == panelObj.new_panel_id ) {
        $scope.newPanel.splice(key,1);
        return;
      }
      key++;
    }
  };

  $scope.getNewPanelId = function() {
    var newPanelId = 0;
    var key = 0;
    for( key = 0; key < $scope.newPanel.length; key++ ) {
      if( $scope.newPanel[key].new_panel_id >= newPanelId ) {
        newPanelId = $scope.newPanel[key].new_panel_id;
      }
    }

    return newPanelId + 1;
  }; // end getNewPanelId

  $scope.updateContacted = function( data, status ) {
    data['contacted_word'] = status == 1 ? "Already Contacted" : "Mark as Contacted";
    data['contacted'] = status;
  };

  $scope.updateApproval = function( data, status ) {
    data['approved_word'] = status == 1 ? "Approved" : "Pending";
    data['approved'] = status;
  };


  $scope.loadEditPanelPage = function( panelData ) {
    $scope.panelToEdit = panelData;
    $scope.getPresenterInfoForPanel( $scope.panelToEdit, panelData.panel_id );

    angular.copy( $scope.panelToEdit, $scope.basePanelToEdit );

    $scope.showEdit = true;
// Is this your track? If not, make it uneditable
// Load panelData into form.
  };

  $scope.deletePanel = function(panelData) {
    if( $scope.panelToEdit.presenters.length > 0 ) {
      alert( "You cannot delete a panel that has any presenters assigned!" );
      return;
    }

    if( confirm( "Do you want to remove panel "+$scope.panelToEdit.panel_title+"?" ) ) {
      var postData = 'p=events-and-exhibits/panels/'+$scope.panelToEdit.panel_id+'/delete';
      postData += '&ret=json';

      $http.post('/admin/',
                 postData,
                 { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
           then(function(data) {
             $scope.closeEditPanel();
             $scope.loadPanels();
           }
      );
    };
  }; // end deletePanel


  $scope.approvePanel = function(panelData) {
    var postData = 'p=events-and-exhibits/panels/'+$scope.panelToEdit.panel_id+'/approve';
    postData += '&ret=json';

    $http.post('/admin/',
               postData,
               { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
         then(function(data) {
           $scope.updateApproval( panelData, 1 );
         }
    );
  }; // end approvePanel

  $scope.approvePanelEdit = function() {
    $scope.approvePanel($scope.panelToEdit);
  };

  $scope.approvePanelRow = function(row) {
    $scope.approvePanel(row.entity);
  };

  $scope.loadNewPanelPage = function() {
    var newBlankPanel = {
      panel_id: 'New',
      new_panel_id: $scope.getNewPanelId(),
      panel_title: '',
      panel_description: '',
      track_name: '',
      panel_track: '',
      panel_length: 1,
      cancel_button: '',
      save_button: ''
    };
    $scope.newPanel.push( newBlankPanel );
    $scope.showNewPanel = true;
  }; // end loadNewPanelPage

  $scope.savePanelEdits = function() {
    var postData = 'p=events-and-exhibits/panels/'+$scope.panelToEdit.panel_id;
    postData += '&ret=json&panel_id='+$scope.panelToEdit.panel_id;
    angular.forEach( $scope.panelToEdit, function(value,key) {
      if( $scope.basePanelToEdit[key] != value ) {
        value = encodeURIComponent(value);
        postData += '&'+key+'='+value;
      };
    });

    $http.post('/admin/',
               postData,
               { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
         then(function(data) {
           // This has been successfully updated. Do what?
           alert('Your changes have been saved');
         }
    );
  }; // end savePanelEdits

  $scope.cancelNewPanel = function( row ) {
    $scope.deleteNewPanel(row.entity);

    if( $scope.newPanel.length < 1 ) {
      $scope.showNewPanel = false;
    }
  };

  $scope.saveNewPanel = function( row ) {
    var postData = 'p=events-and-exhibits/panels/reg&ret=json';
    postData += '&title='+row.entity.panel_title;
    postData += '&panel_description='+row.entity.panel_description;
    postData += '&panel_length='+row.entity.panel_length;
    postData += '&panel_track='+row.entity.panel_track;
    postData += '&event_type='+row.entity.event_type;

    $http.post('/admin/',
               postData,
               { headers: {'Content-Type': 'application/x-www-form-urlencoded'} } ).
         then(function(data) {
           $scope.deleteNewPanel(row.entity);
           $scope.loadPanels();
           if( $scope.newPanel.length < 1 ) {
             $scope.showNewPanel = false;
           }
    });
  };

  $scope.getTableHeight = function() {
    return {
      height: Math.min( 100+($scope.myData.length * 30), 600 ) + 'px'
    };
  };

  $scope.getNewTableHeight = function() {
    return {
      height: Math.min( 30+($scope.newPanel.length * 60), 600 ) + 'px'
    };
  };

  $scope.closeEditPanel = function( ) {
    $scope.showEdit = false;
  };

  $scope.closeNewPanel = function( ) {
    $scope.showNewPanel = false;
  };

  $scope.showNewPanelPage = function() {
    return $scope.showNewPanel;
  };

  $scope.showEditPage = function() {
    return $scope.showEdit;
  };

  $scope.showListPage = function() {
    return !$scope.showEdit && !$scope.showNewPanel;
  };

  $scope.loadPresenters();
  $scope.loadPanels();


}]);



