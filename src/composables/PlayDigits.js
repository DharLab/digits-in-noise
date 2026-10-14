import { ref, toRaw } from "vue";
import { UseStore } from '@/stores/UseStore';
import * as Tone from "tone";
import UseWait from "@/composables/UseWait";

const isPlaying = ref(false);
const digitsArray = ref([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
//const digitsArray = ref([1,1,1,1,1,1,1]); //for testing purposes

// Trial-audio generation guard: each play() bumps playGen; an in-flight play()
// bails at its next checkpoint once superseded, so the participant can answer
// and advance without waiting for the current trial's audio to finish.
let playGen = 0;
let activePlayers = [];
let activePanners = [];

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
        try {
            const npB = toRaw(store.noisePlayerB);
            if (npB) { npB.volume.value = -Infinity; npB.stop(); }
        } catch { /* second noise player only used by Researcher Calibration + Bilateral */ }
        for (const p of activePlayers) { try { p.dispose(); } catch { /* noop */ } }
        for (const p of activePanners) { try { p.dispose(); } catch { /* noop */ } }
        activePlayers = [];
        activePanners = [];
        isPlaying.value = false;
    }

    async function play(rawSNR) {
        stopPlayback();          // cut any still-playing trial audio
        const gen = playGen;     // this trial's generation

        store.currentSNR = -rawSNR;

        // Researcher Calibration (leftZeroSPL/rightZeroSPL) + Bilateral needs the digit and
        // noise to each reach BOTH ears at their own ear's correct SPL. A single centered
        // Tone.Panner can't express two different absolute volumes (pan only sets a shared
        // ratio), so this path plays each signal as two hard-panned copies instead - see
        // known_issue_bilateral_researcher_cal notes.
        const dualChannel = store.audioMode === 'bilateral' && !store.usesComfortLevel;

        // Digit level is fixed for the whole test; only the noise level moves with the staircase.
        let targetNoiseVolume, targetDigitsVolume;
        let digitLeft, digitRight, noiseLeft, noiseRight;
        if (dualChannel) {
            digitLeft = store.listenLevel - store.leftZeroSPL;
            digitRight = store.listenLevel - store.rightZeroSPL;
            noiseLeft = rawSNR + store.listenLevel - store.leftZeroSPL;
            noiseRight = rawSNR + store.listenLevel - store.rightZeroSPL;
            console.log("dualChannel digit L/R:", digitLeft, digitRight, "noise L/R:", noiseLeft, noiseRight);
        } else if (store.usesComfortLevel) {
            // Participant-set comfortable level in dBFS; no real-world SPL calibration.
            targetDigitsVolume = store.comfortDbfs;
            targetNoiseVolume = store.comfortDbfs + rawSNR;
        } else {
            targetDigitsVolume = store.listenLevel - store.leftZeroSPL;
            targetNoiseVolume = rawSNR + store.listenLevel - store.rightZeroSPL;
        }
        if (!dualChannel) {
            console.log("target noise volume: " + targetNoiseVolume);
            console.log("target digits volume: " + targetDigitsVolume);
        }
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
        if (dualChannel) {
            toRaw(store.noisePanner).pan.value = -1;
            toRaw(store.noisePannerB).pan.value = 1;
            toRaw(store.noisePlayer).volume.value = -Infinity;
            toRaw(store.noisePlayerB).volume.value = -Infinity;
            toRaw(store.noisePlayer).start();
            toRaw(store.noisePlayerB).start();
            toRaw(store.noisePlayer).volume.rampTo(noiseLeft, 0.5);
            toRaw(store.noisePlayerB).volume.rampTo(noiseRight, 0.5);
        } else {
            toRaw(store.noisePanner).pan.value = store.audioMode === 'bilateral' ? 0 : 1;
            toRaw(store.noisePlayer).volume.value = -Infinity;
            toRaw(store.noisePlayer).start()
            toRaw(store.noisePlayer).volume.rampTo(targetNoiseVolume, 0.5);
        }
        await wait(1000);
        if (gen !== playGen) return;   // superseded by the next trial

        // All three digits are scheduled now on the audio clock, so no JavaScript timer can drop one.
        // 1.0796s between starts = 0.9046s digit + 175ms gap.
        const digitStart = Tone.now() + 0.05;
        if (dualChannel) {
            const pannerL = new Tone.Panner({ pan: -1 }).toDestination();
            const pannerR = new Tone.Panner({ pan: 1 }).toDestination();
            activePanners = [pannerL, pannerR];
            activePlayers = [target1, target2, target3].flatMap((name, i) => {
                const startTime = digitStart + i * 1.0796; // same instant for both ears' copies
                const left = new Tone.Player().connect(pannerL);
                left.buffer = store.soundLibrary.get(name);
                left.volume.value = digitLeft;
                left.start(startTime);
                const right = new Tone.Player().connect(pannerR);
                right.buffer = store.soundLibrary.get(name);
                right.volume.value = digitRight;
                right.start(startTime);
                return [left, right];
            });
        } else {
            const panner = new Tone.Panner({ pan: store.audioMode === 'bilateral' ? 0 : -1 }).toDestination();//pan right = 1, pan left = -1
            activePanners = [panner];
            activePlayers = [target1, target2, target3].map((name, i) => {
                const player = new Tone.Player().connect(panner);
                player.buffer = store.soundLibrary.get(name);
                player.volume.value = targetDigitsVolume; //volume of digits
                player.start(digitStart + i * 1.0796);
                return player;
            });
        }

        await wait(3700);
        if (gen !== playGen) return;

        toRaw(store.noisePlayer).volume.rampTo(-Infinity, 0.5)
        if (dualChannel) toRaw(store.noisePlayerB).volume.rampTo(-Infinity, 0.5);
        await wait(500);
        if (gen !== playGen) return;
        toRaw(store.noisePlayer).stop();
        if (dualChannel) toRaw(store.noisePlayerB).stop();

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

    // "Set a comfortable level" screen: play a continuous stream of random digits
    // (same pacing as a trial) so the participant can adjust while listening.
    // Level tracks store.comfortDbfs live.
    let previewPanner = null;
    let previewPlayer = null;
    let previewVolume = -18;
    let previewGen = 0;

    async function startLevelPreview() {
        if (previewPanner) return; // already running
        const gen = ++previewGen;
        previewPanner = new Tone.Panner({ pan: store.audioMode === 'bilateral' ? 0 : -1 }).toDestination();
        previewVolume = store.comfortDbfs ?? -18;

        while (gen === previewGen) {
            const digit = Math.floor(Math.random() * 10);
            previewPlayer = new Tone.Player().connect(previewPanner);
            previewPlayer.buffer = store.soundLibrary.get(`n${digit}_2`);
            previewPlayer.volume.value = previewVolume;
            previewPlayer.start();
            await wait(1080); // same ~1.08s spacing as the task's inter-digit timing
            if (gen !== previewGen) return;
            try { previewPlayer.dispose(); } catch { /* noop */ }
        }
    }
    function setLevelPreviewVolume(db) {
        previewVolume = db;
        if (previewPlayer) previewPlayer.volume.rampTo(db, 0.05);
    }
    function stopLevelPreview() {
        previewGen++; // stop the running loop
        try { if (previewPlayer) previewPlayer.dispose(); } catch { /* noop */ }
        try { if (previewPanner) previewPanner.dispose(); } catch { /* noop */ }
        previewPlayer = null;
        previewPanner = null;
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
