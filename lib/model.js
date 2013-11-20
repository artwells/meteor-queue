



Queue.purgeOldLogs = function (){
  var before = new Date();
  before.setDate(before.getDate()- Queue.logLife);
  Queue.log.remove({created_at: {$lte: before}});
}
 

Queue.add = function (entry) {
  res = false;
  /*command, name,  priority, execute_after, reattempt, lock_name, logsuccesses*/
  entryarray=[];
  if (typeof entry !== "object" || entry === null){
    return false;
  }  
  if (typeof entry.command !== "string") { 
    return false;
  }
  entryarray.command=entry.command;

  if (typeof entry.execute_after === "undefined" || entry.execute_after === null) { 
    entry.execute_after = new Date();
  }
  entryarray.execute_after = entry.execute_after;
  /* force default state through this method */
  entryarray.status = Queue.defaultStatus;


  entryarray.priority = Queue.defaultPriority; /* default to mediocre default*/

  if (typeof entry.priority === "number") { 
    entryarray.priority = entry.priority;
  }

  if (typeof entry.name === "string") { 
    entryarray.name = entry.name;
  }

  if (typeof entry.lock_name === "string") {
    entryarray.lock_name = entry.lock_name;
  }

  if (typeof entry.execute_after === "object") {
    entryarray.execute_after = entry.execute_after;
  }

  if (typeof entry.log_success === "boolean") {
    entryarray.log_success = entry.log_success;
  }

  if (typeof entry.reattempt === "number") {
    entryarray.reattempt = entry.reattempt;
  }
  entryarray.created_at = new Date();
  entryarray.updated_at = new Date();

  try {
    res=Queue.entries.insert(entryarray);
  }
  catch(e){
      /* lock errors are expected and should be logged only if verbose */
      if(e.err !== 'undefined' && e.err.indexOf('E11000') === 0 &&
        Queue.loglevel >2 ){
        Queue.log.insert({command:'Queue.add failed '+ entryarray.lock_name, status:'lockfailed', data:e.err, created_at: new Date()});
      }
      else if (Queue.loglevel > 0 ){
        /* otherwise include the whole stack */
        Queue.log.insert({command:'Queue.add failed '+ entryarray.lock_name, status:'lockfailed', data:e, created_at: new Date()});
      }
    }
  return res;
}

/* not much now, but might need to be complicated in the future */
Queue.remove = function(entryId) {
  return Queue.entries.remove({_id:entryId});
}

/* sets all found entries as 'locked'
* @TODO by-priority 
*/
Queue.get = function(args){
/* defaults status: pending,execute_after:now, */
  if (typeof args.execute_after === "undefined" || args.execute_after === null) { 
    execute_after = new Date();
  }
  else{ 
    execute_after = args.execute_after;
  }

  if (typeof args.status !== "string" || args.status === null) { 
    /* do NOT use defaultStatus here, as you want to allow defaultStatus to serve an optional other purpose */
    status = 'pending'; 
  }
  else{
     status = status.args;
  }

  return Queue.entries.findAndModify({execute_after: {$lte: execute_after},status: 'pending'}, {sort: {priority: 1}},
    {$set: {status: 'locked'}}
    );

}


Queue.changeStatus = function (id, status){
  var modified = Queue.entries.update({_id: id}, {$set: {status: status}});
  if(modified === 1){
    return true;
  }
  return false;
}


/* @TODO: add some sanity checks */
Queue.process = function (entry){
  var result=false;
  var message='failed';
  var history = null;
  try{
    result = new Function(entry.command)();
  }
  catch (e){
    result=false;
    message = e.err;

  }

  if(result===true){
    if(entry.log_success ||  Queue.loglevel > 1){
      Queue.log.insert({command:entry.command, parent_id:entry._id, status:'success', data:result, created_at: new Date()});
    }
    if(Queue.keepsuccess){

      if(typeof entry.history !== "undefined"){
        history = entry.history + ' command returned true (' + new Date() + ');';
      }
      else{
        history = 'command returned true (' + new Date() + ');';
      }
      modified = Queue.entries.update({_id: entry._id}, {$set:{status:'completed',history: history,updated_at: new Date()}});
      if(modified !== 1 && Queue.loglevel > 0){
       Queue.log.insert({command:'update on succes', parent_id:entry._id, status:'exception', data:'unable to update entry', created_at: new Date()});
      }
    }
    return true;
  }

  if(Queue.loglevel > 0){
      Queue.log.insert({command:entry.command, parent_id:entry._id, status:'exception', data:message, created_at: new Date()});
  }

  if(entry.reattempt > 0){
    var execdate = new Date();
    execdate.setMinutes(execdate.getMinutes()+entry.reattempt);
    var reattemptmodified = Queue.entries.update({_id: entry._id}, {$set: {status: 'pending', execute_after:execdate}});
    if(reattemptmodified !== 1 && Queue.loglevel > 0){
        Queue.log.insert({command:entry.command, parent_id:entry._id, status:'exception', data:'unable to requeue command', created_at: new Date()});
    }
  }
  else{ 
    if(typeof entry.history !== "undefined"){
        history = entry.history + ' command returned false (' + new Date() + ');';
      }
      else{
        history = ' command returned false (' + new Date() + ');';
      }
    historymodified = Queue.entries.update({_id: entry._id}, {$set:{status:'failed',history: history,updated_at: new Date()}});
    if(historymodified !== 1 && Queue.loglevel > 0){
        Queue.log.insert({command:entry.command, parent_id:entry._id, status:'exception', data:'unable to requeue command', created_at: new Date()});
    }
  }
  return false;
}


Queue.run = function (args){
  /* hacky locking with entry table */
  var entry = [];
  var future = new Date();
  var getargs = [];
  future.setDate(future.getDate() + 600); /* put it out there so it doesn't execute */
  entry.command = 'return true;';
  entry.lock_name = 'query.run';
  entry.execute_after = future;
  
    lock=Queue.add(entry);
    if(lock === false){ 
    if (Queue.loglevel > 0 ){
        Queue.log.insert({command:'Queue.run failed due to locking '+ entry.lock_name, status:'lockfailed', created_at: new Date()});
      }
      return false;
    }

  /* lock obtained */
  if (typeof args.execute_after === "undefined" || args.execute_after === null) { 
    args.execute_after = new Date();
  }
  getargs.execute_after = args.execute_after;

  /* @TODO: add args for status and execute_after */
  var all = Queue.get(getargs);
  _.each(all, function(entry){
      Queue.process(entry);
  });
  /* lock */
  Queue.remove(lock);
  return true;   
}