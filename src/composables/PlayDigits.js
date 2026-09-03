import { ref, toRaw } from "vue";
import { UseStore } from '@/stores/UseStore';
import { EMBED } from "@/config";
import * as Tone from "tone";
import UseWait from "@/composables/UseWait";

const isPlaying = ref(false);
const digitsArray = ref([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
//const digitsArray = ref([1,1,1,1,1,1,1]); //for testing purposes

// Trial-audio generation guard: each play() bumps playGen; an in-flight play()
// bails at its next checkpoint once superseded, so the participant can answer
// and advance without waiting for the current trial's audio to finish.
let playGen = 0;
let activeSeq = null;
let activePlayer = null;
let activePanner = null;

export default function PlayDigits() {

    //let isPlaying = ref(false);
    const { wait } = UseWait();
    const store = UseStore();

    // Immediately silence and tear down whatever the current trial is playing.
    function stopPlayback() {
        playGen++;
        try {
            const np = toRaw(store.noisePlayer);
            if (np) { np.volume.value = -Infinity; np.stop(); }
        } catch { /* noise player may not be started */ }
        try { Tone.getTransport().stop(); Tone.getTransport().cancel(); } catch { /* noop */ }
        try { if (activeSeq) activeSeq.dispose(); } catch { /* noop */ }
        try { if (activePlayer) activePlayer.dispose(); } catch { /* noop */ }
        try { if (activePanner) activePanner.dispose(); } catch { /* noop */ }
        activeSeq = null;
        activePlayer = null;
        activePanner = null;
        isPlaying.value = false;
    }

    async function play(rawSNR) {
        stopPlayback();          // cut any still-playing trial audio
        const gen = playGen;     // this trial's generation

        store.currentSNR = -rawSNR;

        // Digit level is fixed for the whole test; only the noise level moves with the staircase.
        let targetNoiseVolume, targetDigitsVolume;
        if (EMBED) {
            // Participant-set comfortable level in dBFS; no real-world SPL calibration.
            targetDigitsVolume = store.comfortDbfs;
            targetNoiseVolume = store.comfortDbfs + rawSNR;
        } else {
            targetDigitsVolume = store.listenLevel - store.leftZeroSPL;
            targetNoiseVolume = rawSNR + store.listenLevel - store.rightZeroSPL;
        }
        console.log("target noise volume: " + targetNoiseVolume);
        console.log("target digits volume: " + targetDigitsVolume);
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
        if (gen !== playGen) return;   // superseded by the next trial

        activePanner = new Tone.Panner({ pan: -1 }).toDestination();//pan right = 1, pan left = -1
        activePlayer = new Tone.Player().connect(activePanner);
        activePlayer.volume.value = targetDigitsVolume; //volume of digits
        activeSeq = new Tone.Sequence((time, index) => {
            activePlayer.buffer = store.soundLibrary.get(index);
            activePlayer.start(time);
        }, [target1, target2, target3], "1.0796").start(); // 175ms second delay between digits. Calculated based on assumed duration of 0.9046s for all digit recordings.
        activeSeq.loop = false;
        Tone.getTransport().start()

        await wait(3700);
        if (gen !== playGen) return;

        toRaw(store.noisePlayer).volume.rampTo(-Infinity, 0.5)
        await wait(500);
        if (gen !== playGen) return;
        toRaw(store.noisePlayer).stop();

        isPlaying.value = false;
    }


    let calTone;
    async function playCalibrationTone(side){
        const panner = new Tone.Panner({ pan: side == "left" ? -1 : 1 }).toDestination();//pan right = 1, pan left = -1
        calTone = new Tone.Player().connect(panner)
        calTone.buffer =  store.soundLibrary.get("cal_tone")
        const zeroSPL = side == "left" ? store.leftZeroSPL : store.rightZeroSPL
        let targetCalibrationVolume = store.listenLevel - zeroSPL
        calTone.volume.value = targetCalibrationVolume; //volume of digits
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

    // Embed "set a comfortable level" screen: loop a digit so the participant can
    // adjust while listening. Level tracks store.comfortDbfs live.
    let previewPlayer = null;
    function startLevelPreview() {
        if (previewPlayer) return;
        const panner = new Tone.Panner({ pan: -1 }).toDestination();
        previewPlayer = new Tone.Player().connect(panner);
        previewPlayer.buffer = store.soundLibrary.get("n5_2");
        previewPlayer.loop = true;
        previewPlayer.volume.value = store.comfortDbfs ?? -18;
        previewPlayer.start();
    }
    function setLevelPreviewVolume(db) {
        if (previewPlayer) previewPlayer.volume.rampTo(db, 0.05);
    }
    function stopLevelPreview() {
        if (previewPlayer) {
            previewPlayer.stop();
            previewPlayer.dispose();
            previewPlayer = null;
        }
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
    return { play, stopPlayback, playCalibrationTone, stopCalibrationTone, startLevelPreview, setLevelPreviewVolume, stopLevelPreview, isPlaying, digitsArray };
}
