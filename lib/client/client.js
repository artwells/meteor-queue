
if (typeof Houston !== "undefined"  ) {
    Meteor.startup(function () {
        /* called from here to get __ etc. from houston:admin */
        Meteor.call("addQueueRunNow");
    });

    Houston.menu({
        'type': 'template',
        'use': 'queueInterval',
        'title': 'Queue Intervals'
    });
}