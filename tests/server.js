var lockname = Math.random();
var entriestoremove = [];
var editableentry = null;
var entriestounlock = [];
var unlockafter = null; //time in which distant future locks are left for status change
var returnentry = null; //shared between tests

Tinytest.add(
    'queue - test log purge',
    function (test) {
        var savedLogLife = Queue.logLife;
        var savedEphemeralLogStatuses = Queue.ephemeralLogStatuses;
        var ebefore = before = new Date();
        before.setDate(before.getDate() - 3000);
        Queue.log.insert({command: 'OLDTEST', status: 'testlog', created_at: before});
        Queue.logLife = 3000; /*assuming no one will need 3000 days of logs */
        var res = Queue.log.findOne({command: 'OLDTEST'});
        test.equal(res.command, 'OLDTEST', 'test log missing');
        Queue.purgeOldLogs();

        res = Queue.log.findOne({command: 'OLDTEST'});
        test.isUndefined(res, 'old log purge failed');

        ebefore.setDate(ebefore.getTime() - Queue.ephemeralLogLife);
        Queue.ephemeralLogStatuses = ['ephtest '];
        Queue.log.insert({command: 'OLDEPHEMERAL', status: 'ephtest', created_at: ebefore});
        var eres = Queue.log.findOne({command: 'OLDEPHEMERAL'});
        test.equal(eres.command, 'OLDEPHEMERAL', 'ephemeral log missing');

        Queue.purgeOldLogs();
        eres = Queue.log.findOne({command: 'OLDEPHEMERAL'});
        test.isUndefined(eres, 'old ephemeral purge failed');

        Queue.logLife = savedLogLife;
        Queue.ephemeralLogStatuses  = savedEphemeralLogStatuses;
    }
    );



Tinytest.add(
    'queue - minimal add command to the queue and default state',
    function (test) {
        /* minimal required fields here*/
        var entry = [];
        var testdate = new Date();
        entry.command = "console.log('queue test of minimal add');";
        var res = Queue.add(entry);
        entriestoremove.push(res);
        test.isTrue(res, 'failed minimal addition');
        var back = Queue.entries.findOne({_id: res});
        /* just a small sanity check */
        test.isTrue(((Number(testdate) - Number(back.execute_after)) < 1), "execute after failed");
    }
    );


Tinytest.add(
    'queue - failure to add minimal requirements',
    function (test) {
        /* minimal */
        var res = Queue.add(null);
        test.isFalse(res, 'entry addition requirements failed');
    }
    );

Tinytest.add(
    'queue - remove entry',
    function (test) {
        var entry = [];
        entry.command = "console.log('queue test of remove entry');";
        var res = Queue.add(entry);
        test.isTrue(res, 'failed to add in order to remove');
        res = Queue.remove(res);
        test.isTrue(res, 'failed to remove');
    }
    );


Tinytest.add(
    'queue - remove nonexistant entry',
    function (test) {
        var res = Queue.remove('not an id' + Math.random());
        test.equal(res, 0, 'non-exist entry removed?');
    }
    );

Tinytest.add(
    'queue - test name lock',
    function (test) {
        var entry = [];
        var secondentry = [];
        var lock_name = "dontdupe" + Math.random();
        entry.command = "console.log('first test of name lock');";
        entry.lock_name = lock_name;
        var res = Queue.add(entry);
        entriestoremove.push(res);-
        test.isTrue(res, 'first entry failed');
        secondentry.command = "console.log('second test of name lock');";
        secondentry.lock_name = lock_name;
        res = Queue.add(secondentry);
        entriestoremove.push(res);
        test.isFalse(res, 'second entry should not pass');
    }
    );

Tinytest.add(
    'queue - test all assignments',
    function (test) {
        var entry = [];
        var execdate = new Date();
        execdate.setDate(execdate.getDate() + 2);
        var lockname = "allassign" + Math.random();
        entry.priority = 1;
        entry.name = 'all assignments';
        entry.command = "console.log('test of all assignments');";
        entry.execute_after = execdate;
        entry.lock_name = lockname;
        entry.reattempt =  30;
        entry.log_success = true;
        editableentry = Queue.add(entry);
        entriestoremove.push(editableentry);
        test.isTrue(editableentry, 'all assignment entry failed');
        /* get it out again */
        var res = Queue.entries.findOne({_id: editableentry});
        test.equal(entry.lock_name, res.lock_name, 'lock names mismatch');
        test.equal(entry.name, res.name, 'names mismatch');
        test.equal(entry.priority, res.priority, 'priority mismatch');
        test.equal(entry.log_successes, res.log_successes, 'log_successes mismatch');
        test.equal(entry.reattempt, res.reattempt, 'reattempt mismatch');
        test.equal(Queue.defaultStatus, res.status, 'pending default failed');
        test.equal(entry.execute_after, res.execute_after, 'execute date mismatch');
    }
    );



