$(function () {
  function humanize(n, options) {
    options = options || {};
    var d = options.delimiter || ',';
    var s = options.separator || '.';
    n = n.toString().split('.');
    n[0] = n[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + d);
    return n.join(s);
  }

  $.getJSON('/total', function (data) {
    $('#total-packages').html(humanize(data.doc_count));
    $('#total-versions').html(humanize(data.doc_version_count));
    $('#total-deletes').html(humanize(data.doc_del_count));

    var downloads = $('table.downloads');
    downloads.find('td.count:eq(3)').html(humanize(data.download.today));
    downloads.find('td.count:eq(4)').html(humanize(data.download.thisweek));
    downloads.find('td.count:eq(5)').html(humanize(data.download.thismonth));
    downloads.find('td.count:eq(6)').html(humanize(data.download.lastday));
    downloads.find('td.count:eq(7)').html(humanize(data.download.lastweek));
    downloads.find('td.count:eq(8)').html(humanize(data.download.lastmonth));

    $('#node-version').html(data.node_version || 'v0.10.22');
    $('#app-version').html(data.app_version || '0.0.0');

    if (data.sync_model === 'all') {
      $('#sync-model').html('This registry will sync all packages from official registry.');
      $('#last-sync-time').html(new Date(data.last_sync_time));
    } else if (data.sync_model === 'exist') {
      $('#sync-model').html('This registry will only update exist packages from official registry.');
      $('#last-sync-time').html(new Date(data.last_exist_sync_time));
    }

    $('#need-sync').html(data.need_sync_num);
    $('#success-sync').html(data.success_sync_num);
    $('#fail-sync').html(data.fail_sync_num);
    $('#left-sync').html(data.left_sync_num);
    $('#percent-sync').html(Math.floor(data.success_sync_num / data.need_sync_num * 100));
    $('#last-success-name').html('<a target="_blank" href="/package/' + data.last_sync_module + '">' +
      data.last_sync_module + '</a>');

    if (!data.sync_status) {
      $('.syncing').remove();
    }

    $('.sync').show();
  });
});
