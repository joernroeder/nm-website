var exec = require('child_process').exec,
	onErr = function (err) {
		console.log(err);
		process.exit(-1);
	};

exec('git diff --cached --quiet', function (err, stdout, stderr) {

	// only run if there are staged changes
	// i.e. what you would be committing if you ran "git commit" without "-a" option.
	if (err) {

		// stash unstaged changes - only test what's being committed
		exec('git stash --keep-index --quiet', function (err, stdout, stderr) {

			if (err) { onErr(err); }

			exec('./app/grunt release', function (err, stdout, stderr) {

				console.log(stdout);

				// restore stashed changes
				exec('git stash pop --quiet', function () {
					if (err) { onErr(err); }
				});
			});
		});
	}

});