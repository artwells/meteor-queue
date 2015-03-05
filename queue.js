Queue = {};
if (typeof Queue.loglevel === "undefined") {
    Queue.loglevel = 3; /* 3 only includes lock conflicts.  2,3 includes successes */
}
if (typeof Queue.logLife === "undefined") {
    Queue.logLife = 30; /* days to keep logfiles */
}
if (typeof Queue.ephemeralLogLife === "undefined") {
    Queue.ephemeralLogLife = 1800000; /* microseconds to keep ephemeral log statuses */
}
if (typeof Queue.ephemeralLogStatuses === "undefined") {
    Queue.ephemeralLogStatuses = ['lockfailed','success']; /* statuses to purge from logs quickly */
}

if (typeof Queue.defaultPriority === "undefined") {
    Queue.defaultPriority = 5;/* 1 is highest */
}
if (typeof Queue.defaultStatus === "undefined") {
    Queue.defaultStatus = "pending";/* by changing this to some other new word, you can make sure queue items are "blessed" in "pending" through another process. */
}
if (typeof Queue.keepsuccess === "undefined") {
    Queue.keepsuccess = true; /* keep successful in queue as record */
}
if (typeof Queue.lockLife === "undefined") {
    Queue.lockLife = 30; /* minutes to keep lockfiles */
}
if (typeof Queue.completedLife === "undefined") {
    Queue.completedLife = 30; /* days to keep completed tasks */
}
