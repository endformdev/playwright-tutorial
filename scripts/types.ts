export interface TutorialStage {
  name: string;
  title: string;
  branch: string;
  order: number;
  prerequisites: string[];
  learningObjectives: string[];
  docsPath: string;
  assetsPrefix: string;
}

export interface TutorialConfig {
  stages: TutorialStage[];
  docsRepo: string;
  docsBasePath: string;
  currentStage?: string;
}

export interface StageMetadata {
  name: string;
  title: string;
  order: number;
  branch: string;
  prerequisites: string[];
  learningObjectives: string[];
  docsPath: string;
  assetsPrefix: string;
}