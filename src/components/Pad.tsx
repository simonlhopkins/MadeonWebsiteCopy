import { useEffect, useRef } from "react";
import styled from "styled-components";
import {
  MadeonSamplePadInstance,
  PadConfig,
  PadType,
} from "../MadeonSamplePad";
import { getColorFromPadType, mapRange } from "../Util";

type PadProps = {
  active: boolean;
  queued: boolean;
  debugText: string;
  padConfig: PadConfig;
  onPadClick: (padConfig: PadConfig) => void;
};
export default function Pad({
  active,
  queued,
  padConfig,
  onPadClick,
}: PadProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  //this seems like a fucked up way to do animations in react lol but like none of the other libraries make any sense to me.

  //this is wayyyy simpler but could be a little bit delayed since it is not starting exactly on the next update
  useEffect(() => {
    if (active) {
      const keyFrames = [
        { transform: "scale(1)", easing: "ease-in-out", offset: 0.1 },
        { transform: "scale(1.3)", easing: "ease-in-out", offset: 0.2 },
        { transform: "scale(1)", easing: "ease-in-out" },
      ];
      const diff =
        MadeonSamplePadInstance.getNowTime() -
        MadeonSamplePadInstance.getCurrentLoopStartTime();
      //accounts for the initial delay due to react, but then just loops
      let initialAnim = divRef.current?.animate(keyFrames, {
        duration: (MadeonSamplePadInstance.getLoopDuration() / 8 - diff) * 1000,
        composite: "add",
        iterations: 1,
      });
      initialAnim?.finished
        .then(() => {
          divRef.current?.animate(keyFrames, {
            duration: (MadeonSamplePadInstance.getLoopDuration() / 8) * 1000,
            composite: "add",
            iterations: Infinity,
          });
        })
        .catch((e) => {
          console.log("promise aborted");
        });
    }

    return () => {
      divRef.current?.getAnimations().forEach((item) => item.cancel());
    };
  }, [active]);

  //if the queued status changes, then add an animation
  useEffect(() => {
    if (queued) {
      const nextLoopStartTime = MadeonSamplePadInstance.getNextLoopStartTime();
      const loopStartTime = MadeonSamplePadInstance.getCurrentLoopStartTime();
      const percentThrough =
        loopStartTime < nextLoopStartTime
          ? mapRange(
              MadeonSamplePadInstance.getImmediateTime(),
              loopStartTime,
              nextLoopStartTime,
              0,
              1
            )
          : 1;
      overlayRef.current?.animate(
        { width: [`${percentThrough * 100}%`, "100%"], easing: "linear" },
        (1 - percentThrough) * MadeonSamplePadInstance.getLoopDuration() * 1000
      );
    }
    return () => {
      overlayRef.current?.getAnimations().forEach((item) => item.cancel());
    };
  }, [queued]);

  //doing it this way is technically more in sync since at the beginning of each loop it starts the anim from scratch
  // useEffect(() => {
  //   //each pad have a sample loop callback, this is because we need to start the animation AS SOON as we can
  //   //if we rely on the active prop, that will be updated ms after the loop already happened, so we would
  //   //miss the first iteration of the loop
  //   const loopID = MadeonSamplePadInstance.addSampleLoopCallback(
  //     (currentState, _time, loopDuration) => {
  //       const actuallyActive = samplePadStateContainsPadConfig(
  //         currentState,
  //         padConfig
  //       );
  //       //actually active is what the class is giving us completely divorced from rendering
  //       //I feel like i read somewhere that you shouldn't set state in a use effect block but ¯\_(ツ)_/¯
  //       //Like technically it is in the callback function lol

  //       if (actuallyActive) {
  //         const keyFrames = [
  //           { transform: "scale(1)", easing: "ease-in-out", offset: 0.1 },
  //           { transform: "scale(1.3)", easing: "ease-in-out", offset: 0.2 },
  //           { transform: "scale(1)", easing: "ease-in-out" },
  //         ];
  //         divRef.current?.animate(keyFrames, {
  //           duration: (loopDuration / 8) * 1000,
  //           iterations: 8,
  //         });
  //       }
  //     }
  //   );

  //   const visibilityCallback = () => {
  //     console.log(document.visibilityState);
  //     if (document.visibilityState == "hidden") {
  //       divRef.current!.getAnimations().forEach((item) => {
  //         item.cancel();
  //       });
  //       divRef.current?.animate(
  //         [
  //           {
  //             transform: "scale(1)",
  //           },
  //         ],
  //         200
  //       );
  //     }
  //   };
  //   document.addEventListener("visibilitychange", visibilityCallback);

  //   return () => {
  //     document.removeEventListener("visibilitychange", visibilityCallback);
  //     divRef.current!.getAnimations().forEach((item) => {
  //       item.cancel();
  //     });
  //     divRef.current?.animate(
  //       [
  //         {
  //           transform: "scale(1)",
  //         },
  //       ],
  //       200
  //     );

  //     MadeonSamplePadInstance.removeSampleLoopCallback(loopID);
  //   };
  // }, []);
  // useEffect(() => {
  //   if (!active) {
  //     divRef.current?.getAnimations().forEach((item) => item.cancel());
  //   }
  // }, [active]);

  return (
    <StyledPad
      $padType={padConfig.type}
      $animLength={MadeonSamplePadInstance.getLoopDuration() * 1000}
      className={`${active ? "active" : ""} ${queued ? "queued" : ""}`}
      onClick={() => {
        onPadClick(padConfig);
      }}
      ref={divRef}
    >
      <div className="overlay" ref={overlayRef}></div>
    </StyledPad>
  );
}

const StyledPad = styled.div<{ $padType: PadType; $animLength: number }>`
  position: relative;
  background-color: ${(props) => getColorFromPadType(props.$padType, 0.8)};
  border: 3px solid white;
  margin: 5px;
  /* transform: rotate(45deg); */
  cursor: "pointer";

  &.active {
    background-color: ${(props) => getColorFromPadType(props.$padType, 1)};

    .overlay {
      opacity: 0%;
      transition: opacity 200ms;
    }
  }
  .overlay {
    opacity: 0%;
    transition: opacity 200ms;
    background-color: ${(props) => getColorFromPadType(props.$padType, 1)};
    border-right: 2px solid white;
    position: absolute;
    width: 0%;
    height: 100%;
  }
  &.queued {
    .overlay {
      opacity: 100%;
      transition: opacity 200ms;
    }
    &.active {
      .overlay {
        background-color: black;
      }
    }
  }
`;
