var FULLPAGENAMEVAR = '';

function queryObj() {
  var result = {}, keyValuePairs = location.search.slice(1).split('&');

  keyValuePairs.forEach(function(keyValuePair) {
      keyValuePair = keyValuePair.split('=');
      result[keyValuePair[0]] = keyValuePair[1] || '';
  });

  return result;
}

function loadPageList( data, ele ) {
  data.results.forEach( function( el, ind, ar ) {
    var op = new Option( el.pagename, el.resource_id );
    $(op).html( el.pagename+" - "+el.resource_id );

    $('#'+ele).append( op );

    return true;
  } );
}

function addVerifyPagename() {
  $('#pagename').focusout( function() {
    if( $("#pagename").val().length < 3 ) {
      $("#pagename").addClass("badform");

      $('#content-err').html( "The page name must be at least 3 characters" );
      return false;
    } else {
      $('#content-err').html( " " );
      $("#pagename").removeClass("badform");
    }

    if( $("#pagename").val().indexOf( ' ' ) != -1 ) {
      $("#pagename").addClass("badform");
      $('#content-err').html( "The page name must not contain a space" );
      return false;
    } else {
      $('#content-err').html( " " );

      $("#pagename").removeClass("badform");
    }

    if( $("#pagename").val().indexOf( '/' ) != -1 ) {
      $("#pagename").addClass("badform");
      $('#content-err').html( "The page name must not contain a slash" );

      return false;
    } else {
      $('#content-err').html( " " );
      $("#pagename").removeClass("badform");
    }
  } );

}

function startRenamePage() {
  $('.rename-container').show();
  return false;
}

function showAngular() {
  $('.angular-temp-vars').show();
  $('.angular-temp-vars-button').hide();
}

function hideAngular() {
  $('.angular-temp-vars').hide();
  $('.angular-temp-vars-button').show();
}

function showHelp() {
  $('#content-help').toggle();
  $('#content-help-showtext').toggle();
  $('#content-help-hidetext').toggle();
}

function saveAngular() {
  var resid = $('.resource_id').val();
  var templateUrl       = encodeURIComponent($('.templateUrl').val());
  var controller        = encodeURIComponent($('.controller').val());
  var headerImageLeft   = encodeURIComponent($('.headerImageLeft').val());
  var headerImageRight  = encodeURIComponent($('.headerImageRight').val());

  var saveAngularUrl = '/admin/?ret=json&f=saveAng&resource_id='+resid+
    "&templateUrl="+templateUrl+"&controller="+controller+"&headerImageLeft="+headerImageLeft+"&headerImageRight="+headerImageRight;

  console.log( saveAngularUrl );

  $.ajax({
    url: saveAngularUrl,
    success: function(data) {
      saveAngularDone(data);
    }
  });

  return false;
}

function saveAngularDone( data ) {
alert("Done");
  console.log( "saveAngularDone" );
  console.log( data );
  hideAngular();
}

function doRename() {
  var newname = $("#newname").val();
  console.log( newname );

  var resid = $('.resource_id').val();
  console.log( resid );
  var renameurl = '/admin/?ret=json&f=rename&resource_id='+resid+"&newname="+newname;

  $('.rename-container').hide();

  $.ajax({
    url: renameurl,
    success: function(data) {
      startLoadPageContent( resid );
    }
  });

  return false;
}

function loadRevisionContent( revid ) {
  var resid = $('.resource_id').val();
  var contenturl = '/admin/?ret=json&f=getcontent&ns=1&resource_id='+resid+"&rev="+revid;
  $('.hist-hide-button').click();

  $.ajax({
    url: contenturl,
    success: function(data) {
      loadPageContent( data );
    }
  });

  return false;
}

function startLoadPendingContent() {
  var pendingurl = '/admin/?ret=json&f=needs_appr&ns=1';

  $.ajax({
    url: pendingurl,
    success: function(data) {
      loadPendingContent( data );
    }
  });

  return false;
}

