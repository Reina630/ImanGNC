declare module 'react-draggable' {
  import { ComponentType, CSSProperties, ReactElement } from 'react';

  export interface DraggableData {
    node: HTMLElement;
    x: number;
    y: number;
    deltaX: number;
    deltaY: number;
    lastX: number;
    lastY: number;
  }

  export interface DraggableProps {
    axis?: 'both' | 'x' | 'y' | 'none';
    bounds?: { left?: number; top?: number; right?: number; bottom?: number } | string | false;
    defaultClassName?: string;
    defaultClassNameDragging?: string;
    defaultClassNameDragged?: string;
    defaultPosition?: { x: number; y: number };
    disabled?: boolean;
    grid?: [number, number];
    handle?: string;
    cancel?: string;
    onStart?: (e: MouseEvent, data: DraggableData) => void | false;
    onDrag?: (e: MouseEvent, data: DraggableData) => void | false;
    onStop?: (e: MouseEvent, data: DraggableData) => void | false;
    onMouseDown?: (e: MouseEvent) => void;
    position?: { x: number; y: number };
    positionOffset?: { x: number | string; y: number | string };
    scale?: number;
    children?: ReactElement;
    nodeRef?: React.RefObject<HTMLElement>;
  }

  const Draggable: ComponentType<DraggableProps>;
  export default Draggable;
}
