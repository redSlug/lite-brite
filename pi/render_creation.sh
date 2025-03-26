#!/bin/bash


LITE_BRITE_URL="https://bradley--a25faefc8bca4506bcb633d2c1385f61.web.val.run/api/ppm/lite-brite"
POLLING_DELAY=10
LED_DELAY_MS=18


wget -N "https://bradley--a25faefc8bca4506bcb633d2c1385f61.web.val.run/api/ppm/lite-brite"  -O litebrite.ppm



function main {
    while true; do
        wget -N $LITE_BRITE_URL -O litebrite.ppm
        if [ $? -eq 0 ];
        then
            echo "wget succeeded"
            sudo pkill demo
            sudo rpi-rgb-led-matrix/examples-api-use/demo -D 1 litebrite.ppm --led-no-hardware-pulse --led-rows=16 --led-cols=32 -m 0 --led-daemon --led-brightness=10
        else
            echo "wget failed - file was likely not modified"

            if [ ! -f $BANNER_IMAGE_FILE ]; then
                echo "File not found!"
                exit 1
            fi
        fi

        sleep $POLLING_DELAY
    done
}

trap cleanup EXIT
main
