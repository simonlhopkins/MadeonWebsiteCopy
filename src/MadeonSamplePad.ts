import * as Tone from "tone";
import {
  applyQueueToCurrent,
  pause,
  removePadFromCurrent,
} from "./SamplePadSlice";
import { store } from "./store";

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

  private mainLoop: Tone.Loop;

  private bpm: number = 110;
  //todo make private again
  initialized = false;
  debugCurrentlyPlaying: PadConfig | null = null;

  constructor() {
    this.mainLoop = new Tone.Loop((time) => {
      this.onLoop(time, this.getLoopDuration());
    }, this.getLoopDuration());

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState == "hidden") {
        store.dispatch(pause());
      }
    });

    let prevPlayingState = store.getState().samplePad.playingState;
    store.subscribe(() => {
      const newPlayingState = store.getState().samplePad.playingState;
      if (newPlayingState != prevPlayingState) {
        switch (newPlayingState) {
          case "paused":
            this.pause();
            break;
          case "started":
            this.play();
            break;
          case "stopped":
            this.stop();
            break;
        }

        prevPlayingState = newPlayingState;
      }
    });
  }
  getTransportImmediateTime() {
    return Tone.Transport.immediate();
  }
  getTransportNowTime() {
    return Tone.Transport.now();
  }
  getContextNowTime() {
    return Tone.now();
  }

  getLoopProgress() {
    return this.mainLoop.progress;
  }
  async createPlayer(url: string): Promise<Tone.Player> {
    return new Promise((resolve, reject) => {
      const player: Tone.Player = new Tone.Player({
        onerror: (err) => reject(err),
        onload: () => resolve(player as Tone.Player),
        url: url,
      }).sync();
    });
  }

  pause() {
    console.log("pause");
    Tone.Transport.pause();
    document.getAnimations().forEach((animation) => {
      console.log("animation");
      animation.pause();
    });
  }
  async play() {
    await Tone.context.resume();
    Tone.Transport.start();
    document.getAnimations().forEach((animation) => {
      animation.play();
    });
  }
  stop() {
    Tone.Transport.stop();

    //unsync all since I think they all technically are all still events on the timeline
    this.drumSamples.forEach((item) => item.unsync().sync());
    this.soundSamples.forEach((item) => item.unsync().sync());
    this.bassSamples.forEach((item) => item.unsync().sync());
    Tone.Transport.seconds = 0;
  }

  async loadSamples() {
    const loadSoundArr = async (type: string, num: number) => {
      const loadPromises = [];
      for (let i = 1; i < num + 1; i++) {
        let newLoadPromise = this.createPlayer(`sounds/ogg/${type}.1.${i}.ogg`)
          .then((result) => {
            // result.fadeOut = 0.05;
            // result.fadeIn = 0.05;
            return result;
          })
          .then((result) => result.toDestination())

          .catch((e) => {
            console.log(`couldn't load ogg [${e.message}], trying mp3`);

            return this.createPlayer(`sounds/mp3/${type}.1.${i}.mp3`).then(
              (result) => result.toDestination()
            );
          });
        loadPromises.push(newLoadPromise);
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

  stopSoundImmediately(padConfig: PadConfig) {
    this.getSampleFromPadConfig(padConfig).stop();
    store.dispatch(removePadFromCurrent(padConfig));
  }

  getQueuedSamples() {
    return store.getState().samplePad.queuedSamples;
  }
  getCurrentSamples() {
    return store.getState().samplePad.currentSamples;
  }

  //idk a better way of doing this at the moment
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

  private onLoop(time: number, loopDuration: number) {
    // forEachPadConfigInState(this.getCurrentSamples(), (s) => {
    //   this.getSampleFromPadConfig(s).stop();
    // });
    store.dispatch(applyQueueToCurrent());
    this.getCurrentSamples().bass.forEach((config) => {
      this.getSampleFromPadConfig(config).start();
    });
    this.getCurrentSamples().sounds.forEach((config) => {
      this.getSampleFromPadConfig(config).start();
    });
    this.getCurrentSamples().drum.forEach((config) => {
      this.getSampleFromPadConfig(config).start();
    });
    this.sampleLoopCallbackMap.forEach((callback) => {
      //pass a copy of the state to each of them
      callback({ ...this.getCurrentSamples() }, time, loopDuration);
    });

    // Tone.Draw.schedule(() => {

    // }, time);
  }

  async init() {
    if (this.initialized) {
      console.log("Madeon Sample Pad Already initialized");
      return;
    }
    this.initialized = true;
    console.log("initializings");
    console.log("starting tone");
    await Tone.start();
    await Tone.context.resume();
    console.log("loading samples");
    await this.loadSamples();

    console.log("samples loaded");
    Tone.Transport.bpm.value = this.bpm;
    this.onLoop(0, this.getLoopDuration());
    this.mainLoop.start(0);

    // Tone.Transport.start();
  }
}

//Singleton :( this works for a small project like this :) Maybe can make a member of the App Component as a ref or something.
//I need to reference it in most of the react components.
export const MadeonSamplePadInstance = new MadeonSamplePad();
