echo Pulling from GitHub....
git fetch origin master
git reset --hard origin/master
git pull origin master --force
echo Pull successful!
echo Refreshing...
refresh
echo Refresh done!