var lockname = Math.random();
var entriestoremove = [];
var editableentry = null;
var entriestounlock = [];
var unlockafter = null; //time in which distant future locks are left for status change

Tinytest.add(
	'queue - test log purge',
	function (test) {	
		var savedLogLife=Queue.logLife;
		var before = new Date();
        before.setDate(before.getDate()- 3000);
		Queue.log.insert({command:'OLDTEST', status:'lockfailed', created_at: before});
        Queue.logLife=3000; /*assuming no one will need 3000 days of logs */
		Queue.purgeOldLogs();
		Queue.logLife=savedLogLife;
		res=Queue.log.findOne({command:'OLDTEST'});
		test.isUndefined(res, 'old log purge failed');


	}
);


Tinytest.add(
	'queue - minimal add command to the queue and default state',
	function (test) {
		/* minimal required fields here*/
		var entry=[];
		var testdate = new Date();
		entry.command = "console.log('queue test of minimal add');";
		res=Queue.add(entry);
		entriestoremove.push(res);
		test.isTrue(res, 'failed minimal addition');
		back=Queue.entries.findOne({_id:res});
		/* just a small sanity check */
		test.isTrue(((Number(testdate) - Number(back.execute_after)) < 1), "execute after failed" );
	}
);


Tinytest.add(
	'queue - failure to add minimal requirements',
	function (test) {
		/* minimal */
		res=Queue.add(null);
		test.isFalse(res, 'entry addition requirements failed');
		
});

Tinytest.add(
	'queue - remove entry',
	function (test) {
		var entry=[];
		entry.command = "console.log('queue test of remove entry');";
		res=Queue.add(entry);
		test.isTrue(res, 'failed to add in order to remove');
		res=Queue.remove(res);
		test.isTrue(res, 'failed to remove');
	}
);


Tinytest.add(
	'queue - remove nonexistant entry',
	function (test) {
		res=Queue.remove('not an id' + Math.random());
		test.equal(res,0, 'non-exist entry removed?');
	}
);

Tinytest.add(
	'queue - test name lock',
	function (test) {
		var entry=[];
		var secondentry=[];
		var lock_name = "dontdupe" + Math.random();
		entry.command = "console.log('first test of name lock');";
		entry.lock_name =lock_name;
		res=Queue.add(entry);
		entriestoremove.push(res);
		test.isTrue(res, 'first entry failed');
		secondentry.command = "console.log('second test of name lock');";
		secondentry.lock_name =lock_name;
		res=Queue.add(secondentry);
		entriestoremove.push(res);
		test.isFalse(res, 'second entry should not pass');
	}
);

Tinytest.add(
	'queue - test all assignments',
	function (test) {
		var entry = [];
		var execdate = new Date();
        execdate.setDate(execdate.getDate()+2);
        var lockname="allassign" + Math.random();

		entry.priority = 1;
		entry.name = 'all assignments';
		entry.command = "console.log('test of all assignments');";
		entry.execute_after = execdate;
	    entry.lock_name = lockname;
	    entry.reattempt =  30;
	   	entry.log_success = true; 

		editableentry=Queue.add(entry);
		entriestoremove.push(editableentry);
		test.isTrue(editableentry, 'all assignment entry failed');
		/* get it out again */
		res=Queue.entries.findOne({_id:editableentry});
		
		test.equal(entry.lock_name,res.lock_name, 'lock names mismatch');
		test.equal(entry.name,res.name, 'names mismatch');
		test.equal(entry.priority,res.priority, 'priority mismatch');
		test.equal(entry.log_successes,res.log_successes, 'log_successes mismatch');
		test.equal(entry.reattempt,res.reattempt, 'reattempt mismatch');
		test.equal(Queue.defaultStatus,res.status, 'pending default failed');
		test.equal(entry.execute_after,res.execute_after, 'execute date mismatch');
	}
);



Tinytest.add(
	'queue - clean up test queues first',
	function (test) {
		_.each(entriestoremove, function(id){
			res=Queue.remove(id);
		});
		entriestoremove=[];
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
		res=Queue.add(testentry);
		test.isTrue(res, 'first retrieve entry failed');
		entriestoremove.push(res);
		testentry.priority = priorities[1];
		res=Queue.add(testentry);
		test.isTrue(res, 'second retrieve entry failed');
		entriestoremove.push(res);
		testentry.priority = priorities[2];
		res=Queue.add(testentry);
		test.isTrue(res, 'third retrieve entry failed');
		entriestoremove.push(res);

        after.setDate(after.getDate() + 1); //make it look at a date after 'after'
		var all = Queue.get({execute_after: after});
		var countresult = 0;
		priorities.sort();
		try {
			all.forEach(function(entry){
				test.equal(entry.priority,priorities[countresult]);
				countresult = countresult + 1;
				entriestounlock.push(entry);
			});
		}catch (e){
			test.isFalse(e,'failed to iterate over the group');
		}
		test.equal(countresult,3, 'more or less than one result found');
	}
);