function createPendingRow( data ) {
  $('#pending-content-span').append( "  <div class='pending-resource-row'>\n"+
"    <div class='rownum-col'>"+data.rownum+"</div>\n"+
"    <div class='resource-id-col'>"+data.resource_id+"</div>\n"+
"    <div class='pagename-col'><a target=_new href='/#/"+data.pagename+"'>"+data.pagename+"</a></div>\n"+
"    <div class='command-col'><a target=_new href='http://test.clockworkalchemy.com/admin/index.cgi?p=edit&resource_id="+data.resource_id+"'>Edit</a></div>\n"+
"    <div class='lastedited-on-col'>"+data.updated_date+"</div>\n"+
"    <div class='lastedited-by-col'>"+data.updated_by+"</div>\n"+
"  </div>\n"
 );

}

function loadPendingContent( data ) {
  var res = data.results;
  var length = res.length;

  for( var i = 0; i < length; i++ ) {
    res[i].rownum = i+1;
    var elem = createPendingRow( res[i] );
  }
}

function startLoadPageContent( resid ) {
  var contenturl = '/?ret=json&f=getcontent&ns=1&resource_id='+resid;

  $.ajax({
    url: contenturl,
    success: function(data) {
      loadPageContent( data );
    }
  });

  return false;
}

function gotoEditingPage() {
  window.open('/#/'+FULLPAGENAMEVAR);
}

function loadPageContent( data ) {
  if( data == null || data.results == null || data.results.length <= 0 ) return;

  var content = data.results[0];

  FULLPAGENAMEVAR = content['full_pagename'];

  var htmlFields = [ 'resource_id', 'parent_page', 'pagename', 'full_pagename', 'revision', 'realm' ];
  var formFields = [ 'resource_id', 'title', 'image_url', 'summary', 'full_text','featured','featuredyear','templateUrl','controller','headerImageLeft','headerImageRight', 'live_date' ];
  var featuredStatuses = [ 'Normal', 'Featured News', 'Featured Important' ];
  var subTemplate = { '1': 'blank', '3': 'default', '4': 'leftpicture', '5': 'rightpicture' };

  for( var x = 0; x < htmlFields.length; x++ ) {
    $('.'+htmlFields[x]).html( content[htmlFields[x]] );
  }
  for( var x = 0; x < formFields.length; x++ ) {
    $('.'+formFields[x]).val( content[formFields[x]] );
  }

  $('.featured-status').html( featuredStatuses[content['featured']] );
  $('.featured-year').html( content['featuredyear'] );
  $('.subtemplate').html( subTemplate[content['subtemplate_id']] );
}

function updateFeaturedStatus(r2) {
  var resid;
  var featured = $('.featured').val();
  var featuredYear = $('.featuredyear').val();

  var summary = $('.summary').val().length;
  if( summary < 5 ) {
//    alert( "You cannot mark an item Featured if it does not have a summary." );
  }

  if( r2 != undefined ) {
    resid = r2;
    featured = $('#featured-'+resid).val();

    $.ajax({
      url: '/admin/index.cgi?ret=json&f=update_featured_status&resource_id='+resid+'&featured='+featured+'&featuredyear='+featuredYear,
      success: function(data) { }
    });

  } else {
    resid = $('.resource_id').val();

    $.ajax({
      url: '/admin/index.cgi?ret=json&f=update_featured_status&resource_id='+resid+'&featured='+featured+'&featuredyear='+featuredYear,
      success: function(data) {
        startLoadPageContent( resid );
      }
    });
  }

  return false;
}


function updateSubTemplate() {
  var resid;
  var subtemplate_id = $('#subtemplate').val();

  resid = $('.resource_id').val();

  $.ajax({
    url: '/admin/index.cgi?ret=json&f=update_subtemplate&resource_id='+resid+'&subtemplate_id='+subtemplate_id,
    success: function(data) {
      startLoadPageContent( resid );
    }
  });

  return false;
}



