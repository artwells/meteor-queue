Package.describe({
    name: "artwells:queue",
    summary: "job queue for meteor, using mongo and setInterval",
    version: "0.1.2",
    git: "https://github.com/artwells/meteor-queue.git"
});

Package.on_use(function (api) {
    api.versionsFrom("METEOR@1.0.3");
    api.use('mongo',['server']);
    api.use('underscore',['server']);
    api.use('matb33:collection-hooks@0.7.3',['server']);
    api.use(['templating'], 'client');
    api.use('houston:admin@2.0.2',['server','client'],{weak:true});
    api.add_files('queue.js', 'server');
    api.add_files('lib/model.js', 'server');
    api.export('Queue', ['client','server']);
    api.add_files('lib/server/server.js', 'server');
    api.add_files('lib/client/client.js', 'client');
});

Package.on_test(function (api) {
    api.versionsFrom("METEOR@1.0.3");
    api.use('mongo',['server']);
    api.use('underscore',['server']);
    api.use('matb33:collection-hooks',['server']);
    api.use('artwells:queue', 'server');
    api.use('tinytest', 'server');
    api.add_files('tests/server.js', 'server');
});
