import styled from "styled-components";

type ToggleProps = {
  checked: boolean;
  onClick: () => void;
};
export function Toggle({ checked, onClick }: ToggleProps) {
  return (
    <StyledOuter onClick={onClick}>
      <StyledInner className={checked ? "checked" : ""} />
    </StyledOuter>
  );
}

const StyledOuter = styled.div`
  width: 200px;
  height: 100px;
  border-radius: 100px;
  background-color: red;
  position: relative;
`;

const StyledInner = styled.div`
  position: absolute;
  left: 0px;
  &.checked {
    right: 0px;
    left: auto;
  }
  width: 100px;
  aspect-ratio: 1;
  border-radius: 100px;
  background-color: orange;
  top: 0px;
  transition: all 1s ease;
`;
