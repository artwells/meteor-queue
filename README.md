meteor-queue
============

Job Queue for Meteor.js, backed by Mongo and setInterval

##Features
- queued tasks executed by set priorities
- start/stop/change setInterval events
- schedule queued events in the future
- logging of critical events with optional verbose logging
- queue-wide and entry-level locking to avoid processing
- ability to requeue failed jobs at event-level configurable interval (for jobs set to fail at high-load or peak times)
- optional "non-ready" default state -- allowing some tasks to require operational blessing
- queues are stored in Mongo collections (`queue` and `queuelog`)
- option to purge ephemeral logs at higher frequency
- fairly complete tests
- setInterval group for handling Queue-specific tasks
- option integration with houston:admin allowing limited GUI manipulation (changing/deleting/run now queued task, changing, stopping setInterval taks)


##Installation
```sh
meteor add artwells:queue
```

add to a server.js or common file:

```javascript
if (Meteor.isServer) {
  Meteor.startup(function () {
	// code to run on server at startup
	Queue.add({command:'console.log("queue called now");'});
	console.log('about to run queue');
  });
}
```


## Options

* `Queue.loglevel`,  default `3`. `3` only includes lock conflicts.  2, 3 includes successes.

* `Queue.logLife`, default `30`. Days to keep logfiles.

* `Queue.ephemeralLogLife`, default `1800000`. microseconds to keep ephemeral log statuses

* `Queue.ephemeralLogStatuses`, default `['lockfailed','success']`. statuses to purge from logs quickly;

* `Queue.defaultPriority`, default `5`. 1 is highest.

* `Queue.defaultStatus`, default `pending`. By changing this to some other new word, you can make sure queue items are "blessed" in "pending" through another process.

* `Queue.keepsuccess`, default `true`. Keep successful jobs in the queue for the record.

* `Queue.lockLife`, default `30`. Minutes to keep lockfiles.

* `Queue.completedLife`, default `30`. Days to keep completed tasks.


## UI using Houston:admin (Optional)

"Houston is a zero-config Meteor Admin, modeled after Django Admin, intended as a simple way for developers to give end-users (or themselves) an easy way to view and manipulate their app's data.""
https://github.com/gterrono/houston

Houston can be used for CRUD of queued jobs and setInterval tasks.  It can also be used for viewing/purging logs.

All you need is to install houston

```sh
meteor add houston:admin
```
A "Run Now" button will appear above all queue entries. Also a "Stop" button will appear on all queueInterval tasks.  All queueinterval changes will change the task via Meteor's setInterval method.


## Examples

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

    Queue.changeMainInterval(15000); /*changes queue processing interval to 15sec (default 5 sec)*/

    /* set maintenance tasks */
    Queue.setInterval('purgeLocks', 'Queue.purgeOldLocks', 60000); /* once a minute */
    Queue.setInterval('purgeCompleted', 'Queue.purgeCompletedTasks()', 86400000); /* once a day */
    Queue.setInterval('purgeLogs','Queue.purgeLogs()', 86400000); /* once a day */

}
```
## TODO

- Documentation improvements
- More thorough testing
- consider UI improvements