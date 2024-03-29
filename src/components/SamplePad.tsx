import { useRef } from "react";
import styled from "styled-components";
import {
  MadeonSamplePadInstance,
  PadConfig,
  SamplePadState,
} from "../MadeonSamplePad";
import { getPadConfigFromIndex, useAddToRenderLoop } from "../Util";
import { store, useAppSelector } from "../store";
import Pad from "./Pad";

type SamplePadProps = {
  currentSamplePadState: SamplePadState;
  onPadClick: (padConfig: PadConfig) => void;
};

export default function SamplePad({ onPadClick }: SamplePadProps) {
  const loadingState = useAppSelector((state) => state.samplePad.loadedState);
  const playingState = useAppSelector((state) => state.samplePad.playingState);
  const isPlaying = playingState != "stopped";
  // const ref = useAddAnimationToLoop<HTMLDivElement>(
  //   [
  //     { boxShadow: "0 0 0 0px rgba(255, 255, 255, 1)" },
  //     { boxShadow: "0 0 0 60px rgba(0, 0, 0, 0)" },
  //   ],
  //   {
  //     duration: (MadeonSamplePadInstance.getLoopDuration() / 8) * 1000,
  //     iterations: 8,
  //   },
  //   isPlaying,
  //   false
  // );

  const ref = useRef<HTMLDivElement>(null);

  useAddToRenderLoop(
    () => {
      if (store.getState().samplePad.playingState == "started") {
        ref.current?.animate(
          [
            { boxShadow: "0 0 0 0px rgba(255, 255, 255, 1)" },
            { boxShadow: "0 0 0 60px rgba(0, 0, 0, 0)" },
          ],
          {
            duration: (MadeonSamplePadInstance.getLoopDuration() / 8) * 1000,
            iterations: 8,
          }
        );
      }
    },
    () => {
      ref.current?.getAnimations().forEach((i) => i.cancel());
    },
    [isPlaying]
  );

  const n = 6;

  const samplePads = [];

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const index = row * n + col;
      const padConfig = getPadConfigFromIndex(index);

      samplePads.push(
        <Pad
          key={index}
          debugText={`${index}`}
          padConfig={padConfig}
          onPadClick={onPadClick}
        />
      );
    }
  }
  return (
    <StyledSamplePadParent ref={ref} className="samplePadParent">
      {samplePads}

      {!isPlaying && (
        <div className="overlayScreen">
          <div>
            {loadingState == "pending" && (
              <>
                <h1>loading...</h1>
                <div className="loader"></div>
              </>
            )}
          </div>
        </div>
      )}
    </StyledSamplePadParent>
  );
}

const StyledSamplePadParent = styled.div`
  display: grid;
  max-width: 300px;

  grid-template-rows: repeat(6, 1fr);
  grid-template-columns: repeat(6, 1fr);
  transform: rotate(-45deg);
  aspect-ratio: 1;
  margin: auto;
  margin-top: 130px;
  margin-bottom: 130px;

  .overlayScreen {
    overflow: hidden;
    pointer-events: none;
    position: absolute;
    height: 100%;
    width: 100%;

    /* background-color: rgba(128, 128, 128, 0.9); */
    //start loader graphic https://css-loaders.com/spinner/
    > div {
      display: flex;
      justify-content: center;
      flex-direction: column;

      align-items: center;
      transform: rotate(45deg);
      width: 100%;
      height: 100%;
    }
    .loader {
      width: 50px;
      aspect-ratio: 1;
      display: grid;
      animation: l14 4s infinite;
    }
    .loader::before,
    .loader::after {
      content: "";
      grid-area: 1/1;
      border: 8px solid;
      border-radius: 50%;
      border-color: red red #0000 #0000;
      mix-blend-mode: darken;
      animation: l14 1s infinite linear;
    }
    .loader::after {
      border-color: #0000 #0000 blue blue;
      animation-direction: reverse;
    }
    @keyframes l14 {
      100% {
        transform: rotate(1turn);
      }
    }
    //end loader graphic
  }
`;
