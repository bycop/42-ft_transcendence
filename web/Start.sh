if [ "$BUILD_MODE" == "dev" ];
then npm --prefix backend run dev;
else npm --prefix backend run start;
fi;

