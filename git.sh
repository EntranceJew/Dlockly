echo Pulling from GitHub....
git fetch origin master > /dev/null 2>&1
git reset --hard origin/master > /dev/null 2>&1
git pull origin master --force > /dev/null 2>&1
echo Pull successful!
echo Refreshing...
refresh > /dev/null 2>&1
echo Refresh done!