Tinytest.add(
    'queue - clean up test queues first',
    function (test) {
        var res = null;
        _.each(entriestoremove, function (id) {
            res = Queue.remove(id);
        });
        entriestoremove = [];
    }
    );

Tinytest.add(
    'queue - retrieve relevant entries',
    function (test) {
        var testentry =  {};
        var after = new Date();
after.setDate(after.getDate() + 3000); //absurdly ahead of time to check a specific group
var priorities = [5, 8, 2];
testentry.name = 'FUTURE PRIORITY ' + Math.random();
testentry.execute_after = after;
testentry.priority = priorities[0];
testentry.command = "console.log('test of future');";
var res = Queue.add(testentry);
test.isTrue(res, 'first retrieve entry failed');
entriestoremove.push(res);
testentry.priority = priorities[1];
res = Queue.add(testentry);
test.isTrue(res, 'second retrieve entry failed');
entriestoremove.push(res);
testentry.priority = priorities[2];
res = Queue.add(testentry);
test.isTrue(res, 'third retrieve entry failed');
entriestoremove.push(res);
after.setDate(after.getDate() + 1); //make it look at a date after 'after'
var all = Queue.get({execute_after: after});
var countresult = 0;
priorities.sort();
try {
    all.forEach(function (entry) {
        test.equal(entry.priority, priorities[countresult]);
        countresult = countresult + 1;
        entriestounlock.push(entry);
    });
} catch (e) {
    test.isFalse(e, 'failed to iterate over the group');
}
test.equal(countresult, 3, 'more or less than one result found');
}
);


/* status change test with locked orders */

Tinytest.add(
    'queue - change statuses',
    function (test) {
        var res = null;
        _.each(entriestounlock, function (entry) {
            res = Queue.changeStatus(entry._id, 'pending');
            test.isTrue(res, 'failed to change the status of ' + entry._id);
            entriestounlock = _.without(entriestounlock, _.findWhere(entriestounlock, {_id: entry._id}));
        });
    }
    );


Tinytest.add(
    'queue - check process',
    function (test) {
        var entry = [];
        var originalLogLevel = Queue.loglevel;
        Queue.loglevel = 1;
        entry.command = "return true;";
        entry.log_success = true;
        var res = Queue.add(entry);
        entriestoremove.push(res);
        returnentry = Queue.entries.findOne({_id: res});
        var result = Queue.process(returnentry);
        test.isTrue(result, 'process failed');
        var one = Queue.log.findOne({parent_id: res});
        if (typeof one === 'undefined') {
            test.isUndefined(one, 'no log created for sucess');
        } else {
            test.equal(one.status, 'success', 'success not logged properly');
        }
        Queue.loglevel = originalLogLevel;
    }
    );



Tinytest.add(
    'queue - check process unlogged',
    function (test) {
        var entry = [];
        entry.command = "return true;";
        var res = Queue.add(entry);
        entriestoremove.push(res);
        entry = Queue.entries.findOne({_id: res});
        var result = Queue.process(returnentry);
        var one = Queue.log.findOne({parent_id: res});
        test.isFalse(one, 'success logged when it should not be');
    }
    );

Tinytest.add(
    'queue - check lock delete',
    function (test) {
        var past = new Date();
        var entry = [];
past.setDate(past.getDate() - 3000); //absurdly ahead of time to check a specific group
entry.command = "return true;";
entry.lock_name = 'testlock';
Queue.add(entry);
past.setDate(past.getDate() + 1); //absurdly ahead of time to check a specific group
Queue.purgeOldLocks(past);
var allcount = Queue.entries.find({created_at: {$lte: past}, lockname: {$exists: true}}).count();
test.equal(allcount, 0, 'failed to clear old logs');
}
);

