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
 *    "reattempt" :  //number of minutes to requeue
 *    "log_success" : //boolean
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


Queue.entries = new Meteor.Collection("queue");
Queue.log = new Meteor.Collection("queuelog");


if (Meteor.isServer) {
  Queue.entries._ensureIndex({ lock_name: 1 }, { unique: true, sparse: true });
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