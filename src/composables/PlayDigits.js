import { ref, toRaw } from "vue";
import { UseStore } from '@/stores/UseStore';
import * as Tone from "tone";
import UseWait from "@/composables/UseWait";

const isPlaying = ref(false);
const digitsArray = ref([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
//const digitsArray = ref([1,1,1,1,1,1,1]); //for testing purposes

export default function PlayDigits() {
    
    //let isPlaying = ref(false);
    const { wait } = UseWait();
    const store = UseStore();
    
    async function play(targetNoiseVolume) {
        targetNoiseVolume = targetNoiseVolume + store.rightOffset + store.listenLevel
        let targetDigitsVolume = 0 + store.leftOffset + store.listenLevel
        console.log("target noise volume: " + targetNoiseVolume);
        console.log("target digits volume: " + targetDigitsVolume);
        store.currentSNR = targetDigitsVolume - targetNoiseVolume;
        console.log("SNR is " + store.currentSNR);
        isPlaying.value = true;

        //clear previous entry
        //enteredDigits.value = [];

        //generate 3 digit random number
        digitsArray.value = shuffle(digitsArray.value);
        let target1 = "n" + digitsArray.value[0] + "_2" //using 2nd version of the digit (flat intonation)
        let target2 = "n" + digitsArray.value[1] + "_2"
        let target3 = "n" + digitsArray.value[2] + "_2"

        //smooth ramp up of noise volume from -Inf to targetNoiseVolume
        toRaw(store.noisePlayer).volume.value = -Infinity;
        toRaw(store.noisePlayer).start()
        toRaw(store.noisePlayer).volume.rampTo(targetNoiseVolume, 0.5);
        await wait(1000);

        const panner = new Tone.Panner({ pan: -1 }).toDestination();//pan right = 1, pan left = -1
        const player = new Tone.Player().connect(panner);
        player.volume.value = targetDigitsVolume; //volume of digits
        const seq = new Tone.Sequence((time, index) => {
            player.buffer = store.soundLibrary.get(index);
            player.start(time);
        }, [target1, target2, target3], "1.0796").start(); // 175ms second delay between digits. Calculated based on assumed duration of 0.9046s for all digit recordings.
        seq.loop = false;
        Tone.getTransport().start()

        await wait(3700);
        toRaw(store.noisePlayer).volume.rampTo(-Infinity, 0.5)
        await wait(500);
        toRaw(store.noisePlayer).stop();

        isPlaying.value = false;
    }

    
    let calTone;
    async function playCalibrationTone(side){
        const panner = new Tone.Panner({ pan: side == "left" ? -1 : 1 }).toDestination();//pan right = 1, pan left = -1
        calTone = new Tone.Player().connect(panner)
        calTone.buffer =  store.soundLibrary.get("cal_tone")
        let targetDigitsVolume = 0 + store.leftOffset + store.listenLevel
        calTone.volume.value = targetDigitsVolume; //volume of digits
        if(isPlaying.value == false){
            calTone.start();
            isPlaying.value = true;
        } else {
            calTone.stop();
            isPlaying.value = false;
        }   
    }

    function stopCalibrationTone(){
        calTone.stop();
        isPlaying.value = false
    }

    function shuffle(array) {
        var m = array.length, t, i;
        while (m) {
            i = Math.floor(Math.random() * m--);
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        return array;
    }
    return { play, playCalibrationTone, stopCalibrationTone, isPlaying, digitsArray };
}