Tinytest.add(
    'queue - check log failures',
    function (test) {
        var entry = [];
        var originalLogLevel = Queue.loglevel;
        Queue.loglevel = 1;
        entry.command = "return NERFFFIN;";
        var res = Queue.add(entry);
        entriestoremove.push(res);
        returnentry = Queue.entries.findOne({_id: res});
        result = Queue.process(returnentry);
        test.isFalse(result, 'test should have failed');
        var one = Queue.log.findOne({parent_id: res});
        if (typeof one === 'undefined') {
            test.isUndefined(one, 'failure not logged');
        } else {
            test.equal(one.status, 'exception', 'success not logged properly');
        }
        var updatedentry = Queue.entries.findOne({_id: res});
        test.notEqual(updatedentry.updated_at, returnentry.updated_at, "entry failed to update");
        Queue.loglevel = originalLogLevel;
    }
    );


Tinytest.add(
    'queue - confirm reattempt switch',
    function (test) {
        var entry = [];
        var reattemptdate = new Date();
        reattemptdate.setMinutes(reattemptdate.getMinutes() + 120);
        entry.command = "return false;";
        entry.reattempt = 120;
        var res = Queue.add(entry);
        entriestoremove.push(res);
        returnentry = Queue.entries.findOne({_id: res});
        var result = Queue.process(returnentry);
        test.isFalse(result, 'test should have failed');
        var reattempt = Queue.entries.findOne({_id: res, status: 'pending'});
        if (typeof reattempt === 'undefined') {
            reattempt.isUndefined(reattempt, 'reattempt not found');
        }
        test.isTrue(reattempt.execute_after > reattemptdate, 'reattempt date not set properly');

    }
    );



Tinytest.add(
    'queue - clean up test queues second',
    function (test) {
        var res = null;
        _.each(entriestoremove, function (id) {
            res = Queue.remove(id);
        });
        entriestoremove = [];
    }
    );


/* @TODO: this function leaves an extra queue entry that doesn't make it into entriestoremove */
Tinytest.add(
    'queue - test run',
    function (test) {
        var entryone = [];
        var entrytwo = [];
        var future = new Date();
        var runargs = [];
        future.setDate(future.getDate() + 600);
        entryone.command = 'return true;';
        entrytwo.command = 'return true;';
        entryone.execute_after = future;
        entrytwo.execute_after = future;
        var backone = Queue.add(entryone);
        var backtwo = Queue.add(entrytwo);
        /* back up to put them 'after' */
        future.setMinutes(future.getMinutes() + 3);
        runargs.execute_after = future;
        Queue.run(runargs);
        var processedone = Queue.entries.findOne({_id: backone});
        test.equal(processedone.status, "completed");
        var processedtwo = Queue.entries.findOne({_id: backtwo});
        test.equal(processedtwo.status, "completed");
        entriestoremove.push(backone);
        entriestoremove.push(backtwo);
    }
    );

Tinytest.add(
    'queue - clean up test queues third',
    function (test) {
        var res = null;
        _.each(entriestoremove, function (id) {
            res = Queue.remove(id);
        });
    }
    );

Tinytest.add(
    'queue - test setInterval/clearInterval  (takes about 8 seconds)',
    function (test) {
        Queue.log.remove({command: 'INTERVALTEST'});
        var commandstring = 'Queue.log.insert({command: "INTERVALTEST", status: "testlog", created_at: new Date()});';
        var id = Queue.setInterval('fivesecondinterval', commandstring, 2000); /* once a day */
        Meteor._sleepForMs(2000);
        var logres =  Queue.log.find({command : 'INTERVALTEST'}).fetch();
        test.equal(logres.length, 1, 'ran once after 2 seconds');
        Meteor._sleepForMs(2000);
        var logres =  Queue.log.find({command : 'INTERVALTEST'}).fetch();
        test.equal(logres.length, 2, 'ran twice after four seconds');
        Queue.clearInterval(id);
        Meteor._sleepForMs(4000);
        var logres =  Queue.log.find({command : 'INTERVALTEST'}).fetch();
        test.equal(logres.length, 2, 'stopped after clearInterval');
        Queue.log.remove({command: 'INTERVALTEST'});
    }
    );

