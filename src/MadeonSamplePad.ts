import * as Tone from "tone";
import {
  applyPadConfigToSamplePadState,
  applyQueuedStateToExistingState,
  isSamplePadStateEmpty,
  samplePadStateContainsPadConfig,
} from "./Util";

//types
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
export type StateUpdateCallbackType = (
  currentSamples: SamplePadState,
  queuedSamples: SamplePadState
) => void;

export enum PadType {
  DRUM,
  BASS,
  SOUNDS,
}

export type PadConfig = {
  type: PadType;
  index: number;
};

class MadeonSamplePad {
  private drumSamples: Tone.Player[] = [];
  private bassSamples: Tone.Player[] = [];
  private soundSamples: Tone.Player[] = [];

  private sampleLoopCallbackID = 0;
  private sampleLoopCallbackMap = new Map<number, SampleLoopCallbackType>();

  private stateUpdateCallbackID = 0;
  private stateUpdateCallbackMap = new Map<number, StateUpdateCallbackType>();

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
  bpm: number = 110;
  initialized = false;
  debugCurrentlyPlaying: PadConfig | null = null;

  constructor() {
    document.addEventListener("visibilitychange", () => {
      console.log(document.visibilityState);
    });
  }
  getImmediateTime() {
    return Tone.Transport.immediate();
  }
  getNowTime() {
    return Tone.Transport.now();
  }

  getNextLoopStartTime() {
    return Tone.Transport.nextSubdivision("2m");
  }
  getCurrentLoopStartTime() {
    return Math.max(
      0,
      Tone.Transport.nextSubdivision("2m") - this.getLoopDuration()
    );
  }
  async createPlayer(url: string): Promise<Tone.Player> {
    return new Promise((resolve, reject) => {
      const player: Tone.Player = new Tone.Player({
        onerror: (err) => reject(err),
        onload: () => resolve(player as Tone.Player),
        url: url,
      });
    });
  }

  async loadSamples() {
    const loadSoundArr = async (type: string, num: number) => {
      const loadPromises = [];
      for (let i = 1; i < num + 1; i++) {
        let newLoadPromise = this.createPlayer(`sounds/ogg/${type}.1.${i}.ogg`)
          .then((result) => result.toDestination())
          .catch((e) => {
            console.log(`couldn't load ogg [${e.message}], trying mp3`);

            return this.createPlayer(`sounds/mp3/${type}.1.${i}.mp3`).then(
              (result) => result.toDestination()
            );
          });
        loadPromises.push(newLoadPromise);

        // newPlayer.fadeOut = 0.05;
        // newPlayer.fadeIn = 0.05;
      }
      let ret = await Promise.all(loadPromises);
      return ret;
    };

    this.drumSamples = await loadSoundArr("drum", 10);
    this.bassSamples = await loadSoundArr("bass", 10);
    this.soundSamples = await loadSoundArr("sounds", 16);

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
    console.log(Tone.Transport.state);
    if (Tone.context.state == "suspended") {
      Tone.Transport.stop();
      await Tone.context.resume();
    }
    if (Tone.Transport.state != "started") {
      Tone.Transport.seconds = 0;
      Tone.Transport.start();
    }
    // await Tone.start();

    console.log(this.getImmediateTime());
    console.log(Tone.Transport.state);
    //in the queue, are there any items that are also currently playing
    // const sharedElements = getIntersectionOfSamplePadStates(
    //   newState,
    //   this.currentState
    // );
    // //stop all of those

    // //remove those from the queue
    // this.queuedState = removeSampleConfigsFromState(sharedElements, newState);
    // sharedElements.forEach((item) => {
    //   MadeonSamplePadInstance.stopSoundImmediately(item);
    // });
    this.queuedState = newState;
  }

  stopSoundImmediately(padConfig: PadConfig) {
    if (samplePadStateContainsPadConfig(this.currentState, padConfig)) {
      this.getSampleFromPadConfig(padConfig).stop();
      this.setCurrentState(
        applyPadConfigToSamplePadState(this.currentState, padConfig)
      );
    }
  }

  ///ehhhh
  addStateUpdateCallback(callback: StateUpdateCallbackType) {
    const newID = this.stateUpdateCallbackID++;
    this.stateUpdateCallbackMap.set(newID, callback);
    return newID;
  }

  removeStateUpdateCallback(id: number) {
    if (this.sampleLoopCallbackMap.has(id)) {
      this.stateUpdateCallbackMap.delete(id);
    } else {
      console.warn(
        `Trying to remove an id [${id}] that is not in the loop map`
      );
    }
  }

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

  getLoopDuration() {
    return Tone.Transport.toSeconds("2m");
  }
  private setCurrentState(newState: SamplePadState) {
    this.currentState = newState;
    this.stateUpdateCallbackMap.forEach((callback) => {
      //pass a copy of the state to each of them
      callback({ ...this.currentState }, { ...this.queuedState });
    });
    if (isSamplePadStateEmpty(this.currentState)) {
      Tone.Transport.stop();
      Tone.Transport.seconds = 0;
    }
  }
  private onSampleLoop(time: number, loopDuration: number) {
    const newCurrentState = applyQueuedStateToExistingState(
      this.queuedState,
      this.currentState
    );
    this.queuedState = {
      drum: [],
      bass: [],
      sounds: [],
    };
    this.setCurrentState(newCurrentState);
    //end move to a function
    //this.currentState is updated now

    this.currentState.bass.forEach((config) => {
      this.getSampleFromPadConfig(config).start();
    });
    this.currentState.sounds.forEach((config) => {
      this.getSampleFromPadConfig(config).start();
    });
    this.currentState.drum.forEach((config) => {
      this.getSampleFromPadConfig(config).start();
    });

    this.sampleLoopCallbackMap.forEach((callback) => {
      //pass a copy of the state to each of them
      callback({ ...this.currentState }, time, loopDuration);
    });
  }

  async init() {
    if (this.initialized) {
      console.log("Madeon Sample Pad Already initialized");
      return;
    }
    console.log("initializings");
    this.initialized = true;
    console.log("starting tone");
    await Tone.start();
    await Tone.context.resume();
    console.log("loading samples");
    await this.loadSamples();

    console.log("samples loaded");
    Tone.Transport.scheduleRepeat(
      (time) => {
        this.onSampleLoop(time, this.getLoopDuration());
      },
      "2m",
      "0"
    );
    Tone.Transport.bpm.value = this.bpm;
    this.onSampleLoop(0, this.getLoopDuration());
    Tone.Transport.start();
  }
}

//Singleton :( this works for a small project like this :) Maybe can make a member of the App Component as a ref or something.
//I need to reference it in Pad and in App
export const MadeonSamplePadInstance = new MadeonSamplePad();
