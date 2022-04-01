# how to build a standalone version

1. run the server on the backend
2. in 'frontend/config.js' remove the comment in line 11 (// url = './data')
3. npm run build
4. comment again line 11 in 'frontend/config.js' (// url = './data')
5. node build.js 
6. the version is inside dist