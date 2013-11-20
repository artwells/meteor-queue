Package.describe({
    summary: "job queue for meteor"
});

Package.on_use(function (api) {
	api.add_files('lib/queue.js', 'server');
	api.add_files('lib/model.js', 'server');
	api.add_files('lib/server/server.js','server');
	api.export('Queue', 'server');
});

Package.on_test(function (api) {
  api.use('queue', 'server');
  api.use('tinytest',  'server');
  api.add_files('tests/server.js', 'server');
});
