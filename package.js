Package.describe({
  summary: "job queue for meteor",
  version: "0.0.3",
  git: "https://github.com/artwells/meteor-queue.git"
});

Package.on_use(function (api) {
  api.versionsFrom("METEOR@0.9.0");
  api.use(['livedata', 'mongo-livedata'], 'server');
  api.add_files('queue.js', 'server');
  api.add_files('lib/model.js', 'server');
  api.add_files('lib/server/server.js', 'server');
  api.export('Queue', 'server');
});

Package.on_test(function (api) {
  api.use('artwells:queue', 'server');
  api.use('tinytest', 'server');
  api.add_files('tests/server.js', 'server');
});
