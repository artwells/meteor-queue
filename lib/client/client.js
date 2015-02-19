Meteor.startup(function () {
	if (typeof Houston !== "undefined"  ) {
	/* called from here to get __ etc. from houston:admin */
    	Meteor.call("addQueueRunNow");
    }
});