function deleteContent() {
  var resid = $('.resource_id').val();

  if( confirm( "Are you sure you wish to DELETE THIS ENTIRE PAGE FOREVER!?!?!?" ) ) {
    $.ajax({
            url: '/admin/index.cgi',
            type: 'GET',
            data: { 'ret': 'json', 'd': 'deleteContent', 'method': 'DELETE', 'resource_id': resid },
            success: function(data) {
              alert( "The page has been deleted" );
              window.location.href = "http://test.clockworkalchemy.com/admin/?p=content";
            },
            error: function(data) {
              alert( "There was an error" );
            }
    });
  }

  return false;
}

function updateLiveDate() {
  var resid = $('.resource_id').val();
  var rev = $('.revision').html();
  var live_date = $('.live_date').val();

  if( confirm( "Are you sure you wish to set the date this revision becomes available?" ) ) {
    $.ajax({
            url: '/admin/index.cgi',
            type: 'GET',
            data: { 
              'ret': 'json',
              'f': 'updateLiveDate',
              'resource_id': resid,
              'revision': rev,
              'live_date': live_date
            },
            success: function(data) {
              alert( "Live Date has been updated." );
            },
            error: function(data) {
              alert( "There was an error" );
            }
    });
  }

  return false;

}

function pruneContent() {
  var resid = $('.resource_id').val();

  if( confirm( "Are you sure you wish to prune the history of this page? This cannot be undone!" ) ) {
    $.ajax({
      url: '/admin/index.cgi?ret=json&f=pruneHist&resource_id='+resid,
      success: function(data) {
        donePruneContent( data, resid );
      }
    });
  }

  return false;
}

function donePruneContent( data, resid ) {
  alert("This page has had its history pruned.");
}

function approveContent() {
  var resid = $('.resource_id').val();
  var rev = $('.revision').html();

  $.ajax({
    url: '/admin/index.cgi?ret=json&f=appr&resource_id='+resid+'&rev='+rev,
    success: function(data) {
      doneApproveContent( data, resid );
    }
  });

  return false;
}

function doneApproveContent( data, resid ) {
  console.log( data );

  alert("Done");
  startLoadPageContent( resid );
}

function submitContent() {
  var resid = $('.resource_id').val();

  var formFields = [ 'resource_id', 'title', 'image_url', 'summary', 'full_text', 'live_date' ];

  var postContent = 'ret=json&';
  for( var x = 0; x < formFields.length; x++ ) {
    if( formFields[x] == 'summary' ) {
      $('.'+formFields[x]).val()
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"');
    }
    postContent += formFields[x]+"="+encodeURIComponent($('.'+formFields[x]).val())+"&";
  }

  $.ajax({
    type: 'POST',
    url: '/admin/index.cgi',
    data: postContent,
    success: function(data) {
      alert("Done");
      startLoadPageContent( resid );
    }
  });

  return false;
}

function loadHistoryList( data ) {
  $('.hist-list').html( "<div style='display: inline; position: relative; right: 4px;' class='hist-hide-button'>[ X ]</div> - Page History" );
  $('.hist-hide-button').click( function(eve) {
    eve.preventDefault();
    $('.hist-list').html( "" );
    $('.hist-list-container').hide();
  });

  $('.hist-list-container').show();

  for( var x = 0; x < data.results.length; x++ ) {
    var h = data.results[x];

    $('.hist-list').append( "<div class='hist-cell'>"+h.revision+" updated on "+h.updated_date+" by "+h.updated_by+" in "+h.realm+" - <button onClick='return loadRevisionContent( "+h.revision+" );'>Load</button></div>" );
  }
}


function showHistory() {
  var resid = $('.resource_id').val();

  $.ajax({
    url: '/?ret=json&f=hist&resource_id='+resid,
    success: function(data) {
      loadHistoryList( data );
    }
  });

  return false;
}

function bootstrap( page ) {
  var ele = 'pagename';

  if( page == 'new' ) {
    ele = 'parentpage';
  }

  $.ajax({
    url: '/?ret=json&f=pagelist&ns=1',
    success: function(data) {
      loadPageList( data, ele );
    }
  });

  if( page == 'new' ) {
    addVerifyPagename();
  } else if( page == 'edit-content' ) {
    var qo = queryObj();
    startLoadPageContent( qo.resource_id );
  } else if( page == 'pending-content' ) {
    startLoadPendingContent( );
  }

}

