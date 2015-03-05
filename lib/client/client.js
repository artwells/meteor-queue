
if (typeof Houston !== "undefined"  ) {
    Meteor.startup(function () {
        /* called from here to get __ etc. from houston:admin */
        Meteor.call("addQueueRunNow");
        Meteor.call("addQueueStopInterval");
    });
}