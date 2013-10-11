var exec = require('child_process').exec;

exec('cd ' + __dirname + '/../../app; git diff --cached --quiet', function (err, stdout, stderr) {

	exec('cd app; ls', function (err, out, e) {
		console.log(err);
		console.log(out);
	});

	// only run if there are staged changes
	// i.e. what you would be committing if you ran "git commit" without "-a" option.
	if (err) {
		// go to the app folder, kick off grunt and come back
		exec('cd ./app', function (err, stdout, stderr) {
			
			if (err) {
				console.log(stderr);
				process.exit(-1);
			}

			exec('grunt release', function (err, stdout, stderr) {
				console.log('grunt callback');
				process.exit(-1);

				if (err) {
					console.log(stderr);
					process.exit(-1);
				}
				// append dist to the commit
				else {
					exec('git add ./app/dist/*', function () {
						process.exit(0);
					});
				}
			});
		});
	}
});