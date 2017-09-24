'use strict';

angular.module('myApp.panels.reports', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/panels/reports', {
    templateUrl: 'panels/reports.html',
    controller: 'ReportsCtrl'
  });
}])

.controller('ReportsCtrl', ['$scope', '$http', '$sce', function($scope, $http, $filter, $sce) {
  $scope.myData = [];
  $scope.boolListWords = [{ id: 'no', name: 'No' }, { id: 'yes', name: 'Yes' }];
  $scope.boolListInts = [{ id: '0', name: 'No' }, { id: '1', name: 'Yes' }];
  $scope.reportType = [
    { id: "nopanelist",
      name: 'Panels missing Presenter',
      repHeaders: [ 'panel_id', 'panel_title', 'track_name' ]
    },
    { id: "conflicts",
      name: 'Panelists with Conflicts',
      repHeaders: [ 'panel_id', 'panel_title', 'track_name' ]
    },
    { id: "panelistschedule",
      name: 'Panelist Schedules',
      repHeaders: [ 'name','fanname','email','panel_email','panel_title','room_name','panel_length','start_time','end_time']
    },
    { id: "pocketguide",
      name: 'Pocket Schedule',
      repHeaders: [ 'event_name','event_location','event_start_date','event_end_date','event_start_time','event_end_time','event_start_date_private','event_end_date_private','event_start_time_private','event_end_time_private','division','department','url']
    },
    { id: "overscheduled",
      name: 'Panels Over-scheduled',
      repHeaders: [ 'panel_id', 'panel_title', 'track_name', 'room_name', 'panel_day', 'start_time']
    },
    { id: "undescribed",
      name: 'Panels Missing Descriptions',
      repHeaders: [ 'panel_id', 'panel_title', 'track_name']
    },
    { id: "allpanels",
      name: 'All Panels',
      repHeaders: [ 'panel_id', 'panel_title']
    },
    { id: "allpanelsdesc",
      name: 'All Panels w/ descriptions',
      repHeaders: [ 'panel_id', 'panel_title','panel_description_sub','panel_description']
    },
  ];
  $scope.displayType = [
    { id: "display", name: 'Display' },
    { id: "download", name: 'Download as .csv' },
  ];
  $scope.reportName = '';
  $scope.displayMethod = '';

  var cellTemp = '<div class="ngCellText" ng-class="cellClass(row)">{{row.getProperty(col.field)}}</div>';

  $scope.reportResults = { 
    data: 'myData',
    multiSelect: false,
    enableColumnReordering: true,
    enableColumnResize: true,
  };

  $scope.edit = function(row) {
    $scope.loadEditPage(row.entity);
  };

  $scope.cellClass = function(row) {
    if( row.entity.realm == 'dev' ) {
      return 'highlight';
    } else { return ''; }
  };


  // Run reports
  $scope.runReport = function() {
    if( $scope.reportName == '' ) {
      alert( "Select a report to run." );
      return;
    }

    $scope.myData = [];

    $http.get('/admin/?p=panels/schedule/runreport&ret=json&reportName='+$scope.reportName).
         then(function(data) {
      $scope.myData = data.data.page;
    });
  };

  $scope.getReportDef = function( rep ) {
    for( var i = 0; i < $scope.reportType.length; i++ ) {
      if( $scope.reportType[i].id == rep ) {
        return $scope.reportType[i];
      }
    }
  };

  $scope.buildOutputRow = function( data, rep ) {
    var report = $scope.getReportDef(rep);
    var fields = report.repHeaders;

    var res = '';
    for( var i = 0; i < fields.length; i++ ) {
      if( res != '' ) res += ',';

      var token = data[fields[i]];
      if( token != null && token.indexOf(",") >= 0 ) {
        token = '"'+token+'"';
      }

      res += token;
    }

    return res;
  };

  // Build header for csv output
  $scope.buildOutputHeader = function( rep ) {
    var report = $scope.getReportDef(rep);
    var fields = report.repHeaders;

    var res = '';
    for( var i = 0; i < fields.length; i++ ) {
      if( res != '' ) res += ',';

      res += fields[i];
    }

    return res;
  };

  // Download .csv of report results
  $scope.downloadResults = function() {
    if( $scope.myData.length < 1 ) {
      alert( "Run a report before downloading results" );
      return;
    }

    var csvRows = [];
    csvRows.push( $scope.buildOutputHeader( $scope.reportName ) );

    for( var i=0, l = $scope.myData.length; i < l; ++i ) {
      csvRows.push( $scope.buildOutputRow( $scope.myData[i], $scope.reportName ) );
    }

    var csvString = csvRows.join("\r\n");
    csvString = encodeURIComponent(csvString);

    var a         = document.createElement('a');
    a.href        = 'data:application/csv,' + csvString;
    a.target      = '_blank';
    a.download    = $scope.reportName+'.csv';

    document.body.appendChild(a);
    a.click();
  };

}]);

