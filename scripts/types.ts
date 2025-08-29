export interface TutorialStage {
	name: string;
	title: string;
	order: number;
	newPaths: string[];
}

export interface TutorialConfig {
	stages: TutorialStage[];
	docsRepo: string;
	docsBasePath: string;
	docsAssetsPath: string;
}
