/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Ellipse, Text, Line, Group, Path, Circle as KonvaCircle } from 'react-konva';
import Konva from 'konva';
import { v4 as uuidv4 } from 'uuid';
import { 
  Square, 
  Diamond as DiamondIcon, 
  Circle, 
  Trash2, 
  MousePointer2, 
  Link2,
  Layers,
  Settings2,
  Download,
  Share2,
  Minus,
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
  Maximize2,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import { HexColorPicker } from "react-colorful";

// --- Tipos ---
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
  ATRIBUTO = 'ATRIBUTO',
  ATRIBUTO_CHAVE = 'ATRIBUTO_CHAVE',
  ATRIBUTO_CHAVE_PARCIAL = 'ATRIBUTO_CHAVE_PARCIAL',
  ATRIBUTO_MULTIVALORADO = 'ATRIBUTO_MULTIVALORADO',
  ATRIBUTO_OPCIONAL = 'ATRIBUTO_OPCIONAL',
  ATRIBUTO_COMPOSTO = 'ATRIBUTO_COMPOSTO',
  CARDINALIDADE = 'CARDINALIDADE',
  
  // Lógico
  TABELA = 'TABELA',
  
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
  fontColor?: string;
  fontFamily?: string;
  fontSize?: number;
  name: string;
  fields?: string[]; // Para tabelas/classes
  parentId?: string; // Para atributos compostos
}