/* status change test with locked orders */

Tinytest.add(
	'queue - change statuses',
	function (test) {
		_.each(entriestounlock, function(entry){
			res=Queue.changeStatus(entry._id, 'pending');
			test.isTrue(res, 'failed to change the status of ' +entry._id);
			entriestounlock = _.without(entriestounlock, _.findWhere(entriestounlock, {_id: entry._id}));
		});
	}
);


Tinytest.add(
	'queue - check process',
	function (test) {		
		var entry = [];
		var originalLogLevel=Queue.loglevel;
		Queue.loglevel = 1; 
		entry.command = "return true;";
		entry.log_success = true;
		res=Queue.add(entry);
		entriestoremove.push(res);
		returnentry = Queue.entries.findOne({_id:res});
    	result = Queue.process(returnentry);
    	test.isTrue(result, 'process failed');
    	one=Queue.log.findOne({parent_id:res});
    	if(typeof one === 'undefined'){
    		test.isUndefined(one,'no log created for sucess');
    	}
    	else{
    		test.equal(one.status,'success',' success not logged properly');
    	}
    	Queue.loglevel = originalLogLevel;


	}
);



Tinytest.add(
	'queue - check process unlogged',
	function (test) {		
		var entry = [];
		entry.command = "return true;";
		res=Queue.add(entry);
		entriestoremove.push(res);
		entry = Queue.entries.findOne({_id:res});
		result = Queue.process(returnentry);
    	one=Queue.log.findOne({parent_id:res});
    	test.isFalse(one,'success logged when it should not be');
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
		allcount = Queue.entries.find({created_at: {$lte: past}, lockname: {$exists: true}}).count();
		test.equal(allcount, 0, 'failed to clear old logs');
	}
);

Tinytest.add(
	'queue - check log failures',
	function (test) {		
		var entry = [];
		var originalLogLevel=Queue.loglevel;
		Queue.loglevel = 1; 
		entry.command = "return NERFFFIN;";
		res=Queue.add(entry);
		entriestoremove.push(res);
		returnentry = Queue.entries.findOne({_id:res});
    	result = Queue.process(returnentry);
    	test.isFalse(result, 'test should have failed');
    	one=Queue.log.findOne({parent_id:res});
    	if(typeof one === 'undefined'){
    		test.isUndefined(one,'failure not logged');
    	}
    	else{
    		test.equal(one.status,'exception',' success not logged properly');
    	}
		updatedentry = Queue.entries.findOne({_id:res});
		test.notEqual(updatedentry.updated_at,returnentry.updated_at,"entry failed to update");
    	Queue.loglevel = originalLogLevel;
	}
);






Tinytest.add(
	'queue - confirm reattempt switch',
	function (test) {		
		var entry = [];
    	var reattemptdate = new Date();
    	reattemptdate.setMinutes(reattemptdate.getMinutes()+120);
		entry.command = "return false;";
		entry.reattempt = 120;
		res=Queue.add(entry);
		entriestoremove.push(res);
		returnentry = Queue.entries.findOne({_id:res});
    	result = Queue.process(returnentry);
    	test.isFalse(result, 'test should have failed');
		reattempt = Queue.entries.findOne({_id:res, status:'pending'});
		if(typeof reattempt === 'undefined'){
			reattempt.isUndefined(reattempt,'reattempt not found');
		}
		test.isTrue(reattempt.execute_after > reattemptdate, 'reattempt date not set properly');

	}
);



Tinytest.add(
	'queue - clean up test queues second',
	function (test) {
		_.each(entriestoremove, function(id){
			res=Queue.remove(id);
		});
		entriestoremove = [];
	}
);


/* @TOD: this function leaves an extra queue entry that doesn't make it into entriestoremove */
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
		entryone.execute_after=future;
		entrytwo.execute_after=future;
		backone = Queue.add(entryone);
		backtwo = Queue.add(entrytwo);
		/* back up to put them 'after' */
    	future.setMinutes(future.getMinutes() + 3);
    	runargs.execute_after = future;
    	Queue.run(runargs);
		processedone = Queue.entries.findOne({_id:backone});
		test.equal(processedone.status,"completed");
		processedtwo = Queue.entries.findOne({_id:backtwo});
		test.equal(processedtwo.status,"completed");
		entriestoremove.push(backone);
		entriestoremove.push(backtwo);
	}
);

Tinytest.add(
	'queue - clean up test queues third',
	
	function (test) {
		_.each(entriestoremove, function(id){
			res=Queue.remove(id);
		});
	}
);



