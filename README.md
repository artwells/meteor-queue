meteor-queue
============

Job Queue for Meteor.js

##Features
- queued tasks executed by set priorities
- task locking allows the option of allowing only one entry per limited task
- schedule events in the future
- logging of critical events with optional verbose logging
- queue-wide and entry-level locking to avoid processing
- ability to requeue failed jobs at event-level configurable interval (for jobs set to fail at high-load or peak times)
- optional "non-ready" default state -- allowing some tests to require operational blessing
- fairly complete tests


##Quick Start
mrt add queue (once it's in atmosphere)
and you are ready!

add to a server or common file:

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
	  Queue.add({command:'console.log("queue called now");'});
	  Queue.add({command:'console.log("queue called again");'});
	  Queue.add({command:'console.log("first queue called");',priority:1});
	  console.log('about to run queue');
	  Queue.run();
	  console.log('done with the first run');
	  future = new Date();
	  future.setMinutes(future.getMinutes() + 1);
	  Queue.add({command:'console.log("queue called in THE FUTURE");',execute_after:future});
	  future.setMinutes(future.getMinutes() + 3);
	  Queue.add({command:'console.log("queue called in THE FUTURE a bit later";',execute_after:future});
	  Meteor.setInterval(function(){Queue.run()}, 1000);
	  Meteor.setInterval(function(){Queue.purgeLogs()}, 86400000); /* once a day */
  });
}


##Installation

##Options

##TODO

- Add cron-compatible scheduler
- Better configuration options?
- Log Viewer
- UI to Purge old Queues/edit pending jobs
- Method to include queue-ready functions that can be added to queue via UI


