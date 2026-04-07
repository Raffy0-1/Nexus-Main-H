@echo off
git add . > push_log.txt 2>&1
git commit -m "feat: complete final integrations" >> push_log.txt 2>&1
git branch --show-current >> push_log.txt 2>&1
git push https://github.com/Raffy0-1/Nexus-Main-H.git HEAD:main >> push_log.txt 2>&1
