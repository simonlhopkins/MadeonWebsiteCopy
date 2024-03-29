import { useRef, useState } from "react";
import styled from "styled-components";
import { MadeonSamplePadInstance, PadConfig, PadType } from "./MadeonSamplePad";
import { asyncAddSampleToQueue, pause, stop } from "./SamplePadSlice";
import {
  getColorFromPadType,
  samplePadStateContainsPadConfig,
  useAddToRenderLoop,
} from "./Util";
import PauseOverlay from "./components/PauseOverlay";
import SamplePad from "./components/SamplePad";
import { useAppDispatch, useAppSelector } from "./store";

function App() {
  const [immediateStop, setImmediateStop] = useState<boolean>(false);
  const keyFrames = [
    { transform: "scale(1)", easing: "ease-in-out", offset: 0.1 },
    { transform: "scale(1.3)", easing: "ease-in-out", offset: 0.2 },
    { transform: "scale(1)", easing: "ease-in-out" },
  ];

  const currentSamplePadState = useAppSelector(
    (state) => state.samplePad.currentSamples
  );

  const bassRef = useRef<HTMLDivElement>(null);
  const drumRef = useRef<HTMLDivElement>(null);
  const soundsRef = useRef<HTMLDivElement>(null);

  const playingState = useAppSelector((store) => store.samplePad.playingState);

  if (playingState == "paused") {
    document.body.style.overflowY = "hidden";
  } else {
    document.body.style.overflowY = "scroll";
  }
  useAddToRenderLoop(
    (currentSamples) => {
      if (currentSamples.bass.length > 0) {
        bassRef.current?.animate(keyFrames, {
          duration: (MadeonSamplePadInstance.getLoopDuration() / 8) * 1000,
          composite: "add",
          iterations: 8,
        });
      }
    },
    () => {
      bassRef.current?.getAnimations().forEach((i) => i.cancel());
    },
    [currentSamplePadState.bass.length > 0]
  );
  useAddToRenderLoop(
    (currentSamples) => {
      if (currentSamples.drum.length > 0) {
        drumRef.current?.animate(keyFrames, {
          duration: (MadeonSamplePadInstance.getLoopDuration() / 8) * 1000,
          composite: "add",
          iterations: 8,
        });
      }
    },
    () => {
      drumRef.current?.getAnimations().forEach((i) => i.cancel());
    },
    [currentSamplePadState.drum.length > 0]
  );

  useAddToRenderLoop(
    (currentSamples) => {
      if (currentSamples.sounds.length > 0) {
        soundsRef.current?.animate(keyFrames, {
          duration: (MadeonSamplePadInstance.getLoopDuration() / 8) * 1000,
          composite: "add",
          iterations: 8,
        });
      }
    },
    () => {
      soundsRef.current?.getAnimations().forEach((i) => i.cancel());
    },
    [currentSamplePadState.sounds.length > 0]
  );

  const loadedState = useAppSelector((state) => state.samplePad.loadedState);
  const dispatch = useAppDispatch();

  const onClick = async (padConfig: PadConfig) => {
    if (loadedState == "pending") {
      return;
    }
    if (
      immediateStop &&
      samplePadStateContainsPadConfig(currentSamplePadState, padConfig)
    ) {
      MadeonSamplePadInstance.stopSoundImmediately(padConfig);
    } else {
      dispatch(asyncAddSampleToQueue(padConfig));
    }
  };
  return (
    <StyledAppWrapper>
      {playingState == "paused" && <PauseOverlay />}
      <h1>Click on a square to begin!</h1>
      <h2>
        You can have one{" "}
        <StyledPadTypeSpan ref={bassRef} $padType={PadType.BASS}>
          bass
        </StyledPadTypeSpan>
        , one{" "}
        <StyledPadTypeSpan ref={drumRef} $padType={PadType.DRUM}>
          drum
        </StyledPadTypeSpan>
        , and 3{" "}
        <StyledPadTypeSpan ref={soundsRef} $padType={PadType.SOUNDS}>
          melody
        </StyledPadTypeSpan>
      </h2>

      <SamplePad
        currentSamplePadState={currentSamplePadState}
        onPadClick={onClick}
      />
      <button
        disabled={playingState != "started"}
        onClick={() => dispatch(pause())}
      >
        pause
      </button>
      <button
        disabled={playingState != "started"}
        onClick={() => {
          dispatch(stop());
        }}
      >
        stop
      </button>

      <button
        className={immediateStop ? "toggled" : ""}
        onClick={() => {
          setImmediateStop(!immediateStop);
        }}
      >
        {immediateStop ? "instant stop samples" : "stop samples on loop"}
      </button>
      <h2>
        This was 100% stolen from{" "}
        <a href="https://adventuremachine.4thfloorcreative.co.uk/adventuremachine/?t=5,16,34">
          this website
        </a>{" "}
        so credit to them!!
      </h2>

      <h2>made by Simon for learning the Web Audio Api</h2>
      <p>
        I made this all using react (idk why really it was very hard to reason
        about perfectly timing animations when the whole rerender situation is
        so slow -__-) and <a href="https://tonejs.github.io/">Tone.js</a> which
        is so coooool especially for me since I don't really know anything about
        music and ALSO REDUX cause why not.
      </p>

      <p>
        I am pretty proud of the way I used react for all of the rendering, but
        broke out of the react world to make sure all of the updates were
        happening in sync with the tone js Transport :^). React kinda sucks if
        you rely on their way of handling updates to the UI for everything (for
        example it is not immediate, so when the loop completes, and potentially
        trigger a re render, it wouldn't happen until a couple ms later which is
        not ideal for real time animations.) Also shout out the the{" "}
        <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API">
          Web Animations API
        </a>
        , it was nice to not have to rely on a library like anime.js or
        something.
      </p>
      <p>
        thanks for playing! I want to make more music games/experiences so this
        was a great starting point!
      </p>

      <p>
        Also I did some exploding brain math to index the grid starting at the
        upper left and ending at the lower right in order to more easily assign
        the type of pad along the diagonal which I am also extremely proud of
        math is cool.
      </p>
      <StyledImg src="/images/notes1.jpg"></StyledImg>
      <StyledImg src="/images/notes2.jpg"></StyledImg>
      <StyledImg src="/images/notes3.jpg"></StyledImg>
      <StyledImg src="/images/notes4.jpg"></StyledImg>
    </StyledAppWrapper>
  );
}

const StyledImg = styled.img`
  max-width: 100%;
`;

const StyledPadTypeSpan = styled.span<{ $padType: PadType }>`
  color: ${(props) => getColorFromPadType(props.$padType, 1)};
  display: inline-block;
`;

const StyledAppWrapper = styled.div`
  width: 100%;
  height: 100%;
`;

export default App;
