import { v4 as uuidv4 } from 'uuid';

export enum ElementType {
  ENTITY = 'ENTITY',
  WEAK_ENTITY = 'WEAK_ENTITY',
  RELATIONSHIP = 'RELATIONSHIP',
  WEAK_RELATIONSHIP = 'WEAK_RELATIONSHIP',
  ATTRIBUTE = 'ATTRIBUTE',
  MULTIVALUED_ATTRIBUTE = 'MULTIVALUED_ATTRIBUTE',
}

export interface DiagramElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  name: string;
  cardinality?: string; // For relationships/connections
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  cardinality?: '1' | 'N' | 'M';
}

export interface DiagramState {
  elements: DiagramElement[];
  connections: Connection[];
}

export const INITIAL_STATE: DiagramState = {
  elements: [],
  connections: [],
};
