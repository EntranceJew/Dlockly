git add .
git commit -m "Glitch Update"
bash pull.sh
GIT_SSH_COMMAND="ssh -i .githubsync/id_rsa" git push
refresh