import * as Tone from "tone";
import { applyQueuedStateToExistingState } from "./Util";

function shuffle(array: any[]) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}
export type SampleLoopCallbackType = (
  currentSamples: SamplePadState,
  time: number,
  loopDuration: number
) => void;
export type SamplePadState = {
  drum: PadConfig[];
  bass: PadConfig[];
  sounds: PadConfig[];
};

export enum PadType {
  DRUM,
  BASS,
  SOUNDS,
}

export type PadConfig = {
  type: PadType;
  index: number;
};

export default class MadeonSamplePad {
  private drumSamples: Tone.Player[] = [];
  private bassSamples: Tone.Player[] = [];
  private soundSamples: Tone.Player[] = [];

  private sampleLoopCallbackID = 0;
  private sampleLoopCallbackMap = new Map<number, SampleLoopCallbackType>();
  private isIdle = true;

  currentState: SamplePadState = {
    drum: [],
    bass: [],
    sounds: [],
  };
  queuedState: SamplePadState = {
    drum: [],
    bass: [],
    sounds: [],
  };
  currentSamples: Tone.Player[] = [];
  bpm: number = 110;
  initialized = false;
  debugCurrentlyPlaying: PadConfig | null = null;

  constructor() {}

  async loadSamples() {
    const loadSoundArr = (type: string, num: number) => {
      const ret = [];
      for (let i = 1; i < num + 1; i++) {
        let newPlayer = new Tone.Player(
          `sounds/${type}.1.${i}.ogg`
        ).toDestination();
        // newPlayer.fadeOut = 0.05;
        // newPlayer.fadeIn = 0.05;
        ret.push(newPlayer);
      }
      return ret;
    };

    this.drumSamples = loadSoundArr("drum", 10);
    this.bassSamples = loadSoundArr("bass", 10);
    this.soundSamples = loadSoundArr("sounds", 16);

    await Tone.loaded();
  }

  getSampleFromPadConfig(padConfig: PadConfig) {
    switch (padConfig.type) {
      case PadType.BASS:
        return this.bassSamples[padConfig.index];
      case PadType.DRUM:
        return this.drumSamples[padConfig.index];
      case PadType.SOUNDS:
        return this.soundSamples[padConfig.index];
    }
  }
  async setQueuedSamplePadState(newState: SamplePadState) {
    if (!this.initialized) await this.init();
    if (this.isIdle) {
      Tone.Transport.start();
      this.isIdle = false;
    }
    this.queuedState = newState;
  }

  ///ehhhh
  addSampleLoopCallback(callback: SampleLoopCallbackType) {
    const newID = this.sampleLoopCallbackID++;
    this.sampleLoopCallbackMap.set(newID, callback);
    return newID;
  }

  removeSampleLoopCallback(id: number) {
    if (this.sampleLoopCallbackMap.has(id)) {
      this.sampleLoopCallbackMap.delete(id);
    } else {
      console.warn(
        `Trying to remove an id [${id}] that is not in the loop map`
      );
    }
  }
  getCurrentTransportTime() {
    return Tone.Transport.immediate();
  }
  private onSampleLoop(time: number, loopDuration: number) {
    this.currentState = applyQueuedStateToExistingState(
      this.queuedState,
      this.currentState
    );
    //end move to a function
    //this.currentState is updated now

    this.sampleLoopCallbackMap.forEach((callback) => {
      callback({ ...this.currentState }, time, loopDuration);
    });

    this.currentState.bass.forEach((config) => {
      this.getSampleFromPadConfig(config).start();
    });
    this.currentState.sounds.forEach((config) => {
      this.getSampleFromPadConfig(config).start();
    });
    this.currentState.drum.forEach((config) => {
      this.getSampleFromPadConfig(config).start();
    });
    this.queuedState = {
      drum: [],
      bass: [],
      sounds: [],
    };
    //nothing is playing
    if (
      this.currentState.sounds.length == 0 &&
      this.currentState.drum.length == 0 &&
      this.currentState.bass.length == 0
    ) {
      Tone.Transport.stop();
      Tone.Transport.seconds = 0;
      this.isIdle = true;
    }
  }

  async init() {
    if (this.initialized) {
      console.log("Madeon Sample Pad Already initialized");
      return;
    }
    this.initialized = true;
    await Tone.start();
    await this.loadSamples();

    Tone.Transport.scheduleRepeat(
      (time) => {
        this.onSampleLoop(time, Tone.Transport.toSeconds("2m"));
      },
      "2m",
      "0"
    );
    Tone.Transport.bpm.value = this.bpm;
    this.onSampleLoop(0, Tone.Transport.toSeconds("2m"));
  }
}

export const MadeonSamplePadInstance = new MadeonSamplePad();
