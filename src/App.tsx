/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from './hooks/useLanguage';
import { SettingsMenu } from './components/SettingsMenu';
import { Stage, Layer, Rect, Ellipse, Text, Line, Group, Path, Circle as KonvaCircle, Transformer } from 'react-konva';
import Konva from 'konva';
import { v4 as uuidv4 } from 'uuid';
import { io, Socket } from 'socket.io-client';
import { 
  Undo,
  Redo,
  Square, 
  Diamond as DiamondIcon, 
  Circle, 
  Trash2, 
  MousePointer2, 
  Link2,
  Layers,
  Settings2,
  MoreVertical,
  PenLine,
  Settings,
  Download,
  Share2,
  Minus,
  X,
  Maximize2,
  Server,
  Router,
  DoorOpen,
  Square as WallIcon,
  FileJson,
  Table as TableIcon,
  Box,
  Home,
  FileArchive,
  Image as ImageIcon,
  Zap,
  Type,
  Hash,
  HelpCircle,
  PlusCircle,
  MinusCircle,
  Type as TextIcon,
  RotateCw,
  Palette,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize,
  Menu,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  Heart,
  Copy,
  Clipboard as ClipboardIcon,
  Check,
  ExternalLink,
  FileCode
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import { HexColorPicker } from "react-colorful";

// --- Tipos ---
declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    }
  }
}

enum DiagramMode {
  CONCEITUAL = 'CONCEITUAL',
  LOGICO = 'LOGICO',
  UML_CLASSE = 'UML_CLASSE',
  UML_CASO_USO = 'UML_CASO_USO',
  UML_SEQUENCIA = 'UML_SEQUENCIA',
  UML_ATIVIDADE = 'UML_ATIVIDADE',
  UML_ESTADO = 'UML_ESTADO',
  TOPOLOGIA = 'TOPOLOGIA',
  PLANTA_BAIXA = 'PLANTA_BAIXA'
}

enum ElementType {
  // Conceitual
  ENTIDADE = 'ENTIDADE',
  ENTIDADE_FRACA = 'ENTIDADE_FRACA',
  RELACIONAMENTO = 'RELACIONAMENTO',
  RELACIONAMENTO_FRACO = 'RELACIONAMENTO_FRACO',
  AGREGACAO = 'AGREGACAO',
  ATRIBUTO = 'ATRIBUTO',
  ATRIBUTO_CHAVE = 'ATRIBUTO_CHAVE',
  ATRIBUTO_CHAVE_PARCIAL = 'ATRIBUTO_CHAVE_PARCIAL',
  ATRIBUTO_MULTIVALORADO = 'ATRIBUTO_MULTIVALORADO',
  ATRIBUTO_OPCIONAL = 'ATRIBUTO_OPCIONAL',
  ATRIBUTO_COMPOSTO = 'ATRIBUTO_COMPOSTO',
  ATRIBUTO_DERIVADO = 'ATRIBUTO_DERIVADO',
  CARDINALIDADE = 'CARDINALIDADE',
  LEGEND = 'LEGEND',
  
  // Lógico
  TABELA = 'TABELA',
  MAPEAMENTO_9_PASSOS = 'MAPEAMENTO_9_PASSOS',
  
  // UML Classe
  CLASSE = 'CLASSE',
  INTERFACE = 'INTERFACE',
  PACKAGE = 'PACKAGE',
  NOTE = 'NOTE',
  
  // UML Caso de Uso
  ATOR = 'ATOR',
  CASO_USO = 'CASO_USO',
  SISTEMA = 'SISTEMA',

  // UML Sequência / Atividade / Estado
  LIFELINE = 'LIFELINE',
  MESSAGE = 'MESSAGE',
  ACTION = 'ACTION',
  DECISION = 'DECISION',
  START_NODE = 'START_NODE',
  END_NODE = 'END_NODE',
  STATE = 'STATE',
  TRANSITION = 'TRANSITION',
  
  // Topologia de Rede
  SERVIDOR = 'SERVIDOR',
  ROTEADOR = 'ROTEADOR',
  SWITCH = 'SWITCH',
  FIREWALL = 'FIREWALL',
  ACCESS_POINT = 'ACCESS_POINT',
  NUVEM = 'NUVEM',
  PC = 'PC',
  LAPTOP = 'LAPTOP',
  IMPRESSORA = 'IMPRESSORA',
  BANCO_DADOS = 'BANCO_DADOS',
  HUB = 'HUB',
  MODEM = 'MODEM',
  TABLET = 'TABLET',
  SMARTPHONE = 'SMARTPHONE',

  // Planta Baixa
  PAREDE = 'PAREDE',
  PORTA = 'PORTA',
  PORTA_DUPLA = 'PORTA_DUPLA',
  JANELA = 'JANELA',
  ESCADA = 'ESCADA',
  PILAR = 'PILAR',
  PILOTIS = 'PILOTIS',
  TUNEL_VENEZIANO = 'TUNEL_VENEZIANO',
  VENTILACAO = 'VENTILACAO',
  EXAUSTAO = 'EXAUSTAO',
  PIA = 'PIA',
  VASO_SANITARIO = 'VASO_SANITARIO',
  CHUVEIRO = 'CHUVEIRO',
  SOFA = 'SOFA',
  CAMA = 'CAMA',
  MESA = 'MESA',
  CADEIRA = 'CADEIRA',
  TOMADA = 'TOMADA',
  INTERRUPTOR = 'INTERRUPTOR',
  QUADRO_ELETRICO = 'QUADRO_ELETRICO',
  TUBULACAO = 'TUBULACAO',
  PISO = 'PISO',
  GELADEIRA = 'GELADEIRA',
  FOGAO = 'FOGAO',
  MAQUINA_LAVAR = 'MAQUINA_LAVAR',
  TEXT_BOX = 'TEXT_BOX',

  // Desenho Livre
  FREEHAND = 'FREEHAND',
  LINE_DRAWING = 'LINE_DRAWING',
}

interface LegendItem {
  id: string;
  label: string;
  color: string;
  shape: 'circle' | 'square' | 'diamond' | 'line' | 'rect';
}

interface DiagramElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  color?: string;
  fillColor?: string;
  fontColor?: string;
  fontFamily?: string;
  fontSize?: number;
  name: string;
  fields?: string[]; // Para tabelas/classes
  parentId?: string; // Para atributos compostos
  noteText?: string;
  legendItems?: LegendItem[];
  points?: number[]; // Para desenho livre
  strokeWidth?: number; // Para desenho livre
}

interface Connection {
  id: string;
  fromId: string;
  toId: string;
  cardinality?: '1' | 'N' | 'M';
  color?: string;
  label?: string;
  isDouble?: boolean;
  isAuto?: boolean;
  isHierarchy?: boolean;
}

interface Tab {
  id: string;
  name: string;
  color?: string;
  fontColor?: string;
  fontFamily?: string;
  fontSize?: number;
  mode: DiagramMode;
  elements: DiagramElement[];
  connections: Connection[];
}

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Componentes de Desenho ---

const Entidade = ({ element, isSelected, onSelect, onDragEnd, onDragMove, onContextMenu }: { 
  element: DiagramElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onDragEnd: (e: any) => void,
  onDragMove?: (e: any) => void,
  onContextMenu?: (e: any) => void
}) => {
  const isFraca = element.type === ElementType.ENTIDADE_FRACA;
  const width = element.width || 140;
  const height = element.height || 60;
  const rotation = element.rotation || 0;
  const color = element.color || "#141414";
  const fillColor = element.fillColor || "#FFFFFF";
  const fontColor = element.fontColor || color;
  const fontFamily = element.fontFamily || "Inter, sans-serif";
  const fontSize = element.fontSize || 14;

  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
      onContextMenu={onContextMenu}
      offsetX={width / 2}
      offsetY={height / 2}
    >
      <Rect
        width={width}
        height={height}
        fill={fillColor}
        stroke={color}
        strokeWidth={1}
        cornerRadius={8}
        shadowBlur={isSelected ? 10 : 0}
        shadowColor={color}
        shadowOpacity={0.2}
      />
      {isFraca && (
        <Rect
          x={8}
          y={8}
          width={width - 16}
          height={height - 16}
          stroke={color}
          strokeWidth={1}
          cornerRadius={6}
        />
      )}
      <Text
        text={element.name}
        width={width}
        height={height}
        align="center"
        verticalAlign="middle"
        fontSize={fontSize}
        fontFamily={fontFamily}
        fontStyle="bold"
        fill={fontColor}
      />
    </Group>
  );
};

const Relacionamento = ({ element, isSelected, onSelect, onDragEnd, onDragMove, onContextMenu }: { 
  element: DiagramElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onDragEnd: (e: any) => void,
  onDragMove?: (e: any) => void,
  onContextMenu?: (e: any) => void
}) => {
  const isFraco = element.type === ElementType.RELACIONAMENTO_FRACO;
  const isAgregacao = element.type === ElementType.AGREGACAO;
  const width = element.width || 140;
  const height = element.height || 70;
  const rotation = element.rotation || 0;
  const color = element.color || "#141414";
  const fillColor = element.fillColor || "#FFFFFF";
  const fontColor = element.fontColor || color;
  const fontFamily = element.fontFamily || "Inter, sans-serif";
  const fontSize = element.fontSize || 10;

  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
      onContextMenu={onContextMenu}
      offsetX={width / 2}
      offsetY={height / 2}
    >
      {isAgregacao && (
        <Rect
          width={width}
          height={height}
          fill={fillColor}
          stroke={color}
          strokeWidth={1}
          shadowBlur={isSelected ? 10 : 0}
          shadowColor={color}
          shadowOpacity={0.2}
        />
      )}
      <Line
        points={[0, height / 2, width / 2, 0, width, height / 2, width / 2, height]}
        closed
        fill={isAgregacao ? "transparent" : fillColor}
        stroke={color}
        strokeWidth={1}
        lineJoin="miter"
        shadowBlur={isSelected && !isAgregacao ? 10 : 0}
        shadowColor={color}
        shadowOpacity={0.2}
      />
      {isFraco && (
        <Line
          points={[
            16, height / 2, 
            width / 2, 8, 
            width - 16, height / 2, 
            width / 2, height - 8
          ]}
          closed
          stroke={color}
          strokeWidth={1}
          lineJoin="miter"
        />
      )}
      <Text
        text={element.name}
        width={width}
        height={height}
        align="center"
        verticalAlign="middle"
        fontSize={fontSize}
        fontFamily={fontFamily}
        fontStyle="italic"
        fill={fontColor}
      />
    </Group>
  );
};

const Atributo = ({ element, isSelected, onSelect, onDragEnd, onDragMove, onAddSubAttribute, lineOnRight, onContextMenu }: { 
  element: DiagramElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onDragEnd: (e: any) => void,
  onDragMove?: (e: any) => void,
  onAddSubAttribute?: (parentId: string) => void,
  lineOnRight?: boolean,
  onContextMenu?: (e: any) => void
}) => {
  const isMultivalorado = element.type === ElementType.ATRIBUTO_MULTIVALORADO;
  const isChave = element.type === ElementType.ATRIBUTO_CHAVE;
  const isChaveParcial = element.type === ElementType.ATRIBUTO_CHAVE_PARCIAL;
  const isOpcional = element.type === ElementType.ATRIBUTO_OPCIONAL;
  const isComposto = element.type === ElementType.ATRIBUTO_COMPOSTO;
  const isDerivado = element.type === ElementType.ATRIBUTO_DERIVADO;
  
  const color = element.color || "#141414";
  const fillColor = element.fillColor || "#FFFFFF";
  const fontColor = element.fontColor || color;
  const fontFamily = element.fontFamily || "Inter, sans-serif";
  const fontSize = element.fontSize || 12;
  const rotation = element.rotation || 0;
  const width = element.width || 20;
  const scale = width / 20;

  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
      onContextMenu={onContextMenu}
    >
      {/* Símbolo do Atributo (Escalado) */}
      <Group scaleX={scale} scaleY={scale}>
        {isComposto ? (
          <Group>
            {/* Ícone de Atributo Composto (Círculo com botão de adicionar) */}
            <KonvaCircle radius={8} stroke={color} strokeWidth={1.5} fill={fillColor} />
            
            {/* Botão + para adicionar sub-atributos */}
            {isSelected && onAddSubAttribute && (
              <Group 
                x={25} y={0} 
                onClick={(e) => { e.cancelBubble = true; onAddSubAttribute(element.id); }}
                onTap={(e) => { e.cancelBubble = true; onAddSubAttribute(element.id); }}
              >
                <KonvaCircle radius={8} fill="#141414" />
                <Text text="+" x={-4} y={-5} fill="white" fontSize={12} fontStyle="bold" />
              </Group>
            )}
          </Group>
        ) : (
          <Group>
            <KonvaCircle
              radius={8}
              fill={isChave ? color : fillColor}
              stroke={(isDerivado || isOpcional) ? "transparent" : color}
              strokeWidth={1.5}
              shadowBlur={isSelected ? 10 : 0}
              shadowColor={color}
              shadowOpacity={0.2}
            />
            {isChaveParcial && (
              <Path
                data="M -8 0 A 8 8 0 0 0 8 0 Z"
                fill={color}
              />
            )}
            {isOpcional && (
              <Group>
                <KonvaCircle
                  radius={10}
                  stroke={color}
                  strokeWidth={1.5}
                  fill={fillColor}
                />
                <Text
                  text="(0,1)"
                  fontSize={6}
                  x={-7.5}
                  y={-3}
                  fill={color}
                  fontFamily={fontFamily}
                  fontStyle="bold"
                />
              </Group>
            )}
            {isDerivado && (
              <KonvaCircle
                radius={8}
                stroke={color}
                strokeWidth={1.5}
                dash={[5, 3]}
              />
            )}
          </Group>
        )}

        {isMultivalorado && (
          <KonvaCircle
            radius={11}
            stroke={color}
            strokeWidth={1}
          />
        )}
      </Group>
      
      {/* Nome do Atributo (Lado de Fora) - Tamanho Absoluto */}
      <Text
        text={element.name}
        x={lineOnRight ? (isComposto ? -225 : -215) * scale : (isComposto ? 25 : 15) * scale}
        y={-10 * scale}
        width={200 * scale}
        align={lineOnRight ? "right" : "left"}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fill={fontColor}
        fontStyle={isChave ? "bold" : isChaveParcial ? "italic" : "normal"}
        textDecoration={(isChave || isChaveParcial) ? "underline" : undefined}
      />
    </Group>
  );
};

const TextBox = ({ element, isSelected, onSelect, onDragEnd, onDragMove, onContextMenu }: { 
  element: DiagramElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onDragEnd: (e: any) => void,
  onDragMove?: (e: any) => void,
  onContextMenu?: (e: any) => void
}) => {
  const color = element.color || "#141414";
  const fontColor = element.fontColor || color;
  const fontFamily = element.fontFamily || "Inter, sans-serif";
  const fontSize = element.fontSize || 14;
  const rotation = element.rotation || 0;
  const width = element.width || 100;
  const height = element.height || 40;

  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
      onContextMenu={onContextMenu}
      offsetX={width / 2}
      offsetY={height / 2}
    >
      <Text
        text={element.name}
        width={width}
        height={height}
        align="center"
        verticalAlign="middle"
        fontSize={fontSize}
        fontFamily={fontFamily}
        fill={fontColor}
        padding={5}
        stroke={isSelected ? color : "transparent"}
        strokeWidth={1}
      />
    </Group>
  );
};

const getElementsForStep = (stepIndex: number, allElements: DiagramElement[], allConnections: Connection[]) => {
  switch (stepIndex) {
    case 0: return allElements.filter(e => e.type === ElementType.ENTIDADE);
    case 1: return allElements.filter(e => e.type === ElementType.ENTIDADE_FRACA);
    case 2: return allElements.filter(e => e.type === ElementType.RELACIONAMENTO && allConnections.filter(c => c.fromId === e.id || c.toId === e.id).length === 2 && allConnections.filter(c => c.fromId === e.id || c.toId === e.id).every(c => c.cardinality === '1'));
    case 3: return allElements.filter(e => e.type === ElementType.RELACIONAMENTO && allConnections.filter(c => c.fromId === e.id || c.toId === e.id).length === 2 && allConnections.filter(c => c.fromId === e.id || c.toId === e.id).some(c => c.cardinality === 'N' || c.cardinality === 'M') && allConnections.filter(c => c.fromId === e.id || c.toId === e.id).some(c => c.cardinality === '1'));
    case 4: return allElements.filter(e => e.type === ElementType.RELACIONAMENTO && allConnections.filter(c => c.fromId === e.id || c.toId === e.id).length === 2 && allConnections.filter(c => c.fromId === e.id || c.toId === e.id).every(c => c.cardinality === 'N' || c.cardinality === 'M'));
    case 5: return allElements.filter(e => e.type === ElementType.ATRIBUTO_MULTIVALORADO);
    case 6: return allElements.filter(e => e.type === ElementType.RELACIONAMENTO && allConnections.filter(c => c.fromId === e.id || c.toId === e.id).length > 2);
    case 7: return [];
    case 8: return [];
    default: return [];
  }
};

const Mapeamento9PassosElement = ({ element, isSelected, onSelect, onDragEnd, onDragMove, onContextMenu, allElements, allConnections, onUpdate, t }: { 
  element: DiagramElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onDragEnd: (e: any) => void,
  onDragMove?: (e: any) => void,
  onContextMenu?: (e: any) => void,
  allElements?: DiagramElement[],
  allConnections?: Connection[],
  onUpdate?: (newEl: DiagramElement) => void,
  t: (key: string) => string
}) => {
  const width = element.width || 350;
  const height = element.height || 450;
  const rotation = element.rotation || 0;
  const color = element.color || "#141414";
  const fillColor = element.fillColor || "#FFFFFF";
  const fontColor = element.fontColor || "#141414";
  const fontFamily = element.fontFamily || "Inter, sans-serif";
  const fontSize = element.fontSize || 12;

  const steps = [
    t('step1'),
    t('step2'),
    t('step3'),
    t('step4'),
    t('step5'),
    t('step6'),
    t('step7'),
    t('step8'),
    t('step9')
  ];

  const fields = element.fields || [];
  let currentStep = 0;
  for (let i = 0; i < 9; i++) {
    if (!fields[i]) {
      currentStep = i;
      break;
    }
  }
  if (fields.length >= 9 && fields[8]) currentStep = 9;

  useEffect(() => {
    if (currentStep < 9) {
      const els = getElementsForStep(currentStep, allElements || [], allConnections || []);
      if (els.length === 0) {
        const newFields = [...(element.fields || [])];
        while (newFields.length <= currentStep) newFields.push("");
        newFields[currentStep] = `${t('doesNotHave')} ${steps[currentStep].split(": ")[1]?.toLowerCase() || ''}`;
        if (onUpdate) {
          onUpdate({ ...element, fields: newFields });
        }
      }
    }
  }, [currentStep, allElements, allConnections, t]);

  const handleDoubleClick = (index: number) => {
    if (index > currentStep) return;
    
    const currentText = element.fields?.[index] || "";
    const newText = window.prompt(`${t('typeMappingFor')}\n${steps[index]}`, currentText);
    
    if (newText !== null) {
      const newFields = [...(element.fields || [])];
      while (newFields.length <= index) newFields.push("");
      newFields[index] = newText;
      if (onUpdate) {
        onUpdate({ ...element, fields: newFields });
      }
    }
  };

  let currentY = 50;
  const renderedSteps = steps.slice(0, currentStep + 1).map((step, i) => {
    const isCurrent = i === currentStep;
    const userText = element.fields && element.fields[i] ? element.fields[i] : "";
    const lines = userText ? userText.split('\n').length : 1;
    
    const stepGroup = (
      <Group key={i} y={currentY} x={15}>
        <Text
          text={step}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontStyle="bold"
          fill={fontColor}
        />
        {isCurrent && (
          <Path
            x={step.length * (fontSize * 0.6) + 10}
            y={2}
            data="M0 0 L10 5 L0 10 Z"
            fill={fontColor}
          />
        )}
        <Text
          text={userText || (isCurrent ? t('clickToType') : "")}
          y={fontSize + 4}
          fontSize={fontSize - 1}
          fontFamily={fontFamily}
          fill={userText ? fontColor : "#ef4444"}
          fontStyle={userText ? "normal" : "italic"}
          onClick={() => handleDoubleClick(i)}
          onTap={() => handleDoubleClick(i)}
        />
        <Rect
          y={fontSize + 4}
          width={width - 30}
          height={lines * (fontSize + 2) + 10}
          fill="transparent"
          onClick={() => handleDoubleClick(i)}
          onTap={() => handleDoubleClick(i)}
        />
      </Group>
    );
    
    currentY += (fontSize + 4) + (lines * (fontSize + 2)) + 10;
    return stepGroup;
  });

  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
      onContextMenu={onContextMenu}
      offsetX={width / 2}
      offsetY={height / 2}
    >
      <Rect
        width={width}
        height={Math.max(height, currentY + 20)}
        fill={fillColor}
        stroke={isSelected ? "#3b82f6" : color}
        strokeWidth={2}
        cornerRadius={8}
        shadowBlur={isSelected ? 10 : 5}
        shadowColor="#000"
        shadowOpacity={0.1}
      />
      <Rect
        width={width}
        height={40}
        fill={color}
        cornerRadius={[8, 8, 0, 0]}
      />
      <Text
        text={t('mapeamento9Passos')}
        x={10}
        y={12}
        width={width - 20}
        align="center"
        fontSize={Math.max(12, fontSize + 2)}
        fontFamily={fontFamily}
        fontStyle="bold"
        fill="#FFFFFF"
      />
      
      {renderedSteps}
    </Group>
  );
};

