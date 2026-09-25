import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

const byId = new Map<string, ImagePlaceholder>(
  (data.placeholderImages as ImagePlaceholder[]).map((img) => [img.id, img])
);

/** The photo for a menu item's `image` key, if there is one. */
export function getItemImage(id: string | null | undefined): ImagePlaceholder | undefined {
  return id ? byId.get(id) : undefined;
}
