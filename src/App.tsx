import { useEffect, useState } from "react";
import {
  MadeonSamplePadInstance,
  PadConfig,
  PadType,
  SamplePadState,
} from "./MadeonSamplePad";
import {
  applyPadConfigToSamplePadState,
  getColorFromPadType,
  samplePadStateContainsPadConfig,
} from "./Util";
import SamplePad from "./components/SamplePad";

function App() {
  const [currentSamplePadState, setCurrentSamplePadState] =
    useState<SamplePadState>({
      drum: [],
      bass: [],
      sounds: [],
    });
  const [queuedSamplePadState, setQueuedSamplePadState] =
    useState<SamplePadState>({
      drum: [],
      bass: [],
      sounds: [],
    });

  const [immediateStop, setImmediateStop] = useState<boolean>(false);

  useEffect(() => {
    const stateUpdateCallbackID =
      MadeonSamplePadInstance.addStateUpdateCallback(
        (newState: SamplePadState, queuedState: SamplePadState) => {
          console.log("new state: ", newState);
          setCurrentSamplePadState(newState);
          setQueuedSamplePadState(queuedState);
        }
      );

    return () => {
      MadeonSamplePadInstance.removeStateUpdateCallback(stateUpdateCallbackID);
    };
  }, []);
  //this is only used for queuing
  const onClick = (padConfig: PadConfig) => {
    //logic to unqueue items

    const newQueuedState = applyPadConfigToSamplePadState(
      queuedSamplePadState,
      padConfig
    );
    console.log(newQueuedState);

    if (
      samplePadStateContainsPadConfig(currentSamplePadState, padConfig) &&
      immediateStop
    ) {
      MadeonSamplePadInstance.stopSoundImmediately(padConfig);
    } else {
      setQueuedSamplePadState(newQueuedState);
      //here is the ONLY place we should be updating what the sample pad is thinking about playing because this can be set whenever
      MadeonSamplePadInstance.setQueuedSamplePadState(newQueuedState);
    }
  };
  return (
    <>
      <h1>Click on a square to begin!</h1>
      <h2>
        You can have one{" "}
        <span style={{ color: getColorFromPadType(PadType.BASS, 1) }}>
          bass
        </span>
        , one{" "}
        <span style={{ color: getColorFromPadType(PadType.DRUM, 1) }}>
          drum
        </span>
        , and 3{" "}
        <span style={{ color: getColorFromPadType(PadType.SOUNDS, 1) }}>
          melody
        </span>
      </h2>
      <input
        id="immediateStop"
        type="checkbox"
        checked={immediateStop}
        onChange={() => {
          setImmediateStop(!immediateStop);
        }}
      />
      <label style={{ backgroundColor: "black" }} htmlFor="immediateStop">
        Immediately Stop Sample on click
      </label>
      <SamplePad
        currentSamplePadState={currentSamplePadState}
        queuedSamplePadState={queuedSamplePadState}
        onPadClick={onClick}
      />
      <h2>
        This was 100% stolen from{" "}
        <a href="https://adventuremachine.4thfloorcreative.co.uk/adventuremachine/?t=5,16,34">
          this website
        </a>{" "}
        so credit to them!
      </h2>
      <h2>
        I also stole the background artwork from this{" "}
        <a href="https://soundcloud.com/porter-robinson/sad-machine-anamanaguchi-remix">
          song on soundcloud!!
        </a>
      </h2>
      <h3>made this for learning</h3>
    </>
  );
}

export default App;
