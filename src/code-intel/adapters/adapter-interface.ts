export type TechNode = {
  id: string;
  label: string;
  path: string;
  type: 'file' | 'function' | 'class' | 'module';
};

export type TechEdge = {
  from: string;
  to: string;
  type: 'imports' | 'calls' | 'inherits' | 'exports';
  label?: string;
};

export type TechnicalGraphResult = {
  nodes: TechNode[];
  edges: TechEdge[];
};

export interface CodeGraphAdapter {
  isAvailable(): Promise<boolean>;
  queryTechnicalGraph(projectRoot: string): Promise<TechnicalGraphResult>;
  adapterName: string;
}
