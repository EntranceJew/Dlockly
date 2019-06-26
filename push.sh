echo Pushing to GitHub....
bash pull.sh
git add .
GIT_SSH_COMMAND="ssh -i .githubsync/id_rsa" git push
echo Push successful!
echo Refreshing...
refresh > /dev/null 2>&1
echo Refresh done!