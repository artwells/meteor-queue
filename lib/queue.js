Queue= new Object();

Queue.loglevel=3; 
/* 3 only includes lock conflicts */
/* 2,3 includes successes */
Queue.mailCritical=true;
Queue.logLife=30; /* days to keep logfiles */ 
Queue.mailRetries=true;
Queue.defaultPriority=5;/* 1 is highest */
Queue.defaultStatus = "pending"; /* by changing this to some other new word, you can make sure queue items are "blessed" in "pending" through another process. */
Queue.keepsuccess = true;


/** 
 * queue schema
 
{
    "_id" : ObjectId,
    "status" : string,
    "priority" : int, // 1s first
    "command" : string,
    "execute_after" : ISODate,
    "lock_name" : string, //only allow one task of this name to be queued
    "history" : {
    },
    "reattempt" :  //number of minutes to requeue
    "log_success" : //boolean
    "created_at": ISODate,
    "updated_at": ISODate 

    
}


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
Queue.log= new Meteor.Collection("queuelog");