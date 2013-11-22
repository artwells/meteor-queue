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


##Installation
```sh
mrt add queue
```

add to a server.js or common file:

```javascript
if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
	  Queue.add({command:'console.log("queue called now");'});
	  console.log('about to run queue');
	  Queue.run();
  });
}
```


##Options

Queue.loglevel = 3; /* 3 only includes lock conflicts.  2,3 includes successes */

Queue.logLife = 30; /* days to keep logfiles */

Queue.defaultPriority = 5;/* 1 is highest */

Queue.defaultStatus = "pending"; /* by changing this to some other new word, you can make sure queue items are "blessed" in "pending" through another process. */

Queue.keepsuccess = true; /* keep successful in queue as record */

Queue.lockLife = 30; /* minutes to keep lockfiles */

Queue.completedLife = 30; /* days to keep completed tasks */



##Examples

```javascript
if (Meteor.isServer) {
  Meteor.startup(function () {
   Queue.loglevel = 1;
    Queue.keepsuccess = true;
    // code to run on server at startup
    Queue.add({command:'console.log("queue called now");'});
    Queue.add({command:'console.log("last queue called");',priority:10});
    Queue.add({command:'console.log("queue called again");'});
    Queue.add({command:'console.log("first queue called");',priority:1});
    console.log('about to run queue');
    Queue.run();
    console.log('done with the first run');
    future = new Date();
    future.setMinutes(future.getMinutes() + 1);
    Queue.add({command:'console.log("queue called in THE FUTURE");',execute_after:future});
    future.setMinutes(future.getMinutes() + 1);
    Queue.add({command:'console.log("THE FUTURE a bit later");',execute_after:future});
    Meteor.setInterval(function(){Queue.run()}, 1000); /* once a minute */
    Meteor.setInterval(function(){Queue.purgeOldLocks()}, 1000); /* once a minute */
    Meteor.setInterval(function(){Queue.purgeCompletedTasks()}, 86400000); /* once a day */
    Meteor.setInterval(function(){Queue.purgeLogs()}, 86400000); /* once a day */
}
```
##TODO

- Improve documentation
- Add cron-compatible scheduler
- Log Viewer
- UI to Purge old Queues/edit pending jobs
- Method to include queue-ready functions that can be added to queue via UI menus



