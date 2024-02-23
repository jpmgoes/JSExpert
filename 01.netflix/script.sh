ASSETS_FOLDER=assets/timeline

for MEDIA_FILE in $(ls $ASSETS_FOLDER | grep .mp4); do
	# cortar a extensao e a resolucao do arquivo
	FILENAME=$(echo $MEDIA_FILE | sed -n 's/.mp4//p' | sed -n 's/-1920x1080//p')
	INPUT=$ASSETS_FOLDER/$MEDIA_FILE
	FOLDER_TARGET=$ASSETS_FOLDER/$FILENAME
	mkdir -p $FOLDER_TARGET

	# criar arquivos de resolucao diferentes na pasta
	OUTPUT=$ASSETS_FOLDER/$FILENAME/$FILENAME
	DURATION=$(ffprobe -i $INPUT -show_format -v quiet | sed -n 's/duration=//p')

	OUTPUT_144=$OUTPUT-$DURATION-144
	OUTPUT_360=$OUTPUT-$DURATION-360
	OUTPUT_720=$OUTPUT-$DURATION-720

	ffmpeg -y -i $INPUT \
		-c:a aac -ac 2 \
		-vcodec h264 -acodec aac \
		-ab 128k \
		-movflags frag_keyframe+empty_moov+default_base_moof \
		-b:v 300k \
		-maxrate 300k \
		-bufsize 300k \
		-vf "scale=256:144" \
		-v quiet \
		$OUTPUT_144.mp4

	ffmpeg -y -i $INPUT \
		-c:a aac -ac 2 \
		-vcodec h264 -acodec aac \
		-ab 128k \
		-movflags frag_keyframe+empty_moov+default_base_moof \
		-b:v 400k \
		-maxrate 400k \
		-bufsize 400k \
		-vf "scale=-1:360" \
		-v quiet \
		$OUTPUT_360.mp4

	ffmpeg -y -i $INPUT \
		-c:a aac -ac 2 \
		-vcodec h264 -acodec aac \
		-ab 128k \
		-movflags frag_keyframe+empty_moov+default_base_moof \
		-b:v 1500k \
		-maxrate 1500k \
		-bufsize 1000k \
		-vf "scale=-1:720" \
		-v quiet \
		$OUTPUT_720.mp4
done
