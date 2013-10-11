var exec = require('child_process').exec;

console.log(__dirname);
exec('git diff --cached --quiet', function (err, stdout, stderr) {

	// only run if there are staged changes
	// i.e. what you would be committing if you ran "git commit" without "-a" option.
	if (err) {
		// go to the app folder, kick off grunt and come back
		exec('cd app; grunt release; cd ..', function (err, stdout, stderr) {
			
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
	}
});