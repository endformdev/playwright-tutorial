export interface TutorialStage {
  name: string;
  title: string;
  order: number;
}

export interface TutorialConfig {
  stages: TutorialStage[];
  docsRepo: string;
  docsBasePath: string;
}
