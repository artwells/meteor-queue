/**
* queue schema
*
*{
*    "_id" : ObjectId,
*    "status" : string,
*    "priority" : int, // 1s first
*    "command" : string,
*    "execute_after" : ISODate,
*    "lock_name" : string, //only allow one task of this name to be queued
*    "history" : {
*   },
*    "reattempt" :  int //number of minutes to requeue
*    "log_success" : boolean
*    "created_at": ISODate,
*    "updated_at": ISODate
*}
*
*/


/**
*  queuelog schema
*
*  "_id" : ObjectId,
*   "status" : string, // lockfailed
*   "created_at" : ISODate
*   "command" : string,
*   "parent_id": string
*  "data": {
*     results
*  }
*
*/

/**
*  queuereadrun schema
*
*  "_id" : ObjectId
*   "created_at" : ISODate
*   "command" : string,
*   "name" : string,
*   "permission" : int //notimplemented yet
*   "enabled" : boolean
*
*/


/**
* queueinterval schema
* "_id" : ObjectId
* "name" : string,
* "created_at" : ISODate
* "updated_at" : ISODate
* "deleted_at" : ISODate
* "last_run": ISODate
* "command": string
* "enabled ": boolean
* "locked": boolean
* "handle":{
*   [interval handle] 
*}
* 
*/

Queue.entries = new Mongo.Collection("queue");
Queue.log = new Mongo.Collection("queuelog");
Queue.readyrun = new Mongo.Collection("queuereadyrun");
Queue.queueintervals = new Mongo.Collection("queueintervals");
Queue.intervalhandles = [];

if (Meteor.isServer) {
    Queue.entries._ensureIndex({ lock_name: 1 }, { unique: true, sparse: true });
    Queue.readyrun._ensureIndex({ name: 1 }, { unique: true, sparse: true });
    Queue.queueintervals._ensureIndex({ name: 1 }, { unique: true, sparse: true });
    /*just until Meteor bring findAndModify */
    if (typeof Queue.entries.findAndModify === "undefined") {
        Queue.entries.findAndModify = function (query, sort, mod) {
            sort.reactive = false;
            var results = Queue.entries.find(query, sort, {reactive: true}).fetch();
            var modified = Queue.entries.update(query, mod, {multi: true});
            if (modified) {
                return results;
            }
        };
    }
    /* end fake findAndModify */
}

Queue.queueintervals.before.update(function (userId, doc, fieldNames, modifier, options) {

    Meteor.clearInterval(Queue.intervalhandles[doc._id]); 
    command = doc.command;   
    if (modifier.$set.command){
        command = modifier.$set.command;
    }
    interval = doc.interval;
    if (modifier.$set.interval){
        interval = modifier.$set.interval;
    }
    handle = Meteor.setInterval(function(){eval(command)}, interval);
    /* reassign the handle */
    Queue.intervalhandles[doc._id] = handle;
    modifier.$set.updated_at = new Date();
});