const Tabela = ({ element, isSelected, onSelect, onDragEnd, onDragMove, onContextMenu }: { 
  element: DiagramElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onDragEnd: (e: any) => void,
  onDragMove?: (e: any) => void,
  onContextMenu?: (e: any) => void
}) => {
  const isInterface = element.type === ElementType.INTERFACE;
  const fields = element.fields || (isInterface ? ["+ operacao()"] : ["id (PK)", "nome"]);
  const headerHeight = isInterface ? 45 : 30;
  const rowHeight = 25;
  const totalHeight = headerHeight + (fields.length * rowHeight);
  const width = element.width || 160;
  const scale = width / 160;
  const rotation = element.rotation || 0;
  const fontColor = element.fontColor || "#141414";
  const fontFamily = element.fontFamily || "Inter, sans-serif";
  const fontSize = element.fontSize || 12;
  const headerFontColor = element.fontColor || (isInterface ? "#141414" : "#FFFFFF");
  
  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={rotation}
      scaleX={scale}
      scaleY={scale}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
      onContextMenu={onContextMenu}
      offsetX={80}
      offsetY={totalHeight / 2}
    >
      <Rect
        width={160}
        height={totalHeight}
        fill="#FFFFFF"
        stroke="#141414"
        strokeWidth={2}
        cornerRadius={8}
        shadowBlur={isSelected ? 10 : 0}
      />
      <Rect
        width={160}
        height={headerHeight}
        fill={isInterface ? "#f0f0f0" : "#141414"}
        cornerRadius={[8, 8, 0, 0]}
      />
      <Group>
        {isInterface && (
          <Text
            text="<<interface>>"
            width={160}
            y={5}
            align="center"
            fontSize={10}
            fontFamily={fontFamily}
            fontStyle="italic"
            fill={headerFontColor}
          />
        )}
        <Text
          text={element.name}
          width={160}
          height={headerHeight}
          y={isInterface ? 10 : 0}
          align="center"
          verticalAlign="middle"
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontStyle="bold"
          fill={headerFontColor}
        />
      </Group>
      {fields.map((field, i) => {
        const columns = field.split('|').map(c => c.trim());
        const colWidth = 160 / columns.length;
        return (
          <Group key={i} y={headerHeight + (i * rowHeight)}>
            <Line points={[0, 0, 160, 0]} stroke="#141414" strokeWidth={1} />
            {columns.map((colText, j) => (
              <Group key={j} x={j * colWidth}>
                {j > 0 && <Line points={[0, 0, 0, rowHeight]} stroke="#141414" strokeWidth={1} />}
                <Text
                  text={colText}
                  x={5}
                  width={colWidth - 10}
                  height={rowHeight}
                  verticalAlign="middle"
                  fontSize={fontSize - 1}
                  fontFamily={fontFamily === "Inter, sans-serif" ? "Courier New, monospace" : fontFamily}
                  fill={fontColor}
                  align="center"
                />
              </Group>
            ))}
          </Group>
        );
      })}
    </Group>
  );
};

const IconElement = ({ element, isSelected, onSelect, onDragEnd, onDragMove, onContextMenu }: { 
  element: DiagramElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onDragEnd: (e: any) => void,
  onDragMove?: (e: any) => void,
  onContextMenu?: (e: any) => void
}) => {
  const rotation = element.rotation || 0;
  const width = element.width || 40;
  const height = element.height || 40;
  const scale = width / 40;

  const renderIcon = () => {
    const color = element.color || "#141414";
    const fillColor = element.fillColor || "#FFFFFF";
    const width = element.width || 100;
    const height = element.height || 60;

    switch (element.type) {
      case ElementType.SERVIDOR: return <Rect width={40} height={50} fill="#f0f0f0" stroke="#141414" strokeWidth={2} />;
      case ElementType.ROTEADOR: return <KonvaCircle radius={20} fill="#f0f0f0" stroke="#141414" strokeWidth={2} />;
      case ElementType.SWITCH: return <Rect width={50} height={20} fill="#f0f0f0" stroke="#141414" strokeWidth={2} />;
      case ElementType.FIREWALL: return <Rect width={40} height={40} fill="#ffcccc" stroke="#141414" strokeWidth={2} />;
      case ElementType.ACCESS_POINT: return <Group><KonvaCircle radius={15} stroke="#141414" strokeWidth={2} /><Line points={[0, 0, 0, -20]} stroke="#141414" strokeWidth={2} /></Group>;
      case ElementType.PC: return <Group><Rect width={40} height={30} fill="#f0f0f0" stroke="#141414" strokeWidth={2} /><Rect y={30} x={10} width={20} height={5} fill="#141414" /></Group>;
      case ElementType.LAPTOP: return <Group><Rect width={40} height={25} fill="#f0f0f0" stroke="#141414" strokeWidth={2} /><Line points={[0, 25, -10, 35, 50, 35, 40, 25]} stroke="#141414" strokeWidth={2} closed /></Group>;
      case ElementType.IMPRESSORA: return <Rect width={40} height={30} fill="#f0f0f0" stroke="#141414" strokeWidth={2} cornerRadius={2} />;
      case ElementType.BANCO_DADOS: return <Ellipse radiusX={20} radiusY={25} fill="#f0f0f0" stroke="#141414" strokeWidth={2} />;
      case ElementType.HUB: return <Rect width={50} height={15} fill="#f0f0f0" stroke="#141414" strokeWidth={2} />;
      case ElementType.MODEM: return <Rect width={30} height={15} fill="#f0f0f0" stroke="#141414" strokeWidth={2} cornerRadius={2} />;
      case ElementType.TABLET: return <Rect width={30} height={45} fill="#f0f0f0" stroke="#141414" strokeWidth={2} cornerRadius={3} />;
      case ElementType.SMARTPHONE: return <Rect width={20} height={35} fill="#f0f0f0" stroke="#141414" strokeWidth={2} cornerRadius={2} />;
      case ElementType.NUVEM: return <Ellipse radiusX={30} radiusY={20} fill="#e0f0ff" stroke="#141414" strokeWidth={2} />;
      case ElementType.PAREDE: return <Rect width={100} height={8} fill="#141414" />;
      case ElementType.PORTA: return <Line points={[0, 0, 40, 0, 40, -40]} stroke="#141414" strokeWidth={2} />;
      case ElementType.PORTA_DUPLA: return <Group><Line points={[0, 0, 40, 0, 40, -40]} stroke="#141414" strokeWidth={2} /><Line points={[80, 0, 40, 0, 40, -40]} stroke="#141414" strokeWidth={2} /></Group>;
      case ElementType.JANELA: return <Rect width={60} height={8} fill="#ffffff" stroke="#141414" strokeWidth={1} />;
      case ElementType.ESCADA: return <Group>{[0, 10, 20, 30].map(i => <Rect key={i} y={i} width={40} height={10} stroke="#141414" strokeWidth={1} />)}</Group>;
      case ElementType.PILAR: return <Rect width={20} height={20} fill="#141414" />;
      case ElementType.PILOTIS: return <KonvaCircle radius={10} fill="#141414" />;
      case ElementType.PIA: return <Group><Ellipse radiusX={20} radiusY={15} fill="#ffffff" stroke="#141414" strokeWidth={1} /><KonvaCircle x={10} radius={3} fill="#141414" /></Group>;
      case ElementType.VASO_SANITARIO: return <Group><Ellipse radiusX={15} radiusY={20} fill="#ffffff" stroke="#141414" strokeWidth={1} /><Rect y={-25} x={-15} width={30} height={10} stroke="#141414" strokeWidth={1} /></Group>;
      case ElementType.SOFA: return <Rect width={80} height={40} fill="#f0f0f0" stroke="#141414" strokeWidth={2} cornerRadius={5} />;
      case ElementType.CAMA: return <Rect width={60} height={90} fill="#f0f0f0" stroke="#141414" strokeWidth={2} cornerRadius={2} />;
      case ElementType.MESA: return <Rect width={100} height={60} fill="#f0f0f0" stroke="#141414" strokeWidth={2} />;
      case ElementType.CADEIRA: return <Rect width={30} height={30} fill="#f0f0f0" stroke="#141414" strokeWidth={1} />;
      case ElementType.GELADEIRA: return <Rect width={40} height={40} fill="#f0f0f0" stroke="#141414" strokeWidth={2} />;
      case ElementType.FOGAO: return <Group><Rect width={40} height={40} fill="#f0f0f0" stroke="#141414" strokeWidth={2} />{[5, 15, 25, 35].map(x => <KonvaCircle key={x} x={x} y={10} radius={3} fill="#141414" />)}</Group>;
      case ElementType.MAQUINA_LAVAR: return <Group><Rect width={40} height={40} fill="#f0f0f0" stroke="#141414" strokeWidth={2} /><KonvaCircle x={20} y={20} radius={12} stroke="#141414" /></Group>;
      case ElementType.TOMADA: return <Group><KonvaCircle radius={5} stroke="#141414" strokeWidth={1} /><Line points={[-3, 0, 3, 0]} stroke="#141414" strokeWidth={1} /></Group>;
      case ElementType.INTERRUPTOR: return <Rect width={10} height={10} stroke="#141414" strokeWidth={1} />;
      case ElementType.QUADRO_ELETRICO: return <Rect width={30} height={40} fill="#141414" stroke="#141414" strokeWidth={1} />;
      case ElementType.VENTILACAO: return <Group><KonvaCircle radius={15} stroke="#141414" strokeWidth={1} /><Line points={[-10, -10, 10, 10]} stroke="#141414" /><Line points={[10, -10, -10, 10]} stroke="#141414" /></Group>;
      case ElementType.EXAUSTAO: return <Group><KonvaCircle radius={15} stroke="#141414" strokeWidth={1} /><Line points={[0, -15, 0, 15]} stroke="#141414" /><Line points={[-15, 0, 15, 0]} stroke="#141414" /></Group>;
      case ElementType.CHUVEIRO: return <Group><KonvaCircle radius={10} stroke="#141414" strokeWidth={1} /><Line points={[0, 0, 0, 10]} stroke="#141414" /></Group>;
      case ElementType.TUBULACAO: return <Line points={[0, 0, 100, 0]} stroke="#3b82f6" strokeWidth={3} />;
      case ElementType.TUNEL_VENEZIANO: return <Rect width={60} height={20} fill="#f0f0f0" stroke="#141414" strokeWidth={1} dash={[2, 2]} />;
      case ElementType.PISO: return <Rect width={100} height={100} fill="#f9f9f9" stroke="#e0e0e0" strokeWidth={1} />;
      case ElementType.AGREGACAO: return (
        <Group>
          <Rect width={40} height={40} fill="#ffffff" stroke="#141414" strokeWidth={2} />
          <Line points={[0, 20, 20, 0, 40, 20, 20, 40]} closed stroke="#141414" strokeWidth={2} />
        </Group>
      );
      case ElementType.ATOR: return <Group><KonvaCircle y={-20} radius={10} stroke="#141414" strokeWidth={2} /><Line points={[0, -10, 0, 10, -10, 25, 0, 10, 10, 25, 0, 10, 0, 0, -10, 0, 0, 0, 10, 0]} stroke="#141414" strokeWidth={2} /></Group>;
      case ElementType.CASO_USO: return <Ellipse radiusX={50} radiusY={25} fill="#ffffff" stroke="#141414" strokeWidth={2} />;
      case ElementType.ACTION: return <Rect width={100} height={40} cornerRadius={20} fill="#ffffff" stroke="#141414" strokeWidth={2} />;
      case ElementType.DECISION: return <Line points={[0, 25, 25, 0, 50, 25, 25, 50]} closed fill="#ffffff" stroke="#141414" strokeWidth={2} />;
      case ElementType.START_NODE: return <KonvaCircle radius={15} fill="#141414" />;
      case ElementType.END_NODE: return <Group><KonvaCircle radius={15} stroke="#141414" strokeWidth={2} /><KonvaCircle radius={10} fill="#141414" /></Group>;
      case ElementType.STATE: return <Rect width={100} height={50} cornerRadius={10} fill="#ffffff" stroke="#141414" strokeWidth={2} />;
      case ElementType.LIFELINE: return <Group><Rect width={80} height={40} fill="#ffffff" stroke="#141414" strokeWidth={2} /><Line points={[40, 40, 40, 200]} stroke="#141414" strokeWidth={1} dash={[5, 5]} /></Group>;
      case ElementType.PACKAGE: return <Group><Rect width={100} height={70} fill="#ffffff" stroke="#141414" strokeWidth={2} /><Rect y={-15} width={40} height={15} fill="#ffffff" stroke="#141414" strokeWidth={2} /></Group>;
      case ElementType.NOTE: return (
        <Group x={-width/2 + 20} y={-height/2 + 20}>
          <Rect width={width} height={height} fill="#fff9c4" stroke="#141414" strokeWidth={1} />
          <Line points={[width - 20, 0, width, 20, width - 20, 20]} closed fill="#ffffff" stroke="#141414" strokeWidth={1} />
          <Text 
            text={element.noteText || ""} 
            x={10} y={10} 
            width={width - 20} 
            fontSize={element.fontSize || 12} 
            fontFamily={element.fontFamily || "Inter, sans-serif"} 
            fill={element.fontColor || "#141414"} 
          />
        </Group>
      );
      case ElementType.LEGEND: return (
        <Group x={-width/2 + 20} y={-height/2 + 20}>
          <Rect width={width} height={height} fill="#ffffff" stroke="#141414" strokeWidth={1} cornerRadius={4} />
          <Rect width={width} height={25} fill="#f8f9fa" stroke="#141414" strokeWidth={1} cornerRadius={[4, 4, 0, 0]} />
          <Text text={element.name || "Legenda"} x={10} y={7} fontSize={12} fontStyle="bold" fontFamily="Inter, sans-serif" />
          <Group y={30}>
            {(element.legendItems || []).map((item, idx) => (
              <Group key={item.id} y={idx * 25} x={10}>
                {item.shape === 'circle' && <KonvaCircle radius={6} y={6} fill={item.color} stroke="#141414" strokeWidth={1} />}
                {item.shape === 'square' && <Rect width={10} height={10} y={1} fill={item.color} stroke="#141414" strokeWidth={1} />}
                {item.shape === 'rect' && <Rect width={14} height={8} y={2} fill={item.color} stroke="#141414" strokeWidth={1} />}
                {item.shape === 'diamond' && <Line points={[0, 5, 5, 0, 10, 5, 5, 10]} closed fill={item.color} stroke="#141414" strokeWidth={1} />}
                {item.shape === 'line' && <Line points={[0, 5, 12, 5]} stroke={item.color} strokeWidth={2} />}
                <Text text={item.label} x={20} y={0} fontSize={11} fontFamily="Inter, sans-serif" />
              </Group>
            ))}
          </Group>
        </Group>
      );
      case ElementType.CARDINALIDADE: return <Group x={-width/2 + 20} y={-height/2 + 20}><Text text={element.name} x={0} y={0} width={width} height={height} align="center" verticalAlign="middle" fontSize={element.fontSize || 14} fontFamily={element.fontFamily || "Inter, sans-serif"} fontStyle="bold" fill={element.fontColor || element.color || "#141414"} /></Group>;
      default: return <Rect width={40} height={40} fill="#ffffff" stroke={element.color || "#141414"} strokeWidth={2} />;
    }
  };

  const isCardinality = element.type === ElementType.CARDINALIDADE;
  const isNoteOrLegend = element.type === ElementType.NOTE || element.type === ElementType.LEGEND;
  const isUnscaled = isNoteOrLegend || isCardinality;

  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={rotation}
      scaleX={isUnscaled ? 1 : scale}
      scaleY={isUnscaled ? 1 : scale}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
      onContextMenu={onContextMenu}
      offsetX={20}
      offsetY={20}
    >
      {renderIcon()}
      {!isCardinality && !isNoteOrLegend && (
        <Text
          text={element.name}
          y={45}
          width={100}
          x={-50}
          align="center"
          fontSize={element.fontSize || 12}
          fontFamily={element.fontFamily || "Inter, sans-serif"}
          fill={element.fontColor || "#141414"}
        />
      )}
    </Group>
  );
};

// --- App Principal ---

