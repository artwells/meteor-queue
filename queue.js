Queue = {};
if (Queue.loglevel === "undefined") {
  Queue.loglevel = 3; /* 3 only includes lock conflicts.  2,3 includes successes */
}
if (Queue.logLife === "undefined") {
  Queue.logLife = 30; /* days to keep logfiles */
}
if (Queue.defaultPriority === "undefined") {
  Queue.defaultPriority = 5;/* 1 is highest */
}
if (Queue.defaultStatus === "undefined") {
  Queue.defaultStatus = "pending";/* by changing this to some other new word, you can make sure queue items are "blessed" in "pending" through another process. */
}
if (Queue.keepsuccess === "undefined") {
  Queue.keepsuccess = true; /* keep successful in queue as record */
}

