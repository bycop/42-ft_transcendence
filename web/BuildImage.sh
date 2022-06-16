cd ./backend/ && apk add --no-cache python3 make g++ && npm install -g npm@8.10.0 && npm install

cd ..

cd ./frontend/
npm install

if [ "$BUILD_MODE" == "prod" ];
then npm run build;
fi;