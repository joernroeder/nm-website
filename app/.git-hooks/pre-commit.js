# stash unstaged changes, run release task, stage release updates and restore stashed files
PATH="/usr/local/bin:$PATH"
NAME=$(git branch | grep '*' | sed 's/* //')

# don't run on rebase
if [ $NAME != '(no branch)' ]
then
  git stash -q --keep-index
  cd app
  /usr/local/bin/grunt release
  cd ..

  RETVAL=$?

  if [ $RETVAL -ne 0 ]
  then
    exit 1
  fi

  git add .
  git stash pop -q
fi