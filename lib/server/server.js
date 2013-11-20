Meteor.startup(function () {
  /*just until Meteor bring findAndModify */
  if(typeof Queue.entries.findAndModify === "undefined"){
    Queue.entries.findAndModify = function (query, sort, mod){
      sort.reactive=false;
      results = Queue.entries.find(query,sort,{reactive:true}).fetch();
      modified = Queue.entries.update(query, mod,{multi: true});
      return results;
    }
  }
  /* end fake findAndModify */
	Queue.entries._ensureIndex( { lock_name: 1 }, { unique: true, sparse: true } );
});