interface Connection {
  id: string;
  fromId: string;
  toId: string;
  cardinality?: '1' | 'N' | 'M';
  color?: string;
  label?: string;
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

const Entidade = ({ element, isSelected, onSelect, onDragEnd, onDragMove }: { 
  element: DiagramElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onDragEnd: (e: any) => void,
  onDragMove?: (e: any) => void
}) => {
  const isFraca = element.type === ElementType.ENTIDADE_FRACA;
  const width = element.width || 140;
  const height = element.height || 60;
  const rotation = element.rotation || 0;
  const color = element.color || "#141414";
  const fontColor = element.fontColor || color;
  const fontFamily = element.fontFamily || "Inter, sans-serif";
  const fontSize = element.fontSize || 14;

  return (
    <Group
      x={element.x}
      y={element.y}
      rotation={rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
      offsetX={width / 2}
      offsetY={height / 2}
    >
      <Rect
        width={width}
        height={height}
        fill="#FFFFFF"
        stroke={color}
        strokeWidth={2}
        cornerRadius={8}
        shadowBlur={isSelected ? 10 : 0}
        shadowColor={color}
        shadowOpacity={0.2}
      />
      {isFraca && (
        <Rect
          x={5}
          y={5}
          width={width - 10}
          height={height - 10}
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

const Relacionamento = ({ element, isSelected, onSelect, onDragEnd, onDragMove }: { 
  element: DiagramElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onDragEnd: (e: any) => void,
  onDragMove?: (e: any) => void
}) => {
  const isFraco = element.type === ElementType.RELACIONAMENTO_FRACO;
  const width = element.width || 140;
  const height = element.height || 70;
  const rotation = element.rotation || 0;
  const color = element.color || "#141414";
  const fontColor = element.fontColor || color;
  const fontFamily = element.fontFamily || "Inter, sans-serif";
  const fontSize = element.fontSize || 12;

  return (
    <Group
      x={element.x}
      y={element.y}
      rotation={rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
      offsetX={width / 2}
      offsetY={height / 2}
    >
      <Line
        points={[0, height / 2, width / 2, 0, width, height / 2, width / 2, height]}
        closed
        fill="#FFFFFF"
        stroke={color}
        strokeWidth={2}
        shadowBlur={isSelected ? 10 : 0}
        shadowColor={color}
        shadowOpacity={0.2}
      />
      {isFraco && (
        <Line
          points={[10, height / 2, width / 2, 10, width - 10, height / 2, width / 2, height - 10]}
          closed
          stroke={color}
          strokeWidth={1}
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

const Atributo = ({ element, isSelected, onSelect, onDragEnd, onDragMove, onAddSubAttribute, lineOnRight }: { 
  element: DiagramElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onDragEnd: (e: any) => void,
  onDragMove?: (e: any) => void,
  onAddSubAttribute?: (parentId: string) => void,
  lineOnRight?: boolean
}) => {
  const isMultivalorado = element.type === ElementType.ATRIBUTO_MULTIVALORADO;
  const isChave = element.type === ElementType.ATRIBUTO_CHAVE;
  const isChaveParcial = element.type === ElementType.ATRIBUTO_CHAVE_PARCIAL;
  const isOpcional = element.type === ElementType.ATRIBUTO_OPCIONAL;
  const isComposto = element.type === ElementType.ATRIBUTO_COMPOSTO;
  
  const color = element.color || "#141414";
  const fontColor = element.fontColor || color;
  const fontFamily = element.fontFamily || "Inter, sans-serif";
  const fontSize = element.fontSize || 12;
  const rotation = element.rotation || 0;
  const width = element.width || 20;
  const scale = width / 20;

  return (
    <Group
      x={element.x}
      y={element.y}
      rotation={rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
    >
      {/* Símbolo do Atributo (Escalado) */}
      <Group scaleX={scale} scaleY={scale}>
        {isComposto ? (
          <Group>
            {/* Ícone de Atributo Composto (Círculo com botão de adicionar) */}
            <KonvaCircle radius={8} stroke={color} strokeWidth={1.5} fill="#FFFFFF" />
            
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
              fill={isChave ? color : "#FFFFFF"}
              stroke={color}
              strokeWidth={1.5}
              shadowBlur={isSelected ? 10 : 0}
              shadowColor={color}
              shadowOpacity={0.2}
            />
            {isChaveParcial && (
              <Group>
                {/* Círculo meio preenchido */}
                <Rect
                  x={-8}
                  y={0}
                  width={16}
                  height={8}
                  fill={color}
                  clipFunc={(ctx) => {
                    ctx.arc(0, 0, 8, 0, Math.PI, false);
                  }}
                />
              </Group>
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
        {isOpcional && (
          <KonvaCircle
            radius={8}
            stroke={color}
            strokeWidth={1}
            dash={[2, 2]}
          />
        )}
        {isChaveParcial && (
          <Line
            points={[-8, 12, 8, 12]}
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

const TextBox = ({ element, isSelected, onSelect, onDragEnd, onDragMove }: { 
  element: DiagramElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onDragEnd: (e: any) => void,
  onDragMove?: (e: any) => void
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
      x={element.x}
      y={element.y}
      rotation={rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onDragMove={onDragMove}
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

const Tabela = ({ element, isSelected, onSelect, onDragEnd, onDragMove }: { 
  element: DiagramElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onDragEnd: (e: any) => void,
  onDragMove?: (e: any) => void
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

const IconElement = ({ element, isSelected, onSelect, onDragEnd, onDragMove }: { 
  element: DiagramElement, 
  isSelected: boolean, 
  onSelect: () => void,
  onDragEnd: (e: any) => void,
  onDragMove?: (e: any) => void
}) => {
  const rotation = element.rotation || 0;
  const width = element.width || 40;
  const height = element.height || 40;
  const scale = width / 40;

  const renderIcon = () => {
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
      case ElementType.ATOR: return <Group><KonvaCircle y={-20} radius={10} stroke="#141414" strokeWidth={2} /><Line points={[0, -10, 0, 10, -10, 25, 0, 10, 10, 25, 0, 10, 0, 0, -10, 0, 0, 0, 10, 0]} stroke="#141414" strokeWidth={2} /></Group>;
      case ElementType.CASO_USO: return <Ellipse radiusX={50} radiusY={25} fill="#ffffff" stroke="#141414" strokeWidth={2} />;
      case ElementType.ACTION: return <Rect width={100} height={40} cornerRadius={20} fill="#ffffff" stroke="#141414" strokeWidth={2} />;
      case ElementType.DECISION: return <Line points={[0, 25, 25, 0, 50, 25, 25, 50]} closed fill="#ffffff" stroke="#141414" strokeWidth={2} />;
      case ElementType.START_NODE: return <KonvaCircle radius={15} fill="#141414" />;
      case ElementType.END_NODE: return <Group><KonvaCircle radius={15} stroke="#141414" strokeWidth={2} /><KonvaCircle radius={10} fill="#141414" /></Group>;
      case ElementType.STATE: return <Rect width={100} height={50} cornerRadius={10} fill="#ffffff" stroke="#141414" strokeWidth={2} />;
      case ElementType.LIFELINE: return <Group><Rect width={80} height={40} fill="#ffffff" stroke="#141414" strokeWidth={2} /><Line points={[40, 40, 40, 200]} stroke="#141414" strokeWidth={1} dash={[5, 5]} /></Group>;
      case ElementType.PACKAGE: return <Group><Rect width={100} height={70} fill="#ffffff" stroke="#141414" strokeWidth={2} /><Rect y={-15} width={40} height={15} fill="#ffffff" stroke="#141414" strokeWidth={2} /></Group>;
      case ElementType.NOTE: return <Group><Rect width={100} height={60} fill="#fff9c4" stroke="#141414" strokeWidth={1} /><Line points={[80, 0, 100, 20, 80, 20]} closed fill="#ffffff" stroke="#141414" strokeWidth={1} /></Group>;
      case ElementType.CARDINALIDADE: return <Group><Text text={element.name} x={-20} y={-20} width={40} height={40} align="center" verticalAlign="middle" fontSize={element.fontSize || 14} fontFamily={element.fontFamily || "Inter, sans-serif"} fontStyle="bold" fill={element.fontColor || element.color || "#141414"} /></Group>;
      default: return <Rect width={40} height={40} fill="#ffffff" stroke={element.color || "#141414"} strokeWidth={2} />;
    }
  };

  const isCardinality = element.type === ElementType.CARDINALIDADE;

  return (
    <Group
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
      offsetX={20}
      offsetY={20}
    >
      {renderIcon()}
      {!isCardinality && (
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

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: uuidv4(), name: 'Diagrama 1', mode: DiagramMode.CONCEITUAL, elements: [], connections: [] }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<'SELECT' | 'CONNECT' | ElementType>('SELECT');
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [cardinalityMode, setCardinalityMode] = useState<'1' | 'N' | 'M' | null>(null);
  const [showCardinalityMenu, setShowCardinalityMenu] = useState(false);
  const [cardinalityMenuPos, setCardinalityMenuPos] = useState({ top: 0, left: 0 });
  const cardinalityButtonRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth - 320, height: window.innerHeight - 56 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(window.innerWidth >= 1024);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [activeColorPicker, setActiveColorPicker] = useState<'border' | 'text' | 'tab' | null>(null);
  const [history, setHistory] = useState<Tab[][]>([]);
  const [redoStack, setRedoStack] = useState<Tab[][]>([]);
  const [clipboard, setClipboard] = useState<DiagramElement | null>(null);
  const [showSplash, setShowSplash] = useState(true);

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
  const [isDesktopMode, setIsDesktopMode] = useState(false);
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
    const handleResize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    // Adicionar um pequeno delay para garantir que o layout terminou de transicionar
    const timer = setTimeout(handleResize, 350);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [isPropertiesOpen]);

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
    } else if (type.startsWith('RELACIONAMENTO')) {
      width = 140;
      height = 70;
    } else if (type === ElementType.TEXT_BOX) {
      width = 100;
      height = 40;
    } else if (type === ElementType.CARDINALIDADE) {
      width = 40;
      height = 40;
    }

    const newElement: DiagramElement = {
      id: uuidv4(),
      type,
      x: defaultX,
      y: defaultY,
      width,
      height,
      name: type === ElementType.CARDINALIDADE ? (cardinalityMode || 'N') : 
            type === ElementType.TEXT_BOX ? 'Texto' : 
            type.toLowerCase().replace(/_/g, ' '),
      fields: type === ElementType.TABELA || type === ElementType.CLASSE ? ["id (PK)", "nome"] : undefined,
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
    setTool('SELECT');
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
    if (tool === 'CONNECT') {
      if (!connectFrom) {
        setConnectFrom(id);
      } else {
        const newConn: Connection = {
          id: uuidv4(),
          fromId: connectFrom,
          toId: id,
        };
        setConnections([...connections, newConn]);
        setConnectFrom(null);
        setTool('SELECT');
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
      setConnections(prev => prev.filter(c => c.id !== selectedId));
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
      zip.file("info.txt", `Projeto BrModelo F\nTipo: ${mode}\nData: ${new Date().toLocaleString()}`);
      
      const content = await zip.generateAsync({type:"blob"});
      saveAs(content, `projeto_${mode.toLowerCase()}.zip`);
      
      setIsExporting(false);
    }, 100);
  };

  const gerarModeloLogico = () => {
    const novasTabelas: DiagramElement[] = [];
    const novasConexoes: Connection[] = [];
    
    // Mapear Entidades para Tabelas
    elements.filter(el => el.type === ElementType.ENTIDADE || el.type === ElementType.ENTIDADE_FRACA).forEach((ent, i) => {
      const atributos = connections
        .filter(c => c.fromId === ent.id || c.toId === ent.id)
        .map(c => elements.find(el => el.id === (c.fromId === ent.id ? c.toId : c.fromId)))
        .filter(el => el && el.type.startsWith('ATRIBUTO'));
        
      const fields = [
        "id (PK)",
        ...atributos.map(a => a?.name || "campo")
      ];
      
      novasTabelas.push({
        id: ent.id,
        type: ElementType.TABELA,
        x: 100 + (i * 200),
        y: 100,
        name: ent.name,
        fields
      });
    });
    
    setElements(novasTabelas);
    setConnections([]);
    setMode(DiagramMode.LOGICO);
    setSelectedId(null);
  };

  const selectedElement = elements.find(el => el.id === selectedId);
  const selectedConnection = connections.find(c => c.id === selectedId);

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-[#E4E3E0] flex flex-col items-center justify-center z-50">
        <div className="w-32 h-32 sm:w-48 sm:h-48 flex items-center justify-center animate-pulse">
          <img src="/icone.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <div className="w-full h-full bg-[#141414]/10 border-2 border-dashed border-[#141414]/20 rounded-2xl flex items-center justify-center absolute -z-10">
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#E4E3E0] text-[#141414] font-sans overflow-hidden relative">
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
        "bg-white flex flex-col items-center z-20 shrink-0 transition-all no-scrollbar border-r border-[#141414]/5",
        isDesktopMode ? "w-16" : "w-12 sm:w-16 landscape:w-10"
      )}>
        {/* Logo no "L" (Canto Superior Esquerdo) */}
        <div className={cn(
          "flex items-center justify-center shrink-0 border-b border-[#141414]/5 bg-white",
          isDesktopMode ? "h-12 w-16" : "h-10 w-12 sm:w-16 landscape:h-8 landscape:w-10"
        )}>
          <img 
            src="/logo.svg" 
            alt="Logo" 
            className={cn("transition-all object-contain", isDesktopMode ? "w-8 h-8" : "w-6 h-6 sm:w-8 sm:h-8 landscape:w-5 landscape:h-5")} 
            onError={(e) => (e.currentTarget.style.display = 'none')} 
          />
        </div>

        <div className={cn(
          "flex flex-col items-center gap-4 py-6 flex-1 w-full overflow-y-auto no-scrollbar",
          !isDesktopMode && "py-3 sm:py-6 gap-2 sm:gap-4 landscape:py-2 landscape:gap-1"
        )}>
          <ToolButton 
            active={tool === 'SELECT'} 
            onClick={() => setTool('SELECT')} 
            icon={<MousePointer2 className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} 
            label="Selecionar"
            isDesktopMode={isDesktopMode}
          />

        <ToolButton 
          active={tool === 'CONNECT'} 
          onClick={() => setTool('CONNECT')} 
          icon={<Link2 className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} 
          label="Conectar"
          isDesktopMode={isDesktopMode}
        />
        
        <div className="w-8 h-px bg-[#141414]/20 my-2" />

        {mode === DiagramMode.CONCEITUAL && (
          <div className="flex flex-col gap-2 flex-1 w-full items-center overflow-y-auto no-scrollbar py-2">
            <ToolButton active={tool === ElementType.ENTIDADE} onClick={() => setTool(ElementType.ENTIDADE)} icon={<Square className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Entidade" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.ENTIDADE_FRACA} onClick={() => setTool(ElementType.ENTIDADE_FRACA)} icon={<div className="relative"><Square className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} /><Square className={cn("absolute top-1 left-1 transition-all", isDesktopMode ? "w-3 h-3" : "w-2 h-2 sm:w-3 sm:h-3")} /></div>} label="Entidade Fraca" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.RELACIONAMENTO} onClick={() => setTool(ElementType.RELACIONAMENTO)} icon={<DiamondIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Relacionamento" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.RELACIONAMENTO_FRACO} onClick={() => setTool(ElementType.RELACIONAMENTO_FRACO)} icon={<div className="relative"><DiamondIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} /><DiamondIcon className={cn("absolute top-1 left-1 transition-all", isDesktopMode ? "w-3 h-3" : "w-2 h-2 sm:w-3 sm:h-3")} /></div>} label="Rel. Fraco" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.ATRIBUTO} onClick={() => setTool(ElementType.ATRIBUTO)} icon={<Circle className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Atributo" isDesktopMode={isDesktopMode} />
            <ToolButton 
              active={tool === ElementType.ATRIBUTO_CHAVE} 
              onClick={() => setTool(ElementType.ATRIBUTO_CHAVE)} 
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")}>
                  <circle cx="12" cy="12" r="10" />
                </svg>
              } 
              label="Atributo Chave" 
              isDesktopMode={isDesktopMode} 
            />
            <ToolButton 
              active={tool === ElementType.ATRIBUTO_CHAVE_PARCIAL} 
              onClick={() => setTool(ElementType.ATRIBUTO_CHAVE_PARCIAL)} 
              icon={
                <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M 2 12 A 10 10 0 0 0 22 12 Z" fill="currentColor" stroke="none" />
                </svg>
              } 
              label="Chave Parcial" 
              isDesktopMode={isDesktopMode}
            />
            <ToolButton active={tool === ElementType.ATRIBUTO_MULTIVALORADO} onClick={() => setTool(ElementType.ATRIBUTO_MULTIVALORADO)} icon={<div className="relative flex items-center justify-center"><Circle className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} /><Circle className={cn("absolute transition-all", isDesktopMode ? "w-3 h-3" : "w-2 h-2 sm:w-3 sm:h-3")} /></div>} label="Multivalorado" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.ATRIBUTO_OPCIONAL} onClick={() => setTool(ElementType.ATRIBUTO_OPCIONAL)} icon={<Circle className={cn("border-dashed transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Opcional" isDesktopMode={isDesktopMode} />
            <ToolButton 
              active={tool === ElementType.ATRIBUTO_COMPOSTO} 
              onClick={() => setTool(ElementType.ATRIBUTO_COMPOSTO)} 
              icon={
                <div className={cn("relative transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")}>
                  <Circle className={cn("absolute top-0 left-1 transition-all", isDesktopMode ? "w-3 h-3" : "w-2 h-2 sm:w-3 sm:h-3")} />
                  <div className={cn("absolute bg-current transition-all", isDesktopMode ? "top-3 left-2.5 w-px h-2" : "top-2 left-1.5 w-px h-1.5 sm:top-3 sm:left-2.5 sm:w-px sm:h-2")} />
                  <Circle className={cn("absolute bottom-0 left-0 transition-all", isDesktopMode ? "w-2 h-2" : "w-1.5 h-1.5 sm:w-2 sm:h-2")} />
                  <Circle className={cn("absolute bottom-0 right-0 transition-all", isDesktopMode ? "w-2 h-2" : "w-1.5 h-1.5 sm:w-2 sm:h-2")} />
                </div>
              } 
              label="Composto" 
              isDesktopMode={isDesktopMode}
            />
            <ToolButton active={tool === ElementType.TEXT_BOX} onClick={() => setTool(ElementType.TEXT_BOX)} icon={<TextIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Caixa de Texto" isDesktopMode={isDesktopMode} />
            <div className="relative" ref={cardinalityButtonRef}>
              <ToolButton 
                active={tool === ElementType.CARDINALIDADE} 
                onClick={() => {
                  if (cardinalityButtonRef.current) {
                    const rect = cardinalityButtonRef.current.getBoundingClientRect();
                    setCardinalityMenuPos({ top: rect.top, left: rect.right + 8 });
                  }
                  setShowCardinalityMenu(!showCardinalityMenu);
                }} 
                icon={<span className={cn("font-mono font-bold transition-all", isDesktopMode ? "text-lg" : "text-sm sm:text-lg")}>{cardinalityMode || 'N'}</span>} 
                label="Cardinalidade" 
                isDesktopMode={isDesktopMode}
              />
              {showCardinalityMenu && (
                <div 
                  className="fixed bg-white border border-[#141414] rounded-md shadow-lg p-1 flex flex-col gap-1 z-[100]"
                  style={{ top: cardinalityMenuPos.top, left: cardinalityMenuPos.left }}
                >
                  {['1', 'N', 'M'].map(val => (
                    <button
                      key={val}
                      onClick={(e) => { 
                        e.stopPropagation();
                        setCardinalityMode(val as any); 
                        setTool(ElementType.CARDINALIDADE);
                        setShowCardinalityMenu(false); 
                      }}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 font-mono font-bold text-xs",
                        cardinalityMode === val && "bg-[#E4E3E0]"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {mode === DiagramMode.LOGICO && (
          <div className="flex flex-col gap-2 flex-1 w-full items-center overflow-y-auto no-scrollbar py-2">
            <ToolButton active={tool === ElementType.TABELA} onClick={() => setTool(ElementType.TABELA)} icon={<TableIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Tabela" isDesktopMode={isDesktopMode} />
          </div>
        )}

        {mode.startsWith('UML') && (
          <div className="flex flex-col gap-2 flex-1 w-full items-center overflow-y-auto no-scrollbar py-2">
            {mode === DiagramMode.UML_CLASSE && (
              <>
                <ToolButton active={tool === ElementType.CLASSE} onClick={() => setTool(ElementType.CLASSE)} icon={<Box className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Classe" isDesktopMode={isDesktopMode} />
                <ToolButton active={tool === ElementType.INTERFACE} onClick={() => setTool(ElementType.INTERFACE)} icon={<div className="relative"><Box className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} /><Zap className={cn("absolute top-1 left-1 transition-all", isDesktopMode ? "w-3 h-3" : "w-2 h-2 sm:w-3 sm:h-3")} /></div>} label="Interface" isDesktopMode={isDesktopMode} />
                <ToolButton active={tool === ElementType.ATOR} onClick={() => setTool(ElementType.ATOR)} icon={<Type className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Ator" isDesktopMode={isDesktopMode} />
                <ToolButton active={tool === ElementType.PACKAGE} onClick={() => setTool(ElementType.PACKAGE)} icon={<Layers className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Pacote" isDesktopMode={isDesktopMode} />
                <ToolButton active={tool === ElementType.NOTE} onClick={() => setTool(ElementType.NOTE)} icon={<div className={cn("bg-yellow-100 border border-black rounded-sm transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Nota" isDesktopMode={isDesktopMode} />
              </>
            )}
            {mode === DiagramMode.UML_CASO_USO && (
              <>
                <ToolButton active={tool === ElementType.ATOR} onClick={() => setTool(ElementType.ATOR)} icon={<Type className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Ator" isDesktopMode={isDesktopMode} />
                <ToolButton active={tool === ElementType.CASO_USO} onClick={() => setTool(ElementType.CASO_USO)} icon={<Circle className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Caso de Uso" isDesktopMode={isDesktopMode} />
                <ToolButton active={tool === ElementType.SISTEMA} onClick={() => setTool(ElementType.SISTEMA)} icon={<Square className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Sistema" isDesktopMode={isDesktopMode} />
              </>
            )}
            {mode === DiagramMode.UML_SEQUENCIA && (
              <>
                <ToolButton active={tool === ElementType.LIFELINE} onClick={() => setTool(ElementType.LIFELINE)} icon={<Minus className={cn("rotate-90 transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Linha de Vida" isDesktopMode={isDesktopMode} />
              </>
            )}
            {mode === DiagramMode.UML_ATIVIDADE && (
              <>
                <ToolButton active={tool === ElementType.START_NODE} onClick={() => setTool(ElementType.START_NODE)} icon={<Circle className={cn("fill-current transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Início" isDesktopMode={isDesktopMode} />
                <ToolButton active={tool === ElementType.ACTION} onClick={() => setTool(ElementType.ACTION)} icon={<Square className={cn("rounded-full transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Ação" isDesktopMode={isDesktopMode} />
                <ToolButton active={tool === ElementType.DECISION} onClick={() => setTool(ElementType.DECISION)} icon={<DiamondIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Decisão" isDesktopMode={isDesktopMode} />
                <ToolButton active={tool === ElementType.END_NODE} onClick={() => setTool(ElementType.END_NODE)} icon={<PlusCircle className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 h-5")} />} label="Fim" isDesktopMode={isDesktopMode} />
              </>
            )}
            {mode === DiagramMode.UML_ESTADO && (
              <>
                <ToolButton active={tool === ElementType.STATE} onClick={() => setTool(ElementType.STATE)} icon={<Square className={cn("rounded-lg transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 h-5")} />} label="Estado" isDesktopMode={isDesktopMode} />
              </>
            )}
          </div>
        )}

        {mode === DiagramMode.TOPOLOGIA && (
          <div className="flex flex-col gap-2 flex-1 w-full items-center overflow-y-auto no-scrollbar py-2">
            <ToolButton active={tool === ElementType.SERVIDOR} onClick={() => setTool(ElementType.SERVIDOR)} icon={<Server className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Servidor" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.ROTEADOR} onClick={() => setTool(ElementType.ROTEADOR)} icon={<Router className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Roteador" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.HUB} onClick={() => setTool(ElementType.HUB)} icon={<div className={cn("bg-gray-200 border border-black transition-all", isDesktopMode ? "w-5 h-2" : "w-4 h-1.5 sm:w-5 sm:h-2")} />} label="Hub" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.SWITCH} onClick={() => setTool(ElementType.SWITCH)} icon={<Minus className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Switch" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.MODEM} onClick={() => setTool(ElementType.MODEM)} icon={<div className={cn("bg-gray-200 border border-black rounded-sm transition-all", isDesktopMode ? "w-5 h-3" : "w-4 h-2.5 sm:w-5 sm:h-3")} />} label="Modem" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.FIREWALL} onClick={() => setTool(ElementType.FIREWALL)} icon={<WallIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Firewall" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.ACCESS_POINT} onClick={() => setTool(ElementType.ACCESS_POINT)} icon={<Zap className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Access Point" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.PC} onClick={() => setTool(ElementType.PC)} icon={<MousePointer2 className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="PC" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.LAPTOP} onClick={() => setTool(ElementType.LAPTOP)} icon={<Box className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Laptop" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.TABLET} onClick={() => setTool(ElementType.TABLET)} icon={<div className={cn("border-2 border-black rounded-sm transition-all", isDesktopMode ? "w-4 h-6" : "w-3 h-5 sm:w-4 sm:h-6")} />} label="Tablet" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.SMARTPHONE} onClick={() => setTool(ElementType.SMARTPHONE)} icon={<div className={cn("border-2 border-black rounded-sm transition-all", isDesktopMode ? "w-3 h-5" : "w-2.5 h-4 sm:w-3 sm:h-5")} />} label="Smartphone" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.IMPRESSORA} onClick={() => setTool(ElementType.IMPRESSORA)} icon={<Download className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Impressora" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.BANCO_DADOS} onClick={() => setTool(ElementType.BANCO_DADOS)} icon={<Hash className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Banco de Dados" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.NUVEM} onClick={() => setTool(ElementType.NUVEM)} icon={<ImageIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Nuvem" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.TEXT_BOX} onClick={() => setTool(ElementType.TEXT_BOX)} icon={<TextIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Texto" isDesktopMode={isDesktopMode} />
          </div>
        )}

        {mode === DiagramMode.PLANTA_BAIXA && (
          <div className="flex flex-col gap-2 flex-1 w-full items-center overflow-y-auto no-scrollbar py-2">
            <ToolButton active={tool === ElementType.PAREDE} onClick={() => setTool(ElementType.PAREDE)} icon={<WallIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Parede" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.PORTA} onClick={() => setTool(ElementType.PORTA)} icon={<DoorOpen className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Porta" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.PORTA_DUPLA} onClick={() => setTool(ElementType.PORTA_DUPLA)} icon={<div className="flex"><DoorOpen className={cn("transition-all", isDesktopMode ? "w-3 h-3" : "w-2.5 h-2.5 sm:w-3 sm:h-3")} /><DoorOpen className={cn("transition-all", isDesktopMode ? "w-3 h-3" : "w-2.5 h-2.5 sm:w-3 sm:h-3")} /></div>} label="Porta Dupla" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.JANELA} onClick={() => setTool(ElementType.JANELA)} icon={<Minus className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Janela" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.ESCADA} onClick={() => setTool(ElementType.ESCADA)} icon={<Layers className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Escada" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.PILAR} onClick={() => setTool(ElementType.PILAR)} icon={<Square className={cn("fill-current transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Pilar" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.PILOTIS} onClick={() => setTool(ElementType.PILOTIS)} icon={<Circle className={cn("fill-current transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Pilotis" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.PIA} onClick={() => setTool(ElementType.PIA)} icon={<Circle className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Pia" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.VASO_SANITARIO} onClick={() => setTool(ElementType.VASO_SANITARIO)} icon={<Circle className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Vaso Sanitário" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.SOFA} onClick={() => setTool(ElementType.SOFA)} icon={<Box className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Sofá" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.CAMA} onClick={() => setTool(ElementType.CAMA)} icon={<Box className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Cama" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.MESA} onClick={() => setTool(ElementType.MESA)} icon={<Circle className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Mesa" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.CADEIRA} onClick={() => setTool(ElementType.CADEIRA)} icon={<Square className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Cadeira" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.GELADEIRA} onClick={() => setTool(ElementType.GELADEIRA)} icon={<div className={cn("bg-transparent border border-current transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Geladeira" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.FOGAO} onClick={() => setTool(ElementType.FOGAO)} icon={<div className={cn("bg-transparent border border-current grid grid-cols-2 gap-0.5 p-0.5 transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")}><div className="bg-current rounded-full" /><div className="bg-current rounded-full" /><div className="bg-current rounded-full" /><div className="bg-current rounded-full" /></div>} label="Fogão" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.MAQUINA_LAVAR} onClick={() => setTool(ElementType.MAQUINA_LAVAR)} icon={<div className={cn("bg-transparent border border-current flex items-center justify-center transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")}><div className={cn("border border-current rounded-full transition-all", isDesktopMode ? "w-3 h-3" : "w-2.5 h-2.5 sm:w-3 sm:h-3")} /></div>} label="Máquina de Lavar" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.TOMADA} onClick={() => setTool(ElementType.TOMADA)} icon={<Zap className={cn("transition-all", isDesktopMode ? "w-3 h-3" : "w-2.5 h-2.5 sm:w-3 sm:h-3")} />} label="Tomada" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.INTERRUPTOR} onClick={() => setTool(ElementType.INTERRUPTOR)} icon={<Circle className={cn("transition-all", isDesktopMode ? "w-3 h-3" : "w-2.5 h-2.5 sm:w-3 sm:h-3")} />} label="Interruptor" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.QUADRO_ELETRICO} onClick={() => setTool(ElementType.QUADRO_ELETRICO)} icon={<Square className={cn("fill-current transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Quadro Elétrico" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.VENTILACAO} onClick={() => setTool(ElementType.VENTILACAO)} icon={<Zap className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Ventilação" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.EXAUSTAO} onClick={() => setTool(ElementType.EXAUSTAO)} icon={<Zap className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Exaustão" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.CHUVEIRO} onClick={() => setTool(ElementType.CHUVEIRO)} icon={<Circle className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Chuveiro" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.TUBULACAO} onClick={() => setTool(ElementType.TUBULACAO)} icon={<Minus className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Tubulação" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.TUNEL_VENEZIANO} onClick={() => setTool(ElementType.TUNEL_VENEZIANO)} icon={<Minus className={cn("border-dashed transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Túnel Veneziano" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.PISO} onClick={() => setTool(ElementType.PISO)} icon={<Layers className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Piso/Revestimento" isDesktopMode={isDesktopMode} />
            <ToolButton active={tool === ElementType.TEXT_BOX} onClick={() => setTool(ElementType.TEXT_BOX)} icon={<TextIcon className={cn("transition-all", isDesktopMode ? "w-5 h-5" : "w-4 h-4 sm:w-5 sm:h-5")} />} label="Texto" isDesktopMode={isDesktopMode} />
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col items-center gap-2 shrink-0">
          <div className="w-8 h-px bg-[#141414]/20 mb-2" />
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
        <header className={cn(
          "bg-white shrink-0 transition-all overflow-x-auto overflow-y-hidden custom-scrollbar relative z-30 flex items-center h-12 px-4",
          !isDesktopMode && "px-2"
        )}>
          {isDesktopMode ? (
            <div className="flex items-center h-full min-w-max">
              <div className="flex items-center gap-1 h-10 px-2 pt-2">
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
                        "gap-2 px-3 py-1 rounded-t-lg rounded-b-none h-8",
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

              <div className="flex items-center gap-1 md:gap-2 shrink-0 h-full transition-all ml-8">
                {mode === DiagramMode.CONCEITUAL && (
                  <button 
                    onClick={gerarModeloLogico}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-[#141414] text-white rounded-lg hover:bg-[#333] transition-all shadow-sm text-sm"
                    title="Gerar Modelo Lógico"
                  >
                    <TableIcon className="w-4 h-4" />
                    <span className="hidden sm:inline font-bold uppercase tracking-wider">Lógica</span>
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
                  <label className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors cursor-pointer" title="Importar JSON">
                    <FileJson className="w-4 h-4" />
                    <input type="file" accept=".json" onChange={importFromJson} className="hidden" />
                  </label>
                  <button onClick={exportToJson} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title="Exportar JSON"><Download className="w-4 h-4" /></button>
                  
                  {(mode === DiagramMode.CONCEITUAL || mode === DiagramMode.LOGICO) && (
                    <>
                      <button 
                        onClick={() => {
                          const sql = elements
                            .filter(el => el.type === ElementType.TABELA)
                            .map(el => `CREATE TABLE ${el.name} (\n  ${el.fields?.join(',\n  ')}\n);`)
                            .join('\n\n');
                          const blob = new Blob([sql], { type: 'text/plain' });
                          saveAs(blob, 'schema.sql');
                        }} 
                        className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" 
                        title="Exportar SQL"
                      >
                        <span className="text-[10px] font-bold">SQL</span>
                      </button>
                      <button 
                        onClick={() => {
                          const php = `<?php\n\n// Diagrama: ${tabs.find(t => t.id === activeTabId)?.name || 'Export'}\n\n` + 
                            elements
                            .filter(el => el.type === ElementType.TABELA)
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
                        title="Exportar PHP"
                      >
                        <span className="text-[10px] font-bold">PHP</span>
                      </button>
                    </>
                  )}

                  <button onClick={exportToPng} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title="Exportar PNG"><ImageIcon className="w-4 h-4" /></button>
                  <button onClick={exportToZip} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title="Exportar ZIP"><FileArchive className="w-4 h-4" /></button>
                  
                  <div className="w-px h-6 bg-[#141414]/10 mx-1" />
                  
                  <button 
                    onClick={() => setIsDesktopMode(!isDesktopMode)} 
                    className="p-1.5 md:p-2 rounded-md transition-all flex items-center gap-1.5 bg-[#141414] text-white"
                    title="Mudar para Modo Mobile"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span className="text-[10px] font-bold hidden lg:inline">Mobile</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={cn(
              "flex items-center h-full min-w-max transition-all",
              !isHeaderExpanded ? "w-0 opacity-0 pointer-events-none hidden" : ""
            )}>
              <div className="flex items-center gap-2 sm:gap-4 h-10 px-2 pt-2">
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
                        "gap-2 px-4 py-2 rounded-t-lg rounded-b-none h-10",
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
                      title="Gerar Modelo Lógico"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
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
                    <label className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors cursor-pointer" title="Importar JSON">
                      <FileJson className="w-3.5 h-3.5" />
                      <input type="file" accept=".json" onChange={importFromJson} className="hidden" />
                    </label>
                    <button onClick={exportToJson} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title="Exportar JSON"><Download className="w-3.5 h-3.5" /></button>
                    
                    {(mode === DiagramMode.CONCEITUAL || mode === DiagramMode.LOGICO) && (
                      <>
                        <button 
                          onClick={() => {
                            const sql = elements
                              .filter(el => el.type === ElementType.TABELA)
                              .map(el => `CREATE TABLE ${el.name} (\n  ${el.fields?.join(',\n  ')}\n);`)
                              .join('\n\n');
                            const blob = new Blob([sql], { type: 'text/plain' });
                            saveAs(blob, 'schema.sql');
                          }} 
                          className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" 
                          title="Exportar SQL"
                        >
                          <span className="text-[10px] font-bold">SQL</span>
                        </button>
                        <button 
                          onClick={() => {
                            const php = `<?php\n\n// Diagrama: ${tabs.find(t => t.id === activeTabId)?.name || 'Export'}\n\n` + 
                              elements
                              .filter(el => el.type === ElementType.TABELA)
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
                          title="Exportar PHP"
                        >
                          <span className="text-[10px] font-bold">PHP</span>
                        </button>
                      </>
                    )}

                    <button onClick={exportToPng} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title="Exportar PNG"><ImageIcon className="w-3.5 h-3.5" /></button>
                    <button onClick={exportToZip} className="p-1.5 md:p-2 hover:bg-[#E4E3E0] rounded-md transition-colors" title="Exportar ZIP"><FileArchive className="w-3.5 h-3.5" /></button>
                    
                    <div className="w-px h-6 bg-[#141414]/10 mx-1" />
                    
                    <button 
                      onClick={() => setIsDesktopMode(!isDesktopMode)} 
                      className="p-1.5 md:p-2 rounded-md transition-all flex items-center gap-1.5 hover:bg-[#E4E3E0] text-[#141414]/60"
                      title="Mudar para Modo Desktop"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>

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
            onClick={handleCanvasClick}
            onTap={handleCanvasClick}
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
                      
                      const offsetAmount = (offsetIndex - (totalConns - 1) / 2) * 80; // Much more spacing to match example images
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
                  const offset = (connIndex - (totalConns - 1) / 2) * 200;
                  
                  let localXFrom = -width / 4 + offset;
                  let localXTo = width / 4 + offset;
                  let localYFrom = height / 8;
                  let localYTo = height / 8;

                  if (from.type.startsWith('RELACIONAMENTO')) {
                    localYFrom = -height / 2 + (height / width) * Math.abs(localXFrom);
                    localYTo = -height / 2 + (height / width) * Math.abs(localXTo);
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

                if (conn.fromId === conn.toId) {
                  // Linhas retas para auto-loop
                  const loopHeight = 120 + connIndex * 120;
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
                  const dx = toPos.x - fromPos.x;
                  const dy = toPos.y - fromPos.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist > 0) {
                    const nx = -dy / dist;
                    const ny = dx / dist;
                    const offsetAmount = (connIndex - (totalConns - 1) / 2) * 35; // Espaçamento maior para paralelismo
                    
                    points = [
                      fromPos.x, 
                      fromPos.y, 
                      toPos.x, 
                      toPos.y
                    ];
                    tension = 0; // Garantir que seja reta
                  }
                }

                let labelX = (fromPos.x + toPos.x) / 2;
                let labelY = (fromPos.y + toPos.y) / 2;

                if (conn.fromId === conn.toId) {
                  const loopHeight = 120 + connIndex * 80;
                  labelY = fromPos.y + loopHeight;
                }

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
                      <Line
                        points={points}
                        stroke={isSelected ? "#3b82f6" : (conn.color || "#141414")}
                        strokeWidth={isSelected ? 3 : 1.5}
                        tension={tension}
                        lineCap="round"
                        lineJoin="round"
                        hitStrokeWidth={10}
                      />
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
                  return <Entidade key={el.id} element={el} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} onDragMove={onDragMove} />;
                }
                if (el.type === ElementType.RELACIONAMENTO || el.type === ElementType.RELACIONAMENTO_FRACO) {
                  return <Relacionamento key={el.id} element={el} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} onDragMove={onDragMove} />;
                }
                if (el.type.startsWith('ATRIBUTO')) {
                  const conn = connections.find(c => c.fromId === el.id || c.toId === el.id);
                  const otherId = conn ? (conn.fromId === el.id ? conn.toId : conn.fromId) : null;
                  const otherEl = otherId ? elements.find(e => e.id === otherId) : null;
                  const lineOnRight = otherEl ? otherEl.x > el.x : false;
                  return <Atributo key={el.id} element={el} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} onDragMove={onDragMove} lineOnRight={lineOnRight} onAddSubAttribute={(pid) => addElement(ElementType.ATRIBUTO, undefined, undefined, pid)} />;
                }
                if (el.type === ElementType.TABELA || el.type === ElementType.CLASSE || el.type === ElementType.INTERFACE) {
                  return <Tabela key={el.id} element={el} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} onDragMove={onDragMove} />;
                }
                if (el.type === ElementType.TEXT_BOX) {
                  return <TextBox key={el.id} element={el} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} onDragMove={onDragMove} />;
                }
                return <IconElement key={el.id} element={el} isSelected={isSelected} onSelect={onSelect} onDragEnd={onDragEnd} onDragMove={onDragMove} />;
              })}
            </Layer>
          </Stage>

          {/* Controles de Zoom */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-30">
            <button 
              onClick={() => handleZoom(1)}
              className="p-3 bg-white border border-[#141414] rounded-full shadow-lg hover:bg-gray-50 transition-all"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleZoom(-1)}
              className="p-3 bg-white border border-[#141414] rounded-full shadow-lg hover:bg-gray-50 transition-all"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button 
              onClick={resetZoom}
              className="p-3 bg-white border border-[#141414] rounded-full shadow-lg hover:bg-gray-50 transition-all"
              title="Resetar Zoom"
            >
              <Maximize className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setScale(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="p-3 bg-white border border-[#141414] rounded-full shadow-lg hover:bg-gray-50 transition-all"
              title="Centralizar"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Botão para abrir propriedades no mobile/PC */}
          {!isPropertiesOpen && (
            <button 
              onClick={() => setIsPropertiesOpen(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-[#141414] border-r-0 p-2 rounded-l-md shadow-lg z-30 hover:bg-gray-50 transition-all"
              title="Abrir Propriedades"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Tooltip para Modo Conexão */}
          {tool === 'CONNECT' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#141414] text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-xl animate-bounce">
              <Link2 className="w-4 h-4" />
              {connectFrom ? 'Selecione o destino' : 'Selecione a origem'}
            </div>
          )}
        </div>
      </main>

      {/* Painel Lateral Direito (Propriedades) */}
      <aside className={cn(
        "bg-white border-l border-[#141414] flex flex-col z-20 overflow-y-auto transition-all duration-300",
        "fixed lg:relative right-0 h-full",
        isDesktopMode ? "p-6 gap-6" : "p-4 sm:p-6 gap-4 sm:gap-6",
        isPropertiesOpen ? (isDesktopMode ? "w-80 translate-x-0" : "w-64 sm:w-80 translate-x-0") : "w-0 p-0 sm:p-0 translate-x-full lg:w-0 lg:translate-x-0 overflow-hidden border-none"
      )}>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest opacity-50 flex items-center gap-2">
            <Settings2 className="w-3 h-3" /> Propriedades
          </h2>
          <button 
            onClick={() => setIsPropertiesOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            title="Fechar Propriedades"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div>
          {selectedElement ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase opacity-50">Nome / Texto</label>
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
                    Cor da Borda
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
                      title="Cor Customizada"
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

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-1">
                    Cor do Texto
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
                      title="Cor de Texto Customizada"
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
                  <TextIcon className="w-3 h-3" /> Tamanho da Fonte
                </label>
                <div className="flex gap-1">
                  <input 
                    type="number" 
                    value={selectedElement.fontSize || ([ElementType.ENTIDADE, ElementType.ENTIDADE_FRACA, ElementType.RELACIONAMENTO, ElementType.RELACIONAMENTO_FRACO, ElementType.TABELA, ElementType.CLASSE, ElementType.INTERFACE, ElementType.TEXT_BOX, ElementType.CARDINALIDADE].includes(selectedElement.type) ? 14 : 12)}
                    onChange={(e) => updateElementProperty(selectedId!, 'fontSize', parseInt(e.target.value) || 12)}
                    className="w-16 bg-[#E4E3E0] px-2 py-1 rounded border border-[#141414]/10 text-sm focus:outline-none"
                  />
                  <button 
                    onClick={() => {
                      const currentSize = selectedElement.fontSize || ([ElementType.ENTIDADE, ElementType.ENTIDADE_FRACA, ElementType.RELACIONAMENTO, ElementType.RELACIONAMENTO_FRACO, ElementType.TABELA, ElementType.CLASSE, ElementType.INTERFACE, ElementType.TEXT_BOX, ElementType.CARDINALIDADE].includes(selectedElement.type) ? 14 : 12);
                      updateElementProperty(selectedId!, 'fontSize', currentSize + 1);
                    }}
                    className="flex-1 bg-[#E4E3E0] p-1 rounded hover:bg-gray-200 font-bold"
                  >
                    +
                  </button>
                  <button 
                    onClick={() => {
                      const currentSize = selectedElement.fontSize || ([ElementType.ENTIDADE, ElementType.ENTIDADE_FRACA, ElementType.RELACIONAMENTO, ElementType.RELACIONAMENTO_FRACO, ElementType.TABELA, ElementType.CLASSE, ElementType.INTERFACE, ElementType.TEXT_BOX, ElementType.CARDINALIDADE].includes(selectedElement.type) ? 14 : 12);
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
                    <Maximize2 className="w-3 h-3" /> Tamanho
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

              <div className="pt-4">
                <button 
                  onClick={deleteSelected}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-bold",
                    isDesktopMode ? "py-3" : "py-2 sm:py-3"
                  )}
                >
                  <Trash2 className={cn("transition-all", isDesktopMode ? "w-4 h-4" : "w-3.5 h-3.5 sm:w-4 h-4")} />
                  Excluir Elemento
                </button>
              </div>
            </div>
          ) : selectedConnection ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-50 border-b border-black/5 pb-2">Propriedades da Conexão</h3>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase opacity-50">Rótulo (Label)</label>
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
                  Excluir Conexão
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-50 border-b border-black/5 pb-2">Configurações da Aba</h3>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase opacity-50">Título da Aba</label>
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
                      Cor da Aba
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
                        title="Cor de Aba Customizada"
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
                    <TextIcon className="w-3 h-3" /> Tamanho da Fonte da Aba
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
                <p className="text-xs font-mono">Selecione um elemento para ver as propriedades detalhadas</p>
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
    </div>
  );
}

function ToolButton({ active, onClick, icon, label, isDesktopMode }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isDesktopMode?: boolean }) {
  return (
    <button 
      onClick={onClick}
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
  );
}
