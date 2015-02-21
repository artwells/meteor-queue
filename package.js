Package.describe({
    summary: "job queue for meteor",
    version: "0.0.4",
    git: "https://github.com/artwells/meteor-queue.git"
});

Package.on_use(function (api) {
    api.versionsFrom("METEOR@1.0.3");
    api.use(['livedata', 'mongo-livedata'], ['server']);
    api.use(['templating'], 'client');
    api.use('houston:admin',['server','client'],{weak:true});
    api.add_files('queue.js', 'server');
    api.add_files('lib/model.js', 'server');
    api.export('Queue', ['client','server']);
    api.add_files('lib/server/server.js', 'server');
    api.add_files('views/queueintervals.html', 'client');
    api.add_files('lib/client/client.js', 'client');
});

Package.on_test(function (api) {
    api.use('artwells:queue', 'server');
    api.use('tinytest', 'server');
    api.add_files('tests/server.js', 'server');
});
