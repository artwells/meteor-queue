
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
    /*
    Meteor.call("getQueueIntervalLength", function (err, result) { 
        if(err){
            console.log(err);
        }
        Session.set('QueueIntervalLength', result);
    } );

    Meteor.call("getQueueIntervals", function (err, result) { 
        if(err){
            console.log(err);
        }
        console.log(result);
        Session.set('QueueIntervals', result);
    } );

    Template.queueInterval.helpers({
        num_of_intervals: function () {
            var num = 0;
            try {
                num = Session.get('QueueIntervalLength');
            }
            catch (e){
                console.log(e);
            }
            return num;
        },
        all_intervals: function () {
            return Session.get("QueueIntervals");
        }
    });
*/
}