const getTranslationKey = (type: string) => {
  if (type === 'MESA') return 'tableFurniture';
  if (type === 'INTERRUPTOR') return 'switchLight';
  const parts = type.split('_');
  return parts[0].toLowerCase() + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
};

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: uuidv4(), name: 'Diagrama 1', mode: DiagramMode.CONCEITUAL, elements: [], connections: [] }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const transformerRef = useRef<any>(null);
  const [tool, setTool] = useState<'SELECT' | 'CONNECT' | 'CONNECT_DOUBLE' | 'CONNECT_AUTO' | 'CONNECT_HIERARCHY' | ElementType>('SELECT');
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [addingHierarchyChildFrom, setAddingHierarchyChildFrom] = useState<string | null>(null);
  const [cardinalityMode, setCardinalityMode] = useState<string | null>('N');
  const [showCardinalityMenu, setShowCardinalityMenu] = useState(false);
  const [cardinalityMenuPos, setCardinalityMenuPos] = useState({ top: 0, left: 0 });
  const cardinalityButtonRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth - 320, height: window.innerHeight - 56 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(window.innerWidth >= 1024);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [activeColorPicker, setActiveColorPicker] = useState<'border' | 'text' | 'tab' | 'fill' | null>(null);
  const [history, setHistory] = useState<Tab[][]>([]);
  const [redoStack, setRedoStack] = useState<Tab[][]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hierarchyJunctions, setHierarchyJunctions] = useState<Record<string, { x: number, y: number }>>({});
  const { t } = useLanguage();
  const [clipboard, setClipboard] = useState<DiagramElement | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [showFirstRunModal, setShowFirstRunModal] = useState(false);
  const [syncPreference, setSyncPreference] = useState<'local' | 'cloud'>('local');
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Collaboration State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, { x: number, y: number }>>({});
  const [isReceivingSync, setIsReceivingSync] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean, targetId: string | null }>({ x: 0, y: 0, visible: false, targetId: null });

  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<DiagramElement | null>(null);
  const [drawingColor, setDrawingColor] = useState('#141414');
  const [drawingThickness, setDrawingThickness] = useState(2);

  // Autosave State
  const [isAutosaveEnabled, setIsAutosaveEnabled] = useState(() => {
    const saved = localStorage.getItem('brmodelo_autosave_enabled');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [autosaveInterval, setAutosaveInterval] = useState(() => {
    const saved = localStorage.getItem('brmodelo_autosave_interval');
    return saved !== null ? JSON.parse(saved) : 30; // 30 seconds default
  });

  // Load tabs from localStorage on mount
  useEffect(() => {
    // Temporary reset to clear the mockup for the user
    const hasClearedMockup = localStorage.getItem('brmodelo_cleared_mockup_3');
    if (!hasClearedMockup) {
      localStorage.removeItem('brmodelo_tabs_backup');
      localStorage.removeItem('brmodelo_first_run');
      localStorage.setItem('brmodelo_cleared_mockup_3', 'true');
      window.location.reload();
      return;
    }

    const savedTabs = localStorage.getItem('brmodelo_tabs_backup');
    if (savedTabs) {
      try {
        const parsed = JSON.parse(savedTabs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTabs(parsed);
          setActiveTabId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to load backup tabs", e);
      }
    }
  }, []);

  // Autosave Effect
  useEffect(() => {
    if (!isAutosaveEnabled) return;

    const interval = setInterval(() => {
      localStorage.setItem('brmodelo_tabs_backup', JSON.stringify(tabs));
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSaved(now);
      console.log('Autosaved at ' + now);
    }, autosaveInterval * 1000);

    return () => clearInterval(interval);
  }, [tabs, isAutosaveEnabled, autosaveInterval]);

  // Persist autosave settings
  useEffect(() => {
    localStorage.setItem('brmodelo_autosave_enabled', JSON.stringify(isAutosaveEnabled));
    localStorage.setItem('brmodelo_autosave_interval', JSON.stringify(autosaveInterval));
  }, [isAutosaveEnabled, autosaveInterval]);

  useEffect(() => {
    if (!socket) return;

    socket.on('sync-full-state', (data: { elements: DiagramElement[], connections: Connection[] }) => {
      setIsReceivingSync(true);
      setTabs(prev => prev.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, elements: data.elements, connections: data.connections }
          : tab
      ));
      setTimeout(() => setIsReceivingSync(false), 100);
    });

    socket.on('state-updated', (data: { elements: DiagramElement[], connections: Connection[] }) => {
      setIsReceivingSync(true);
      setTabs(prev => prev.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, elements: data.elements, connections: data.connections }
          : tab
      ));
      setTimeout(() => setIsReceivingSync(false), 100);
    });

    socket.on('cursor-moved', (data: { id: string, x: number, y: number }) => {
      setRemoteCursors(prev => ({ ...prev, [data.id]: { x: data.x, y: data.y } }));
    });

    socket.on('cursor-removed', (id: string) => {
      setRemoteCursors(prev => {
        const newCursors = { ...prev };
        delete newCursors[id];
        return newCursors;
      });
    });

    return () => {
      socket.off('sync-full-state');
      socket.off('state-updated');
      socket.off('cursor-moved');
      socket.off('cursor-removed');
    };
  }, [socket, activeTabId]);

  // Sync local changes to server
  useEffect(() => {
    if (socket && isCollaborating && !isReceivingSync) {
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab) {
        socket.emit('update-state', { roomId, elements: activeTab.elements, connections: activeTab.connections });
      }
    }
  }, [tabs, activeTabId, socket, isCollaborating, isReceivingSync, roomId]);

  useEffect(() => {
    const hasRun = localStorage.getItem('brmodelo_first_run');
    if (!hasRun) {
      setShowFirstRunModal(true);
    }
  }, []);

  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeTabEl = document.getElementById(`tab-${activeTabId}`);
      if (activeTabEl) {
        activeTabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTabId]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const saveHistory = () => {
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(tabs))].slice(-50));
    setRedoStack([]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack(prev => [...prev, JSON.parse(JSON.stringify(tabs))]);
    setTabs(previous);
    setHistory(prev => prev.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(tabs))]);
    setTabs(next);
    setRedoStack(prev => prev.slice(0, -1));
  };

  const copySelected = () => {
    const el = elements.find(el => el.id === selectedId);
    if (el) {
      setClipboard(JSON.parse(JSON.stringify(el)));
    }
  };

  const pasteElement = () => {
    if (clipboard) {
      saveHistory();
      const newEl = {
        ...JSON.parse(JSON.stringify(clipboard)),
        id: uuidv4(),
        x: clipboard.x + 20,
        y: clipboard.y + 20
      };
      setElements(prev => [...prev, newEl]);
      setSelectedId(newEl.id);
    }
  };
  const duplicateSelected = (id?: string) => {
    const targetId = id || selectedId;
    if (!targetId) return;
    const el = elements.find(el => el.id === targetId);
    if (el) {
      saveHistory();
      const newEl = {
        ...JSON.parse(JSON.stringify(el)),
        id: uuidv4(),
        x: el.x + 20,
        y: el.y + 20
      };
      setElements(prev => [...prev, newEl]);
      setSelectedId(newEl.id);
    }
  };

  const handleContextMenu = (e: any, id: string | null = null) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    
    if (pointerPos) {
      setContextMenu({
        x: pointerPos.x,
        y: pointerPos.y,
        visible: true,
        targetId: id
      });
      if (id) setSelectedId(id);
    }
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const [isDesktopMode, setIsDesktopMode] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      setIsDesktopMode(true);
    }
  }, []);

  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  const pixKey = "SU842a9734-c590-4ef2-a01a-8d826bd724ee"; // Chave PIX atualizada

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };
  const [isExporting, setIsExporting] = useState(false);
  const [guides, setGuides] = useState<{ x?: number, y?: number }[]>([]);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const lastDist = useRef(0);
  const handleTouchMove = (e: any) => {
    if (e.evt.touches.length === 2) {
      e.evt.preventDefault();
      const touch1 = e.evt.touches[0];
      const touch2 = e.evt.touches[1];
      const dist = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      if (lastDist.current > 0) {
        const scaleBy = 1.05;
        const stage = stageRef.current;
        const oldScale = stage.scaleX();
        const pointer = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };

        const mousePointTo = {
          x: (pointer.x - stage.x()) / oldScale,
          y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = dist > lastDist.current ? oldScale * scaleBy : oldScale / scaleBy;

        setScale(newScale);
        setPosition({
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        });
      }
      lastDist.current = dist;
    }
  };

  const handleZoom = (delta: number) => {
    const scaleBy = 1.2;
    const newScale = delta > 0 ? scale * scaleBy : scale / scaleBy;
    
    // Zoom em direção ao centro da tela
    const center = { x: stageSize.width / 2, y: stageSize.height / 2 };
    const mousePointTo = {
      x: (center.x - position.x) / scale,
      y: (center.y - position.y) / scale,
    };

    setScale(newScale);
    setPosition({
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    });
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const activeTab = tabs.find(t => t.id === activeTabId)!;
  const elements = activeTab.elements;
  const connections = activeTab.connections;
  const mode = activeTab.mode;

  const setElements = (newElements: DiagramElement[] | ((prev: DiagramElement[]) => DiagramElement[])) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { 
      ...t, 
      elements: typeof newElements === 'function' ? newElements(t.elements) : newElements 
    } : t));
  };

  const setConnections = (newConns: Connection[] | ((prev: Connection[]) => Connection[])) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { 
      ...t, 
      connections: typeof newConns === 'function' ? newConns(t.connections) : newConns 
    } : t));
  };

  const setMode = (newMode: DiagramMode) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, mode: newMode } : t));
  };

  const addTab = (mode: DiagramMode = DiagramMode.CONCEITUAL) => {
    saveHistory();
    const newTab: Tab = {
      id: uuidv4(),
      name: `Diagrama ${tabs.length + 1}`,
      mode,
      elements: [],
      connections: []
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) return;
    saveHistory();
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setStageSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    
    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [showSplash, isPropertiesOpen]);

  const addElement = (type: ElementType, x?: number, y?: number, parentId?: string) => {
    saveHistory();
    const parent = parentId ? elements.find(el => el.id === parentId) : null;
    let defaultX = x !== undefined ? x : 100 + Math.random() * 100;
    let defaultY = y !== undefined ? y : 100 + Math.random() * 100;

    if (parentId && parent) {
      // Encontrar sub-atributos existentes para evitar sobreposição
      const subAttributes = elements.filter(el => el.parentId === parentId);
      const lastSub = subAttributes.length > 0 ? subAttributes[subAttributes.length - 1] : parent;
      defaultX = parent.x + 60;
      defaultY = lastSub.y + 40;
    }

    let width = 140;
    let height = 60;

    if (type.startsWith('ATRIBUTO')) {
      width = 20;
      height = 20;
    } else if (type.startsWith('RELACIONAMENTO') || type === ElementType.AGREGACAO) {
      width = 140;
      height = 70;
    } else if (type === ElementType.TEXT_BOX) {
      width = 100;
      height = 40;
    } else if (type === ElementType.CARDINALIDADE) {
      width = 40;
      height = 40;
    } else if (type === ElementType.MAPEAMENTO_9_PASSOS) {
      width = 350;
      height = 450;
    } else if (type === ElementType.NOTE) {
      width = 80;
      height = 60;
    } else if (type === ElementType.LEGEND) {
      width = 100;
      height = 80;
    }

    const newElement: DiagramElement = {
      id: uuidv4(),
      type,
      x: defaultX,
      y: defaultY,
      width,
      height,
      name: type === ElementType.CARDINALIDADE ? (cardinalityMode || 'N') : 
            type === ElementType.TEXT_BOX ? t('textBox') : 
            t(getTranslationKey(type)) || type.toLowerCase().replace(/_/g, ' '),
      fields: type === ElementType.TABELA || type === ElementType.CLASSE ? ["id (PK)", "nome"] : 
              type === ElementType.MAPEAMENTO_9_PASSOS ? ["", "", "", "", "", "", "", "", ""] : undefined,
      parentId,
      color: "#141414",
      rotation: 0
    };

    // Auto-conectar atributo
    let autoConn: Connection | null = null;
    if (type.startsWith('ATRIBUTO')) {
      if (parentId) {
        // Conectar ao pai (atributo composto)
        autoConn = {
          id: uuidv4(),
          fromId: newElement.id,
          toId: parentId,
        };
      } else {
        // Conectar à entidade ou relacionamento mais próximo
        const targets = elements.filter(el => 
          el.type === ElementType.ENTIDADE || 
          el.type === ElementType.ENTIDADE_FRACA || 
          el.type === ElementType.RELACIONAMENTO || 
          el.type === ElementType.RELACIONAMENTO_FRACO
        );
        
        if (targets.length > 0) {
          let nearest = targets[0];
          let minDist = Math.sqrt(Math.pow(newElement.x - targets[0].x, 2) + Math.pow(newElement.y - targets[0].y, 2));
          
          targets.forEach(t => {
            const dist = Math.sqrt(Math.pow(newElement.x - t.x, 2) + Math.pow(newElement.y - t.y, 2));
            if (dist < minDist) {
              minDist = dist;
              nearest = t;
            }
          });
          
          autoConn = {
            id: uuidv4(),
            fromId: newElement.id,
            toId: nearest.id,
          };
        }
      }
    }

    setElements(prev => [...prev, newElement]);
    
    if (autoConn) {
      setConnections(prev => [...prev, autoConn!]);
    }

    setSelectedId(newElement.id);
  };

  const handleDragMove = (id: string, e: any) => {
    const currentX = e.target.x();
    const currentY = e.target.y();
    const currentEl = elements.find(el => el.id === id);
    if (!currentEl) return;

    const width = currentEl.width || (currentEl.type.startsWith('ATRIBUTO') ? 20 : 140);
    const height = currentEl.height || (currentEl.type.startsWith('ATRIBUTO') ? 20 : 60);

    const newGuides: { x?: number, y?: number }[] = [];
    const threshold = 5;

    elements.forEach(el => {
      if (el.id === id) return;

      const otherWidth = el.width || (el.type.startsWith('ATRIBUTO') ? 20 : 140);
      const otherHeight = el.height || (el.type.startsWith('ATRIBUTO') ? 20 : 60);

      // Alinhamento horizontal (X)
      // Centro com centro
      if (Math.abs(currentX - el.x) < threshold) {
        newGuides.push({ x: el.x });
      }
      // Esquerda com esquerda
      if (Math.abs((currentX - width/2) - (el.x - otherWidth/2)) < threshold) {
        newGuides.push({ x: el.x - otherWidth/2 + width/2 });
      }
      // Direita com direita
      if (Math.abs((currentX + width/2) - (el.x + otherWidth/2)) < threshold) {
        newGuides.push({ x: el.x + otherWidth/2 - width/2 });
      }

      // Alinhamento vertical (Y)
      // Centro com centro
      if (Math.abs(currentY - el.y) < threshold) {
        newGuides.push({ y: el.y });
      }
      // Topo com topo
      if (Math.abs((currentY - height/2) - (el.y - otherHeight/2)) < threshold) {
        newGuides.push({ y: el.y - otherHeight/2 + height/2 });
      }
      // Base com base
      if (Math.abs((currentY + height/2) - (el.y + otherHeight/2)) < threshold) {
        newGuides.push({ y: el.y + otherHeight/2 - height/2 });
      }
    });

    setGuides(newGuides);
  };

  const handleDragEnd = (id: string, e: any) => {
    saveHistory();
    const x = Math.round(e.target.x() / 20) * 20;
    const y = Math.round(e.target.y() / 20) * 20;
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, x, y } : el
    ));
    e.target.position({ x, y });
    setGuides([]);
  };

  const handleCanvasClick = (e: any) => {
    const stage = e.target.getStage();
    const clickedOnEmpty = e.target === stage;
    
    if (clickedOnEmpty) {
      if (tool === 'CONNECT_HIERARCHY' && connectFrom) {
        const pos = stage.getPointerPosition();
        setHierarchyJunctions(prev => ({
          ...prev,
          [connectFrom]: { x: Math.round(pos.x / 20) * 20, y: Math.round(pos.y / 20) * 20 }
        }));
        return;
      }
      if (tool !== 'SELECT' && tool !== 'CONNECT') {
        const pos = stage.getPointerPosition();
        addElement(tool as ElementType, Math.round(pos.x / 20) * 20, Math.round(pos.y / 20) * 20);
      } else {
        setSelectedId(null);
        setConnectFrom(null);
      }
    }
  };

  const handleElementClick = (id: string) => {
    if (addingHierarchyChildFrom) {
      if (addingHierarchyChildFrom === id) return;
      const newConn: Connection = {
        id: uuidv4(),
        fromId: addingHierarchyChildFrom,
        toId: id,
        isHierarchy: true
      };
      setConnections([...connections, newConn]);
      setAddingHierarchyChildFrom(null);
      return;
    }
    if (tool === 'CONNECT' || tool === 'CONNECT_DOUBLE' || tool === 'CONNECT_AUTO' || tool === 'CONNECT_HIERARCHY') {
      if (!connectFrom) {
        setConnectFrom(id);
      } else {
        if (connectFrom === id) {
          setConnectFrom(null);
          return;
        }
        if ((tool === 'CONNECT_DOUBLE' || tool === 'CONNECT_AUTO' || tool === 'CONNECT_HIERARCHY') && connections.some(c => (c.fromId === connectFrom && c.toId === id) || (c.fromId === id && c.toId === connectFrom))) {
          setConnectFrom(null);
          return;
        }
        const newConn: Connection = {
          id: uuidv4(),
          fromId: connectFrom,
          toId: id,
          isDouble: tool === 'CONNECT_DOUBLE',
          isAuto: tool === 'CONNECT_AUTO',
          isHierarchy: tool === 'CONNECT_HIERARCHY'
        };
        setConnections([...connections, newConn]);
        setConnectFrom(null);
      }
    } else {
      setSelectedId(id);
    }
  };

  const updateConnectionProperty = (id: string, property: keyof Connection, value: any) => {
    saveHistory();
    setConnections(prev => prev.map(c => c.id === id ? { ...c, [property]: value } : c));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    saveHistory();
    const isElement = elements.some(el => el.id === selectedId);
    if (isElement) {
      setElements(prev => prev.filter(el => el.id !== selectedId));
      setConnections(prev => prev.filter(c => c.fromId !== selectedId && c.toId !== selectedId));
    } else {
      const connToDelete = connections.find(c => c.id === selectedId);
      if (connToDelete) {
        const fromEl = elements.find(el => el.id === connToDelete.fromId);
        const toEl = elements.find(el => el.id === connToDelete.toId);
        
        const elementsToDelete = new Set<string>();
        if (fromEl?.type.startsWith('ATRIBUTO')) elementsToDelete.add(fromEl.id);
        if (toEl?.type.startsWith('ATRIBUTO')) elementsToDelete.add(toEl.id);
        
        if (elementsToDelete.size > 0) {
          setElements(prev => prev.filter(el => !elementsToDelete.has(el.id)));
          setConnections(prev => prev.filter(c => c.id !== selectedId && !elementsToDelete.has(c.fromId) && !elementsToDelete.has(c.toId)));
        } else {
          setConnections(prev => prev.filter(c => c.id !== selectedId));
        }
      }
    }
    setSelectedId(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (isCtrl && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        redo();
      } else if (isCtrl && e.key === 'c') {
        copySelected();
      } else if (isCtrl && e.key === 'v') {
        pasteElement();
      } else if (isCtrl && e.key === 's') {
        e.preventDefault();
        exportToJson();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Evitar deletar se estiver digitando em um input
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        deleteSelected();
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setConnectFrom(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements, connections, history, redoStack, clipboard, tabs]);

  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        transformerRef.current.nodes([]);
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedId, elements]);

  const updateElementProperty = (id: string, property: keyof DiagramElement, value: any) => {
    saveHistory();
    setElements(prev => prev.map(el => el.id === id ? { ...el, [property]: value } : el));
  };

  const updateElementFields = (fieldsStr: string) => {
    if (!selectedId) return;
    saveHistory();
    const fields = fieldsStr.split('\n').filter(f => f.trim() !== '');
    setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fields } : el));
  };

  const addLegendItem = () => {
    if (!selectedId) return;
    const el = elements.find(e => e.id === selectedId);
    if (!el || el.type !== ElementType.LEGEND) return;
    
    const newItem: LegendItem = {
      id: uuidv4(),
      label: 'Novo Item',
      color: '#141414',
      shape: 'circle'
    };
    
    const currentItems = el.legendItems || [];
    const newItems = [...currentItems, newItem];
    updateElementProperty(selectedId, 'legendItems', newItems);
    
    // Auto-expand height
    const newHeight = Math.max(80, 40 + newItems.length * 25);
    updateElementProperty(selectedId, 'height', newHeight);
    
    // Auto-expand width if needed
    const longestLabel = Math.max(...newItems.map(i => i.label.length), 10);
    const newWidth = Math.max(el.width || 120, 40 + longestLabel * 7);
    updateElementProperty(selectedId, 'width', newWidth);
  };

  const updateLegendItem = (itemId: string, property: keyof LegendItem, value: any) => {
    if (!selectedId) return;
    const el = elements.find(e => e.id === selectedId);
    if (!el || !el.legendItems) return;
    
    const newItems = el.legendItems.map(item => 
      item.id === itemId ? { ...item, [property]: value } : item
    );
    updateElementProperty(selectedId, 'legendItems', newItems);

    if (property === 'label') {
      const longestLabel = Math.max(...newItems.map(i => i.label.length), 10);
      const newWidth = Math.max(el.width || 120, 40 + longestLabel * 7);
      updateElementProperty(selectedId, 'width', newWidth);
    }
  };

  const removeLegendItem = (itemId: string) => {
    if (!selectedId) return;
    const el = elements.find(e => e.id === selectedId);
    if (!el || !el.legendItems) return;
    
    const newItems = el.legendItems.filter(item => item.id !== itemId);
    updateElementProperty(selectedId, 'legendItems', newItems);
    
    const newHeight = Math.max(80, 40 + newItems.length * 25);
    updateElementProperty(selectedId, 'height', newHeight);
  };

  const addTableRow = () => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => {
      if (el.id === selectedId) {
        const currentFields = el.fields || [];
        const maxCols = currentFields.length > 0 
          ? currentFields.reduce((max, f) => Math.max(max, f.split('|').length), 1)
          : 1;
        const newRow = Array(maxCols).fill('...').join(' | ');
        return { ...el, fields: [...currentFields, newRow] };
      }
      return el;
    }));
  };

  const addTableColumn = () => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => {
      if (el.id === selectedId) {
        const currentFields = el.fields || [];
        const newFields = currentFields.length > 0 
          ? currentFields.map(f => f + ' | ...')
          : ['... | ...'];
        return { ...el, fields: newFields };
      }
      return el;
    }));
  };

  const exportToJson = () => {
    const data = JSON.stringify({ elements, connections }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    saveAs(blob, 'projeto_brmodelo.json');
  };

  const importFromJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.elements && data.connections) {
          setElements(data.elements);
          setConnections(data.connections);
        }
      } catch (err) {
        console.error("Erro ao importar JSON", err);
      }
    };
    reader.readAsText(file);
  };

  const exportToPng = () => {
    setIsExporting(true);
    setTimeout(() => {
      if (!stageRef.current) return;
      const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `modelo_${mode.toLowerCase()}.png`;
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 100);
  };

  const exportToSvg = () => {
    setIsExporting(true);
    setTimeout(() => {
      if (!stageRef.current) return;
      
      // Encontrar limites do diagrama para o viewBox
      if (elements.length === 0) {
        setIsExporting(false);
        return;
      }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      elements.forEach(el => {
        const w = el.width || 100;
        const h = el.height || 100;
        minX = Math.min(minX, el.x - w);
        minY = Math.min(minY, el.y - h);
        maxX = Math.max(maxX, el.x + w);
        maxY = Math.max(maxY, el.y + h);
      });

      minX -= 100;
      minY -= 100;
      maxX += 100;
      maxY += 100;

      const width = maxX - minX;
      const height = maxY - minY;

      let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">`;
      svg += `<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#ffffff" />`;

      const escape = (str: string) => str.replace(/[<>&"']/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":"&apos;"}[c] || c));

      // Conexões (fundo)
      connections.forEach(conn => {
        const from = elements.find(e => e.id === conn.fromId);
        const to = elements.find(e => e.id === conn.toId);
        if (from && to) {
          svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#141414" stroke-width="2" />`;
          if (conn.label) {
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2;
            svg += `<text x="${mx}" y="${my - 5}" font-family="Inter, sans-serif" font-size="12" text-anchor="middle" fill="#141414">${escape(conn.label)}</text>`;
          }
        }
      });

      // Elementos
      elements.forEach(el => {
        const color = el.color || "#141414";
        const fillColor = el.fillColor || "#FFFFFF";
        const fontColor = el.fontColor || color;
        const fontSize = el.fontSize || 14;
        const name = escape(el.name || "");
        const rotation = el.rotation || 0;
        const w = el.width || 140;
        const h = el.height || 60;

        svg += `<g transform="translate(${el.x},${el.y}) rotate(${rotation})">`;

        if (el.type === ElementType.ENTIDADE || el.type === ElementType.ENTIDADE_FRACA) {
          svg += `<rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" fill="${fillColor}" stroke="${color}" stroke-width="1" rx="8" />`;
          if (el.type === ElementType.ENTIDADE_FRACA) {
            svg += `<rect x="${-w/2 + 4}" y="${-h/2 + 4}" width="${w - 8}" height="${h - 8}" fill="none" stroke="${color}" stroke-width="1" rx="6" />`;
          }
          svg += `<text x="0" y="0" font-family="Inter, sans-serif" font-size="${fontSize}" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${fontColor}">${name}</text>`;
        } else if (el.type === ElementType.RELACIONAMENTO || el.type === ElementType.RELACIONAMENTO_FRACO || el.type === ElementType.AGREGACAO) {
          const rw = el.width || 140;
          const rh = el.height || 70;
          if (el.type === ElementType.AGREGACAO) {
             svg += `<rect x="${-rw/2}" y="${-rh/2}" width="${rw}" height="${rh}" fill="${fillColor}" stroke="${color}" stroke-width="1" />`;
          }
          const points = `0,${-rh/2} ${rw/2},0 0,${rh/2} ${-rw/2},0`;
          svg += `<polygon points="${points}" fill="${el.type === ElementType.AGREGACAO ? 'none' : fillColor}" stroke="${color}" stroke-width="1" />`;
          if (el.type === ElementType.RELACIONAMENTO_FRACO) {
            const points2 = `0,${-rh/2 + 6} ${rw/2 - 12},0 0,${rh/2 - 6} ${-rw/2 + 12},0`;
            svg += `<polygon points="${points2}" fill="none" stroke="${color}" stroke-width="1" />`;
          }
          svg += `<text x="0" y="0" font-family="Inter, sans-serif" font-size="${fontSize}" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${fontColor}">${name}</text>`;
        } else if (el.type.startsWith('ATRIBUTO')) {
          const r = 8;
          const isChave = el.type === ElementType.ATRIBUTO_CHAVE;
          svg += `<circle cx="0" cy="0" r="${r}" fill="${isChave ? color : fillColor}" stroke="${color}" stroke-width="1.5" />`;
          svg += `<text x="0" y="25" font-family="Inter, sans-serif" font-size="${fontSize}" text-anchor="middle" fill="${fontColor}">${name}</text>`;
        } else if (el.type === ElementType.TABELA || el.type === ElementType.CLASSE || el.type === ElementType.INTERFACE) {
          const tw = el.width || 160;
          const fields = el.fields || [];
          const headerH = el.type === ElementType.INTERFACE ? 45 : 30;
          const rowH = 25;
          const totalH = headerH + (fields.length * rowH);
          svg += `<rect x="${-tw/2}" y="${-totalH/2}" width="${tw}" height="${totalH}" fill="#FFFFFF" stroke="#141414" stroke-width="2" rx="8" />`;
          svg += `<rect x="${-tw/2}" y="${-totalH/2}" width="${tw}" height="${headerH}" fill="${el.type === ElementType.INTERFACE ? '#f0f0f0' : '#141414'}" rx="8" />`;
          svg += `<text x="0" y="${-totalH/2 + headerH / 2}" font-family="Inter, sans-serif" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${el.type === ElementType.INTERFACE ? '#141414' : '#FFFFFF'}">${name}</text>`;
          fields.forEach((f, i) => {
            svg += `<text x="${-tw/2 + 10}" y="${-totalH/2 + headerH + (i * rowH) + rowH / 2}" font-family="Inter, sans-serif" font-size="11" dominant-baseline="middle" fill="#141414">${escape(f)}</text>`;
          });
        } else if (el.type === ElementType.TEXT_BOX) {
          svg += `<text x="0" y="0" font-family="Inter, sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle" fill="${fontColor}">${name}</text>`;
        } else if (el.type === ElementType.ATOR) {
          svg += `<circle cx="0" cy="-20" r="10" fill="none" stroke="${color}" stroke-width="2" />`;
          svg += `<line x1="0" y1="-10" x2="0" y2="10" stroke="${color}" stroke-width="2" />`;
          svg += `<line x1="-10" y1="0" x2="10" y2="0" stroke="${color}" stroke-width="2" />`;
          svg += `<line x1="0" y1="10" x2="-10" y2="25" stroke="${color}" stroke-width="2" />`;
          svg += `<line x1="0" y1="10" x2="10" y2="25" stroke="${color}" stroke-width="2" />`;
          svg += `<text x="0" y="40" font-family="Inter, sans-serif" font-size="12" text-anchor="middle" fill="${fontColor}">${name}</text>`;
        } else if (el.type === ElementType.CASO_USO) {
          svg += `<ellipse cx="0" cy="0" rx="50" ry="25" fill="${fillColor}" stroke="${color}" stroke-width="2" />`;
          svg += `<text x="0" y="0" font-family="Inter, sans-serif" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="${fontColor}">${name}</text>`;
        } else if (el.type === ElementType.ACTION) {
          svg += `<rect x="-50" y="-20" width="100" height="40" rx="20" fill="${fillColor}" stroke="${color}" stroke-width="2" />`;
          svg += `<text x="0" y="0" font-family="Inter, sans-serif" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="${fontColor}">${name}</text>`;
        } else if (el.type === ElementType.DECISION) {
          const points = "0,-25 25,0 0,25 -25,0";
          svg += `<polygon points="${points}" fill="${fillColor}" stroke="${color}" stroke-width="2" />`;
          svg += `<text x="0" y="40" font-family="Inter, sans-serif" font-size="12" text-anchor="middle" fill="${fontColor}">${name}</text>`;
        } else if (el.type === ElementType.START_NODE) {
          svg += `<circle cx="0" cy="0" r="15" fill="${color}" />`;
        } else if (el.type === ElementType.END_NODE) {
          svg += `<circle cx="0" cy="0" r="15" fill="none" stroke="${color}" stroke-width="2" />`;
          svg += `<circle cx="0" cy="0" r="10" fill="${color}" />`;
        } else if (el.type === ElementType.STATE) {
          svg += `<rect x="-50" y="-25" width="100" height="50" rx="10" fill="${fillColor}" stroke="${color}" stroke-width="2" />`;
          svg += `<text x="0" y="0" font-family="Inter, sans-serif" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="${fontColor}">${name}</text>`;
        } else if (el.type === ElementType.NOTE) {
          svg += `<rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" fill="#fff9c4" stroke="${color}" stroke-width="1" />`;
          svg += `<polygon points="${w/2-20},${-h/2} ${w/2},${-h/2+20} ${w/2-20},${-h/2+20}" fill="#ffffff" stroke="${color}" stroke-width="1" />`;
          svg += `<text x="${-w/2+10}" y="${-h/2+20}" font-family="Inter, sans-serif" font-size="12" fill="${fontColor}">${escape(el.noteText || "")}</text>`;
        } else {
          // Fallback genérico
          svg += `<rect x="-20" y="-20" width="40" height="40" fill="${fillColor}" stroke="${color}" stroke-width="1" rx="4" />`;
          svg += `<text x="0" y="35" font-family="Inter, sans-serif" font-size="10" text-anchor="middle" fill="${fontColor}">${name}</text>`;
        }

        svg += `</g>`;
      });

      svg += `</svg>`;

      const blob = new Blob([svg], { type: 'image/svg+xml' });
      saveAs(blob, `modelo_${mode.toLowerCase()}.svg`);
      setIsExporting(false);
    }, 100);
  };

  const exportToZip = async () => {
    setIsExporting(true);
    setTimeout(async () => {
      if (!stageRef.current) return;
      
      const zip = new JSZip();
      const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
      
      const base64Data = uri.replace(/^data:image\/(png|jpg);base64,/, "");
      zip.file("modelo.png", base64Data, {base64: true});
      zip.file("modelo.json", JSON.stringify({ elements, connections }, null, 2));
      
      // Adicionar README ou metadados dependendo do modo
      zip.file("info.txt", `Projeto BrModelo R\nTipo: ${mode}\nData: ${new Date().toLocaleString()}`);
      
      const content = await zip.generateAsync({type:"blob"});
      saveAs(content, `projeto_${mode.toLowerCase()}.zip`);
      
      setIsExporting(false);
    }, 100);
  };

  const helperGerarTabelas = (els: DiagramElement[], conns: Connection[]) => {
    const novasTabelas: DiagramElement[] = [];
    
    // Passo 1 e 2: Mapear Entidades (Fortes e Fracas) para Tabelas
    const entidades = els.filter(el => el.type === ElementType.ENTIDADE || el.type === ElementType.ENTIDADE_FRACA);
    
    entidades.forEach((ent, i) => {
      const atributos = conns
        .filter(c => c.fromId === ent.id || c.toId === ent.id)
        .map(c => els.find(el => el.id === (c.fromId === ent.id ? c.toId : c.fromId)))
        .filter(el => el && el.type.startsWith('ATRIBUTO') && el.type !== ElementType.ATRIBUTO_MULTIVALORADO && el.type !== ElementType.ATRIBUTO_DERIVADO);
        
      const fields = [
        "id (PK)",
        ...atributos.map(a => {
          if (a?.type === ElementType.ATRIBUTO_CHAVE) return `${a.name} (PK)`;
          if (a?.type === ElementType.ATRIBUTO_CHAVE_PARCIAL) return `${a.name} (PPK)`;
          return a?.name || "campo";
        })
      ];
      
      novasTabelas.push({
        id: ent.id,
        type: ElementType.TABELA,
        x: 100 + ((i % 4) * 200),
        y: 100 + (Math.floor(i / 4) * 150),
        name: ent.name,
        fields
      });
    });

    // Passo 3, 4, 5: Mapear Relacionamentos
    const relacionamentos = els.filter(el => el.type === ElementType.RELACIONAMENTO || el.type === ElementType.RELACIONAMENTO_FRACO);
    
    relacionamentos.forEach((rel, i) => {
      const relConns = conns.filter(c => c.fromId === rel.id || c.toId === rel.id);
      const entidadesConectadas = relConns
        .map(c => els.find(el => el.id === (c.fromId === rel.id ? c.toId : c.fromId)))
        .filter(el => el && (el.type === ElementType.ENTIDADE || el.type === ElementType.ENTIDADE_FRACA));
      
      if (entidadesConectadas.length === 2) {
        // Simplificação: Tratar como N:M criando uma tabela associativa
        const fields = [
          `id_${entidadesConectadas[0]?.name} (FK)`,
          `id_${entidadesConectadas[1]?.name} (FK)`
        ];

        // Adicionar atributos do relacionamento
        const relAtributos = relConns
          .map(c => els.find(el => el.id === (c.fromId === rel.id ? c.toId : c.fromId)))
          .filter(el => el && el.type.startsWith('ATRIBUTO'));
        
        fields.push(...relAtributos.map(a => a?.name || "campo"));

        novasTabelas.push({
          id: rel.id,
          type: ElementType.TABELA,
          x: 100 + ((novasTabelas.length % 4) * 200),
          y: 100 + (Math.floor(novasTabelas.length / 4) * 150),
          name: rel.name,
          fields
        });
      }
    });

    // Passo 6: Atributos Multivalorados
    const atributosMultivalorados = els.filter(el => el.type === ElementType.ATRIBUTO_MULTIVALORADO);
    atributosMultivalorados.forEach((attr, i) => {
      const conn = conns.find(c => c.fromId === attr.id || c.toId === attr.id);
      if (conn) {
        const parent = els.find(el => el.id === (conn.fromId === attr.id ? conn.toId : conn.fromId));
        if (parent) {
          novasTabelas.push({
            id: attr.id,
            type: ElementType.TABELA,
            x: 100 + ((novasTabelas.length % 4) * 200),
            y: 100 + (Math.floor(novasTabelas.length / 4) * 150),
            name: `${parent.name}_${attr.name}`,
            fields: [`id_${parent.name} (FK)`, attr.name]
          });
        }
      }
    });
    
    return novasTabelas;
  };

  const gerarModeloLogico = () => {
    const novasTabelas = helperGerarTabelas(elements, connections);
    const novasConexoes: Connection[] = [];
    
    const newTab: Tab = {
      id: uuidv4(),
      name: `Lógico (${activeTab?.name})`,
      mode: DiagramMode.LOGICO,
      elements: novasTabelas,
      connections: novasConexoes
    };
    
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const selectedElement = elements.find(el => el.id === selectedId);
  const selectedConnection = connections.find(c => c.id === selectedId);

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-[#E4E3E0] flex flex-col items-center justify-center z-50">
        <div className="w-32 h-32 sm:w-48 sm:h-48 flex items-center justify-center animate-pulse">
          <img src={import.meta.env.VITE_APP_TYPE === 'server' ? "./icone-server.svg" : "./icone.svg"} alt="Logo" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <div className="w-full h-full bg-[#141414]/10 border-2 border-dashed border-[#141414]/20 rounded-2xl flex items-center justify-center absolute -z-10">
          </div>
        </div>
      </div>
    );
  }

  const sidebarWidth = "w-12 sm:w-16 landscape:w-10";
  const logoWidth = "w-[78px]";
  const logoHeight = "h-[48px]";
  const headerMarginLeft = "ml-[78px]";
  const sidebarMarginTop = "mt-0";

  return (
    <div className="flex flex-col h-screen bg-[#E4E3E0] text-[#141414] font-sans overflow-hidden relative">
      {/* Caixa da Logo (Absoluta) */}
      <div className={cn(
        "absolute top-0 left-0 bg-white z-[80] flex items-center justify-start drag-region pl-0",
        logoWidth,
        logoHeight
      )}>
        <img 
          src="./logo.svg" 
          alt="BrModelo-R Logo" 
          className="w-full h-full object-contain scale-[2.0] origin-left ml-[-32px] mt-[10px]"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fallback if logo.svg is missing
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* Painel Superior (Header) */}
      <div className={cn("flex h-12 bg-white shrink-0 z-50 drag-region", headerMarginLeft)}>
        {/* Header (Continuação do Painel Superior) */}
        <header className={cn(
          "flex-1 bg-white transition-all overflow-x-auto overflow-y-hidden custom-scrollbar flex items-center px-4",
          !isDesktopMode && "px-2"
        )}>
          {isDesktopMode ? (
            <>
              <div className="flex items-center h-full min-w-max no-drag">
                <div 
                  ref={tabsContainerRef}
                  className="flex items-center gap-1 h-full shrink-0 mx-2"
                >
                  {tabs.map(tab => (
                    <div 
                      key={tab.id}
                      id={`tab-${tab.id}`}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setActiveTabId(tab.id);
                        setSelectedId(null);
                      }}
                      className={cn(
                        "group flex items-center border border-transparent cursor-pointer transition-all font-medium shrink-0 select-none",
                        "gap-2 px-3 py-[2px] rounded-t-lg rounded-b-none",
                        activeTabId === tab.id ? "bg-[#E4E3E0] border-[#141414]/20 shadow-sm" : "bg-transparent hover:bg-gray-200/50"
                      )}
                      style={{ 
                        borderTop: tab.color ? `4px solid ${tab.color}` : `4px solid transparent`,
                        color: activeTabId === tab.id ? (tab.fontColor || '#141414') : undefined,
                        fontSize: tab.fontSize ? `${tab.fontSize}px` : undefined
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTabId(tab.id);
                        setSelectedId(null);
                      }}
                    >
                      <span className="truncate max-w-[120px] pointer-events-none">{tab.name}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-0.5"
                      >
                        <MinusCircle className="transition-all w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => addTab()}
                    className="hover:bg-gray-200/50 rounded-full transition-colors ml-1 shrink-0 p-1.5"
                  >
                    <Plus className="transition-all w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1 md:gap-2 shrink-0 h-full transition-all ml-auto no-drag">
                {mode === DiagramMode.CONCEITUAL && (
                  <button 
                    onClick={gerarModeloLogico}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-[#141414] text-white rounded-lg hover:bg-[#333] transition-all shadow-sm text-sm"
                    title={t('mapeamento9Passos')}
                  >
                    <Layers className="w-4 h-4" />
                    <span className="hidden sm:inline font-bold uppercase tracking-wider">{t('mapeamento9Passos')}</span>
                  </button>
                )}

                <select 
                  value={mode} 
                  onChange={(e) => setMode(e.target.value as DiagramMode)}
                  className="bg-[#E4E3E0] font-mono rounded border border-[#141414]/10 focus:outline-none transition-all text-sm px-2 py-1.5"
                >
                  <option value={DiagramMode.CONCEITUAL}>Conceitual</option>
                  <option value={DiagramMode.LOGICO}>Lógico</option>
                </select>

                <div className="w-px h-6 bg-[#141414]/10 mx-1" />
                
                <div className="flex items-center gap-0.5 md:gap-1">
                  <label className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors cursor-pointer" title={t('importJson')}>
                    <FileJson className="w-4 h-4" />
                    <input type="file" accept=".json" onChange={importFromJson} className="hidden" />
                  </label>
                  <button onClick={exportToJson} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title={t('exportJson')}><Download className="w-4 h-4" /></button>
                  
                  {(mode === DiagramMode.CONCEITUAL || mode === DiagramMode.LOGICO) && (
                    <>
                      <button 
                        onClick={() => {
                          const tabelas = elements.filter(el => el.type === ElementType.TABELA).length > 0 
                            ? elements.filter(el => el.type === ElementType.TABELA) 
                            : helperGerarTabelas(elements, connections);
                            
                          const sql = tabelas
                            .map(el => `CREATE TABLE ${el.name} (\n  ${el.fields?.join(' VARCHAR(255),\n  ')} VARCHAR(255)\n);`)
                            .join('\n\n');
                          const blob = new Blob([sql], { type: 'text/plain' });
                          saveAs(blob, 'schema.sql');
                        }} 
                        className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" 
                        title={t('exportSql')}
                      >
                        <span className="text-[10px] font-bold">SQL</span>
                      </button>
                      <button 
                        onClick={() => {
                          const tabelas = elements.filter(el => el.type === ElementType.TABELA).length > 0 
                            ? elements.filter(el => el.type === ElementType.TABELA) 
                            : helperGerarTabelas(elements, connections);

                          const php = `<?php\n\n// Diagrama: ${tabs.find(t => t.id === activeTabId)?.name || 'Export'}\n\n` + 
                            tabelas
                            .map(el => {
                              const className = el.name.charAt(0).toUpperCase() + el.name.slice(1);
                              const props = el.fields?.map(f => `    public $${f.split(' ')[0]};`).join('\n') || '';
                              return `class ${className} {\n${props}\n}`;
                            })
                            .join('\n\n');
                          const blob = new Blob([php], { type: 'text/plain' });
                          saveAs(blob, 'models.php');
                        }} 
                        className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" 
                        title={t('exportPhp')}
                      >
                        <span className="text-[10px] font-bold">PHP</span>
                      </button>
                    </>
                  )}

                  <button onClick={exportToPng} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title={t('exportPng')}><ImageIcon className="w-4 h-4" /></button>
                  <button onClick={exportToSvg} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title={t('exportSvg')}><FileCode className="w-4 h-4" /></button>
                  <button onClick={exportToZip} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title={t('exportZip')}><FileArchive className="w-4 h-4" /></button>
                  
                  <div className="w-px h-6 bg-[#141414]/10 mx-1" />

                  <button onClick={undo} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title="Desfazer"><Undo className="w-4 h-4" /></button>
                  <button onClick={redo} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title="Refazer"><Redo className="w-4 h-4" /></button>
                  
                  <button 
                    onClick={() => {
                      const url = localStorage.getItem('institutionalUrl');
                      if (!url) {
                        alert('Configure a URL do servidor institucional nas Configurações (Aba Armazenamento) primeiro.');
                        return;
                      }
                      if (isCollaborating) {
                        socket?.disconnect();
                        setSocket(null);
                        setIsCollaborating(false);
                        setRoomId('');
                        setRemoteCursors({});
                      } else {
                        const newSocket = io(url);
                        const newRoomId = prompt('Digite o ID da sala para colaborar (ou crie um novo):', uuidv4().substring(0, 8));
                        if (newRoomId) {
                          newSocket.emit('join-room', newRoomId);
                          setSocket(newSocket);
                          setRoomId(newRoomId);
                          setIsCollaborating(true);
                        }
                      }
                    }}
                    className={cn(
                      "p-1.5 md:p-2 rounded-md transition-colors",
                      isCollaborating ? "bg-green-100 text-green-700" : "hover:bg-[#E4E3E0]"
                    )}
                    title={isCollaborating ? "Desconectar Colaboração" : "Iniciar Colaboração"}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsSettingsOpen(true)} 
                    className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors no-drag" 
                    title={t('settings')}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  
                  {/* Window Controls (Electron only) */}
                  {(window as any).electronAPI && (
                    <div className="flex items-center ml-2 border-l border-gray-300 pl-2 gap-1 no-drag">
                      <button 
                        onClick={() => (window as any).electronAPI.minimize()} 
                        className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                        title="Minimizar"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => (window as any).electronAPI.maximize()} 
                        className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                        title="Maximizar"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => (window as any).electronAPI.close()} 
                        className="p-1.5 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                        title="Fechar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className={cn(
              "flex items-center h-full min-w-max transition-all",
              !isHeaderExpanded ? "w-0 opacity-0 pointer-events-none hidden" : ""
            )}>
              <>
                <div 
                  ref={tabsContainerRef}
                  className="flex items-center gap-1 scroll-smooth h-full touch-pan-x shrink-0 mx-2"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {tabs.map(tab => (
                    <div 
                      key={tab.id}
                      id={`tab-${tab.id}`}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setActiveTabId(tab.id);
                        setSelectedId(null);
                      }}
                      className={cn(
                        "group flex items-center border border-transparent cursor-pointer transition-all font-medium shrink-0 select-none",
                        "gap-2 px-4 py-[2px] rounded-t-lg rounded-b-none",
                        activeTabId === tab.id ? "bg-[#E4E3E0] border-[#141414]/20 shadow-sm" : "bg-transparent hover:bg-gray-100"
                      )}
                      style={{ 
                        borderTop: tab.color ? `4px solid ${tab.color}` : `4px solid transparent`,
                        color: activeTabId === tab.id ? (tab.fontColor || '#141414') : undefined,
                        fontSize: tab.fontSize ? `${tab.fontSize}px` : undefined
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTabId(tab.id);
                        setSelectedId(null);
                      }}
                    >
                      <span className="truncate max-w-[80px] sm:max-w-[120px] pointer-events-none">{tab.name}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-0.5"
                      >
                        <MinusCircle className="transition-all w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => addTab()}
                    className="hover:bg-gray-100 rounded-full transition-colors ml-1 shrink-0 p-1.5"
                  >
                    <Plus className="transition-all w-4 h-4" />
                  </button>
                </div>
              
                <div className="flex items-center gap-1 md:gap-2 shrink-0 ml-2 h-full transition-all">
                  {mode === DiagramMode.CONCEITUAL && (
                    <button 
                      onClick={gerarModeloLogico}
                      className="flex items-center gap-1 px-2.5 py-2 bg-[#141414] text-white rounded-lg hover:bg-[#333] transition-all shadow-sm text-xs"
                      title={t('mapeamento9Passos')}
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <select 
                    value={mode} 
                    onChange={(e) => setMode(e.target.value as DiagramMode)}
                    className="bg-[#E4E3E0] font-mono rounded border border-[#141414]/10 focus:outline-none transition-all text-xs px-1 py-1 max-w-[80px] sm:max-w-none"
                  >
                    <option value={DiagramMode.CONCEITUAL}>Conceitual</option>
                    <option value={DiagramMode.LOGICO}>Lógico</option>
                  </select>

                  <div className="w-px h-6 bg-[#141414]/10 mx-1" />
                  
                  <div className="flex items-center gap-0.5 md:gap-1">
                    <label className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors cursor-pointer" title={t('importJson')}>
                      <FileJson className="w-3.5 h-3.5" />
                      <input type="file" accept=".json" onChange={importFromJson} className="hidden" />
                    </label>
                    <button onClick={exportToJson} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title={t('exportJson')}><Download className="w-3.5 h-3.5" /></button>
                    
                    {(mode === DiagramMode.CONCEITUAL || mode === DiagramMode.LOGICO) && (
                      <>
                        <button 
                          onClick={() => {
                            const tabelas = elements.filter(el => el.type === ElementType.TABELA).length > 0 
                              ? elements.filter(el => el.type === ElementType.TABELA) 
                              : helperGerarTabelas(elements, connections);
                            const sql = tabelas
                              .map(el => `CREATE TABLE ${el.name} (\n  ${el.fields?.join(' VARCHAR(255),\n  ')} VARCHAR(255)\n);`)
                              .join('\n\n');
                            const blob = new Blob([sql], { type: 'text/plain' });
                            saveAs(blob, 'schema.sql');
                          }} 
                          className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" 
                          title={t('exportSql')}
                        >
                          <span className="text-[10px] font-bold">SQL</span>
                        </button>
                        <button 
                          onClick={() => {
                            const tabelas = elements.filter(el => el.type === ElementType.TABELA).length > 0 
                              ? elements.filter(el => el.type === ElementType.TABELA) 
                              : helperGerarTabelas(elements, connections);
                            const php = `<?php\n\n// Diagrama: ${tabs.find(t => t.id === activeTabId)?.name || 'Export'}\n\n` + 
                              tabelas
                              .map(el => {
                                const className = el.name.charAt(0).toUpperCase() + el.name.slice(1);
                                const props = el.fields?.map(f => `    public $${f.split(' ')[0]};`).join('\n') || '';
                                return `class ${className} {\n${props}\n}`;
                              })
                              .join('\n\n');
                            const blob = new Blob([php], { type: 'text/plain' });
                            saveAs(blob, 'models.php');
                          }} 
                          className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" 
                          title={t('exportPhp')}
                        >
                          <span className="text-[10px] font-bold">PHP</span>
                        </button>
                      </>
                    )}

                    <button onClick={exportToPng} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title={t('exportPng')}><ImageIcon className="w-3.5 h-3.5" /></button>
                    <button onClick={exportToSvg} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title={t('exportSvg')}><FileCode className="w-3.5 h-3.5" /></button>
                    <button onClick={exportToZip} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title={t('exportZip')}><FileArchive className="w-3.5 h-3.5" /></button>
                    
                    <div className="w-px h-6 bg-[#141414]/10 mx-1 ml-auto" />

                    <button onClick={undo} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title="Desfazer"><Undo className="w-3.5 h-3.5" /></button>
                    <button onClick={redo} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title="Refazer"><Redo className="w-3.5 h-3.5" /></button>
                    
                    {!isDesktopMode && isMobileDevice && (
                      <button 
                        onClick={() => setIsDesktopMode(true)}
                        className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors"
                        title="Modo Desktop"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button 
                      onClick={() => {
                        const url = localStorage.getItem('institutionalUrl');
                        if (!url) {
                          alert('Configure a URL do servidor institucional nas Configurações (Aba Armazenamento) primeiro.');
                          return;
                        }
                        if (isCollaborating) {
                          socket?.disconnect();
                          setSocket(null);
                          setIsCollaborating(false);
                          setRoomId('');
                          setRemoteCursors({});
                        } else {
                          const newSocket = io(url);
                          const newRoomId = prompt('Digite o ID da sala para colaborar (ou crie um novo):', uuidv4().substring(0, 8));
                          if (newRoomId) {
                            newSocket.emit('join-room', newRoomId);
                            setSocket(newSocket);
                            setRoomId(newRoomId);
                            setIsCollaborating(true);
                          }
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] font-bold transition-colors",
                        isCollaborating ? "bg-green-100 text-green-700 hover:bg-green-200" : "hover:bg-[#E4E3E0] text-[#141414]"
                      )}
                      title={isCollaborating ? "Desconectar Colaboração" : "Iniciar Colaboração"}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {isCollaborating ? `Sala: ${roomId}` : "Colaborar"}
                    </button>
                    <button 
                      onClick={() => setIsSettingsOpen(true)} 
                      className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors no-drag" 
                      title={t('settings')}
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            </div>
          )}
        </header>
      
      {/* Mobile Desktop Mode Toggle (Floating) */}
      {!isDesktopMode && isMobileDevice && (
        <button 
          onClick={() => setIsDesktopMode(true)}
          className="fixed bottom-4 right-4 z-[200] bg-[#141414] text-white p-3 rounded-full shadow-lg sm:hidden"
          title="Modo Desktop"
        >
          <Monitor className="w-6 h-6" />
        </button>
      )}
      
      {isDesktopMode && !window.matchMedia('(min-width: 1024px)').matches && (
        <button 
          onClick={() => setIsDesktopMode(false)}
          className="fixed bottom-4 right-4 z-[200] bg-[#141414] text-white p-3 rounded-full shadow-lg"
          title="Modo Mobile"
        >
          <Smartphone className="w-6 h-6" />
        </button>
      )}
      </div>

      {/* Conteúdo Principal (Sidebar + Canvas) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Overlay para fechar sidebars no mobile */}
        {isPropertiesOpen && window.innerWidth < 1024 && (
          <div 
            className="absolute inset-0 bg-black/20 z-10" 
            onClick={() => {
              setIsPropertiesOpen(false);
            }}
          />
        )}

        {/* Barra de Ferramentas (Esquerda) */}
        <aside className={cn(
          "bg-white flex flex-col items-center z-20 shrink-0 transition-all no-scrollbar border-r border-[#141414]/5 overflow-visible",
          sidebarWidth,
          sidebarMarginTop
        )}>
        <div className={cn(
          "flex flex-col items-center gap-2 flex-1 w-full overflow-y-auto no-scrollbar",
          isDesktopMode ? "pt-6 pb-6" : "pt-4 pb-3 sm:pb-6 landscape:pt-4 landscape:pb-2"
        )}>
          <div className="mt-[8px]">
            <ToolButton 
              active={false} 
              onClick={() => setIsDonationModalOpen(true)} 
              icon={<Heart className={cn("transition-all text-black", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} 
              label={t('donate')}
              isDesktopMode={isDesktopMode}
            />
          </div>

          <ToolButton 
            active={tool === 'SELECT'} 
            onClick={() => setTool('SELECT')} 
            icon={<MousePointer2 className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} 
            label={t('select')}
            isDesktopMode={isDesktopMode}
          />

        <ToolButton 
          active={tool === 'CONNECT' || tool === 'CONNECT_DOUBLE' || tool === 'CONNECT_AUTO' || tool === 'CONNECT_HIERARCHY'} 
          onClick={() => {
            if (tool !== 'CONNECT' && tool !== 'CONNECT_DOUBLE' && tool !== 'CONNECT_AUTO' && tool !== 'CONNECT_HIERARCHY') {
              setTool('CONNECT');
            }
          }} 
          icon={
            <div className="relative flex items-center">
              {tool === 'CONNECT_DOUBLE' ? (
                <img src="./botao-re.png" alt="Restrição Total" className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />
              ) : tool === 'CONNECT_AUTO' ? (
                <img src="./botao-auto.png" alt="Auto Relacionamento" className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />
              ) : tool === 'CONNECT_HIERARCHY' ? (
                <img src="./botao-hi.png" alt="Hierarquia" className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />
              ) : (
                <Link2 className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />
              )}
            </div>
          } 
          label={
            tool === 'CONNECT_DOUBLE' ? t('totalParticipation') :
            tool === 'CONNECT_AUTO' ? t('autoRelationship') :
            tool === 'CONNECT_HIERARCHY' ? t('hierarchy') :
            t('connect')
          }
          isDesktopMode={isDesktopMode}
          menu={(close) => (
            <div className="flex flex-col w-48">
              <button className="text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2" onClick={() => { setTool('CONNECT'); close(); }}>
                <Link2 className="w-4 h-4" />
                <span className="text-sm">{t('connect')}</span>
              </button>
              <button className="text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2" onClick={() => { setTool('CONNECT_DOUBLE'); close(); }}>
                <img src="./botao-re.png" alt="Restrição Total" className="w-4 h-4" />
                <span className="text-sm">{t('totalParticipation')}</span>
              </button>
              <button className="text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2" onClick={() => { setTool('CONNECT_AUTO'); close(); }}>
                <img src="./botao-auto.png" alt="Auto Relacionamento" className="w-4 h-4" />
                <span className="text-sm">{t('autoRelationship')}</span>
              </button>
              <button className="text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2" onClick={() => { setTool('CONNECT_HIERARCHY'); close(); }}>
                <img src="./botao-hi.png" alt="Hierarquia" className="w-4 h-4" />
                <span className="text-sm">{t('hierarchy')}</span>
              </button>
            </div>
          )}
        />

        {mode === DiagramMode.CONCEITUAL && (
          <div className="flex flex-col gap-2 flex-1 w-full items-center overflow-y-auto no-scrollbar">
            <ToolButton 
              active={tool === ElementType.ENTIDADE || tool === ElementType.ENTIDADE_FRACA} 
              onClick={() => setTool(ElementType.ENTIDADE)} 
              icon={<Square className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} 
              label={t('entity')} 
              isDesktopMode={isDesktopMode} 
              menu={(close) => (
                <div className="flex flex-col gap-1 p-1">
                  <button
                    onClick={() => { setTool(ElementType.ENTIDADE_FRACA); close(); }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-xs font-bold uppercase tracking-wider",
                      tool === ElementType.ENTIDADE_FRACA ? "bg-[#141414] text-white" : "hover:bg-gray-100 text-[#141414]"
                    )}
                  >
                    <div className="relative">
                      <Square className="w-4 h-4" />
                      <Square className="absolute top-0.5 left-0.5 w-2.5 h-2.5" />
                    </div>
                    {t('weakEntity')}
                  </button>
                </div>
              )}
            />
            <ToolButton 
              active={tool === ElementType.RELACIONAMENTO || tool === ElementType.RELACIONAMENTO_FRACO || tool === ElementType.AGREGACAO} 
              onClick={() => setTool(ElementType.RELACIONAMENTO)} 
              icon={<DiamondIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} 
              label={t('relationship')} 
              isDesktopMode={isDesktopMode} 
              menu={(close) => (
                <div className="flex flex-col gap-1 p-1">
                  <button
                    onClick={() => { setTool(ElementType.RELACIONAMENTO_FRACO); close(); }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-xs font-bold uppercase tracking-wider",
                      tool === ElementType.RELACIONAMENTO_FRACO ? "bg-[#141414] text-white" : "hover:bg-gray-100 text-[#141414]"
                    )}
                  >
                    <div className="relative">
                      <DiamondIcon className="w-4 h-4" />
                      <DiamondIcon className="absolute top-0.5 left-0.5 w-2.5 h-2.5" />
                    </div>
                    {t('weakRelationship')}
                  </button>
                  <button
                    onClick={() => { setTool(ElementType.AGREGACAO); close(); }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-xs font-bold uppercase tracking-wider",
                      tool === ElementType.AGREGACAO ? "bg-[#141414] text-white" : "hover:bg-gray-100 text-[#141414]"
                    )}
                  >
                    <div className="relative">
                      <Square className="w-4 h-4" />
                      <DiamondIcon className="absolute top-0.5 left-0.5 w-2.5 h-2.5" />
                    </div>
                    {t('aggregation')}
                  </button>
                </div>
              )}
            />
            <ToolButton 
              active={[ElementType.ATRIBUTO, ElementType.ATRIBUTO_OPCIONAL, ElementType.ATRIBUTO_DERIVADO, ElementType.ATRIBUTO_MULTIVALORADO, ElementType.ATRIBUTO_COMPOSTO].includes(tool as ElementType)} 
              onClick={() => setTool(ElementType.ATRIBUTO)} 
              icon={
                tool === ElementType.ATRIBUTO_COMPOSTO ? (
                  <img src="./botao-composto.png" alt="Atributo Composto" className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />
                ) : (
                  <Circle className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />
                )
              } 
              label={t('attribute')} 
              isDesktopMode={isDesktopMode} 
              menu={(close) => (
                <div className="flex flex-col gap-1 p-1">
                  <button
                    onClick={() => { setTool(ElementType.ATRIBUTO_OPCIONAL); close(); }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-xs font-bold uppercase tracking-wider",
                      tool === ElementType.ATRIBUTO_OPCIONAL ? "bg-[#141414] text-white" : "hover:bg-gray-100 text-[#141414]"
                    )}
                  >
                    <div className="relative flex items-center justify-center">
                      <Circle className="w-4 h-4" />
                      <span className="absolute text-[5px] font-bold">(0,1)</span>
                    </div>
                    {t('optionalAttribute')}
                  </button>
                  <button
                    onClick={() => { setTool(ElementType.ATRIBUTO_DERIVADO); close(); }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-xs font-bold uppercase tracking-wider",
                      tool === ElementType.ATRIBUTO_DERIVADO ? "bg-[#141414] text-white" : "hover:bg-gray-100 text-[#141414]"
                    )}
                  >
                    <Circle className="w-4 h-4 border-dashed" style={{ strokeDasharray: '3 2' }} />
                    {t('derivedAttribute')}
                  </button>
                  <button
                    onClick={() => { setTool(ElementType.ATRIBUTO_MULTIVALORADO); close(); }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-xs font-bold uppercase tracking-wider",
                      tool === ElementType.ATRIBUTO_MULTIVALORADO ? "bg-[#141414] text-white" : "hover:bg-gray-100 text-[#141414]"
                    )}
                  >
                    <div className="relative flex items-center justify-center">
                      <Circle className="w-4 h-4" />
                      <Circle className="absolute w-2.5 h-2.5" />
                    </div>
                    {t('multivaluedAttribute')}
                  </button>
                  <button
                    onClick={() => { setTool(ElementType.ATRIBUTO_COMPOSTO); close(); }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-xs font-bold uppercase tracking-wider",
                      tool === ElementType.ATRIBUTO_COMPOSTO ? "bg-[#141414] text-white" : "hover:bg-gray-100 text-[#141414]"
                    )}
                  >
                    <img src="./botao-composto.png" alt="Atributo Composto" className="w-4 h-4" />
                    {t('compositeAttribute')}
                  </button>
                </div>
              )}
            />
            <ToolButton 
              active={tool === ElementType.ATRIBUTO_CHAVE || tool === ElementType.ATRIBUTO_CHAVE_PARCIAL} 
              onClick={() => setTool(ElementType.ATRIBUTO_CHAVE)} 
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")}>
                  <circle cx="12" cy="12" r="10" />
                </svg>
              } 
              label={t('keyAttribute')} 
              isDesktopMode={isDesktopMode} 
              menu={(close) => (
                <div className="flex flex-col gap-1 p-1">
                  <button
                    onClick={() => { setTool(ElementType.ATRIBUTO_CHAVE_PARCIAL); close(); }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-xs font-bold uppercase tracking-wider",
                      tool === ElementType.ATRIBUTO_CHAVE_PARCIAL ? "bg-[#141414] text-white" : "hover:bg-gray-100 text-[#141414]"
                    )}
                  >
                    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="w-4 h-4">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M 2 12 A 10 10 0 0 0 22 12 Z" fill="currentColor" stroke="none" />
                    </svg>
                    {t('partialKeyAttribute')}
                  </button>
                </div>
              )}
            />
            <ToolButton active={tool === ElementType.TEXT_BOX} onClick={() => setTool(ElementType.TEXT_BOX)} icon={<TextIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('textBox')} isDesktopMode={isDesktopMode} />
            <ToolButton 
              active={tool === ElementType.CARDINALIDADE && cardinalityMode === '1'} 
              onClick={() => { setCardinalityMode('1'); setTool(ElementType.CARDINALIDADE); }} 
              icon={<span className={cn("font-mono font-bold transition-all", isDesktopMode ? "text-lg" : "text-sm sm:text-lg")}>1</span>} 
              label={t('cardinality') + " 1"} 
              isDesktopMode={isDesktopMode}
            />
            <div className="relative">
              <ToolButton 
                active={tool === ElementType.CARDINALIDADE && cardinalityMode !== '1'} 
                onClick={() => { 
                  if (cardinalityMode === '1') setCardinalityMode('N');
                  setTool(ElementType.CARDINALIDADE); 
                }} 
                icon={<span className={cn("font-mono font-bold transition-all", isDesktopMode ? "text-lg" : "text-sm sm:text-lg")}>{cardinalityMode === '1' ? 'N' : (cardinalityMode || 'N')}</span>} 
                label={t('cardinality')} 
                isDesktopMode={isDesktopMode}
                menu={(close) => (
                  <div className="flex flex-col w-32">
                    {['N', 'M', '(0:0)'].map(val => (
                      <button
                        key={val}
                        onClick={(e) => { 
                          e.stopPropagation();
                          setCardinalityMode(val); 
                          setTool(ElementType.CARDINALIDADE);
                          close();
                        }}
                        className={cn(
                          "w-full px-3 py-2 flex items-center justify-start rounded hover:bg-gray-100 font-mono font-bold text-xs gap-2",
                          cardinalityMode === val && "bg-[#E4E3E0]"
                        )}
                      >
                        <span className="w-8 text-center">{val}</span>
                        <span className="text-[10px] text-gray-400 font-normal">Cardinalidade</span>
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>
            <ToolButton active={tool === ElementType.MAPEAMENTO_9_PASSOS} onClick={() => setTool(ElementType.MAPEAMENTO_9_PASSOS)} icon={<span className={cn("font-mono font-bold transition-all", isDesktopMode ? "text-lg" : "text-sm sm:text-lg")}>9P</span>} label={t('mapeamento9Passos') || "Mapeamento 9 Passos"} isDesktopMode={isDesktopMode} />
            <div className="relative">
              <ToolButton 
                active={tool === ElementType.FREEHAND || tool === ElementType.LINE_DRAWING} 
                onClick={() => setTool(ElementType.FREEHAND)} 
                icon={<PenLine className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} 
                label={"Desenho Livre"} 
                isDesktopMode={isDesktopMode}
                menu={(close) => (
                  <div className="flex flex-col w-32">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation();
                        setTool(ElementType.FREEHAND);
                        close();
                      }}
                      className={cn(
                        "w-full px-3 py-2 flex items-center justify-start rounded hover:bg-gray-100 font-bold text-xs gap-2",
                        tool === ElementType.FREEHAND && "bg-[#E4E3E0]"
                      )}
                    >
                      <PenLine className="w-4 h-4" />
                      <span className="text-[10px] font-normal">Caneta</span>
                    </button>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation();
                        setTool(ElementType.LINE_DRAWING);
                        close();
                      }}
                      className={cn(
                        "w-full px-3 py-2 flex items-center justify-start rounded hover:bg-gray-100 font-bold text-xs gap-2",
                        tool === ElementType.LINE_DRAWING && "bg-[#E4E3E0]"
                      )}
                    >
                      <Minus className="w-4 h-4" />
                      <span className="text-[10px] font-normal">Linha Reta</span>
                    </button>
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {mode === DiagramMode.LOGICO && (
          <div className="flex flex-col gap-2 flex-1 w-full items-center overflow-y-auto no-scrollbar">
            <ToolButton active={tool === ElementType.TABELA} onClick={() => setTool(ElementType.TABELA)} icon={<TableIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('table')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.MAPEAMENTO_9_PASSOS} onClick={() => setTool(ElementType.MAPEAMENTO_9_PASSOS)} icon={<Layers className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('mapeamento9Passos') || "Mapeamento 9 Passos"} isDesktopMode={isDesktopMode} />
          </div>
        )}

        {mode.startsWith('UML') && (
          <div className="flex flex-col gap-2 flex-1 w-full items-center overflow-y-auto no-scrollbar">
            {mode === DiagramMode.UML_CLASSE && (
              <>
                <ToolButton active={tool === ElementType.CLASSE} onClick={() => setTool(ElementType.CLASSE)} icon={<Box className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('class')} isDesktopMode={isDesktopMode} />
                <ToolButton active={tool === ElementType.INTERFACE} onClick={() => setTool(ElementType.INTERFACE)} icon={<div className="relative"><Box className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} /><Zap className={cn("absolute top-1 left-1 transition-all", isDesktopMode ? "w-3 h-3" : "w-2 h-2 sm:w-3 sm:h-3")} /></div>} label={t('interface')} isDesktopMode={isDesktopMode} />
                <ToolButton active={tool === ElementType.ATOR} onClick={() => setTool(ElementType.ATOR)} icon={<Type className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('actor')} isDesktopMode={isDesktopMode} />
                <ToolButton active={tool === ElementType.PACKAGE} onClick={() => setTool(ElementType.PACKAGE)} icon={<Layers className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('package')} isDesktopMode={isDesktopMode} />
              </>
            )}
            {mode === DiagramMode.UML_CASO_USO && (
              <>
                <ToolButton active={tool === ElementType.ATOR} onClick={() => setTool(ElementType.ATOR)} icon={<Type className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('actor')} isDesktopMode={isDesktopMode} />
                <ToolButton active={tool === ElementType.CASO_USO} onClick={() => setTool(ElementType.CASO_USO)} icon={<Circle className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('useCase')} isDesktopMode={isDesktopMode} />
                <ToolButton active={tool === ElementType.SISTEMA} onClick={() => setTool(ElementType.SISTEMA)} icon={<Square className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('system')} isDesktopMode={isDesktopMode} />
              </>
            )}
            {mode === DiagramMode.UML_SEQUENCIA && (
              <>
                <ToolButton active={tool === ElementType.LIFELINE} onClick={() => setTool(ElementType.LIFELINE)} icon={<Minus className={cn("rotate-90 transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('lifeline')} isDesktopMode={isDesktopMode} />
              </>
            )}
            {mode === DiagramMode.UML_ATIVIDADE && (
              <>
                <ToolButton active={tool === ElementType.START_NODE} onClick={() => setTool(ElementType.START_NODE)} icon={<Circle className={cn("fill-current transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('startNode')} isDesktopMode={isDesktopMode} />
                <ToolButton active={tool === ElementType.ACTION} onClick={() => setTool(ElementType.ACTION)} icon={<Square className={cn("rounded-full transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('action')} isDesktopMode={isDesktopMode} />
                <ToolButton active={tool === ElementType.DECISION} onClick={() => setTool(ElementType.DECISION)} icon={<DiamondIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('decision')} isDesktopMode={isDesktopMode} />
                <ToolButton active={tool === ElementType.END_NODE} onClick={() => setTool(ElementType.END_NODE)} icon={<PlusCircle className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 h-5")} />} label={t('endNode')} isDesktopMode={isDesktopMode} />
              </>
            )}
            {mode === DiagramMode.UML_ESTADO && (
              <>
                <ToolButton active={tool === ElementType.STATE} onClick={() => setTool(ElementType.STATE)} icon={<Square className={cn("rounded-lg transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 h-5")} />} label={t('state')} isDesktopMode={isDesktopMode} />
              </>
            )}
          </div>
        )}

        {mode === DiagramMode.TOPOLOGIA && (
          <div className="flex flex-col gap-2 flex-1 w-full items-center overflow-y-auto no-scrollbar py-2">
            <ToolButton active={tool === ElementType.SERVIDOR} onClick={() => setTool(ElementType.SERVIDOR)} icon={<Server className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('server')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.ROTEADOR} onClick={() => setTool(ElementType.ROTEADOR)} icon={<Router className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('router')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.HUB} onClick={() => setTool(ElementType.HUB)} icon={<div className={cn("bg-gray-200 border border-black transition-all", isDesktopMode ? "w-5 h-2" : "w-4 h-1.5 sm:w-5 sm:h-2")} />} label={t('hub')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.SWITCH} onClick={() => setTool(ElementType.SWITCH)} icon={<Minus className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('switch')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.MODEM} onClick={() => setTool(ElementType.MODEM)} icon={<div className={cn("bg-gray-200 border border-black rounded-sm transition-all", isDesktopMode ? "w-5 h-3" : "w-4 h-2.5 sm:w-5 sm:h-3")} />} label={t('modem')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.FIREWALL} onClick={() => setTool(ElementType.FIREWALL)} icon={<WallIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('firewall')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.ACCESS_POINT} onClick={() => setTool(ElementType.ACCESS_POINT)} icon={<Zap className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('accessPoint')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.PC} onClick={() => setTool(ElementType.PC)} icon={<MousePointer2 className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('pc')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.LAPTOP} onClick={() => setTool(ElementType.LAPTOP)} icon={<Box className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('laptop')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.TABLET} onClick={() => setTool(ElementType.TABLET)} icon={<div className={cn("border-2 border-black rounded-sm transition-all", isDesktopMode ? "w-4 h-6" : "w-3 h-5 sm:w-4 sm:h-6")} />} label={t('tablet')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.SMARTPHONE} onClick={() => setTool(ElementType.SMARTPHONE)} icon={<div className={cn("border-2 border-black rounded-sm transition-all", isDesktopMode ? "w-3 h-5" : "w-2.5 h-4 sm:w-3 sm:h-5")} />} label={t('smartphone')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.IMPRESSORA} onClick={() => setTool(ElementType.IMPRESSORA)} icon={<Download className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('printer')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.BANCO_DADOS} onClick={() => setTool(ElementType.BANCO_DADOS)} icon={<Hash className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('database')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.NUVEM} onClick={() => setTool(ElementType.NUVEM)} icon={<ImageIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('cloud')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.TEXT_BOX} onClick={() => setTool(ElementType.TEXT_BOX)} icon={<TextIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('textBox')} isDesktopMode={isDesktopMode} />
          </div>
        )}

        {mode === DiagramMode.PLANTA_BAIXA && (
          <div className="flex flex-col gap-2 flex-1 w-full items-center overflow-y-auto no-scrollbar py-2">
            <ToolButton active={tool === ElementType.PAREDE} onClick={() => setTool(ElementType.PAREDE)} icon={<WallIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('wall')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.PORTA} onClick={() => setTool(ElementType.PORTA)} icon={<DoorOpen className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('door')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.PORTA_DUPLA} onClick={() => setTool(ElementType.PORTA_DUPLA)} icon={<div className="flex"><DoorOpen className={cn("transition-all", isDesktopMode ? "w-3 h-3" : "w-2.5 h-2.5 sm:w-3 sm:h-3")} /><DoorOpen className={cn("transition-all", isDesktopMode ? "w-3 h-3" : "w-2.5 h-2.5 sm:w-3 sm:h-3")} /></div>} label={t('doubleDoor')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.JANELA} onClick={() => setTool(ElementType.JANELA)} icon={<Minus className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('window')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.ESCADA} onClick={() => setTool(ElementType.ESCADA)} icon={<Layers className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('stairs')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.PILAR} onClick={() => setTool(ElementType.PILAR)} icon={<Square className={cn("fill-current transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('pillar')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.PILOTIS} onClick={() => setTool(ElementType.PILOTIS)} icon={<Circle className={cn("fill-current transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('pilotis')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.PIA} onClick={() => setTool(ElementType.PIA)} icon={<Circle className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('sink')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.VASO_SANITARIO} onClick={() => setTool(ElementType.VASO_SANITARIO)} icon={<Circle className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('toilet')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.SOFA} onClick={() => setTool(ElementType.SOFA)} icon={<Box className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('sofa')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.CAMA} onClick={() => setTool(ElementType.CAMA)} icon={<Box className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('bed')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.MESA} onClick={() => setTool(ElementType.MESA)} icon={<Circle className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('tableFurniture')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.CADEIRA} onClick={() => setTool(ElementType.CADEIRA)} icon={<Square className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('chair')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.GELADEIRA} onClick={() => setTool(ElementType.GELADEIRA)} icon={<div className={cn("bg-transparent border border-current transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('fridge')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.FOGAO} onClick={() => setTool(ElementType.FOGAO)} icon={<div className={cn("bg-transparent border border-current grid grid-cols-2 gap-0.5 p-0.5 transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")}><div className="bg-current rounded-full" /><div className="bg-current rounded-full" /><div className="bg-current rounded-full" /><div className="bg-current rounded-full" /></div>} label={t('stove')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.MAQUINA_LAVAR} onClick={() => setTool(ElementType.MAQUINA_LAVAR)} icon={<div className={cn("bg-transparent border border-current flex items-center justify-center transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")}><div className={cn("border border-current rounded-full transition-all", isDesktopMode ? "w-3 h-3" : "w-2.5 h-2.5 sm:w-3 sm:h-3")} /></div>} label={t('washingMachine')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.TOMADA} onClick={() => setTool(ElementType.TOMADA)} icon={<Zap className={cn("transition-all", isDesktopMode ? "w-3 h-3" : "w-2.5 h-2.5 sm:w-3 sm:h-3")} />} label={t('outlet')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.INTERRUPTOR} onClick={() => setTool(ElementType.INTERRUPTOR)} icon={<Circle className={cn("transition-all", isDesktopMode ? "w-3 h-3" : "w-2.5 h-2.5 sm:w-3 sm:h-3")} />} label={t('switchLight')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.QUADRO_ELETRICO} onClick={() => setTool(ElementType.QUADRO_ELETRICO)} icon={<Square className={cn("fill-current transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('electricPanel')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.VENTILACAO} onClick={() => setTool(ElementType.VENTILACAO)} icon={<Zap className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('ventilation')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.EXAUSTAO} onClick={() => setTool(ElementType.EXAUSTAO)} icon={<Zap className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('exhaust')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.CHUVEIRO} onClick={() => setTool(ElementType.CHUVEIRO)} icon={<Circle className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('shower')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.TUBULACAO} onClick={() => setTool(ElementType.TUBULACAO)} icon={<Minus className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('piping')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.TUNEL_VENEZIANO} onClick={() => setTool(ElementType.TUNEL_VENEZIANO)} icon={<Minus className={cn("border-dashed transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('venetianTunnel')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.PISO} onClick={() => setTool(ElementType.PISO)} icon={<Layers className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('floor')} isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.TEXT_BOX} onClick={() => setTool(ElementType.TEXT_BOX)} icon={<TextIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label={t('textBox')} isDesktopMode={isDesktopMode} />
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col items-center gap-2 shrink-0">
          <div className="w-8 h-px bg-[#141414]/20 mb-2" />
          <ToolButton 
            active={tool === ElementType.LEGEND || tool === ElementType.NOTE} 
            onClick={() => setTool(ElementType.LEGEND)} 
            icon={<span className={cn("font-mono font-bold transition-all", isDesktopMode ? "text-lg" : "text-sm sm:text-lg")}>L</span>} 
            label={t('legend')} 
            isDesktopMode={isDesktopMode} 
            menu={(close) => (
              <div className="flex flex-col gap-1 p-1">
                <button
                  onClick={() => { setTool(ElementType.NOTE); close(); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-xs font-bold uppercase tracking-wider",
                    tool === ElementType.NOTE ? "bg-[#141414] text-white" : "hover:bg-gray-100 text-[#141414]"
                  )}
                >
                  <PenLine className="w-4 h-4" />
                  {t('notes')}
                </button>
              </div>
            )}
          />
          <div className="w-8 h-px bg-[#141414]/20 my-2" />
          <button 
            onClick={deleteSelected}
            disabled={!selectedId}
            className={cn(
              "rounded-lg hover:bg-red-100 text-red-600 disabled:opacity-30 transition-all",
              isDesktopMode ? "p-2" : "p-1.5 sm:p-2"
            )}
          >
            <Trash2 className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />
          </button>
        </div>
      </aside>

        {/* Espaço de Trabalho Principal */}
        <main className="flex-1 flex flex-col relative min-w-0">

        {/* Área do Canvas */}
        <div ref={containerRef} className="flex-1 relative bg-[radial-gradient(#14141422_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden border-t border-l border-[#141414]">
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            ref={stageRef}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            draggable={tool === 'SELECT'}
            onDragEnd={(e) => {
              if (e.target === stageRef.current) {
                setPosition({ x: e.target.x(), y: e.target.y() });
              }
            }}
            onWheel={handleWheel}
            onTouchMove={handleTouchMove}
            onClick={(e) => {
              handleCanvasClick(e);
              closeContextMenu();
            }}
            onTap={(e) => {
              handleCanvasClick(e);
              closeContextMenu();
            }}
            onContextMenu={(e) => handleContextMenu(e)}
            onMouseDown={(e) => {
              if (tool === ElementType.FREEHAND || tool === ElementType.LINE_DRAWING) {
                const stage = e.target.getStage();
                if (!stage) return;
                const pos = stage.getPointerPosition();
                if (!pos) return;
                const x = (pos.x - position.x) / scale;
                const y = (pos.y - position.y) / scale;
                setIsDrawing(true);
                const newId = uuidv4();
                const newElement: DiagramElement = {
                  id: newId,
                  type: tool,
                  x: 0,
                  y: 0,
                  points: [x, y],
                  color: drawingColor,
                  strokeWidth: drawingThickness,
                  name: ''
                };
                setElements(prev => [...prev, newElement]);
                setCurrentLine(newElement);
              }
            }}
            onMouseMove={(e) => {
              if (isCollaborating && socket) {
                const stage = e.target.getStage();
                if (stage) {
                  const pointerPosition = stage.getPointerPosition();
                  if (pointerPosition) {
                    const x = (pointerPosition.x - position.x) / scale;
                    const y = (pointerPosition.y - position.y) / scale;
                    socket.emit('cursor-move', { roomId, cursor: { x, y } });
                  }
                }
              }
              if (isDrawing && currentLine) {
                const stage = e.target.getStage();
                if (!stage) return;
                const pos = stage.getPointerPosition();
                if (!pos) return;
                const x = (pos.x - position.x) / scale;
                const y = (pos.y - position.y) / scale;
                
                setElements(prev => prev.map(el => {
                  if (el.id === currentLine.id) {
                    const points = el.points || [];
                    if (tool === ElementType.LINE_DRAWING || (tool === ElementType.FREEHAND && e.evt.shiftKey)) {
                      // Straight line from start to current
                      return { ...el, points: [points[0], points[1], x, y] };
                    } else {
                      // Freehand
                      return { ...el, points: [...points, x, y] };
                    }
                  }
                  return el;
                }));
              }
            }}
            onMouseUp={(e) => {
              if (isDrawing) {
                setIsDrawing(false);
                setCurrentLine(null);
                saveHistory();
              }
            }}
          >
            <Layer>
              {isExporting && (
                <Rect
                  x={-position.x / scale}
                  y={-position.y / scale}
                  width={stageSize.width / scale}
                  height={stageSize.height / scale}
                  fill="#ffffff"
                  listening={false}
                />
              )}
              {guides.map((guide, i) => (
                <Line
                  key={i}
                  points={
                    guide.x !== undefined 
                      ? [guide.x, -5000, guide.x, 5000] 
                      : [-5000, guide.y!, 5000, guide.y!]
                  }
                  stroke="#3b82f6"
                  strokeWidth={1}
                  dash={[5, 5]}
                />
              ))}
              {/* Conexões */}
              {connections.map(conn => {
                const from = elements.find(el => el.id === conn.fromId);
                const to = elements.find(el => el.id === conn.toId);
                if (!from || !to) return null;

                const samePairConns = connections.filter(c => 
                  (c.fromId === conn.fromId && c.toId === conn.toId) || 
                  (c.fromId === conn.toId && c.toId === conn.fromId)
                );
                const connIndex = samePairConns.findIndex(c => c.id === conn.id);
                const totalConns = samePairConns.length;

                const getBoundaryPoint = (el: DiagramElement, other: DiagramElement, offsetIndex: number = 0) => {
                  const width = el.width || (el.type.startsWith('ATRIBUTO') ? 20 : 140);
                  const height = el.height || (el.type.startsWith('ATRIBUTO') ? 20 : 60);
                  const rotation = (el.rotation || 0) * (Math.PI / 180);
                  
                  if (el.type.startsWith('ATRIBUTO')) {
                    const sideX = other.x > el.x ? width / 2 : -width / 2;
                    return { x: el.x + sideX, y: el.y };
                  }

                  // Para múltiplas conexões, calculamos um alvo virtual para criar linhas paralelas
                  let effectiveTargetX = other.x;
                  let effectiveTargetY = other.y;

                  if (totalConns > 1) {
                    const dx = other.x - el.x;
                    const dy = other.y - el.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                      // Vetor normal para o offset
                      let nx = -dy / dist;
                      let ny = dx / dist;
                      
                      // Garantir direção consistente para o par de elementos
                      if (el.id > other.id) {
                        nx = -nx;
                        ny = -ny;
                      }
                      
                      const spacing = conn.isAuto ? 600 : 100; // Larger spacing for auto-relationship
                      const offsetAmount = (offsetIndex - (totalConns - 1) / 2) * spacing;
                      effectiveTargetX += nx * offsetAmount;
                      effectiveTargetY += ny * offsetAmount;
                    }
                  }

                  // Rotacionar o alvo virtual para o sistema de coordenadas local do elemento
                  const dx = effectiveTargetX - el.x;
                  const dy = effectiveTargetY - el.y;
                  
                  const localX = dx * Math.cos(-rotation) - dy * Math.sin(-rotation);
                  const localY = dx * Math.sin(-rotation) + dy * Math.cos(-rotation);
                  
                  const halfW = width / 2;
                  const halfH = height / 2;
                  
                  let localBoundaryX, localBoundaryY;
                  
                  const absX = Math.abs(localX);
                  const absY = Math.abs(localY);

                  if (el.type.startsWith('RELACIONAMENTO')) {
                    // Losango: |x/w| + |y/h| = 1
                    // Usar um scale menor (0.8) para que a linha entre um pouco no losango
                    const scale = 0.8 / (absX / halfW + absY / halfH);
                    localBoundaryX = localX * scale;
                    localBoundaryY = localY * scale;
                  } else {
                    // Retângulo
                    if (absX / halfW > absY / halfH) {
                      localBoundaryX = (localX > 0 ? halfW : -halfW);
                      localBoundaryY = localY * (halfW / absX);
                    } else {
                      localBoundaryX = localX * (halfH / absY);
                      localBoundaryY = (localY > 0 ? halfH : -halfH);
                    }
                  }
                  
                  // Rotacionar de volta para as coordenadas mundiais
                  return {
                    x: el.x + localBoundaryX * Math.cos(rotation) - localBoundaryY * Math.sin(rotation),
                    y: el.y + localBoundaryX * Math.sin(rotation) + localBoundaryY * Math.cos(rotation)
                  };
                };

                let fromPos, toPos;
                if (conn.fromId === conn.toId) {
                  // Auto-loop
                  const width = from.width || (from.type.startsWith('ATRIBUTO') ? 20 : 140);
                  const height = from.height || (from.type.startsWith('ATRIBUTO') ? 20 : 60);
                  const offset = (connIndex - (totalConns - 1) / 2) * 150; // Increased distance between multiple loops
                  
                  // Extremely close loop to point directly to the center
                  let localXFrom = -width / 30 + offset;
                  let localXTo = width / 30 + offset;
                  
                  // Clamp to stay within element bounds
                  localXFrom = Math.max(-width/2 + 2, Math.min(width/2 - 2, localXFrom));
                  localXTo = Math.max(-width/2 + 2, Math.min(width/2 - 2, localXTo));

                  // Start from the top of the element to cross the center and be much longer
                  let localYFrom = -height / 2;
                  let localYTo = -height / 2;

                  if (from.type.startsWith('RELACIONAMENTO') || from.type === ElementType.AGREGACAO) {
                    // For diamonds, start at the top boundary
                    const boundaryY = -(height / 2) * (1 - Math.abs(localXFrom) / (width / 2));
                    localYFrom = boundaryY;
                    localYTo = boundaryY;
                  }

                  const rotation = (from.rotation || 0) * (Math.PI / 180);
                  fromPos = { 
                    x: from.x + localXFrom * Math.cos(rotation) - localYFrom * Math.sin(rotation), 
                    y: from.y + localXFrom * Math.sin(rotation) + localYFrom * Math.cos(rotation) 
                  };
                  toPos = { 
                    x: from.x + localXTo * Math.cos(rotation) - localYTo * Math.sin(rotation), 
                    y: from.y + localXTo * Math.sin(rotation) + localYTo * Math.cos(rotation) 
                  };
                } else {
                  fromPos = getBoundaryPoint(from, to, connIndex);
                  toPos = getBoundaryPoint(to, from, connIndex);
                }

                const isAttributeConn = from.type.startsWith('ATRIBUTO') || to.type.startsWith('ATRIBUTO');
                const isSelected = selectedId === conn.id;
                
                let points = [fromPos.x, fromPos.y, toPos.x, toPos.y];
                let tension = 0;
                let pathData = "";

                let labelX = (fromPos.x + toPos.x) / 2;
                let labelY = (fromPos.y + toPos.y) / 2;

                if (conn.fromId === conn.toId) {
                  // Linhas retas para auto-loop
                  const loopHeight = 250 + connIndex * 100;
                  points = [
                    fromPos.x, fromPos.y, 
                    fromPos.x, fromPos.y + loopHeight, 
                    toPos.x, toPos.y + loopHeight, 
                    toPos.x, toPos.y
                  ];
                  tension = 0;
                } else if (isAttributeConn) {
                  const attr = from.type.startsWith('ATRIBUTO') ? from : to;
                  const other = from.type.startsWith('ATRIBUTO') ? to : from;
                  
                  // L-shape: Vertical from Entity, then Horizontal to Attribute
                  const otherW = other.width || 140;
                  const otherH = other.height || 60;
                  const attrW = attr.width || 20;
                  const attrH = attr.height || 20;

                  // Encontrar todas as conexões de atributos para esta entidade para aplicar offset
                  const otherConns = connections.filter(c => c.fromId === other.id || c.toId === other.id);
                  const attrConnsToOther = otherConns.filter(c => {
                    const oid = c.fromId === other.id ? c.toId : c.fromId;
                    const oel = elements.find(el => el.id === oid);
                    return oel?.type.startsWith('ATRIBUTO');
                  });
                  
                  // Ordenar por posição X do atributo para manter consistência
                  attrConnsToOther.sort((a, b) => {
                    const aId = a.fromId === other.id ? a.toId : a.fromId;
                    const bId = b.fromId === other.id ? b.toId : b.fromId;
                    const aEl = elements.find(el => el.id === aId);
                    const bEl = elements.find(el => el.id === bId);
                    return (aEl?.x || 0) - (bEl?.x || 0);
                  });

                  const attrIndex = attrConnsToOther.findIndex(c => c.id === conn.id);
                  const totalAttrConns = attrConnsToOther.length;
                  
                  // Offset horizontal para evitar que todas as linhas saiam do mesmo ponto
                  const spacing = Math.min(20, (otherW - 20) / Math.max(1, totalAttrConns - 1));
                  const offset = totalAttrConns > 1 ? (attrIndex - (totalAttrConns - 1) / 2) * spacing : 0;

                  // Exit point on Entity/Relationship (top or bottom)
                  let exitY;
                  if (other.type === ElementType.RELACIONAMENTO || other.type === ElementType.RELACIONAMENTO_FRACO) {
                    // Diamond shape: y = cy ± (H/2) * (1 - |offset|/(W/2))
                    const hFactor = 1 - Math.abs(offset) / (otherW / 2);
                    exitY = attr.y > other.y ? other.y + (otherH / 2) * hFactor : other.y - (otherH / 2) * hFactor;
                  } else {
                    // Rectangular shape
                    exitY = attr.y > other.y ? other.y + otherH / 2 : other.y - otherH / 2;
                  }
                  
                  const exitPos = { x: other.x + offset, y: exitY };
                  
                  // Entry point on Attribute (left or right)
                  const entryX = attr.x > other.x ? attr.x - attrW / 2 : attr.x + attrW / 2;
                  const entryPos = { x: entryX, y: attr.y };
                  
                  // Corner point (aligned vertically with Entity, horizontally with Attribute)
                  const cornerPos = { x: exitPos.x, y: entryPos.y };
                  
                  // Calcular pontos para o canto arredondado (raio 8)
                  const radius = 8;
                  const distToCorner = Math.abs(exitPos.y - cornerPos.y);
                  const distFromCorner = Math.abs(entryPos.x - cornerPos.x);
                  
                  // Ajustar raio se a distância for muito pequena
                  const actualRadius = Math.min(radius, distToCorner, distFromCorner);
                  
                  const startArc = { 
                    x: cornerPos.x, 
                    y: cornerPos.y + (exitPos.y > cornerPos.y ? actualRadius : -actualRadius) 
                  };
                  const endArc = { 
                    x: cornerPos.x + (entryPos.x > cornerPos.x ? actualRadius : -actualRadius), 
                    y: cornerPos.y 
                  };

                  if (from.type.startsWith('ATRIBUTO')) {
                    // Atributo -> Entidade
                    pathData = `M ${entryPos.x} ${entryPos.y} L ${endArc.x} ${endArc.y} Q ${cornerPos.x} ${cornerPos.y} ${startArc.x} ${startArc.y} L ${exitPos.x} ${exitPos.y}`;
                  } else {
                    // Entidade -> Atributo
                    pathData = `M ${exitPos.x} ${exitPos.y} L ${startArc.x} ${startArc.y} Q ${cornerPos.x} ${cornerPos.y} ${endArc.x} ${endArc.y} L ${entryPos.x} ${entryPos.y}`;
                  }
                } else if (totalConns > 1) {
                  // Linhas retas e paralelas para múltiplas conexões entre os mesmos elementos
                  // fromPos and toPos already have the offset from getBoundaryPoint
                  points = [
                    fromPos.x, 
                    fromPos.y, 
                    toPos.x, 
                    toPos.y
                  ];
                  tension = 0; // Garantir que seja reta
                }

                if (conn.fromId === conn.toId) {
                  const loopHeight = 150 + connIndex * 80;
                  labelY = fromPos.y + loopHeight;
                }

                const multipleConns = connections.filter(c => 
                  (c.fromId === conn.fromId && c.toId === conn.toId) || 
                  (c.fromId === conn.toId && c.toId === conn.fromId)
                );
                const isMultiple = multipleConns.length > 1;
                const connIdxInMultiple = multipleConns.findIndex(c => c.id === conn.id);

                return (
                  <Group 
                    key={conn.id}
                    onClick={(e) => { e.cancelBubble = true; setSelectedId(conn.id); }}
                    onTap={(e) => { e.cancelBubble = true; setSelectedId(conn.id); }}
                  >
                    {pathData ? (
                      <Path
                        data={pathData}
                        stroke={isSelected ? "#3b82f6" : (conn.color || "#141414")}
                        strokeWidth={isSelected ? 3 : 1.5}
                        lineCap="round"
                        lineJoin="round"
                        hitStrokeWidth={10}
                      />
                    ) : (
                      <>
                        {conn.isDouble && (
                          (() => {
                            const dx = toPos.x - fromPos.x;
                            const dy = toPos.y - fromPos.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            const nx = dist > 0 ? -dy / dist : 0;
                            const ny = dist > 0 ? dx / dist : 0;
                            const offset = 3;
                            const p1 = points.map((p, i) => i % 2 === 0 ? p + nx * offset : p + ny * offset);
                            const p2 = points.map((p, i) => i % 2 === 0 ? p - nx * offset : p - ny * offset);
                            return (
                              <>
                                <Line points={p1} stroke={isSelected ? "#3b82f6" : (conn.color || "#141414")} strokeWidth={1.5} tension={tension} lineCap="round" lineJoin="round" />
                                <Line points={p2} stroke={isSelected ? "#3b82f6" : (conn.color || "#141414")} strokeWidth={1.5} tension={tension} lineCap="round" lineJoin="round" />
                              </>
                            );
                          })()
                        )}
                        {conn.isAuto && (
                          (() => {
                            const dx = toPos.x - fromPos.x;
                            const dy = toPos.y - fromPos.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            const nx = dist > 0 ? -dy / dist : 0;
                            const ny = dist > 0 ? dx / dist : 0;
                            const offset = 20; // Increased distance for auto-relationship
                            const p1 = points.map((p, i) => i % 2 === 0 ? p + nx * offset : p + ny * offset);
                            const p2 = points.map((p, i) => i % 2 === 0 ? p - nx * offset : p - ny * offset);
                            return (
                              <>
                                <Line points={p1} stroke={isSelected ? "#3b82f6" : (conn.color || "#141414")} strokeWidth={1.5} tension={tension} lineCap="round" lineJoin="round" />
                                <Line points={p2} stroke={isSelected ? "#3b82f6" : (conn.color || "#141414")} strokeWidth={1.5} tension={tension} lineCap="round" lineJoin="round" />
                              </>
                            );
                          })()
                        )}
                        {conn.isHierarchy && (
                          (() => {
                            const junction = hierarchyJunctions[conn.fromId] || { x: fromPos.x, y: fromPos.y + 80 };
                            const angle = Math.atan2(junction.y - fromPos.y, junction.x - fromPos.x);
                            const baseOffset = 24;
                            const baseCenter = {
                              x: junction.x + Math.cos(angle) * baseOffset,
                              y: junction.y + Math.sin(angle) * baseOffset
                            };
                            
                            // Only draw the Parent -> Junction line once per parent
                            const isFirstHierarchy = connections.findIndex(c => c.fromId === conn.fromId && c.isHierarchy) === connections.findIndex(c => c.id === conn.id);
                            
                            return (
                              <>
                                {isFirstHierarchy && (
                                  <>
                                    <Line
                                      points={[fromPos.x, fromPos.y, junction.x, junction.y]}
                                      stroke={isSelected ? "#3b82f6" : (conn.color || "#141414")}
                                      strokeWidth={1.5}
                                      lineCap="round"
                                      lineJoin="round"
                                    />
                                    <Group 
                                      x={junction.x} 
                                      y={junction.y}
                                      rotation={angle * 180 / Math.PI - 90}
                                    >
                                      <Path
                                        data="M -18 24 L 18 24 L 0 0 Z"
                                        fill="white"
                                        stroke={isSelected ? "#3b82f6" : (conn.color || "#141414")}
                                        strokeWidth={1.5}
                                      />
                                      <Group 
                                        x={25} y={10}
                                        onClick={(e) => { e.cancelBubble = true; setAddingHierarchyChildFrom(conn.fromId); }}
                                        onTap={(e) => { e.cancelBubble = true; setAddingHierarchyChildFrom(conn.fromId); }}
                                      >
                                        <KonvaCircle radius={10} fill="#141414" />
                                        <Text text="+" x={-5} y={-6} fill="white" fontSize={14} fontStyle="bold" />
                                      </Group>
                                    </Group>
                                  </>
                                )}
                                <Line
                                  points={[baseCenter.x, baseCenter.y, toPos.x, toPos.y]}
                                  stroke={isSelected ? "#3b82f6" : (conn.color || "#141414")}
                                  strokeWidth={1.5}
                                  lineCap="round"
                                  lineJoin="round"
                                />
                              </>
                            );
                          })()
                        )}
                        {(!conn.isDouble && !conn.isAuto && !conn.isHierarchy) && (
                          (() => {
                            let finalPoints = points;
                            if (isMultiple) {
                              const dx = toPos.x - fromPos.x;
                              const dy = toPos.y - fromPos.y;
                              const dist = Math.sqrt(dx * dx + dy * dy);
                              const nx = dist > 0 ? -dy / dist : 0;
                              const ny = dist > 0 ? dx / dist : 0;
                              const offset = (connIdxInMultiple - (multipleConns.length - 1) / 2) * 40; // Increased distance for multiple connections
                              finalPoints = points.map((p, i) => i % 2 === 0 ? p + nx * offset : p + ny * offset);
                            }
                            return (
                              <Line
                                points={finalPoints}
                                stroke={isSelected ? "#3b82f6" : (conn.color || "#141414")}
                                strokeWidth={isSelected ? 3 : 1.5}
                                tension={tension}
                                lineCap="round"
                                lineJoin="round"
                                hitStrokeWidth={10}
                              />
                            );
                          })()
                        )}
                      </>
                    )}
                    {conn.label && (
                      <Text
                        text={conn.label}
                        x={labelX}
                        y={labelY - 20}
                        fontSize={12}
                        fontFamily="Inter, sans-serif"
                        fill={conn.color || "#141414"}
                        align="center"
                        verticalAlign="middle"
                        offsetX={50}
                        width={100}
                        fontStyle="italic"
                      />
                    )}
                    {conn.cardinality && (
                      <Text
                        text={conn.cardinality}
                        x={labelX}
                        y={labelY + 5}
                        fontSize={14}
                        fontFamily="Inter, sans-serif"
                        fill={conn.color || "#141414"}
                        align="center"
                        verticalAlign="middle"
                        offsetX={20}
                        width={40}
                        fontStyle="bold"
                      />
                    )}
                  </Group>
                );
              })}

              {/* Elementos */}
              {elements.map(el => {
                const isSelected = selectedId === el.id;
                const onSelect = () => handleElementClick(el.id);
                const onDragEnd = (e: any) => handleDragEnd(el.id, e);
                const onDragMove = (e: any) => handleDragMove(el.id, e);

                if (el.type === ElementType.ENTIDADE || el.type === ElementType.ENTIDADE_FRACA) {
                  return <Entidade key={el.id} element={el} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} onDragMove={onDragMove} onContextMenu={(e) => handleContextMenu(e, el.id)} />;
                }
                if (el.type === ElementType.RELACIONAMENTO || el.type === ElementType.RELACIONAMENTO_FRACO || el.type === ElementType.AGREGACAO) {
                  return <Relacionamento key={el.id} element={el} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} onDragMove={onDragMove} onContextMenu={(e) => handleContextMenu(e, el.id)} />;
                }
                if (el.type.startsWith('ATRIBUTO')) {
                  const conn = connections.find(c => c.fromId === el.id || c.toId === el.id);
                  const otherId = conn ? (conn.fromId === el.id ? conn.toId : conn.fromId) : null;
                  const otherEl = otherId ? elements.find(e => e.id === otherId) : null;
                  const lineOnRight = otherEl ? otherEl.x > el.x : false;
                  return <Atributo key={el.id} element={el} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} onDragMove={onDragMove} lineOnRight={lineOnRight} onAddSubAttribute={(pid) => addElement(ElementType.ATRIBUTO, undefined, undefined, pid)} onContextMenu={(e) => handleContextMenu(e, el.id)} />;
                }
                if (el.type === ElementType.TABELA || el.type === ElementType.CLASSE || el.type === ElementType.INTERFACE) {
                  return <Tabela key={el.id} element={el} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} onDragMove={onDragMove} onContextMenu={(e) => handleContextMenu(e, el.id)} />;
                }
                if (el.type === ElementType.TEXT_BOX) {
                  return <TextBox key={el.id} element={el} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} onDragMove={onDragMove} onContextMenu={(e) => handleContextMenu(e, el.id)} />;
                }
                if (el.type === ElementType.MAPEAMENTO_9_PASSOS) {
                  return <Mapeamento9PassosElement key={el.id} element={el} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} onDragMove={onDragMove} onContextMenu={(e) => handleContextMenu(e, el.id)} allElements={elements} allConnections={connections} onUpdate={(newEl) => updateElementProperty(el.id, 'fields', newEl.fields)} t={t} />;
                }
                if (el.type === ElementType.FREEHAND || el.type === ElementType.LINE_DRAWING) {
                  return (
                    <Line
                      id={el.id}
                      key={el.id}
                      points={el.points || []}
                      stroke={isSelected ? "#3b82f6" : (el.color || "#141414")}
                      strokeWidth={isSelected ? (el.strokeWidth || 2) + 2 : (el.strokeWidth || 2)}
                      tension={el.type === ElementType.FREEHAND ? 0.5 : 0}
                      lineCap="round"
                      lineJoin="round"
                      onClick={onSelect}
                      onTap={onSelect}
                      draggable={tool === 'SELECT'}
                      x={el.x}
                      y={el.y}
                      onDragEnd={(e) => {
                        saveHistory();
                        setElements(prev => prev.map(item => 
                          item.id === el.id ? { ...item, x: e.target.x(), y: e.target.y() } : item
                        ));
                      }}
                    />
                  );
                }
                return <IconElement key={el.id} element={el} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} onDragMove={onDragMove} onContextMenu={(e) => handleContextMenu(e, el.id)} />;
              })}

              {/* 9-Step Mapping Red Dots */}
              {(() => {
                const mapeamentoElement = elements.find(e => e.type === ElementType.MAPEAMENTO_9_PASSOS);
                if (!mapeamentoElement) return null;
                
                const fields = mapeamentoElement.fields || [];
                let currentStep = 0;
                for (let i = 0; i < 9; i++) {
                  if (!fields[i]) {
                    currentStep = i;
                    break;
                  }
                }
                if (fields.length >= 9 && fields[8]) currentStep = 9;
                
                if (currentStep >= 9) return null;
                
                const currentElements = getElementsForStep(currentStep, elements, connections);
                return currentElements.map(el => {
                  let w = el.width || 140;
                  let h = el.height || 60;
                  if (el.type === ElementType.ATOR) { w = 40; h = 60; }
                  if (el.type === ElementType.CASO_USO) { w = 100; h = 50; }
                  if (el.type === ElementType.START_NODE || el.type === ElementType.END_NODE) { w = 30; h = 30; }
                  if (el.type.startsWith('ATRIBUTO')) { w = 16; h = 16; }
                  
                  return (
                    <KonvaCircle
                      key={`dot-global-${el.id}`}
                      x={el.x - w/2 + 10}
                      y={el.y - h/2 + 10}
                      radius={8}
                      fill="#ef4444"
                      shadowBlur={4}
                      shadowColor="#000"
                      shadowOpacity={0.3}
                    />
                  );
                });
              })()}

              {/* Remote Cursors */}
              {Object.entries(remoteCursors).map(([id, cursor]) => (
                <Group key={id} x={cursor.x} y={cursor.y}>
                  <Path
                    data="M0 0 L10 10 L5 10 L0 20 Z"
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
                  <Text
                    text={id.substring(0, 4)}
                    x={12}
                    y={12}
                    fontSize={10}
                    fill="#ef4444"
                    fontStyle="bold"
                  />
                </Group>
              ))}
              {selectedId && tool === 'SELECT' && (
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // limit resize
                    if (newBox.width < 20 || newBox.height < 20) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();

                    // we will reset it back
                    node.scaleX(1);
                    node.scaleY(1);

                    const newWidth = Math.max(20, node.width() * scaleX);
                    const newHeight = Math.max(20, node.height() * scaleY);

                    saveHistory();
                    setElements(prev => prev.map(el => {
                      if (el.id === selectedId) {
                        return {
                          ...el,
                          x: node.x(),
                          y: node.y(),
                          rotation: node.rotation(),
                          width: newWidth,
                          height: newHeight
                        };
                      }
                      return el;
                    }));
                  }}
                />
              )}
            </Layer>
          </Stage>

          {/* Controles de Zoom */}
          <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2 z-30">
            {lastSaved && (
              <div className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-gray-500 border border-gray-200 shadow-sm mb-1">
                Salvo às {lastSaved}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleZoom(1)}
              className="p-3 bg-white border border-[#141414] rounded-full shadow-lg hover:bg-gray-50 transition-all"
              title={t('zoomIn')}
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleZoom(-1)}
              className="p-3 bg-white border border-[#141414] rounded-full shadow-lg hover:bg-gray-50 transition-all"
              title={t('zoomOut')}
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button 
              onClick={resetZoom}
              className="p-3 bg-white border border-[#141414] rounded-full shadow-lg hover:bg-gray-50 transition-all"
              title={t('resetZoom')}
            >
              <Maximize className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setScale(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="p-3 bg-white border border-[#141414] rounded-full shadow-lg hover:bg-gray-50 transition-all"
              title={t('center')}
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Menu de Contexto */}
        {contextMenu.visible && (
          <div 
            className="fixed z-[1000] bg-white border border-[#141414]/10 shadow-xl rounded-lg py-1 w-48 overflow-hidden"
            style={{ top: contextMenu.y + 56, left: contextMenu.x + (isDesktopMode ? 104 : 78) }}
            onMouseLeave={closeContextMenu}
          >
            {contextMenu.targetId ? (
              <>
                <button 
                  onClick={() => { copySelected(); closeContextMenu(); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" /> {t('copy')}
                </button>
                <button 
                  onClick={() => { duplicateSelected(contextMenu.targetId!); closeContextMenu(); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" /> {t('duplicate')}
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button 
                  onClick={() => { deleteSelected(); closeContextMenu(); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> {t('delete')}
                </button>
              </>
            ) : (
              <button 
                onClick={() => { pasteElement(); closeContextMenu(); }}
                disabled={!clipboard}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 disabled:opacity-30"
              >
                <ClipboardIcon className="w-4 h-4" /> {t('paste')}
              </button>
            )}
          </div>
        )}

          {/* Botão para abrir propriedades no mobile/PC */}
          {!isPropertiesOpen && (
            <button 
              onClick={() => setIsPropertiesOpen(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-[#141414] border-r-0 p-2 rounded-l-md shadow-lg z-30 hover:bg-gray-50 transition-all"
              title={t('openProperties')}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Tooltip para Modo Conexão */}
          {(tool === 'CONNECT' || tool === 'CONNECT_DOUBLE' || tool === 'CONNECT_AUTO' || tool === 'CONNECT_HIERARCHY') && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#141414] text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-xl animate-pulse">
              <Link2 className="w-4 h-4" />
              {connectFrom ? 'Selecione o destino' : 'Selecione a origem'}
            </div>
          )}

          {addingHierarchyChildFrom && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#141414] text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-xl animate-pulse">
              <Plus className="w-4 h-4" />
              Selecione a entidade filha para a hierarquia
            </div>
          )}
        </div>
      </main>

      {/* Painel Lateral Direito (Propriedades) */}
      <aside className={cn(
        "bg-white border-l border-[#141414] flex flex-col z-20 overflow-y-auto transition-all duration-300",
        "fixed lg:relative right-0 h-full",
        isPropertiesOpen 
          ? (isDesktopMode ? "w-80 p-6 gap-6 translate-x-0 pointer-events-auto" : "w-64 sm:w-80 p-4 sm:p-6 gap-4 sm:gap-6 translate-x-0 pointer-events-auto") 
          : "w-0 p-0 gap-0 translate-x-full lg:translate-x-0 overflow-hidden border-none pointer-events-none"
      )}>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest opacity-50 flex items-center gap-2">
            <Settings2 className="w-3 h-3" /> {t('properties')}
          </h2>
          <button 
            onClick={() => setIsPropertiesOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            title={t('closeProperties')}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div>
          {tool === ElementType.FREEHAND || tool === ElementType.LINE_DRAWING || (selectedElement && (selectedElement.type === ElementType.FREEHAND || selectedElement.type === ElementType.LINE_DRAWING)) ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-50 border-b border-black/5 pb-2">Propriedades do Desenho</h3>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> Cor da Linha
                  </label>
                  <div className="flex gap-2 flex-wrap items-center mb-2">
                    {['#141414', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
                      <button 
                        key={c}
                        onClick={() => {
                          if (selectedElement && (selectedElement.type === ElementType.FREEHAND || selectedElement.type === ElementType.LINE_DRAWING)) {
                            updateElementProperty(selectedId!, 'color', c);
                          } else {
                            setDrawingColor(c);
                          }
                        }}
                        className={cn(
                          "w-6 h-6 rounded-full border border-black/10 transition-transform",
                          (selectedElement && (selectedElement.type === ElementType.FREEHAND || selectedElement.type === ElementType.LINE_DRAWING) ? selectedElement.color : drawingColor) === c ? "scale-125 border-black" : "hover:scale-110"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                    <Minus className="w-3 h-3" /> Espessura
                  </label>
                  <div className="flex gap-1">
                    <input 
                      type="number" 
                      value={selectedElement && (selectedElement.type === ElementType.FREEHAND || selectedElement.type === ElementType.LINE_DRAWING) ? (selectedElement.strokeWidth || 2) : drawingThickness}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 2;
                        if (selectedElement && (selectedElement.type === ElementType.FREEHAND || selectedElement.type === ElementType.LINE_DRAWING)) {
                          updateElementProperty(selectedId!, 'strokeWidth', val);
                        } else {
                          setDrawingThickness(val);
                        }
                      }}
                      className="w-16 bg-[#E4E3E0] px-2 py-1 rounded border border-[#141414]/10 text-sm focus:outline-none"
                    />
                    <button 
                      onClick={() => {
                        if (selectedElement && (selectedElement.type === ElementType.FREEHAND || selectedElement.type === ElementType.LINE_DRAWING)) {
                          updateElementProperty(selectedId!, 'strokeWidth', (selectedElement.strokeWidth || 2) + 1);
                        } else {
                          setDrawingThickness(prev => prev + 1);
                        }
                      }}
                      className="flex-1 bg-[#E4E3E0] p-1 rounded hover:bg-gray-200 font-bold"
                    >
                      +
                    </button>
                    <button 
                      onClick={() => {
                        if (selectedElement && (selectedElement.type === ElementType.FREEHAND || selectedElement.type === ElementType.LINE_DRAWING)) {
                          updateElementProperty(selectedId!, 'strokeWidth', Math.max(1, (selectedElement.strokeWidth || 2) - 1));
                        } else {
                          setDrawingThickness(prev => Math.max(1, prev - 1));
                        }
                      }}
                      className="flex-1 bg-[#E4E3E0] p-1 rounded hover:bg-gray-200 font-bold"
                    >
                      -
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedElement ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase opacity-50">{t('nameText')}</label>
                <input 
                  type="text" 
                  value={selectedElement.name}
                  onChange={(e) => updateElementProperty(selectedId!, 'name', e.target.value)}
                  className="bg-[#E4E3E0] px-3 py-2 rounded border border-[#141414]/10 text-sm focus:outline-none focus:border-black/20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                    {t('borderColor')}
                  </label>
                </div>
                <div className="flex gap-2 flex-wrap items-center mb-2">
                  {['#141414', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
                    <button 
                      key={c}
                      onClick={() => updateElementProperty(selectedId!, 'color', c)}
                      className={cn(
                        "w-6 h-6 rounded-full border border-black/10 transition-transform",
                        selectedElement.color === c ? "scale-125 border-black" : "hover:scale-110"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <div className="relative">
                    <button 
                      onClick={() => setActiveColorPicker(activeColorPicker === 'border' ? null : 'border')}
                      className={cn(
                        "w-6 h-6 rounded-full border border-black/10 flex items-center justify-center bg-white hover:scale-110 transition-transform relative",
                        activeColorPicker === 'border' && "scale-125 border-black"
                      )}
                      title={t('customColor')}
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span className="absolute -top-1 -right-1 text-[8px] font-bold">+</span>
                    </button>
                    {activeColorPicker === 'border' && (
                      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 p-2 bg-white rounded-lg shadow-xl border border-black/10 w-48">
                        <HexColorPicker 
                          color={selectedElement.color || '#141414'} 
                          onChange={(c) => updateElementProperty(selectedId!, 'color', c)}
                          className="!w-full !h-32"
                        />
                        <button 
                          onClick={() => setActiveColorPicker(null)}
                          className="w-full mt-2 py-1 bg-[#141414] text-white text-[10px] rounded font-bold uppercase"
                        >
                          Fechar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {[ElementType.ENTIDADE, ElementType.ENTIDADE_FRACA, ElementType.RELACIONAMENTO, ElementType.RELACIONAMENTO_FRACO, ElementType.AGREGACAO].includes(selectedElement.type) && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                      {t('fillColor')}
                    </label>
                  </div>
                  <div className="flex gap-2 flex-wrap items-center mb-2">
                    {['#FFFFFF', '#141414', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
                      <button 
                        key={c}
                        onClick={() => updateElementProperty(selectedId!, 'fillColor', c)}
                        className={cn(
                          "w-6 h-6 rounded-full border border-black/10 transition-transform",
                          selectedElement.fillColor === c ? "scale-125 border-black" : "hover:scale-110"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <div className="relative">
                      <button 
                        onClick={() => setActiveColorPicker(activeColorPicker === 'fill' ? null : 'fill')}
                        className={cn(
                          "w-6 h-6 rounded-full border border-black/10 flex items-center justify-center bg-white hover:scale-110 transition-transform relative",
                          activeColorPicker === 'fill' && "scale-125 border-black"
                        )}
                        title={t('customFillColor')}
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span className="absolute -top-1 -right-1 text-[8px] font-bold">+</span>
                      </button>
                      {activeColorPicker === 'fill' && (
                        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 p-2 bg-white rounded-lg shadow-xl border border-black/10 w-48">
                          <HexColorPicker 
                            color={selectedElement.fillColor || '#FFFFFF'} 
                            onChange={(c) => updateElementProperty(selectedId!, 'fillColor', c)}
                            className="!w-full !h-32"
                          />
                          <button 
                            onClick={() => setActiveColorPicker(null)}
                            className="w-full mt-2 py-1 bg-[#141414] text-white text-[10px] rounded font-bold uppercase"
                          >
                            Fechar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                    {t('textColor')}
                  </label>
                </div>
                <div className="flex gap-2 flex-wrap items-center mb-2">
                  {['#141414', '#FFFFFF', '#3b82f6', '#ef4444', '#10b981', '#f59e0b'].map(c => (
                    <button 
                      key={c}
                      onClick={() => updateElementProperty(selectedId!, 'fontColor', c)}
                      className={cn(
                        "w-6 h-6 rounded-full border border-black/10 transition-transform",
                        selectedElement.fontColor === c ? "scale-125 border-black" : "hover:scale-110"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <div className="relative">
                    <button 
                      onClick={() => setActiveColorPicker(activeColorPicker === 'text' ? null : 'text')}
                      className={cn(
                        "w-6 h-6 rounded-full border border-black/10 flex items-center justify-center bg-white hover:scale-110 transition-transform relative",
                        activeColorPicker === 'text' && "scale-125 border-black"
                      )}
                      title={t('customTextColor')}
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span className="absolute -top-1 -right-1 text-[8px] font-bold">+</span>
                    </button>
                    {activeColorPicker === 'text' && (
                      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 p-2 bg-white rounded-lg shadow-xl border border-black/10 w-48">
                        <HexColorPicker 
                          color={selectedElement.fontColor || selectedElement.color || '#141414'} 
                          onChange={(c) => updateElementProperty(selectedId!, 'fontColor', c)}
                          className="!w-full !h-32"
                        />
                        <button 
                          onClick={() => setActiveColorPicker(null)}
                          className="w-full mt-2 py-1 bg-[#141414] text-white text-[10px] rounded font-bold uppercase"
                        >
                          Fechar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase opacity-50">Fonte</label>
                <select 
                  value={selectedElement.fontFamily || 'Inter, sans-serif'}
                  onChange={(e) => updateElementProperty(selectedId!, 'fontFamily', e.target.value)}
                  className="bg-[#E4E3E0] px-3 py-2 rounded border border-[#141414]/10 text-sm focus:outline-none"
                >
                  <option value="Inter, sans-serif">Inter (Padrão)</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="Courier New, monospace">Courier New</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                  <TextIcon className="w-3 h-3" /> {t('fontSize')}
                </label>
                <div className="flex gap-1">
                  <input 
                    type="number" 
                    value={selectedElement.fontSize || ([ElementType.ENTIDADE, ElementType.ENTIDADE_FRACA, ElementType.RELACIONAMENTO, ElementType.RELACIONAMENTO_FRACO, ElementType.AGREGACAO, ElementType.TABELA, ElementType.CLASSE, ElementType.INTERFACE, ElementType.TEXT_BOX, ElementType.CARDINALIDADE].includes(selectedElement.type) ? 14 : 12)}
                    onChange={(e) => updateElementProperty(selectedId!, 'fontSize', parseInt(e.target.value) || 12)}
                    className="w-16 bg-[#E4E3E0] px-2 py-1 rounded border border-[#141414]/10 text-sm focus:outline-none"
                  />
                  <button 
                    onClick={() => {
                      const currentSize = selectedElement.fontSize || ([ElementType.ENTIDADE, ElementType.ENTIDADE_FRACA, ElementType.RELACIONAMENTO, ElementType.RELACIONAMENTO_FRACO, ElementType.AGREGACAO, ElementType.TABELA, ElementType.CLASSE, ElementType.INTERFACE, ElementType.TEXT_BOX, ElementType.CARDINALIDADE].includes(selectedElement.type) ? 14 : 12);
                      updateElementProperty(selectedId!, 'fontSize', currentSize + 1);
                    }}
                    className="flex-1 bg-[#E4E3E0] p-1 rounded hover:bg-gray-200 font-bold"
                  >
                    +
                  </button>
                  <button 
                    onClick={() => {
                      const currentSize = selectedElement.fontSize || ([ElementType.ENTIDADE, ElementType.ENTIDADE_FRACA, ElementType.RELACIONAMENTO, ElementType.RELACIONAMENTO_FRACO, ElementType.AGREGACAO, ElementType.TABELA, ElementType.CLASSE, ElementType.INTERFACE, ElementType.TEXT_BOX, ElementType.CARDINALIDADE].includes(selectedElement.type) ? 14 : 12);
                      updateElementProperty(selectedId!, 'fontSize', Math.max(8, currentSize - 1));
                    }}
                    className="flex-1 bg-[#E4E3E0] p-1 rounded hover:bg-gray-200 font-bold"
                  >
                    -
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                    <RotateCw className="w-3 h-3" /> Rotação
                  </label>
                  <input 
                    type="number" 
                    value={selectedElement.rotation || 0}
                    onChange={(e) => updateElementProperty(selectedId!, 'rotation', parseInt(e.target.value))}
                    className="bg-[#E4E3E0] px-3 py-2 rounded border border-[#141414]/10 text-sm focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                    <Maximize2 className="w-3 h-3" /> {t('size')}
                  </label>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        const scale = 1.1;
                        updateElementProperty(selectedId!, 'width', (selectedElement.width || 100) * scale);
                        updateElementProperty(selectedId!, 'height', (selectedElement.height || 100) * scale);
                      }}
                      className="flex-1 bg-[#E4E3E0] p-1 rounded hover:bg-gray-200"
                    >
                      +
                    </button>
                    <button 
                      onClick={() => {
                        const scale = 0.9;
                        updateElementProperty(selectedId!, 'width', (selectedElement.width || 100) * scale);
                        updateElementProperty(selectedId!, 'height', (selectedElement.height || 100) * scale);
                      }}
                      className="flex-1 bg-[#E4E3E0] p-1 rounded hover:bg-gray-200"
                    >
                      -
                    </button>
                  </div>
                </div>
              </div>

              {(selectedElement.type === ElementType.TABELA || selectedElement.type === ElementType.CLASSE) && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase opacity-50">Campos (um por linha)</label>
                  <textarea 
                    value={selectedElement.fields?.join('\n')}
                    onChange={(e) => updateElementFields(e.target.value)}
                    rows={6}
                    className="bg-[#E4E3E0] px-3 py-2 rounded border border-[#141414]/10 text-xs font-mono focus:outline-none"
                  />
                  <div className="flex gap-2 mt-1">
                    <button 
                      onClick={addTableRow}
                      className="flex-1 bg-[#141414] text-white text-[10px] py-1.5 rounded hover:bg-black transition-colors font-bold uppercase tracking-wider"
                    >
                      + Linha
                    </button>
                    <button 
                      onClick={addTableColumn}
                      className="flex-1 bg-[#141414] text-white text-[10px] py-1.5 rounded hover:bg-black transition-colors font-bold uppercase tracking-wider"
                    >
                      + Coluna
                    </button>
                  </div>
                </div>
              )}

              {selectedElement.type === ElementType.MAPEAMENTO_9_PASSOS && (
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-[10px] font-bold uppercase opacity-50">Preencher Passos</label>
                  {[
                    "1: Entidades Fortes",
                    "2: Entidades Fracas",
                    "3: Relacionamentos 1:1",
                    "4: Relacionamentos 1:N",
                    "5: Relacionamentos M:N",
                    "6: Atributos Multivalorados",
                    "7: Relacionamentos N-ários",
                    "8: Especialização/Generalização",
                    "9: Categorias (Union)"
                  ].map((stepLabel, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold opacity-70">{stepLabel}</label>
                      <input
                        type="text"
                        value={(selectedElement.fields || [])[idx] || ""}
                        onChange={(e) => {
                          const newFields = [...(selectedElement.fields || ["", "", "", "", "", "", "", "", ""])];
                          newFields[idx] = e.target.value;
                          updateElementProperty(selectedElement.id, 'fields', newFields);
                        }}
                        className="w-full bg-[#E4E3E0] border-none rounded-md p-1.5 text-xs font-mono focus:ring-1 focus:ring-black"
                        placeholder="Digite as tabelas geradas..."
                      />
                    </div>
                  ))}
                </div>
              )}

              {selectedElement.type === ElementType.NOTE && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase opacity-50">Conteúdo da Anotação</label>
                  <textarea 
                    value={selectedElement.noteText || ''}
                    onChange={(e) => updateElementProperty(selectedId!, 'noteText', e.target.value)}
                    rows={6}
                    className="bg-[#E4E3E0] px-3 py-2 rounded border border-[#141414]/10 text-xs focus:outline-none"
                    placeholder="Escreva sua anotação aqui..."
                  />
                </div>
              )}

              {selectedElement.type === ElementType.LEGEND && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase opacity-50">Itens da Legenda</label>
                    <button 
                      onClick={addLegendItem}
                      className="text-[10px] bg-[#141414] text-white px-2 py-1 rounded font-bold uppercase tracking-wider hover:bg-black"
                    >
                      + Item
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-4 max-h-64 overflow-y-auto pr-1">
                    {(selectedElement.legendItems || []).map((item) => (
                      <div key={item.id} className="flex flex-col gap-2 p-2 bg-gray-50 rounded border border-black/5">
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={item.label}
                            onChange={(e) => updateLegendItem(item.id, 'label', e.target.value)}
                            className="flex-1 bg-white px-2 py-1 rounded border border-black/10 text-xs focus:outline-none"
                            placeholder="Rótulo"
                          />
                          <button 
                            onClick={() => removeLegendItem(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex gap-1">
                            {['circle', 'square', 'rect', 'diamond', 'line'].map(s => (
                              <button
                                key={s}
                                onClick={() => updateLegendItem(item.id, 'shape', s)}
                                className={cn(
                                  "w-5 h-5 flex items-center justify-center rounded border border-black/10 hover:bg-gray-200 transition-colors",
                                  item.shape === s && "bg-gray-200 border-black"
                                )}
                                title={s}
                              >
                                {s === 'circle' && <div className="w-2 h-2 rounded-full bg-gray-600" />}
                                {s === 'square' && <div className="w-2 h-2 bg-gray-600" />}
                                {s === 'rect' && <div className="w-3 h-1.5 bg-gray-600" />}
                                {s === 'diamond' && <div className="w-2 h-2 bg-gray-600 rotate-45" />}
                                {s === 'line' && <div className="w-3 h-0.5 bg-gray-600" />}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1">
                            {['#141414', '#3b82f6', '#ef4444', '#10b981', '#f59e0b'].map(c => (
                              <button
                                key={c}
                                onClick={() => updateLegendItem(item.id, 'color', c)}
                                className={cn(
                                  "w-4 h-4 rounded-full border border-black/10 transition-transform hover:scale-110",
                                  item.color === c && "ring-1 ring-black ring-offset-1"
                                )}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button 
                  onClick={deleteSelected}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-bold",
                    isDesktopMode ? "py-3" : "py-2 sm:py-3"
                  )}
                >
                  <Trash2 className={cn("transition-all", isDesktopMode ? "w-4 h-4" : "w-3.5 h-3.5 sm:w-4 h-4")} />
                  {t('deleteElement')}
                </button>
              </div>
            </div>
          ) : selectedConnection ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-50 border-b border-black/5 pb-2">{t('connectionProperties')}</h3>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase opacity-50">{t('label')}</label>
                  <input 
                    type="text" 
                    value={selectedConnection.label || ''}
                    onChange={(e) => updateConnectionProperty(selectedId!, 'label', e.target.value)}
                    className="bg-[#E4E3E0] px-3 py-2 rounded border border-[#141414]/10 text-sm focus:outline-none"
                    placeholder="Ex: supervisor"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase opacity-50">Cardinalidade</label>
                  <div className="flex gap-1">
                    {['1', 'N', 'M'].map(val => (
                      <button
                        key={val}
                        onClick={() => updateConnectionProperty(selectedId!, 'cardinality', val)}
                        className={cn(
                          "flex-1 py-2 rounded text-sm font-bold transition-colors",
                          selectedConnection.cardinality === val ? "bg-[#141414] text-white" : "bg-[#E4E3E0] hover:bg-gray-200"
                        )}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> Cor
                  </label>
                  <div className="flex gap-1 flex-wrap">
                    {['#141414', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
                      <button
                        key={c}
                        onClick={() => updateConnectionProperty(selectedId!, 'color', c)}
                        className={cn(
                          "w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110",
                          selectedConnection.color === c && "ring-2 ring-black ring-offset-1"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={deleteSelected}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-bold",
                    isDesktopMode ? "py-3" : "py-2 sm:py-3"
                  )}
                >
                  <Trash2 className={cn("transition-all", isDesktopMode ? "w-4 h-4" : "w-3.5 h-3.5 sm:w-4 h-4")} />
                  {t('deleteConnection')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-50 border-b border-black/5 pb-2">{t('tabSettings')}</h3>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase opacity-50">{t('tabTitle')}</label>
                  <input 
                    type="text" 
                    value={tabs.find(t => t.id === activeTabId)?.name || ''}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, name: newName } : t));
                    }}
                    className="bg-[#E4E3E0] px-3 py-2 rounded border border-[#141414]/10 text-sm focus:outline-none focus:border-black/20"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                      {t('tabColor')}
                    </label>
                  </div>
                  <div className="flex gap-2 flex-wrap items-center mb-2">
                    {['#E4E3E0', '#141414', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
                      <button 
                        key={c}
                        onClick={() => setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, color: c === '#E4E3E0' ? undefined : c } : t))}
                        className={cn(
                          "w-6 h-6 rounded-full border border-black/10 transition-transform",
                          (tabs.find(t => t.id === activeTabId)?.color || '#E4E3E0') === c ? "scale-125 border-black" : "hover:scale-110"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <div className="relative">
                      <button 
                        onClick={() => setActiveColorPicker(activeColorPicker === 'tab' ? null : 'tab')}
                        className={cn(
                          "w-6 h-6 rounded-full border border-black/10 flex items-center justify-center bg-white hover:scale-110 transition-transform relative",
                          activeColorPicker === 'tab' && "scale-125 border-black"
                        )}
                        title={t('customTabColor')}
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span className="absolute -top-1 -right-1 text-[8px] font-bold">+</span>
                      </button>
                      {activeColorPicker === 'tab' && (
                        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 p-2 bg-white rounded-lg shadow-xl border border-black/10 w-48">
                          <HexColorPicker 
                            color={tabs.find(t => t.id === activeTabId)?.color || '#E4E3E0'} 
                            onChange={(c) => setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, color: c } : t))}
                            className="!w-full !h-32"
                          />
                          <button 
                            onClick={() => setActiveColorPicker(null)}
                            className="w-full mt-2 py-1 bg-[#141414] text-white text-[10px] rounded font-bold uppercase"
                          >
                            Fechar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                    <TextIcon className="w-3 h-3" /> {t('tabFontSize')}
                  </label>
                  <div className="flex gap-1">
                    <input 
                      type="number" 
                      value={tabs.find(t => t.id === activeTabId)?.fontSize || 14}
                      onChange={(e) => {
                        const newSize = parseInt(e.target.value) || 14;
                        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, fontSize: newSize } : t));
                      }}
                      className="w-16 bg-[#E4E3E0] px-2 py-1 rounded border border-[#141414]/10 text-sm focus:outline-none"
                    />
                    <button 
                      onClick={() => {
                        const currentSize = tabs.find(t => t.id === activeTabId)?.fontSize || 14;
                        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, fontSize: currentSize + 1 } : t));
                      }}
                      className="flex-1 bg-[#E4E3E0] p-1 rounded hover:bg-gray-200 font-bold"
                    >
                      +
                    </button>
                    <button 
                      onClick={() => {
                        const currentSize = tabs.find(t => t.id === activeTabId)?.fontSize || 14;
                        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, fontSize: Math.max(8, currentSize - 1) } : t));
                      }}
                      className="flex-1 bg-[#E4E3E0] p-1 rounded hover:bg-gray-200 font-bold"
                    >
                      -
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-40 flex flex-col items-center justify-center text-center opacity-30">
                <MousePointer2 className="w-8 h-8 mb-2" />
                <p className="text-xs font-mono">{t('selectElementToViewProperties')}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto space-y-4">
          <div className={cn("bg-[#141414] text-white rounded-xl", isDesktopMode ? "p-4" : "p-3 sm:p-4")}>
            <h3 className="text-xs font-mono uppercase tracking-widest mb-2 opacity-70">Dicas Rápidas</h3>
            <ul className="text-[11px] space-y-2 opacity-90">
              <li>• Arraste para mover</li>
              <li>• Use Conectar para linhas</li>
              <li>• Use abas para múltiplos desenhos</li>
              <li>• Salve a aba atual individualmente</li>
            </ul>
          </div>
        </div>
      </aside>

      {/* Modal de Doação */}
      {isDonationModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                  Apoie o Projeto
                </h3>
                <button 
                  onClick={() => setIsDonationModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                    <img 
                      src="./qrcode.png" 
                      alt="QR Code PIX" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://picsum.photos/seed/qrcode/200/200";
                        (e.target as HTMLImageElement).alt = "Placeholder QR Code";
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    Escaneie o QR Code acima para doar via PIX
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Chave PIX</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm truncate">
                      {pixKey}
                    </div>
                    <button 
                      onClick={copyPixKey}
                      className={cn(
                        "px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-bold text-sm",
                        pixCopied ? "bg-green-500 text-white" : "bg-[#141414] text-white hover:bg-[#333]"
                      )}
                    >
                      {pixCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {pixCopied ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 text-center">
              <p className="text-xs text-gray-400 font-medium">
                Obrigado por ajudar a manter o BrModelo vivo!
              </p>
            </div>
          </div>
        </div>
      )}
      <SettingsMenu 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        isAutosaveEnabled={isAutosaveEnabled}
        setIsAutosaveEnabled={setIsAutosaveEnabled}
        autosaveInterval={autosaveInterval}
        setAutosaveInterval={setAutosaveInterval}
      />
      
      {/* Modal de Primeira Execução */}
      {showFirstRunModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl flex flex-col gap-4">
            <h2 className="text-xl font-bold text-center">Bem-vindo ao BrModelo-R</h2>
            <p className="text-sm text-gray-600 text-center">
              Como você deseja salvar seus projetos?
            </p>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input 
                  type="radio" 
                  name="sync" 
                  value="local" 
                  checked={syncPreference === 'local'}
                  onChange={() => setSyncPreference('local')}
                />
                <div>
                  <div className="font-bold">Uso Local</div>
                  <div className="text-xs text-gray-500">Salvar apenas neste dispositivo.</div>
                </div>
              </label>
              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input 
                  type="radio" 
                  name="sync" 
                  value="cloud" 
                  checked={syncPreference === 'cloud'}
                  onChange={() => setSyncPreference('cloud')}
                />
                <div>
                  <div className="font-bold">Sincronizar (Nuvem/Servidor)</div>
                  <div className="text-xs text-gray-500">Conectar ao Google Drive, OneDrive ou Servidor Local.</div>
                </div>
              </label>
            </div>
            
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Não exibir novamente na próxima vez</span>
            </label>

            <button 
              onClick={() => {
                if (dontShowAgain) {
                  localStorage.setItem('brmodelo_first_run', 'true');
                } else {
                  localStorage.removeItem('brmodelo_first_run');
                }
                localStorage.setItem('brmodelo_sync_pref', syncPreference);
                setShowFirstRunModal(false);
                if (syncPreference === 'cloud') {
                  setShowLoginModal(true);
                }
              }}
              className="bg-[#141414] text-white py-2 rounded-lg font-bold hover:bg-black/80 transition-colors mt-2"
            >
              Confirmar e Iniciar
            </button>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl flex flex-col gap-4">
            <h2 className="text-xl font-bold text-center">Fazer Login</h2>
            <p className="text-sm text-gray-600 text-center">
              Faça login para sincronizar seus projetos na nuvem.
            </p>
            
            <div className="flex flex-col gap-3 mt-2">
              <input 
                id="login-email"
                type="email" 
                placeholder="E-mail" 
                className="p-2 border rounded-lg w-full"
              />
              <input 
                id="login-password"
                type="password" 
                placeholder="Senha" 
                className="p-2 border rounded-lg w-full"
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => setShowLoginModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  const email = (document.getElementById('login-email') as HTMLInputElement)?.value;
                  const password = (document.getElementById('login-password') as HTMLInputElement)?.value;
                  
                  if (!email || !password) {
                    alert("Por favor, preencha e-mail e senha.");
                    return;
                  }

                  try {
                    const response = await fetch('/api/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email, password })
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                      alert(`Login realizado com sucesso! Bem-vindo, ${data.user.email}`);
                      setShowLoginModal(false);
                    } else {
                      alert(data.message || "Erro ao fazer login.");
                    }
                  } catch (err) {
                    alert("Erro ao conectar com o servidor.");
                  }
                }}
                className="flex-1 bg-[#141414] text-white py-2 rounded-lg font-bold hover:bg-black/80 transition-colors"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  </div>
);
}

function ToolButton({ active, onClick, icon, label, isDesktopMode, menu }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isDesktopMode?: boolean, menu?: (close: () => void) => React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.top, left: rect.right + 8 });
    }
  }, [isMenuOpen]);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (menu) {
      setIsMenuOpen(true);
    }
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
    }, 300);
  };

  return (
    <div 
      className="relative group" 
      ref={buttonRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button 
        onClick={(e) => {
          onClick();
          setIsMenuOpen(false);
        }}
        title={label}
        className={cn(
          "transition-all relative group flex-shrink-0",
          isDesktopMode ? "p-3 rounded-xl" : "p-1.5 sm:p-3 rounded-lg sm:rounded-xl landscape:p-1",
          active ? "bg-[#141414] text-white shadow-lg" : "hover:bg-[#E4E3E0] text-[#141414]/60"
        )}
      >
        {icon}
        {!active && (
          <span className={cn(
            "absolute left-14 bg-[#141414] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50",
            isDesktopMode ? "block" : "hidden sm:block"
          )}>
            {label}
          </span>
        )}
      </button>
      {menu && (
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className={cn(
            "absolute -top-1 -right-2 p-1 text-black hover:text-[#141414]/80 z-20 transition-all",
            isMenuOpen && "text-[#141414]"
          )}
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      )}
      {menu && isMenuOpen && createPortal(
        <div 
          ref={menuRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="fixed bg-white border border-[#141414] rounded-lg shadow-xl p-2 z-[9999] min-w-[150px] flex flex-col gap-1"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          {menu(() => setIsMenuOpen(false))}
        </div>,
        document.body
      )}
    </div>
  );
}
