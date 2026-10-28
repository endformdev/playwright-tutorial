import sharp from "sharp";

// Jev accepts still PNG or JPEG images whose sides are each 280–1568 pixels.
const maxSide = 1568;
const minSide = 280;

export type JevImageAsset = {
	type: "image";
	format: "png";
	data_base64: string;
};

export type PreparedImage = {
	asset: JevImageAsset;
	png: Buffer;
	width: number;
	height: number;
	scale: number;
};

// Shrink tall full-page screenshots to fit and pad tiny ones; never crop.
export async function prepareJevImage(input: string | Buffer) {
	const source = sharp(input);
	const metadata = await source.metadata();
	if (!metadata.width || !metadata.height)
		throw new Error("Screenshot has no dimensions");
	const scale = Math.min(
		1,
		maxSide / metadata.width,
		maxSide / metadata.height,
	);
	const width = Math.max(1, Math.round(metadata.width * scale));
	const height = Math.max(1, Math.round(metadata.height * scale));
	let image = source.resize({ width, height, fit: "fill" });
	if (width < minSide || height < minSide)
		image = sharp(await image.png().toBuffer()).extend({
			right: Math.max(0, minSide - width),
			bottom: Math.max(0, minSide - height),
			background: "#ffffff",
		});
	const { data, info } = await image
		.png()
		.toBuffer({ resolveWithObject: true });
	return {
		asset: {
			type: "image",
			format: "png",
			data_base64: data.toString("base64"),
		},
		png: data,
		width: info.width,
		height: info.height,
		scale,
	} satisfies PreparedImage;
}
